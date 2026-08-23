import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async aggregateHourlyStats() {
    this.logger.log('Running hourly token stats aggregation...');
    try {
      const now = new Date();
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const tenantStats = await this.prisma.lumaxTokenConsumption.groupBy({
        by: ['tenantId', 'modelName'],
        where: { consumedAt: { gte: hourAgo } },
        _sum: { inputTokens: true, outputTokens: true },
        _count: true,
        _avg: { responseTimeMs: true },
      });

      for (const stat of tenantStats) {
        await this.prisma.lumaxUsageDailyStats.upsert({
          where: {
            tenantId_userId_date_modelName: {
              tenantId: stat.tenantId,
              userId: 0,
              date: today,
              modelName: stat.modelName,
            },
          },
          update: {
            tokensInTotal: { increment: stat._sum.inputTokens ?? 0 },
            tokensOutTotal: { increment: stat._sum.outputTokens ?? 0 },
            callsCount: { increment: stat._count },
            avgDurationMs: Math.round(stat._avg.responseTimeMs ?? 0),
          },
          create: {
            tenantId: stat.tenantId,
            userId: 0,
            date: today,
            modelName: stat.modelName,
            tokensInTotal: stat._sum.inputTokens ?? 0,
            tokensOutTotal: stat._sum.outputTokens ?? 0,
            callsCount: stat._count,
            avgDurationMs: Math.round(stat._avg.responseTimeMs ?? 0),
          },
        });
      }

      this.logger.log(`Hourly aggregation completed: ${tenantStats.length} tenant-model groups`);
    } catch (error) {
      this.logger.error('Hourly aggregation failed', error);
    }
  }

  @Cron('30 0 * * *')
  async generateDailyStats() {
    this.logger.log('Running daily stats generation...');
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const userStats = await this.prisma.lumaxTokenConsumption.groupBy({
        by: ['tenantId', 'userId', 'modelName'],
        where: { consumedAt: { gte: dayStart, lt: dayEnd } },
        _sum: { inputTokens: true, outputTokens: true },
        _count: true,
        _avg: { responseTimeMs: true },
      });

      for (const stat of userStats) {
        await this.prisma.lumaxUsageDailyStats.upsert({
          where: {
            tenantId_userId_date_modelName: {
              tenantId: stat.tenantId,
              userId: stat.userId,
              date: dayStart,
              modelName: stat.modelName,
            },
          },
          update: {
            tokensInTotal: stat._sum.inputTokens ?? 0,
            tokensOutTotal: stat._sum.outputTokens ?? 0,
            callsCount: stat._count,
            avgDurationMs: Math.round(stat._avg.responseTimeMs ?? 0),
          },
          create: {
            tenantId: stat.tenantId,
            userId: stat.userId,
            date: dayStart,
            modelName: stat.modelName,
            tokensInTotal: stat._sum.inputTokens ?? 0,
            tokensOutTotal: stat._sum.outputTokens ?? 0,
            callsCount: stat._count,
            avgDurationMs: Math.round(stat._avg.responseTimeMs ?? 0),
          },
        });
      }

      this.logger.log(`Daily stats generated: ${userStats.length} user-model groups`);
    } catch (error) {
      this.logger.error('Daily stats generation failed', error);
    }
  }

  @Cron('0 1 1 * *')
  async generateMonthlyStats() {
    this.logger.log('Running monthly stats generation...');
    try {
      const now = new Date();
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);

      const tenantStats = await this.prisma.lumaxTokenConsumption.groupBy({
        by: ['tenantId'],
        where: { consumedAt: { gte: lastMonthStart, lt: lastMonthEnd } },
        _sum: { totalTokens: true },
        _count: true,
      });

      for (const stat of tenantStats) {
        const activeUsers = await this.prisma.lumaxTokenConsumption.groupBy({
          by: ['userId'],
          where: {
            tenantId: stat.tenantId,
            consumedAt: { gte: lastMonthStart, lt: lastMonthEnd },
          },
        });

        await this.prisma.lumaxUsageMonthlyStats.upsert({
          where: {
            tenantId_month: { tenantId: stat.tenantId, month: lastMonthStart },
          },
          update: {
            totalTokens: stat._sum.totalTokens ?? 0,
            totalCalls: stat._count,
            activeUsers: activeUsers.length,
          },
          create: {
            tenantId: stat.tenantId,
            month: lastMonthStart,
            totalTokens: stat._sum.totalTokens ?? 0,
            totalCalls: stat._count,
            activeUsers: activeUsers.length,
          },
        });
      }

      this.logger.log(`Monthly stats generated: ${tenantStats.length} tenants`);
    } catch (error) {
      this.logger.error('Monthly stats generation failed', error);
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkQuotaAlerts() {
    try {
      const subscriptions = await this.prisma.lumaxSubscription.findMany({
        where: { status: 'active', tokenLimitMonthly: { gt: 0 } },
      });

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      for (const sub of subscriptions) {
        const usage = await this.prisma.lumaxTokenConsumption.aggregate({
          where: { tenantId: sub.tenantId, consumedAt: { gte: monthStart } },
          _sum: { totalTokens: true },
        });

        const tokenUsed = usage._sum.totalTokens ?? 0;
        const usagePct = Math.round((tokenUsed / sub.tokenLimitMonthly) * 100);

        if (usagePct >= 100) {
          await this.upsertAlert(sub.tenantId, 'exceeded_100', 100, usagePct, sub.tokenLimitMonthly, tokenUsed);
        } else if (usagePct >= 80) {
          await this.upsertAlert(sub.tenantId, 'warning_80', 80, usagePct, sub.tokenLimitMonthly, tokenUsed);
        }
      }
    } catch (error) {
      this.logger.error('Quota alert check failed', error);
    }
  }

  @Cron('0 3 * * *')
  async cleanupAgentRunLogs() {
    this.logger.log('Running agent run log cleanup (90 days)...');
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 90);

      const result = await this.prisma.lumaxAgentRun.deleteMany({
        where: { createdAt: { lt: cutoff } },
      });
      this.logger.log(`Cleaned up ${result.count} old agent run records`);
    } catch (error) {
      this.logger.error('Agent run cleanup failed', error);
    }
  }

  @Cron('0 4 * * *')
  async cleanupTokenConsumptionDetails() {
    this.logger.log('Running token consumption detail cleanup (180 days)...');
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 180);

      const result = await this.prisma.lumaxTokenConsumption.deleteMany({
        where: { consumedAt: { lt: cutoff } },
      });
      this.logger.log(`Cleaned up ${result.count} old token consumption records`);
    } catch (error) {
      this.logger.error('Token consumption cleanup failed', error);
    }
  }

  private async upsertAlert(
    tenantId: number, alertType: string, thresholdPct: number,
    currentPct: number, tokenLimit: number, tokenUsed: number,
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.prisma.lumaxQuotaAlert.findFirst({
      where: { tenantId, alertType, resolved: false, createdAt: { gte: today } },
    });

    if (!existing) {
      await this.prisma.lumaxQuotaAlert.create({
        data: {
          tenantId,
          alertType,
          thresholdPct,
          currentPct,
          tokenLimit: BigInt(tokenLimit),
          tokenUsed: BigInt(tokenUsed),
        },
      });
      this.logger.warn(`Quota alert: tenant=${tenantId} type=${alertType} usage=${currentPct}%`);
    }
  }
}
