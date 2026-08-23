import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/filters/business-exception.filter';
import { ErrorCode } from '../../common/enums/error-code.enum';
import type { AgentRunEventDto, AgentMonitorQueryDto } from './dto/agent-monitor.dto';

@Injectable()
export class AgentMonitorService {
  private readonly logger = new Logger(AgentMonitorService.name);

  constructor(private readonly prisma: PrismaService) {}

  async handleEvent(dto: AgentRunEventDto) {
    if (dto.eventType === 'start') {
      const run = await this.prisma.lumaxAgentRun.create({
        data: {
          tenantId: dto.tenantId,
          userId: dto.userId,
          threadId: dto.threadId,
          agentName: dto.agentName ?? '',
          skillName: dto.skillName ?? '',
          modelName: dto.modelName ?? '',
          status: 'running',
        },
      });
      return { runId: run.id };
    }

    if (dto.eventType === 'end' && dto.runId) {
      await this.prisma.lumaxAgentRun.update({
        where: { id: dto.runId },
        data: {
          status: dto.status ?? 'completed',
          durationMs: dto.durationMs ?? 0,
          tokensTotal: dto.tokensTotal ?? 0,
          tokensIn: dto.tokensIn ?? 0,
          tokensOut: dto.tokensOut ?? 0,
          toolCallsCount: dto.toolCallsCount ?? 0,
          errorType: dto.errorType,
          errorMessage: dto.errorMessage,
          endedAt: new Date(),
        },
      });
      return { success: true };
    }

    if (dto.eventType === 'end' && !dto.runId) {
      const run = await this.prisma.lumaxAgentRun.findFirst({
        where: { tenantId: dto.tenantId, threadId: dto.threadId, status: 'running' },
        orderBy: { startedAt: 'desc' },
      });
      if (run) {
        await this.prisma.lumaxAgentRun.update({
          where: { id: run.id },
          data: {
            status: dto.status ?? 'completed',
            durationMs: dto.durationMs ?? 0,
            tokensTotal: dto.tokensTotal ?? 0,
            tokensIn: dto.tokensIn ?? 0,
            tokensOut: dto.tokensOut ?? 0,
            toolCallsCount: dto.toolCallsCount ?? 0,
            errorType: dto.errorType,
            errorMessage: dto.errorMessage,
            endedAt: new Date(),
          },
        });
      }
      return { success: true };
    }

    return { success: true };
  }

  async getDashboard(tenantId: number, startDate?: string, endDate?: string) {
    const dateFilter = {
      ...(startDate && { gte: new Date(startDate) }),
      ...(endDate && { lte: new Date(endDate) }),
    };
    const where = {
      tenantId,
      ...(Object.keys(dateFilter).length > 0 && { startedAt: dateFilter }),
    };

    const [total, completed, failed, running, avgStats] = await Promise.all([
      this.prisma.lumaxAgentRun.count({ where }),
      this.prisma.lumaxAgentRun.count({ where: { ...where, status: 'completed' } }),
      this.prisma.lumaxAgentRun.count({ where: { ...where, status: 'failed' } }),
      this.prisma.lumaxAgentRun.count({ where: { ...where, status: 'running' } }),
      this.prisma.lumaxAgentRun.aggregate({
        where: { ...where, status: 'completed' },
        _avg: { durationMs: true, tokensTotal: true },
      }),
    ]);

    const errorDistribution = await this.prisma.lumaxAgentRun.groupBy({
      by: ['errorType'],
      where: { ...where, status: 'failed', errorType: { not: null } },
      _count: true,
      orderBy: { _count: { errorType: 'desc' } },
    });

    return {
      total,
      completed,
      failed,
      running,
      successRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      avgDurationMs: Math.round(avgStats._avg.durationMs ?? 0),
      avgTokens: Math.round(avgStats._avg.tokensTotal ?? 0),
      errorDistribution: errorDistribution.map((e) => ({
        errorType: e.errorType,
        count: e._count,
      })),
    };
  }

  async getRuns(tenantId: number, query: AgentMonitorQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where = {
      tenantId,
      ...(query.status && { status: query.status }),
      ...(query.agentName && { agentName: query.agentName }),
      ...((query.startDate || query.endDate) && {
        startedAt: {
          ...(query.startDate && { gte: new Date(query.startDate) }),
          ...(query.endDate && { lte: new Date(query.endDate) }),
        },
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.lumaxAgentRun.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.lumaxAgentRun.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async getRunDetail(tenantId: number, id: number) {
    const run = await this.prisma.lumaxAgentRun.findFirst({
      where: { id, tenantId },
    });
    if (!run) throw new BusinessException(ErrorCode.AGENT_RUN_NOT_FOUND);
    return run;
  }

  async getSkillsRanking(tenantId: number, startDate?: string, endDate?: string) {
    const dateFilter = {
      ...(startDate && { gte: new Date(startDate) }),
      ...(endDate && { lte: new Date(endDate) }),
    };
    const where = {
      tenantId,
      skillName: { not: '' },
      ...(Object.keys(dateFilter).length > 0 && { startedAt: dateFilter }),
    };

    const result = await this.prisma.lumaxAgentRun.groupBy({
      by: ['skillName'],
      where,
      _count: true,
      _avg: { durationMs: true, tokensTotal: true },
      orderBy: { _count: { skillName: 'desc' } },
      take: 20,
    });

    const completedCounts = await this.prisma.lumaxAgentRun.groupBy({
      by: ['skillName'],
      where: { ...where, status: 'completed' },
      _count: true,
    });
    const completedMap = new Map(completedCounts.map((c) => [c.skillName, c._count]));

    return result.map((r) => ({
      skillName: r.skillName,
      callsCount: r._count,
      avgDurationMs: Math.round(r._avg.durationMs ?? 0),
      avgTokens: Math.round(r._avg.tokensTotal ?? 0),
      successRate: r._count > 0
        ? Math.round(((completedMap.get(r.skillName) ?? 0) / r._count) * 1000) / 10
        : 0,
    }));
  }

  async getToolsStats(tenantId: number) {
    const result = await this.prisma.lumaxAgentRun.groupBy({
      by: ['agentName'],
      where: { tenantId },
      _sum: { toolCallsCount: true },
      _count: true,
      orderBy: { _sum: { toolCallsCount: 'desc' } },
      take: 20,
    });

    return result.map((r) => ({
      agentName: r.agentName,
      totalToolCalls: r._sum.toolCallsCount ?? 0,
      runsCount: r._count,
    }));
  }
}
