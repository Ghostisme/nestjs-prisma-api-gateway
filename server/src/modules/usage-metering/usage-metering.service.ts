import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LlmModelService } from '../llm-model/llm-model.service';
import { BusinessException } from '../../common/filters/business-exception.filter';
import { ErrorCode } from '../../common/enums/error-code.enum';
import type { UsageReportDto, UsageQueryDto } from './dto/usage-metering.dto';

@Injectable()
export class UsageMeteringService {
  private readonly logger = new Logger(UsageMeteringService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llmModelService: LlmModelService,
  ) {}

  async report(dto: UsageReportDto) {
    const cacheReadTokens = dto.cacheReadTokens ?? 0;
    const cacheWriteTokens = dto.cacheWriteTokens ?? 0;
    const reasoningTokens = dto.reasoningTokens ?? 0;
    const inferenceMode = dto.inferenceMode ?? 'online';
    const totalTokens = dto.tokensTotal ?? (dto.tokensIn + dto.tokensOut);
    const idempotencyKey = dto.idempotencyKey ?? `legacy:${dto.tenantId}:${dto.userId}:${dto.threadId}:${Date.now()}`;

    let costResult = { inputCost: 0, outputCost: 0, cacheCost: 0, totalCost: 0, priceTierId: null as number | null };
    try {
      costResult = await this.llmModelService.calculateCost(
        dto.tenantId, dto.modelName, dto.tokensIn, dto.tokensOut, cacheReadTokens, inferenceMode,
      );
    } catch (e) {
      this.logger.warn(`Cost calculation failed for model ${dto.modelName}: ${e}`);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const prismaTx = tx as any;
      const existing = await prismaTx.lumaxTokenConsumption.findUnique({
        where: { idempotencyKey },
      });
      if (existing) {
        return { success: true, duplicate: true, conversationId: existing.conversationId };
      }

      const conversation =
        dto.conversationId
          ? await prismaTx.lumaxConversation.findUnique({ where: { id: dto.conversationId } })
          : await prismaTx.lumaxConversation.findFirst({
              where: { tenantId: dto.tenantId, threadId: dto.threadId, userId: dto.userId },
              orderBy: { createdAt: 'desc' },
            });

      const conversationId =
        conversation?.id ??
        (
          await prismaTx.lumaxConversation.create({
            data: {
              tenantId: dto.tenantId,
              threadId: dto.threadId,
              userId: dto.userId,
              username: '',
              modelName: dto.modelName ?? '',
              agentName: dto.agentName ?? '',
              skillName: dto.skillName ?? '',
              messageCount: 0,
              inputTokens: 0,
              outputTokens: 0,
              totalTokens: 0,
              cacheReadTokens: 0,
              reasoningTokens: 0,
              totalCost: 0,
              startTime: new Date(),
              status: 'ongoing',
            },
          })
        ).id;

      await prismaTx.lumaxConversation.update({
        where: { id: conversationId },
        data: {
          modelName: dto.modelName ?? conversation?.modelName ?? '',
          agentName: dto.agentName ?? conversation?.agentName ?? '',
          skillName: dto.skillName ?? conversation?.skillName ?? '',
          messageCount: { increment: dto.messages?.length ?? 0 },
          inputTokens: { increment: dto.tokensIn },
          outputTokens: { increment: dto.tokensOut },
          totalTokens: { increment: totalTokens },
          durationSeconds: { increment: Math.ceil((dto.responseTimeMs ?? 0) / 1000) },
          endTime: new Date(),
          status: dto.status === 'failed' ? 'failed' : dto.status === 'cancelled' ? 'cancelled' : 'completed',
        },
      });

      await prismaTx.lumaxTokenConsumption.create({
        data: {
          tenantId: dto.tenantId,
          conversationId,
          threadId: dto.threadId,
          runId: dto.runId,
          idempotencyKey,
          userId: dto.userId,
          modelName: dto.modelName,
          agentName: dto.agentName ?? '',
          skillName: dto.skillName ?? '',
          toolCallsCount: dto.toolCallsCount ?? 0,
          inputTokens: dto.tokensIn,
          outputTokens: dto.tokensOut,
          cacheReadTokens: dto.cacheReadTokens ?? 0,
          cacheWriteTokens: dto.cacheWriteTokens ?? 0,
          reasoningTokens: dto.reasoningTokens ?? 0,
          inferenceMode: dto.inferenceMode ?? 'online',
          inputCost: costResult.inputCost,
          outputCost: costResult.outputCost,
          cacheCost: costResult.cacheCost,
          totalCost: costResult.totalCost,
          priceTierId: costResult.priceTierId,
          totalTokens,
          responseTimeMs: dto.responseTimeMs ?? 0,
        },
      });

      if (dto.messages?.length && prismaTx.lumaxConversationMessage) {
        await prismaTx.lumaxConversationMessage.createMany({
          data: dto.messages.map((message) => ({
            tenantId: dto.tenantId,
            conversationId,
            threadId: dto.threadId,
            runId: dto.runId,
            idempotencyKey,
            userId: dto.userId,
            messageId: message.messageId,
            role: message.role,
            content: message.content,
            messageIndex: message.messageIndex,
            createdAt: message.createdAt ? new Date(message.createdAt) : new Date(),
          })),
          skipDuplicates: true,
        });
      }

      await this.consumeUserQuota(prismaTx, dto.tenantId, dto.userId, totalTokens);

      return { success: true, duplicate: false, conversationId };
    });

