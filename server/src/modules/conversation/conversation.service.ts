import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/filters/business-exception.filter';
import { ErrorCode } from '../../common/enums/error-code.enum';
import { PageResult } from '../../common/dto/response.dto';
import { deptName, deptIdsByName, fmtDate } from '../../common/utils/format.util';
import type { ConversationUserListDto, ConversationDetailListDto } from './dto/conversation.dto';

@Injectable()
export class ConversationService {
  constructor(private readonly prisma: PrismaService) {}

  async getModelStats(tenantId: number) {
    const stats = await this.prisma.lumaxConversation.groupBy({
      by: ['modelName'],
      where: { tenantId },
      _count: true,
    });
    return stats.map((s) => ({
      modelName: s.modelName || '未知',
      totalConversations: s._count,
    }));
  }

  async getUserConversationList(tenantId: number, dto: ConversationUserListDto) {
    const { current = 1, size = 10 } = dto;

    const where: any = { tenantId };
    if (dto.status) where.status = dto.status;
    if (dto.name) where.username = { contains: dto.name };
    if (dto.department) {
      const matchingIds = deptIdsByName(dto.department);
      if (matchingIds.length > 0) {
        where.deptId = { in: matchingIds };
      } else {
        return PageResult.of([], 0, current, size);
      }
    }

    const grouped = await this.prisma.lumaxConversation.groupBy({
      by: ['userId', 'username'],
      where,
      _count: true,
      _max: { startTime: true },
    });

    let filtered = grouped;
    if (dto.lastConversationTimeStart) {
      const start = new Date(dto.lastConversationTimeStart);
      filtered = filtered.filter((g) => g._max.startTime && g._max.startTime >= start);
    }
    if (dto.lastConversationTimeEnd) {
      const end = new Date(dto.lastConversationTimeEnd);
      filtered = filtered.filter((g) => g._max.startTime && g._max.startTime <= end);
    }

    const total = filtered.length;
    const paged = filtered
      .sort((a, b) => (b._max.startTime?.getTime() ?? 0) - (a._max.startTime?.getTime() ?? 0))
      .slice((current - 1) * size, current * size);

    const records = await Promise.all(
      paged.map(async (g) => {
        const feedbacks = await this.prisma.lumaxFeedback.groupBy({
          by: ['result'],
          where: { tenantId, userId: g.userId },
          _count: true,
        });
        const positive = feedbacks.find((f) => f.result === 'positive')?._count ?? 0;
        const totalFb = feedbacks.reduce((s, f) => s + f._count, 0);

        const satisfactionRate = totalFb > 0 ? (positive / totalFb * 100).toFixed(1) : null;
        const conv = await this.prisma.lumaxConversation.findFirst({
          where: { tenantId, userId: g.userId },
          select: { deptId: true },
        });

        return {
          id: g.userId,
          name: g.username,
          department: deptName(conv?.deptId),
          conversationCount: g._count,
          userSatisfaction: satisfactionRate !== null ? `${satisfactionRate}%` : '-',
          lastConversationTime: fmtDate(g._max.startTime),
        };
      }),
    );

    return PageResult.of(records, total, current, size);
  }

  async getUserConversationDetails(tenantId: number, userId: number, dto: ConversationDetailListDto) {
    const { current = 1, size = 10 } = dto;
    const where = { tenantId, userId };
    const [records, total] = await Promise.all([
      this.prisma.lumaxConversation.findMany({
        where,
        skip: (current - 1) * size,
        take: size,
        orderBy: { startTime: 'desc' },
      }),
      this.prisma.lumaxConversation.count({ where }),
    ]);

    const mapped = await Promise.all(records.map(async (r) => {
      const fb = await this.prisma.lumaxFeedback.groupBy({
        by: ['result'],
        where: { conversationId: r.id },
        _count: true,
      });
      const pos = fb.find((f) => f.result === 'positive')?._count ?? 0;
      const tot = fb.reduce((s, f) => s + f._count, 0);
      const sat = tot > 0 ? `${(pos / tot * 100).toFixed(0)}%` : '-';

      return {
        dialogId: r.id,
        model: r.modelName,
        agent: r.agentName,
        dialogTitle: r.title,
        startTime: fmtDate(r.startTime),
        endTime: fmtDate(r.endTime),
        duration: this.formatDuration(r.durationSeconds),
        consumeToken: r.totalTokens,
        userSatisfaction: sat,
        bannedWordTriggerCount: r.bannedWordHitCount,
      };
    }));

    return PageResult.of(mapped, total, current, size);
  }

