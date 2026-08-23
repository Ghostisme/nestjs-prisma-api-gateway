import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/filters/business-exception.filter';
import { ErrorCode } from '../../common/enums/error-code.enum';
import { LlmModelService } from '../llm-model/llm-model.service';
import { BannedWordsCacheService } from '../banned-words/banned-words-cache.service';
import type {
  ConversationStartDto,
  ConversationEndDto,
  FeedbackDto,
  BannedWordHitDto,
  CheckQuotaDto,
  CheckBannedWordsDto,
} from './dto/collector.dto';

const SUPPORTED_MATCH_MODES = new Set(['exact', 'fuzzy']);

type MatchedWordResult = {
  wordId: number;
  categoryId: number;
  word: string;
  matchedMode: string;
  matchedSentence: string;
};

@Injectable()
export class CollectorService {
  private readonly logger = new Logger(CollectorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llmModelService: LlmModelService,
    private readonly cacheService: BannedWordsCacheService,
  ) {}

  async conversationStart(dto: ConversationStartDto) {
    const conversation = await this.prisma.lumaxConversation.create({
      data: {
        tenantId: dto.tenantId,
        threadId: dto.threadId,
        userId: dto.userId,
        username: dto.username ?? '',
        modelName: dto.modelName ?? '',
        agentName: dto.agentName ?? '',
        startTime: new Date(),
        status: 'ongoing',
      },
    });
    return { conversationId: conversation.id };
  }

  async conversationEnd(dto: ConversationEndDto) {
    const conversation = await this.prisma.lumaxConversation.findFirst({
      where: { tenantId: dto.tenantId, threadId: dto.threadId },
      orderBy: { createdAt: 'desc' },
    });
    if (!conversation) {
      throw new BusinessException(ErrorCode.CONVERSATION_NOT_FOUND);
    }

    const inputTokens = dto.inputTokens ?? 0;
    const outputTokens = dto.outputTokens ?? 0;
    const totalTokens = dto.totalTokens ?? 0;
    const cacheReadTokens = dto.cacheReadTokens ?? 0;
    const reasoningTokens = dto.reasoningTokens ?? 0;

    let costResult = { inputCost: 0, outputCost: 0, cacheCost: 0, totalCost: 0, priceTierId: null as number | null };
    if (totalTokens > 0 && conversation.modelName) {
      try {
        costResult = await this.llmModelService.calculateCost(
          dto.tenantId, conversation.modelName, inputTokens, outputTokens, cacheReadTokens,
        );
      } catch (e) {
        this.logger.warn(`Cost calculation failed for model ${conversation.modelName}: ${e}`);
      }
    }

    await this.prisma.$transaction(async (tx) => {
      const updateData: any = {
        title: dto.title ?? conversation.title,
        endTime: new Date(),
        status: 'completed',
      };
      if (dto.messageCount !== undefined) updateData.messageCount = dto.messageCount;
      if (dto.inputTokens !== undefined) updateData.inputTokens = dto.inputTokens;
      if (dto.outputTokens !== undefined) updateData.outputTokens = dto.outputTokens;
      if (dto.totalTokens !== undefined) updateData.totalTokens = dto.totalTokens;
      if (dto.durationSeconds !== undefined) updateData.durationSeconds = dto.durationSeconds;

      await tx.lumaxConversation.update({
        where: { id: conversation.id },
        data: {
          title: dto.title ?? conversation.title,
          messageCount: dto.messageCount ?? conversation.messageCount,
          inputTokens,
          outputTokens,
          totalTokens,
          cacheReadTokens,
          reasoningTokens,
          totalCost: costResult.totalCost,
          durationSeconds: dto.durationSeconds ?? 0,
          endTime: new Date(),
          status: 'completed',
        },
      });

      if (totalTokens > 0) {
        await tx.lumaxTokenConsumption.create({
          data: {
            tenantId: dto.tenantId,
            conversationId: conversation.id,
            userId: conversation.userId,
            modelName: conversation.modelName,
            agentName: conversation.agentName,
            inputTokens,
            outputTokens,
            totalTokens,
            cacheReadTokens,
            cacheWriteTokens: 0,
            reasoningTokens,
            inputCost: costResult.inputCost,
            outputCost: costResult.outputCost,
            cacheCost: costResult.cacheCost,
            totalCost: costResult.totalCost,
            priceTierId: costResult.priceTierId,
          },
        });

        await tx.lumaxUserQuota.upsert({
          where: { tenantId_userId: { tenantId: dto.tenantId, userId: conversation.userId } },
          update: { usedQuota: { increment: totalTokens } },
          create: {
            tenantId: dto.tenantId,
            userId: conversation.userId,
            username: conversation.username,
            totalQuota: -1,
            usedQuota: totalTokens,
          },
        });
      }
    });

    return { success: true };
  }