    this.logger.debug(
      `Usage reported: tenant=${dto.tenantId} user=${dto.userId} model=${dto.modelName} ` +
      `tokens=${totalTokens} cache=${cacheReadTokens} reasoning=${reasoningTokens} cost=${costResult.totalCost}`,
    );
    return result;
  }

  private async consumeUserQuota(tx: any, tenantId: number, userId: number, totalTokens: number) {
    if (totalTokens <= 0) {
      return;
    }

    const quota = await tx.lumaxUserQuota.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
    });

    if (!quota) {
      await tx.lumaxUserQuota.upsert({
        where: { tenantId_userId: { tenantId, userId } },
        update: { usedQuota: { increment: totalTokens } },
        create: {
          tenantId,
          userId,
          totalQuota: -1,
          usedQuota: totalTokens,
        },
      });
      return;
    }

    if (quota.totalQuota === -1) {
      await tx.lumaxUserQuota.update({
        where: { tenantId_userId: { tenantId, userId } },
        data: { usedQuota: { increment: totalTokens } },
      });
      return;
    }

    const updateResult = await tx.lumaxUserQuota.updateMany({
      where: {
        tenantId,
        userId,
        totalQuota: { not: -1 },
        usedQuota: { lte: quota.totalQuota - totalTokens },
      },
      data: { usedQuota: { increment: totalTokens } },
    });
    if (updateResult.count !== 1) {
      throw new BusinessException(ErrorCode.QUOTA_INSUFFICIENT);
    }
  }

  async getSummary(query: UsageQueryDto) {
    const where = this.buildWhereClause(query);

    const result = await this.prisma.lumaxTokenConsumption.aggregate({
      where,
      _sum: { inputTokens: true, outputTokens: true, totalTokens: true },
      _count: true,
      _avg: { responseTimeMs: true },
    });

    return {
      tokensIn: result._sum.inputTokens ?? 0,
      tokensOut: result._sum.outputTokens ?? 0,
      tokensTotal: result._sum.totalTokens ?? 0,
      callsCount: result._count,
      avgResponseTimeMs: Math.round(result._avg.responseTimeMs ?? 0),
    };
  }

  async getTrends(query: UsageQueryDto) {
    const where = this.buildWhereClause(query);

    const stats = await this.prisma.lumaxUsageDailyStats.findMany({
      where: {
        tenantId: query.tenantId,
        userId: query.userId ?? 0,
        modelName: query.modelName ?? '',
        ...(query.startDate && { date: { gte: new Date(query.startDate) } }),
        ...(query.endDate && { date: { lte: new Date(query.endDate) } }),
      },
      orderBy: { date: 'asc' },
    });

    if (stats.length > 0) {
      return stats.map((s) => ({
        date: s.date,
        tokensIn: Number(s.tokensInTotal),
        tokensOut: Number(s.tokensOutTotal),
        callsCount: s.callsCount,
        avgDurationMs: s.avgDurationMs,
      }));
    }

    const rawTrends = await this.prisma.lumaxTokenConsumption.groupBy({
      by: ['consumedAt'],
      where,
      _sum: { inputTokens: true, outputTokens: true, totalTokens: true },
      _count: true,
      orderBy: { consumedAt: 'asc' },
    });

    return rawTrends.map((r) => ({
      date: r.consumedAt,
      tokensIn: r._sum.inputTokens ?? 0,
      tokensOut: r._sum.outputTokens ?? 0,
      callsCount: r._count,
    }));
  }

  async getByModel(query: UsageQueryDto) {
    const where = this.buildWhereClause(query);

    const result = await this.prisma.lumaxTokenConsumption.groupBy({
      by: ['modelName'],
      where,
      _sum: { totalTokens: true, inputTokens: true, outputTokens: true },
      _count: true,
      orderBy: { _sum: { totalTokens: 'desc' } },
    });

    return result.map((r) => ({
      modelName: r.modelName,
      tokensTotal: r._sum.totalTokens ?? 0,
      tokensIn: r._sum.inputTokens ?? 0,
      tokensOut: r._sum.outputTokens ?? 0,
      callsCount: r._count,
    }));
  }

  async getByUser(query: UsageQueryDto) {
    const where = this.buildWhereClause(query);

    const result = await this.prisma.lumaxTokenConsumption.groupBy({
      by: ['userId'],
      where,
      _sum: { totalTokens: true },
      _count: true,
      orderBy: { _sum: { totalTokens: 'desc' } },
      take: 20,
    });

    const userIds = result.map((r) => r.userId);
    const quotas = userIds.length > 0
      ? await this.prisma.lumaxUserQuota.findMany({
          where: { tenantId: query.tenantId, userId: { in: userIds } },
          select: { userId: true, username: true },
        })
      : [];
    const usernameMap = new Map(quotas.map((q) => [q.userId, q.username]));

    return result.map((r) => ({
      userId: r.userId,
      username: usernameMap.get(r.userId) ?? '',
      tokensTotal: r._sum.totalTokens ?? 0,
      callsCount: r._count,
    }));
  }

  async getQuotaStatus(tenantId: number) {
    const subscription = await this.prisma.lumaxSubscription.findUnique({
      where: { tenantId },
      include: { plan: true },
    });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthUsage = await this.prisma.lumaxTokenConsumption.aggregate({
      where: { tenantId, consumedAt: { gte: monthStart } },
      _sum: { totalTokens: true },
      _count: true,
    });

    const tokenLimit = subscription?.tokenLimitMonthly ?? -1;
    const tokenUsed = monthUsage._sum.totalTokens ?? 0;

    return {
      planTier: subscription?.planTier ?? 'free',
      tokenLimit,
      tokenUsed,
      tokenRemaining: tokenLimit === -1 ? -1 : Math.max(0, tokenLimit - tokenUsed),
      usagePercent: tokenLimit === -1 ? 0 : Math.round((tokenUsed / tokenLimit) * 100),
      callsThisMonth: monthUsage._count,
      concurrentLimit: subscription?.concurrentLimit ?? -1,
    };
  }

  private buildWhereClause(query: UsageQueryDto) {
    return {
      tenantId: query.tenantId,
      ...(query.userId && { userId: query.userId }),
      ...(query.modelName && { modelName: query.modelName }),
      ...(query.startDate || query.endDate
        ? {
            consumedAt: {
              ...(query.startDate && { gte: new Date(query.startDate) }),
              ...(query.endDate && { lte: new Date(query.endDate) }),
            },
          }
        : {}),
    };
  }
}