  private extractTextContent(raw: string): string {
    if (!raw) return '';
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((part: any) => part.type === 'text' && part.text)
          .map((part: any) => part.text)
          .join('\n')
          .trim();
      }
    } catch {
      // not JSON, return as-is
    }
    return raw.trim();
  }

  private formatDuration(seconds: number | null): string {
    if (seconds === null || seconds === undefined) return '-';
    if (seconds < 60) return `${seconds}秒`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins < 60) return secs > 0 ? `${mins}分${secs}秒` : `${mins}分`;
    const hours = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return remainMins > 0 ? `${hours}时${remainMins}分` : `${hours}时`;
  }

  async getConversationView(tenantId: number, dialogId: number) {
    const conversation = await this.prisma.lumaxConversation.findFirst({
      where: { id: dialogId, tenantId },
    });
    if (!conversation) {
      throw new BusinessException(ErrorCode.CONVERSATION_NOT_FOUND);
    }

    const bannedWordHits = await this.prisma.lumaxBannedWordTrigger.findMany({
      where: { conversationId: dialogId, tenantId },
      orderBy: { triggerTime: 'desc' },
      select: { triggerTime: true, matchedWord: true, matchedSentence: true, triggerSource: true, matchedMode: true },
    });

    const feedbacks = await this.prisma.lumaxFeedback.findMany({
      where: { conversationId: dialogId, tenantId },
      orderBy: { messageIndex: 'asc' },
    });

    const totalFb = feedbacks.length;
    const positiveCount = feedbacks.filter((f) => f.result === 'positive').length;

    const userMessages = conversation.messageCount
      ? Math.ceil(conversation.messageCount / 2)
      : 0;
    const agentMessages = conversation.messageCount
      ? conversation.messageCount - userMessages
      : 0;

    const messages = await this.prisma.lumaxConversationMessage.findMany({
      where: { conversationId: dialogId, tenantId },
      orderBy: { createdAt: 'asc' },
    });

    const bannedSentences = new Set(bannedWordHits.map((h) => h.matchedSentence));

    return {
      info: {
        dialogTitle: conversation.title,
        model: conversation.modelName,
        agent: conversation.agentName,
        totalMessages: conversation.messageCount,
        userMessages,
        agentMessages,
        userSatisfaction: totalFb > 0 ? `${(positiveCount / totalFb * 100).toFixed(1)}%` : '-',
        startTime: fmtDate(conversation.startTime),
        endTime: fmtDate(conversation.endTime),
        duration: this.formatDuration(conversation.durationSeconds),
        avgResponseTime: null,
        consumeToken: conversation.totalTokens,
      },
      bannedWordHits: bannedWordHits.map((h) => ({
        triggerTime: fmtDate(h.triggerTime),
        triggeredWord: h.matchedWord,
        triggerSentence: h.matchedSentence,
        triggerSource: h.triggerSource ?? '',
        matchedMode: h.matchedMode ?? '',
      })),
      messages: messages.map((m, idx) => {
        const content = this.extractTextContent(m.content);
        return {
          id: idx + 1,
          role: m.role as 'user' | 'assistant',
          content,
          timestamp: fmtDate(m.createdAt),
          isBannedContent: bannedSentences.has(content),
        };
      }),
    };
  }
}
