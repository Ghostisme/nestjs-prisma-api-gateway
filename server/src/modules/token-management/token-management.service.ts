import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/filters/business-exception.filter';
import { ErrorCode } from '../../common/enums/error-code.enum';
import { PageResult } from '../../common/dto/response.dto';
import { deptName, deptIdsByName, fmtDate } from '../../common/utils/format.util';
import type { UserContext } from '../../common/interfaces/user-context.interface';
import { REDIS_CLIENT } from '../auth/redis.provider';
import type { TokenUserListDto, QuotaOperationDto, ConsumptionListDto } from './dto/token-management.dto';

@Injectable()
export class TokenManagementService {
  private readonly logger = new Logger(TokenManagementService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async getModelStats(tenantId: number) {
    const stats = await this.prisma.lumaxTokenConsumption.groupBy({
      by: ['modelName'],
      where: { tenantId },
      _sum: { totalTokens: true },
    });
    return stats.map((s) => ({
      modelName: s.modelName || '未知',
      totalTokens: s._sum.totalTokens ?? 0,
    }));
  }

  async getUserTokenList(tenantId: number, dto: TokenUserListDto) {
    const { current = 1, size = 10 } = dto;

    const where: any = { tenantId };
    if (dto.name) where.username = { contains: dto.name };
    if (dto.department) {
      const matchingIds = deptIdsByName(dto.department);
      if (matchingIds.length > 0) {
        where.deptId = { in: matchingIds };
      } else {
        return PageResult.of([], 0, current, size);
      }
    }

    const allQuotas = await this.prisma.lumaxUserQuota.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });

    let quotas = allQuotas;
    if (dto.quotaLimit === '是') {
      quotas = quotas.filter((q) => q.totalQuota > 0 && q.usedQuota >= q.totalQuota);
    } else if (dto.quotaLimit === '否') {
      quotas = quotas.filter((q) => q.totalQuota <= 0 || q.usedQuota < q.totalQuota);
    }

    if (dto.lastUsedTimeStart || dto.lastUsedTimeEnd) {
      const userIds = quotas.map((q) => q.userId);
      const lastConvs = userIds.length > 0
        ? await this.prisma.lumaxConversation.findMany({
            where: { tenantId, userId: { in: userIds } },
            distinct: ['userId'],
            orderBy: { startTime: 'desc' },
            select: { userId: true, startTime: true },
          })
        : [];
      const lastConvMap = new Map(lastConvs.map((c) => [c.userId, c.startTime]));

      if (dto.lastUsedTimeStart) {
        const start = new Date(dto.lastUsedTimeStart);
        quotas = quotas.filter((q) => {
          const t = lastConvMap.get(q.userId);
          return t && t >= start;
        });
      }
      if (dto.lastUsedTimeEnd) {
        const end = new Date(dto.lastUsedTimeEnd);
        quotas = quotas.filter((q) => {
          const t = lastConvMap.get(q.userId);
          return t && t <= end;
        });
      }
    }

    const total = quotas.length;
    const paged = quotas.slice((current - 1) * size, current * size);

    const records = await Promise.all(
      paged.map(async (q) => {
        const lastConv = await this.prisma.lumaxConversation.findFirst({
          where: { tenantId, userId: q.userId },
          orderBy: { startTime: 'desc' },
          select: { startTime: true },
        });

        const feedbacks = await this.prisma.lumaxFeedback.groupBy({
          by: ['result'],
          where: { tenantId, userId: q.userId },
          _count: true,
        });
        const positive = feedbacks.find((f) => f.result === 'positive')?._count ?? 0;
        const totalFb = feedbacks.reduce((s, f) => s + f._count, 0);

        return {
          id: q.userId,
          name: q.username,
          department: deptName(q.deptId),
          tokenQuota: q.totalQuota,
          usedQuota: q.usedQuota,
          quotaLimit: q.totalQuota > 0 && q.usedQuota >= q.totalQuota ? '是' : '否',
          userSatisfaction: totalFb > 0 ? `${(positive / totalFb * 100).toFixed(0)}%` : '-',
          lastUsedTime: fmtDate(lastConv?.startTime),
        };
      }),
    );

