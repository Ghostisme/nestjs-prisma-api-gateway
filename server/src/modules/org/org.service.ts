import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { PrismaService } from '../../prisma/prisma.service';
import { deptName } from '../../common/utils/format.util';
import { REDIS_CLIENT } from '../auth/redis.provider';
import type { TokenConfigDto } from './dto/org.dto';

const DEPT_TREE = {
  nodeId: '1',
  nodeName: '总公司',
  nodeType: 'company' as const,
  memberCount: 10,
  children: [
    { nodeId: '2', nodeName: '技术部', nodeType: 'department' as const, memberCount: 3, children: [] },
    { nodeId: '3', nodeName: '运营部', nodeType: 'department' as const, memberCount: 2, children: [] },
    { nodeId: '4', nodeName: '产品部', nodeType: 'department' as const, memberCount: 2, children: [] },
    { nodeId: '5', nodeName: '销售部', nodeType: 'department' as const, memberCount: 2, children: [] },
    { nodeId: '6', nodeName: '市场部', nodeType: 'department' as const, memberCount: 1, children: [] },
  ],
};

const DEPT_ID_MAP: Record<string, number[]> = {
  '1': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  '2': [2, 3],
  '3': [4, 5, 6],
  '4': [7, 8],
  '5': [9, 10],
  '6': [1],
};

@Injectable()
export class OrgService {
  private readonly logger = new Logger(OrgService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async getTree() {
    return DEPT_TREE;
  }

  async getNodeDetail(tenantId: number, nodeId: string) {
    type AnyNode = { nodeId: string; nodeName: string; nodeType: string; memberCount: number; children: AnyNode[] };

    const findNode = (node: AnyNode, id: string): AnyNode | null => {
      if (node.nodeId === id) return node;
      for (const c of node.children ?? []) {
        const found = findNode(c, id);
        if (found) return found;
      }
      return null;
    };

    const node = findNode(DEPT_TREE as AnyNode, nodeId);
    const nodeName = node?.nodeName ?? '未知';
    const nodeType = node?.nodeType ?? 'department';

    const userIds = DEPT_ID_MAP[nodeId] ?? [];
    const quotas = await this.prisma.lumaxUserQuota.findMany({
      where: { tenantId, userId: { in: userIds } },
    });

    const directMembers = quotas.map((q) => ({
      memberId: String(q.userId),
      memberName: q.username || `用户${q.userId}`,
      department: deptName(q.deptId),
      tokenQuota: q.totalQuota,
      remainToken: q.totalQuota === -1 ? -1 : q.totalQuota - q.usedQuota,
    }));

    const subDepartments = (node?.children ?? []).map((c) => ({
      nodeId: c.nodeId,
      nodeName: c.nodeName,
      memberCount: c.memberCount,
    }));

    return {
      nodeId,
      nodeName,
      nodeType,
      directMembers,
      subDepartments,
    };
  }

  async setDeptTokenConfig(tenantId: number, nodeId: number, dto: TokenConfigDto) {
    this.logger.log(`Setting tenant ${tenantId} dept ${nodeId} token config: ${JSON.stringify(dto)}`);
    const userIds = DEPT_ID_MAP[String(nodeId)] ?? [];
    if (userIds.length === 0) {
      return { success: true };
    }

    const totalQuota = dto.unlimited ? -1 : (dto.quota ?? -1);
    const quotaPeriod = dto.period ?? 'unlimited';

    await this.prisma.$transaction(
      userIds.map((userId) =>
        this.prisma.lumaxUserQuota.upsert({
          where: { tenantId_userId: { tenantId, userId } },
          update: { totalQuota, quotaPeriod },
          create: {
            tenantId,
            userId,
            username: '',
            totalQuota,
            quotaPeriod,
          },
        }),
      ),
    );

    await this.clearQuotaUsedCache(tenantId, userIds);

    return { success: true };
  }

  async setMemberTokenConfig(tenantId: number, memberId: number, dto: TokenConfigDto) {
    const totalQuota = dto.unlimited ? -1 : (dto.quota ?? -1);

    await this.prisma.lumaxUserQuota.upsert({
      where: { tenantId_userId: { tenantId, userId: memberId } },
      update: { totalQuota, quotaPeriod: dto.period ?? 'unlimited' },
      create: {
        tenantId,
        userId: memberId,
        username: '',
        totalQuota,
        quotaPeriod: dto.period ?? 'unlimited',
      },
    });

    await this.clearQuotaUsedCache(tenantId, [memberId]);

    return { success: true };
  }

  private quotaUsedKey(tenantId: number, userId: number) {
    return `${tenantId}:lumax:quota:used:${userId}`;
  }

  private async clearQuotaUsedCache(tenantId: number, userIds: number[]) {
    if (userIds.length === 0) {
      return;
    }
    const keys = userIds.map((userId) => this.quotaUsedKey(tenantId, userId));
    try {
      await this.redis.del(...keys);
    }
    catch (error) {
      this.logger.warn(`Failed to clear quota used cache: keys=${keys.join(',')}`, error as Error);
    }
  }
}
