import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import dayjs from 'dayjs';
import { PrismaService } from '../../prisma/prisma.service';
import { fmtDate } from '../../common/utils/format.util';
import { BannedWordsCacheService } from './banned-words-cache.service';
import type { BannedWordsFilterDto, CreateBannedWordDto } from './dto/banned-words.dto';

const RISK_LEVEL_TO_CN: Record<string, string> = {
  high: '高风险',
  medium: '中风险',
  low: '低风险',
};

const RISK_LEVEL_TO_EN: Record<string, string> = {
  高风险: 'high',
  中风险: 'medium',
  低风险: 'low',
};

const SUPPORTED_TRIGGER_MODES = new Set(['input', 'output']);
const SUPPORTED_MATCH_MODES = new Set(['exact', 'fuzzy', 'semantic', 'model']);

@Injectable()
export class BannedWordsService {
  private readonly logger = new Logger(BannedWordsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: BannedWordsCacheService,
  ) {}

  async getOverview(tenantId: number, filter: BannedWordsFilterDto) {
    const triggerWhere = this.buildTriggerWhere(tenantId, filter);

    const [totalWords, triggerUsers, totalTriggers] = await Promise.all([
      this.prisma.lumaxBannedWord.count({ where: { tenantId, status: 'enabled' } }),
      this.prisma.lumaxBannedWordTrigger
        .findMany({ where: triggerWhere, distinct: ['userId'], select: { userId: true } })
        .then((r) => r.length),
      this.prisma.lumaxBannedWordTrigger.count({ where: triggerWhere }),
    ]);
    return { totalWords, totalUserTriggerCount: triggerUsers, totalInterceptCount: totalTriggers };
  }

  async getCategoryDistribution(tenantId: number, filter: BannedWordsFilterDto) {
    const hasFilter = filter.timeRange !== 'all' || (filter.model && filter.model !== 'all') || (filter.agent && filter.agent !== 'all');
    if (!hasFilter) {
      const categories = await this.prisma.lumaxBannedWordCategory.findMany({
        where: { tenantId },
        select: { name: true, wordCount: true },
      });
      return categories.map((c) => ({ name: c.name, value: c.wordCount }));
    }

    const triggerWhere = this.buildTriggerWhere(tenantId, filter);
    const distribution = await this.prisma.lumaxBannedWordTrigger.groupBy({
      by: ['categoryId'],
      where: triggerWhere,
      _count: true,
    });
    const categoryIds = distribution.map((d) => d.categoryId);
    const categories = categoryIds.length > 0
      ? await this.prisma.lumaxBannedWordCategory.findMany({
          where: { id: { in: categoryIds } },
          select: { id: true, name: true },
        })
      : [];
    const nameMap = new Map(categories.map((c) => [c.id, c.name]));
    return distribution.map((d) => ({
      name: nameMap.get(d.categoryId) ?? `类型${d.categoryId}`,
      value: d._count,
    }));
  }

  async getUserRank(tenantId: number, filter: BannedWordsFilterDto) {
    const triggerWhere = this.buildTriggerWhere(tenantId, filter);

    const triggers = await this.prisma.lumaxBannedWordTrigger.groupBy({
      by: ['userId'],
      where: triggerWhere,
      _count: true,
      orderBy: { _count: { userId: 'desc' } },
      take: 10,
    });

    const userIds = triggers.map((t) => t.userId);
    const conversations = userIds.length > 0
      ? await this.prisma.lumaxConversation.findMany({
          where: { tenantId, userId: { in: userIds } },
          distinct: ['userId'],
          select: { userId: true, username: true },
        })
      : [];
    const userNameMap = new Map(conversations.map((c) => [c.userId, c.username]));

    return triggers.map((t) => ({
      userName: userNameMap.get(t.userId) || `用户${t.userId}`,
      count: t._count,
    }));
  }

  async getCategories(tenantId: number) {
    const categories = await this.prisma.lumaxBannedWordCategory.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return categories.map((c) => ({
      id: c.id,
      category: c.name,
      riskLevel: RISK_LEVEL_TO_CN[c.riskLevel] ?? c.riskLevel,
      wordCount: c.wordCount,
      triggerCount: c.triggerCount,
    }));
  }

  async createBannedWord(tenantId: number, dto: CreateBannedWordDto) {
    this.assertSupportedModes(dto.triggerMode, SUPPORTED_TRIGGER_MODES, 'triggerMode');
    this.assertSupportedModes(dto.matchMode, SUPPORTED_MATCH_MODES, 'matchMode');

    const riskLevelEN = RISK_LEVEL_TO_EN[dto.riskLevel] ?? dto.riskLevel;

    let category = await this.prisma.lumaxBannedWordCategory.findUnique({
      where: { tenantId_name: { tenantId, name: dto.category } },
    });

    if (!category) {
      category = await this.prisma.lumaxBannedWordCategory.create({
        data: { tenantId, name: dto.category, riskLevel: riskLevelEN },
      });
    }

    const word = await this.prisma.lumaxBannedWord.create({
      data: {
        tenantId,
        categoryId: category.id,
        word: dto.word,
        triggerMode: dto.triggerMode.join(','),
        matchMode: dto.matchMode.join(','),
      },
    });

    await this.prisma.lumaxBannedWordCategory.update({
      where: { id: category.id },
      data: { wordCount: { increment: 1 } },
    });

    await this.safeRefreshTenantCache(tenantId);
    return word;
  }

