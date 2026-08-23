import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { DashboardFilterDto } from './dto/dashboard-filter.dto';
import dayjs from 'dayjs';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserDashboard(tenantId: number, filter: DashboardFilterDto) {
    const { where, prevWhere } = this.buildTimeFilter(tenantId, filter);

    const [totalConversations, totalUsers, activeUsers] = await Promise.all([
      this.prisma.lumaxConversation.count({ where }),
      this.prisma.lumaxConversation
        .findMany({ where, distinct: ['userId'], select: { userId: true } })
        .then((r) => r.length),
      this.prisma.lumaxConversation
        .findMany({ where, distinct: ['userId'], select: { userId: true } })
        .then((r) => r.length),
    ]);

    const feedbacks = await this.prisma.lumaxFeedback.groupBy({
      by: ['result'],
      where: { tenantId, conversation: where },
      _count: true,
    });
    const positiveCount = feedbacks.find((f) => f.result === 'positive')?._count ?? 0;
    const totalFeedbacks = feedbacks.reduce((s, f) => s + f._count, 0);
    const satisfactionRate = totalFeedbacks > 0 ? +(positiveCount / totalFeedbacks * 100).toFixed(1) : 0;

    const [prevConversations, prevUsers, prevActiveUsers] = await Promise.all([
      this.prisma.lumaxConversation.count({ where: prevWhere }),
      this.prisma.lumaxConversation
        .findMany({ where: prevWhere, distinct: ['userId'], select: { userId: true } })
        .then((r) => r.length),
      this.prisma.lumaxConversation
        .findMany({ where: prevWhere, distinct: ['userId'], select: { userId: true } })
        .then((r) => r.length),
    ]);

    const prevFeedbacks = await this.prisma.lumaxFeedback.groupBy({
      by: ['result'],
      where: { tenantId, conversation: prevWhere },
      _count: true,
    });
    const prevPositive = prevFeedbacks.find((f) => f.result === 'positive')?._count ?? 0;
    const prevTotalFb = prevFeedbacks.reduce((s, f) => s + f._count, 0);
    const prevSatisfaction = prevTotalFb > 0 ? +(prevPositive / prevTotalFb * 100).toFixed(1) : 0;

    const modelUsage = await this.prisma.lumaxConversation.groupBy({
      by: ['modelName'],
      where,
      _count: true,
    });

    const responseTimeBuckets = await this.buildResponseTimeDistribution(tenantId, filter);
    const activityTrend = await this.buildActivityTrend(where, filter);

    return {
      overview: {
        totalConversations,
        totalUsers,
        activeUsers,
        satisfactionRate,
        dayOverDay: {
          conversations: this.calcDayOverDay(totalConversations, prevConversations),
          users: this.calcDayOverDay(totalUsers, prevUsers),
          activeUsers: this.calcDayOverDay(activeUsers, prevActiveUsers),
          satisfaction: this.calcDayOverDay(+satisfactionRate, +prevSatisfaction),
        },
      },
      modelUsage: modelUsage.map((m) => ({
        name: m.modelName || 'Unknown',
        value: m._count,
      })),
      responseTime: responseTimeBuckets,
      activityTrend,
    };
  }

  async getTokenDashboard(tenantId: number, filter: DashboardFilterDto) {
    const { where } = this.buildTokenFilter(tenantId, filter);

    const aggregate = await this.prisma.lumaxTokenConsumption.aggregate({
      where,
      _sum: {
        inputTokens: true,
        outputTokens: true,
        totalTokens: true,
        cacheReadTokens: true,
        reasoningTokens: true,
        totalCost: true,
      },
    });

    const totalTokens = aggregate._sum.totalTokens ?? 0;
    const inputTokens = aggregate._sum.inputTokens ?? 0;
    const outputTokens = aggregate._sum.outputTokens ?? 0;
    const cacheReadTokens = Number(aggregate._sum.cacheReadTokens ?? 0);
    const reasoningTokens = Number(aggregate._sum.reasoningTokens ?? 0);
    const totalCost = +Number(aggregate._sum.totalCost ?? 0).toFixed(2);

    const userTokenRaw = await this.prisma.lumaxTokenConsumption.groupBy({
      by: ['userId'],
      where,
      _sum: { totalTokens: true, totalCost: true },
      orderBy: { _sum: { totalTokens: 'desc' } },
      take: 10,
    });

    const userIds = userTokenRaw.map((u) => u.userId);
    const conversations = userIds.length > 0
      ? await this.prisma.lumaxConversation.findMany({
          where: { tenantId, userId: { in: userIds } },
          distinct: ['userId'],
          select: { userId: true, username: true },
        })
      : [];
    const usernameMap = new Map(conversations.map((c) => [c.userId, c.username]));

    const agentConsumption = await this.prisma.lumaxTokenConsumption.groupBy({
      by: ['agentName', 'modelName'],
      where,
      _sum: { totalTokens: true, inputTokens: true, outputTokens: true, cacheReadTokens: true, totalCost: true },
      _avg: { responseTimeMs: true },
    });

    const tokenTrend = await this.buildTokenTrend(where, filter);

    return {
      overview: {
        totalTokens,
        inputTokens,
        outputTokens,
        cacheReadTokens,
        reasoningTokens,
        totalCost,
        dayOverDay: {
          totalTokens: 0,
          inputTokens: 0,
          outputTokens: 0,
          totalCost: 0,
        },
      },
      userTokenUsage: userTokenRaw.map((u) => ({
			username: usernameMap.get(u.userId) ?? `User ${u.userId}`,
        tokens: u._sum.totalTokens ?? 0,
        cost: +Number(u._sum.totalCost ?? 0).toFixed(4),
      })),
      tokenTrend,
      agentConsumption: agentConsumption.map((a) => ({
        agentName: a.agentName || 'Unknown',
        model: a.modelName || '未知',
        tokens: a._sum.totalTokens ?? 0,
        cacheReadTokens: Number(a._sum.cacheReadTokens ?? 0),
        cost: +Number(a._sum.totalCost ?? 0).toFixed(4),
        avgResponseTime: `${Math.round(a._avg.responseTimeMs ?? 0)}ms`,
      })),
    };
  }

  async getFeedbackDashboard(tenantId: number, filter: DashboardFilterDto) {
    const { where, prevWhere } = this.buildTimeFilter(tenantId, filter);

    const feedbacks = await this.prisma.lumaxFeedback.groupBy({
      by: ['result'],
      where: { tenantId, conversation: where },
      _count: true,
    });

    const positiveCount = feedbacks.find((f) => f.result === 'positive')?._count ?? 0;
    const negativeCount = feedbacks.find((f) => f.result === 'negative')?._count ?? 0;
    const total = positiveCount + negativeCount;
    const positiveRate = total > 0 ? +(positiveCount / total * 100).toFixed(1) : 0;
    const negativeRate = total > 0 ? +(negativeCount / total * 100).toFixed(1) : 0;

    const prevFeedbacks = await this.prisma.lumaxFeedback.groupBy({
      by: ['result'],
      where: { tenantId, conversation: prevWhere },
      _count: true,
    });
    const prevPositive = prevFeedbacks.find((f) => f.result === 'positive')?._count ?? 0;
    const prevNegative = prevFeedbacks.find((f) => f.result === 'negative')?._count ?? 0;
    const prevTotal = prevPositive + prevNegative;
    const prevPositiveRate = prevTotal > 0 ? +(prevPositive / prevTotal * 100).toFixed(1) : 0;
    const prevNegativeRate = prevTotal > 0 ? +(prevNegative / prevTotal * 100).toFixed(1) : 0;

    const records = await this.prisma.lumaxFeedback.findMany({
      where: { tenantId, conversation: where },
      orderBy: { feedbackTime: 'desc' },
      take: 50,
      select: {
        id: true,
        result: true,
        userQuestion: true,
        assistantAnswer: true,
        agentName: true,
        feedbackTime: true,
        comment: true,
      },
    });

    const feedbackStats = await this.buildFeedbackTrend(tenantId, where, filter);

    return {
      overview: {
        totalFeedbacks: total,
        positiveRate,
        negativeRate,
        dayOverDay: {
          totalFeedbacks: this.calcDayOverDay(total, prevTotal),
          positiveRate: this.calcDayOverDay(+positiveRate, +prevPositiveRate),
          negativeRate: this.calcDayOverDay(+negativeRate, +prevNegativeRate),
        },
      },
      feedbackStats,
      feedbackDistribution: [
        { name: 'Positive', value: positiveCount },
        { name: 'Negative', value: negativeCount },
      ],
      feedbackRecords: records,
    };
  }

  async getFilterOptions(tenantId: number) {
    const [models, agents] = await Promise.all([
      this.prisma.lumaxConversation.findMany({
        distinct: ['modelName'],
        select: { modelName: true },
        where: { tenantId, modelName: { not: '' } },
      }),
      this.prisma.lumaxConversation.findMany({
        distinct: ['agentName'],
        select: { agentName: true },
        where: { tenantId, agentName: { not: '' } },
      }),
    ]);

    return {
      models: models.map((m) => m.modelName),
      agents: agents.map((a) => a.agentName),
    };
  }

  private buildTimeFilter(tenantId: number, filter: DashboardFilterDto) {
    const { start, end, prevStart, prevEnd } = this.getTimeRange(filter);

    const baseWhere: any = { tenantId };
    if (filter.model && filter.model !== 'all') {
      baseWhere.modelName = filter.model;
    }
    if (filter.agent && filter.agent !== 'all') {
      baseWhere.agentName = filter.agent;
    }

    const where = { ...baseWhere, ...(start ? { startTime: { gte: start, lte: end } } : {}) };
    const prevWhere = { ...baseWhere, ...(prevStart ? { startTime: { gte: prevStart, lte: prevEnd } } : {}) };
    return { where, prevWhere };
  }

  private buildTokenFilter(tenantId: number, filter: DashboardFilterDto) {
    const { start, end } = this.getTimeRange(filter);
    const where: any = { tenantId };
    if (filter.model && filter.model !== 'all') where.modelName = filter.model;
    if (filter.agent && filter.agent !== 'all') where.agentName = filter.agent;
    if (start) where.consumedAt = { gte: start, lte: end };
    return { where };
  }

  private getTimeRange(filter: DashboardFilterDto) {
    const now = dayjs();
    let start: Date | null = null;
    let end: Date = now.toDate();
    let prevStart: Date | null = null;
    let prevEnd: Date | null = null;

    switch (filter.timeRange) {
      case 'yesterday': {
        start = now.subtract(1, 'day').startOf('day').toDate();
        end = now.subtract(1, 'day').endOf('day').toDate();
        prevStart = now.subtract(2, 'day').startOf('day').toDate();
        prevEnd = now.subtract(2, 'day').endOf('day').toDate();
        break;
      }
      case 'last7days': {
        start = now.subtract(7, 'day').startOf('day').toDate();
        prevStart = now.subtract(14, 'day').startOf('day').toDate();
        prevEnd = now.subtract(8, 'day').endOf('day').toDate();
        break;
      }
      case 'last30days': {
        start = now.subtract(30, 'day').startOf('day').toDate();
        prevStart = now.subtract(60, 'day').startOf('day').toDate();
        prevEnd = now.subtract(31, 'day').endOf('day').toDate();
        break;
      }
      case 'custom': {
        if (filter.customRange?.length === 2) {
          start = dayjs(filter.customRange[0]).startOf('day').toDate();
          end = dayjs(filter.customRange[1]).endOf('day').toDate();
          const rangeDays = dayjs(end).diff(dayjs(start), 'day');
          prevStart = dayjs(start).subtract(rangeDays + 1, 'day').startOf('day').toDate();
          prevEnd = dayjs(start).subtract(1, 'day').endOf('day').toDate();
        }
        break;
      }
    }

    return { start, end, prevStart, prevEnd };
  }

  private calcDayOverDay(current: number, previous: number): number | null {
    if (previous === 0) return current > 0 ? 100 : null;
    return +((current - previous) / previous * 100).toFixed(1);
  }

  private async buildResponseTimeDistribution(tenantId: number, filter: DashboardFilterDto) {
    const { where } = this.buildTokenFilter(tenantId, filter);
    const consumptions = await this.prisma.lumaxTokenConsumption.findMany({
      where,
      select: { responseTimeMs: true },
    });

    const buckets = [
      { range: '<1s', min: 0, max: 1000 },
      { range: '1-3s', min: 1000, max: 3000 },
      { range: '3-5s', min: 3000, max: 5000 },
      { range: '5-10s', min: 5000, max: 10000 },
      { range: '>10s', min: 10000, max: Infinity },
    ];

    return buckets.map((b) => ({
      range: b.range,
      count: consumptions.filter(
        (c) => (c.responseTimeMs ?? 0) >= b.min && (c.responseTimeMs ?? 0) < b.max,
      ).length,
    }));
  }

  private async buildActivityTrend(where: any, filter: DashboardFilterDto) {
    const days = filter.timeRange === 'last7days' ? 7 : filter.timeRange === 'last30days' ? 30 : 14;
    const result: { date: string; value: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = dayjs().subtract(i, 'day').startOf('day').toDate();
      const dayEnd = dayjs().subtract(i, 'day').endOf('day').toDate();
      const mergedWhere = { ...where, startTime: { gte: dayStart, lte: dayEnd } };
      const users = await this.prisma.lumaxConversation.findMany({
        where: mergedWhere,
        distinct: ['userId'],
        select: { userId: true },
      });
      result.push({
        date: dayjs().subtract(i, 'day').format('MM-DD'),
        value: users.length,
      });
    }
    return result;
  }

  private async buildTokenTrend(where: any, filter: DashboardFilterDto) {
    const days = filter.timeRange === 'last7days' ? 7 : filter.timeRange === 'last30days' ? 30 : 14;
    const result: { date: string; input: number; output: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = dayjs().subtract(i, 'day').startOf('day').toDate();
      const dayEnd = dayjs().subtract(i, 'day').endOf('day').toDate();
      const mergedWhere = { ...where, consumedAt: { gte: dayStart, lte: dayEnd } };
      const agg = await this.prisma.lumaxTokenConsumption.aggregate({
        where: mergedWhere,
        _sum: { inputTokens: true, outputTokens: true },
      });
      result.push({
        date: dayjs().subtract(i, 'day').format('MM-DD'),
        input: agg._sum.inputTokens ?? 0,
        output: agg._sum.outputTokens ?? 0,
      });
    }
    return result;
  }

  private async buildFeedbackTrend(tenantId: number, conversationWhere: any, filter: DashboardFilterDto) {
    const days = filter.timeRange === 'last7days' ? 7 : filter.timeRange === 'last30days' ? 30 : 14;
    const result: { date: string; positive: number; negative: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = dayjs().subtract(i, 'day').startOf('day').toDate();
      const dayEnd = dayjs().subtract(i, 'day').endOf('day').toDate();
      const groups = await this.prisma.lumaxFeedback.groupBy({
        by: ['result'],
        where: {
          tenantId,
          conversation: conversationWhere,
          feedbackTime: { gte: dayStart, lte: dayEnd },
        },
        _count: true,
      });
      result.push({
        date: dayjs().subtract(i, 'day').format('MM-DD'),
        positive: groups.find((g) => g.result === 'positive')?._count ?? 0,
        negative: groups.find((g) => g.result === 'negative')?._count ?? 0,
      });
    }
    return result;
  }
}
