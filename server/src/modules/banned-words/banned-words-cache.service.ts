import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { PrismaService } from '../../prisma/prisma.service';
import { REDIS_CLIENT } from '../auth/redis.provider';

export type BannedWordTriggerMode = 'input' | 'output';

export interface CachedBannedWord {
  wordId: number;
  categoryId: number;
  word: string;
  wordExact: string;
  wordFuzzyPrefix: string;
}

const CACHE_KEY_SEGMENT = 'lumax:banned_words';
const CACHE_TTL_SECONDS = 24 * 60 * 60;
const MODES_SENTINEL = '__modes';
const DEFAULT_TRIGGER_MODES: BannedWordTriggerMode[] = ['input'];
const DEFAULT_MATCH_MODES = ['exact'];

@Injectable()
export class BannedWordsCacheService {
  private readonly logger = new Logger(BannedWordsCacheService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async rebuildTenantCache(tenantId: number): Promise<void> {
    const words = await this.prisma.lumaxBannedWord.findMany({
      where: { tenantId, status: 'enabled' },
      select: { id: true, categoryId: true, word: true, triggerMode: true, matchMode: true },
    });

    const entriesByKey = new Map<string, CachedBannedWord[]>();
    const modesByTrigger = new Map<BannedWordTriggerMode, Set<string>>();

    for (const row of words) {
      const triggerModes = this.parseTriggerModes(row.triggerMode);
      const matchModes = this.parseMatchModes(row.matchMode);
      const wordExact = this.normalizeExact(row.word);
      const normalized = this.normalizeFuzzy(row.word);
      const fuzzyPrefix = normalized.length >= 4 ? normalized.slice(0, normalized.length - 1) : '';

      for (const triggerMode of triggerModes) {
        let modeSet = modesByTrigger.get(triggerMode);
        if (!modeSet) {
          modeSet = new Set<string>();
          modesByTrigger.set(triggerMode, modeSet);
        }

        for (const matchMode of matchModes) {
          modeSet.add(matchMode);
          const key = this.wordsKey(tenantId, triggerMode, matchMode);
          const bucket = entriesByKey.get(key) ?? [];
          bucket.push({
            wordId: row.id,
            categoryId: row.categoryId,
            word: row.word,
            wordExact,
            wordFuzzyPrefix: fuzzyPrefix,
          });
          entriesByKey.set(key, bucket);
        }
      }
    }

    await this.clearTenantCacheKeys(tenantId);

    const multi = this.redis.multi();
    for (const [key, entries] of entriesByKey.entries()) {
      multi.set(key, JSON.stringify(entries), 'EX', CACHE_TTL_SECONDS);
    }
    for (const triggerMode of ['input', 'output'] as BannedWordTriggerMode[]) {
      const modes = Array.from(modesByTrigger.get(triggerMode) ?? []);
      multi.set(this.modesKey(tenantId, triggerMode), JSON.stringify(modes), 'EX', CACHE_TTL_SECONDS);
    }
    await multi.exec();
  }

  async getModesForTrigger(tenantId: number, triggerMode: BannedWordTriggerMode): Promise<string[]> {
    const key = this.modesKey(tenantId, triggerMode);
    const cached = await this.redis.get(key);
    if (cached) {
      return this.parseStringArray(cached);
    }

    await this.rebuildTenantCache(tenantId);
    const reloaded = await this.redis.get(key);
    return reloaded ? this.parseStringArray(reloaded) : [];
  }

  async getWordsForMode(
    tenantId: number,
    triggerMode: BannedWordTriggerMode,
    matchMode: string,
  ): Promise<CachedBannedWord[]> {
    const key = this.wordsKey(tenantId, triggerMode, matchMode);
    const cached = await this.redis.get(key);
    if (cached) {
      return this.parseWordsArray(cached);
    }

    await this.rebuildTenantCache(tenantId);
    const reloaded = await this.redis.get(key);
    return reloaded ? this.parseWordsArray(reloaded) : [];
  }

  normalizeExact(text: string): string {
    return String(text ?? '').toLowerCase();
  }

  normalizeFuzzy(text: string): string {
    return this.normalizeExact(text).replace(/[^\w\u4e00-\u9fff]/g, '');
  }

  private parseTriggerModes(raw: string): BannedWordTriggerMode[] {
    const values = this.parseCsv(raw)
      .filter((value) => value === 'input' || value === 'output') as BannedWordTriggerMode[];
    return values.length > 0 ? values : DEFAULT_TRIGGER_MODES;
  }

  private parseMatchModes(raw: string): string[] {
    const values = this.parseCsv(raw);
    return values.length > 0 ? values : DEFAULT_MATCH_MODES;
  }

  private parseCsv(raw: string): string[] {
    return String(raw ?? '')
      .split(',')
      .map((token) => token.trim())
      .filter((token) => token.length > 0);
  }

  private wordsKey(tenantId: number, triggerMode: BannedWordTriggerMode, matchMode: string): string {
    return `${tenantId}:${CACHE_KEY_SEGMENT}:${triggerMode}:${matchMode}`;
  }

  private modesKey(tenantId: number, triggerMode: BannedWordTriggerMode): string {
    return `${tenantId}:${CACHE_KEY_SEGMENT}:${triggerMode}:${MODES_SENTINEL}`;
  }

  private tenantPattern(tenantId: number): string {
    return `${tenantId}:${CACHE_KEY_SEGMENT}:*`;
  }

  private async clearTenantCacheKeys(tenantId: number): Promise<void> {
    let cursor = '0';
    const keys: string[] = [];

    do {
      const [nextCursor, batch] = await this.redis.scan(cursor, 'MATCH', this.tenantPattern(tenantId), 'COUNT', 200);
      cursor = nextCursor;
      if (batch.length > 0) {
        keys.push(...batch);
      }
    } while (cursor !== '0');

    if (keys.length === 0) {
      return;
    }

    try {
      await this.redis.del(...keys);
    }
    catch (error) {
      this.logger.warn(`Failed to clear banned words cache keys for tenant=${tenantId}`, error as Error);
    }
  }

  private parseStringArray(raw: string): string[] {
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.filter((item): item is string => typeof item === 'string');
    }
    catch {
      return [];
    }
  }

  private parseWordsArray(raw: string): CachedBannedWord[] {
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed
        .filter((item) => item && typeof item === 'object')
        .map((item) => ({
          wordId: Number(item.wordId),
          categoryId: Number(item.categoryId),
          word: String(item.word ?? ''),
          wordExact: String(item.wordExact ?? ''),
          wordFuzzyPrefix: String(item.wordFuzzyPrefix ?? ''),
        }))
        .filter((item) => Number.isInteger(item.wordId) && item.wordId > 0 && Number.isInteger(item.categoryId) && item.categoryId > 0);
    }
    catch {
      return [];
    }
  }
}