  async toggleWord(tenantId: number, wordId: number, status?: string) {
    const word = await this.prisma.lumaxBannedWord.findFirst({ where: { id: wordId, tenantId } });
    if (!word) return;

    const newStatus = status ?? (word.status === 'enabled' ? 'disabled' : 'enabled');
    await this.prisma.lumaxBannedWord.update({
      where: { id: wordId },
      data: { status: newStatus },
    });

    const enabledCount = await this.prisma.lumaxBannedWord.count({
      where: { tenantId, categoryId: word.categoryId, status: 'enabled' },
    });
    await this.prisma.lumaxBannedWordCategory.update({
      where: { id: word.categoryId },
      data: { wordCount: enabledCount },
    });

    await this.safeRefreshTenantCache(tenantId);
    return { status: newStatus };
  }

  async deleteWord(tenantId: number, wordId: number) {
    const word = await this.prisma.lumaxBannedWord.findFirst({ where: { id: wordId, tenantId } });
    if (!word) return;

    await this.prisma.lumaxBannedWordTrigger.deleteMany({ where: { wordId } });
    await this.prisma.lumaxBannedWord.delete({ where: { id: wordId } });

    const enabledCount = await this.prisma.lumaxBannedWord.count({
      where: { tenantId, categoryId: word.categoryId, status: 'enabled' },
    });
    await this.prisma.lumaxBannedWordCategory.update({
      where: { id: word.categoryId },
      data: { wordCount: enabledCount },
    });

    await this.safeRefreshTenantCache(tenantId);
    return { success: true };
  }

  async getCategoryWords(tenantId: number, categoryId: number) {
    const words = await this.prisma.lumaxBannedWord.findMany({
      where: { tenantId, categoryId },
      orderBy: { createdAt: 'desc' },
    });

    return words.map((w) => {
      const triggerModes = w.triggerMode.split(',');
      const matchModes = w.matchMode.split(',');
      return {
        id: w.id,
        wordName: w.word,
        inputTrigger: triggerModes.includes('input'),
        outputTrigger: triggerModes.includes('output'),
        exactMatch: matchModes.includes('exact'),
        fuzzyMatch: matchModes.includes('fuzzy'),
        semanticMatch: matchModes.includes('semantic'),
        modelMatch: matchModes.includes('model'),
        addTime: fmtDate(w.createdAt),
        status: w.status === 'enabled' ? '启用' : '禁用',
      };
    });
  }

  async getCategoryTriggers(tenantId: number, categoryId: number) {
    const triggers = await this.prisma.lumaxBannedWordTrigger.findMany({
      where: { tenantId, categoryId },
      orderBy: { triggerTime: 'desc' },
      include: {
        word: { select: { word: true } },
        conversation: { select: { username: true } },
      },
    });

    return triggers.map((t) => ({
      id: t.id,
      userName: t.conversation?.username || `用户${t.userId}`,
      wordName: t.word.word,
      triggerTime: fmtDate(t.triggerTime),
      triggerSource: t.triggerSource ?? '',
      matchedMode: t.matchedMode ?? '',
      interceptStatus: '已拦截',
    }));
  }

  async getWordTriggers(tenantId: number, wordId: number) {
    const triggers = await this.prisma.lumaxBannedWordTrigger.findMany({
      where: { tenantId, wordId },
      orderBy: { triggerTime: 'desc' },
      include: {
        word: { select: { word: true } },
        conversation: { select: { username: true } },
      },
    });

    return triggers.map((t) => ({
      id: t.id,
      userName: t.conversation?.username || `用户${t.userId}`,
      wordName: t.word.word,
      triggerTime: fmtDate(t.triggerTime),
      triggerSource: t.triggerSource ?? '',
      matchedMode: t.matchedMode ?? '',
      interceptStatus: '已拦截',
    }));
  }

  private async safeRefreshTenantCache(tenantId: number): Promise<void> {
    try {
      await this.cacheService.rebuildTenantCache(tenantId);
    }
    catch (error) {
      this.logger.warn(`Failed to rebuild banned words cache for tenant=${tenantId}`, error as Error);
    }
  }

  private buildTriggerWhere(tenantId: number, filter: BannedWordsFilterDto): any {
    const where: any = { tenantId };

    const { start, end } = this.getTimeRange(filter);
    if (start) {
      where.triggerTime = { gte: start, lte: end };
    }

    const conversationFilter: any = {};
    if (filter.model && filter.model !== 'all') {
      conversationFilter.modelName = filter.model;
    }
    if (filter.agent && filter.agent !== 'all') {
      conversationFilter.agentName = filter.agent;
    }
    if (Object.keys(conversationFilter).length > 0) {
      where.conversation = conversationFilter;
    }

    return where;
  }

  private getTimeRange(filter: BannedWordsFilterDto) {
    const now = dayjs();
    let start: Date | null = null;
    let end: Date = now.toDate();

    switch (filter.timeRange) {
      case 'yesterday': {
        start = now.subtract(1, 'day').startOf('day').toDate();
        end = now.subtract(1, 'day').endOf('day').toDate();
        break;
      }
      case 'last7days': {
        start = now.subtract(7, 'day').startOf('day').toDate();
        break;
      }
      case 'last30days': {
        start = now.subtract(30, 'day').startOf('day').toDate();
        break;
      }
      case 'custom': {
        if (filter.customRange?.length === 2) {
          start = dayjs(filter.customRange[0]).startOf('day').toDate();
          end = dayjs(filter.customRange[1]).endOf('day').toDate();
        }
        break;
      }
    }

    return { start, end };
  }

  private assertSupportedModes(values: string[], supported: Set<string>, field: string): void {
    for (const value of values) {
      if (!supported.has(value)) {
        throw new BadRequestException(`${field} contains unsupported mode: ${value}`);
      }
    }
  }
}