    return PageResult.of(records, total, current, size);
  }

  async updateQuota(tenantId: number, userId: number, dto: QuotaOperationDto, operator: UserContext) {
    const quota = await this.prisma.lumaxUserQuota.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
    });
    if (!quota) {
      await this.prisma.lumaxUserQuota.create({
        data: { tenantId, userId, username: '', totalQuota: -1, usedQuota: 0 },
      });
    }

    const current = quota ?? { totalQuota: -1, usedQuota: 0 };
    let newQuota = current.totalQuota;

    const changeValue = dto.value ?? dto.amount ?? 0;

    switch (dto.operationType) {
      case 'increase':
        newQuota = (current.totalQuota === -1 ? 0 : current.totalQuota) + changeValue;
        break;
      case 'decrease':
        if (current.totalQuota === -1) break;
        newQuota = current.totalQuota - changeValue;
        if (newQuota < current.usedQuota) {
          throw new BusinessException(ErrorCode.QUOTA_DECREASE_EXCEEDS);
        }
        break;
      case 'unlimited':
        newQuota = -1;
        break;
      case 'noChange':
        return { success: true };
      default:
        break;
    }

    await this.prisma.$transaction([
      this.prisma.lumaxUserQuota.upsert({
        where: { tenantId_userId: { tenantId, userId } },
        update: { totalQuota: newQuota },
        create: { tenantId, userId, username: '', totalQuota: newQuota },
      }),
      this.prisma.lumaxQuotaOperation.create({
        data: {
          tenantId,
          userId,
          operatorId: operator.userId,
          operatorName: operator.nickname ?? operator.username,
          operationType: dto.operationType,
          originalQuota: current.totalQuota,
          actualQuota: newQuota,
        },
      }),
    ]);

    await this.clearQuotaUsedCache(tenantId, userId);

    return { success: true };
  }

  async getQuotaRecords(tenantId: number, userId: number) {
    const rows = await this.prisma.lumaxQuotaOperation.findMany({
      where: { tenantId, userId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => ({
      originalQuota: r.originalQuota,
      operation: r.operationType,
      actualQuota: r.actualQuota,
      operatorName: r.operatorName,
      operateTime: fmtDate(r.createdAt),
    }));
  }

  async getConsumptionList(tenantId: number, userId: number, dto: ConsumptionListDto) {
    const { current = 1, size = 10 } = dto;
    const [rows, total, quota] = await Promise.all([
      this.prisma.lumaxTokenConsumption.findMany({
        where: { tenantId, userId },
        skip: (current - 1) * size,
        take: size,
        orderBy: { consumedAt: 'desc' },
      }),
      this.prisma.lumaxTokenConsumption.count({ where: { tenantId, userId } }),
      this.prisma.lumaxUserQuota.findUnique({
        where: { tenantId_userId: { tenantId, userId } },
      }),
    ]);

    const totalQuota = quota?.totalQuota ?? -1;
    const usedQuota = quota?.usedQuota ?? 0;
    const remainToken = totalQuota === -1 ? -1 : totalQuota - usedQuota;

    const records = rows.map((r) => ({
      id: r.id,
      modelType: r.modelName,
      agentName: r.agentName,
      inputToken: r.inputTokens,
      outToken: r.outputTokens,
      consumeToken: r.totalTokens,
      remainToken,
      consumeTime: fmtDate(r.consumedAt),
    }));

    return PageResult.of(records, total, current, size);
  }

  private quotaUsedKey(tenantId: number, userId: number) {
    return `${tenantId}:lumax:quota:used:${userId}`;
  }

  private async clearQuotaUsedCache(tenantId: number, userId: number) {
    const key = this.quotaUsedKey(tenantId, userId);
    try {
      await this.redis.del(key);
    }
    catch (error) {
      this.logger.warn(`Failed to clear quota used cache: key=${key}`, error as Error);
    }
  }
}
