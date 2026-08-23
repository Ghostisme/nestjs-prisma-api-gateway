import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/filters/business-exception.filter';
import { ErrorCode } from '../../common/enums/error-code.enum';
import type { ChangePlanDto } from './dto/subscription.dto';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getCurrent(tenantId: number) {
    const subscription = await this.prisma.lumaxSubscription.findUnique({
      where: { tenantId },
      include: { plan: true },
    });

    if (!subscription) {
      return {
        planTier: 'free',
        planName: '免费版',
        status: 'active',
        tokenLimitMonthly: -1,
        concurrentLimit: -1,
        features: [],
        periodStart: null,
        periodEnd: null,
      };
    }

    return {
      planTier: subscription.planTier,
      planName: subscription.plan.name,
      status: subscription.status,
      tokenLimitMonthly: subscription.tokenLimitMonthly,
      concurrentLimit: subscription.concurrentLimit,
      features: subscription.plan.features,
      featuresOverride: subscription.featuresOverride,
      periodStart: subscription.periodStart,
      periodEnd: subscription.periodEnd,
    };
  }

  async getPlans() {
    const plans = await this.prisma.lumaxPlanConfig.findMany({
      where: { status: 'enabled' },
      orderBy: { sortOrder: 'asc' },
    });
    return plans;
  }

  async changePlan(tenantId: number, dto: ChangePlanDto) {
    const plan = await this.prisma.lumaxPlanConfig.findUnique({
      where: { tier: dto.planTier },
    });
    if (!plan) throw new BusinessException(ErrorCode.PLAN_NOT_FOUND);

    const now = new Date();
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    const subscription = await this.prisma.lumaxSubscription.upsert({
      where: { tenantId },
      update: {
        planTier: dto.planTier,
        tokenLimitMonthly: dto.tokenLimitMonthly ?? plan.tokenLimitMonthly,
        concurrentLimit: dto.concurrentLimit ?? plan.concurrentLimit,
        periodStart: now,
        periodEnd,
        status: 'active',
      },
      create: {
        tenantId,
        planTier: dto.planTier,
        tokenLimitMonthly: dto.tokenLimitMonthly ?? plan.tokenLimitMonthly,
        concurrentLimit: dto.concurrentLimit ?? plan.concurrentLimit,
        periodStart: now,
        periodEnd,
        status: 'active',
      },
      include: { plan: true },
    });

    return {
      planTier: subscription.planTier,
      planName: subscription.plan.name,
      tokenLimitMonthly: subscription.tokenLimitMonthly,
      concurrentLimit: subscription.concurrentLimit,
      periodStart: subscription.periodStart,
      periodEnd: subscription.periodEnd,
    };
  }

  async updatePlanStatus(planId: number, status: string) {
    const plan = await this.prisma.lumaxPlanConfig.findUnique({
      where: { id: planId },
    });
    if (!plan) throw new BusinessException(ErrorCode.PLAN_NOT_FOUND);

    await this.prisma.lumaxPlanConfig.update({
      where: { id: planId },
      data: { status },
    });

    return { success: true };
  }
}