  async feedback(dto: FeedbackDto) {
    const conversation = await this.prisma.lumaxConversation.findFirst({
      where: { tenantId: dto.tenantId, threadId: dto.threadId },
      orderBy: { createdAt: 'desc' },
    });

    await this.prisma.lumaxFeedback.upsert({
      where: { userId_messageId: { userId: dto.userId, messageId: dto.messageId } },
      update: {
        result: dto.result,
        comment: dto.comment,
        userQuestion: dto.userQuestion ?? '',
        assistantAnswer: dto.assistantAnswer ?? '',
        feedbackTime: new Date(),
      },
      create: {
        tenantId: dto.tenantId,
        conversationId: conversation?.id,
        threadId: dto.threadId,
        messageId: dto.messageId,
        runId: dto.runId,
        userId: dto.userId,
        messageIndex: dto.messageIndex ?? 0,
        result: dto.result,
        userQuestion: dto.userQuestion ?? '',
        assistantAnswer: dto.assistantAnswer ?? '',
        agentName: dto.agentName ?? '',
        comment: dto.comment,
      },
    });

    if (conversation) {
      const feedbacks = await this.prisma.lumaxFeedback.groupBy({
        by: ['result'],
        where: { conversationId: conversation.id },
        _count: true,
      });
      const positiveCount = feedbacks.find((f) => f.result === 'positive')?._count ?? 0;
      const totalCount = feedbacks.reduce((s, f) => s + f._count, 0);
      const satisfaction = totalCount > 0
        ? (positiveCount > totalCount / 2 ? 'positive' : 'negative')
        : 'none';

      await this.prisma.lumaxConversation.update({
        where: { id: conversation.id },
        data: { satisfaction },
      });
    }

    return { success: true };
  }

  async bannedWordHit(dto: BannedWordHitDto) {
    await this.prisma.$transaction(async (tx) => {
      await tx.lumaxBannedWordTrigger.create({
        data: {
          tenantId: dto.tenantId,
          wordId: dto.wordId,
          categoryId: dto.categoryId,
          conversationId: dto.conversationId,
          userId: dto.userId,
          matchedWord: dto.matchedWord ?? '',
          matchedSentence: dto.matchedSentence ?? '',
          triggerSource: dto.triggerSource,
          matchedMode: dto.matchedMode,
        },
      });

      await tx.lumaxBannedWordCategory.update({
        where: { id: dto.categoryId },
        data: { triggerCount: { increment: 1 } },
      });

      if (dto.conversationId) {
        await tx.lumaxConversation.update({
          where: { id: dto.conversationId },
          data: { bannedWordHitCount: { increment: 1 } },
        });
      }
    });

    return { success: true };
  }

  async checkQuota(dto: CheckQuotaDto) {
    const quota = await this.prisma.lumaxUserQuota.findUnique({
      where: { tenantId_userId: { tenantId: dto.tenantId, userId: dto.userId } },
    });

    if (!quota || quota.totalQuota === -1) {
      return { allowed: true, remaining: -1 };
    }

    const remaining = quota.totalQuota - quota.usedQuota;
    if (remaining <= 0) {
      throw new BusinessException(ErrorCode.QUOTA_INSUFFICIENT);
    }

    return { allowed: true, remaining };
  }

  async checkBannedWords(dto: CheckBannedWordsDto) {
    const triggerMode = dto.triggerMode === 'output' ? 'output' : 'input';
    const modes = await this.cacheService.getModesForTrigger(dto.tenantId, triggerMode);
    const skippedModes = modes.filter((mode) => !SUPPORTED_MATCH_MODES.has(mode));

    const text = String(dto.text ?? '');
    const textExact = this.cacheService.normalizeExact(text);
    const textFuzzy = this.cacheService.normalizeFuzzy(text);

    const hitsByWordId = new Map<number, MatchedWordResult>();

    const supportedModes = modes.filter((mode) => SUPPORTED_MATCH_MODES.has(mode));
    if (supportedModes.length === 0) {
      supportedModes.push('exact', 'fuzzy');
    }

    for (const mode of supportedModes) {
      const words = await this.cacheService.getWordsForMode(dto.tenantId, triggerMode, mode);
      for (const word of words) {
        if (mode === 'exact') {
          if (!word.wordExact || !textExact.includes(word.wordExact)) {
            continue;
          }
          const matchedSentence = this.extractMatchedSentence(text, word.word);
          hitsByWordId.set(word.wordId, {
            wordId: word.wordId,
            categoryId: word.categoryId,
            word: word.word,
            matchedMode: 'exact',
            matchedSentence,
          });
          continue;
        }

        if (mode === 'fuzzy') {
          if (!word.wordFuzzyPrefix || word.wordFuzzyPrefix.length < 3) {
            continue;
          }
          if (!textFuzzy.includes(word.wordFuzzyPrefix)) {
            continue;
          }

          const existing = hitsByWordId.get(word.wordId);
          if (existing?.matchedMode === 'exact') {
            continue;
          }

          const fuzzyLiteral = word.word.slice(0, Math.max(1, word.word.length - 1));
          const matchedSentence = this.extractMatchedSentence(text, fuzzyLiteral);
          hitsByWordId.set(word.wordId, {
            wordId: word.wordId,
            categoryId: word.categoryId,
            word: word.word,
            matchedMode: 'fuzzy',
            matchedSentence,
          });
        }
      }
    }

    return {
      hit: hitsByWordId.size > 0,
      matchedWords: Array.from(hitsByWordId.values()),
      skippedModes,
    };
  }

  private extractMatchedSentence(text: string, literal: string): string {
    const source = String(text ?? '');
    if (!source.trim()) {
      return '';
    }

    const index = source.toLowerCase().indexOf(String(literal ?? '').toLowerCase());
    if (index < 0) {
      return this.firstSentence(source);
    }

    const left = this.findLeftBoundary(source, index);
    const right = this.findRightBoundary(source, index + literal.length);
    return source.slice(left, right).trim() || this.firstSentence(source);
  }

  private findLeftBoundary(text: string, from: number): number {
    for (let i = from - 1; i >= 0; i -= 1) {
      if (this.isSentenceSeparator(text[i])) {
        return i + 1;
      }
    }
    return 0;
  }

  private findRightBoundary(text: string, from: number): number {
    for (let i = from; i < text.length; i += 1) {
      if (this.isSentenceSeparator(text[i])) {
        return i + 1;
      }
    }
    return text.length;
  }

  private firstSentence(text: string): string {
    for (let i = 0; i < text.length; i += 1) {
      if (this.isSentenceSeparator(text[i])) {
        return text.slice(0, i + 1).trim();
      }
    }
    return text.trim();
  }

  private isSentenceSeparator(ch: string): boolean {
    return ch === '。' || ch === '！' || ch === '？' || ch === '!' || ch === '?' || ch === ';' || ch === '；' || ch === '\n';
  }
}
