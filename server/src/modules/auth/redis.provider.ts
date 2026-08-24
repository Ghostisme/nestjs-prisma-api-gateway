import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

function getRequiredString(configService: ConfigService, key: string): string {
  const value = configService.get<string>(key);
  if (value === undefined || value === null || value.trim() === '') {
    throw new Error(`Missing required config: ${key}`);
  }
  return value.trim();
}

function getRequiredNumber(configService: ConfigService, key: string): number {
  const raw = getRequiredString(configService, key);
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`Invalid numeric config: ${key}=${raw}`);
  }
  return value;
}

function formatRedisError(err: unknown): string {
  if (!err || typeof err !== 'object') {
    return String(err ?? 'unknown error');
  }
  const e = err as {
    name?: string;
    message?: string;
    code?: string | number;
    errno?: string | number;
    address?: string;
    port?: string | number;
    stack?: string;
  };
  const details = {
    name: e.name,
    code: e.code,
    errno: e.errno,
    address: e.address,
    port: e.port,
    message: e.message,
    stack: e.stack,
  };
  const compact = Object.fromEntries(
    Object.entries(details).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );
  return Object.keys(compact).length > 0 ? JSON.stringify(compact) : String(err);
}

export const redisProvider = {
  provide: REDIS_CLIENT,
  useFactory: (configService: ConfigService): Redis => {
    const logger = new Logger('RedisProvider');
    let errorLogged = false;

    const host = getRequiredString(configService, 'REDIS_HOST');
    const port = getRequiredNumber(configService, 'REDIS_PORT');
    const password = configService.get<string>('REDIS_PASSWORD');
    if (password === undefined || password === null) {
      throw new Error('Missing required config: REDIS_PASSWORD');
    }
    const dbRaw = configService.get<string>('REDIS_DATABASE');
    if (dbRaw === undefined || dbRaw === null || dbRaw.trim() === '') {
      throw new Error('Missing required config: REDIS_DATABASE');
    }
    const db = Number(dbRaw);
    if (!Number.isInteger(db) || db < 0) {
      throw new Error(`Invalid numeric config: REDIS_DATABASE=${dbRaw}`);
    }

    // Managed Redis (Upstash, Redis Cloud, …) requires TLS. Enable it when
    // REDIS_TLS=true or for a known managed host, mirroring the SSL detection
    // in prisma.service.ts. `rejectUnauthorized: false` accepts the provider's
    // managed CA chain — fine for a demo BFF; tighten if you pin a CA.
    const wantsTls =
      configService.get<string>('REDIS_TLS') === 'true' ||
      /[.]upstash[.]io|[.]redns[.]redis-cloud[.]com|[.]rediss[.]/i.test(host);

    const redis = new Redis({
      host,
      port,
      password,
      db,
      ...(wantsTls ? { tls: { rejectUnauthorized: false } } : {}),
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 10) {
          logger.warn('Redis unreachable after 10 retries, stopping reconnection. Auth via Opaque Token will be unavailable.');
          return null;
        }
        return Math.min(times * 500, 5000);
      },
      lazyConnect: true,
    });

    redis.on('connect', () => {
      errorLogged = false;
      logger.log('Redis connected');
    });

    redis.on('error', (err) => {
      if (!errorLogged) {
        logger.warn(`Redis unavailable: ${formatRedisError(err)}. Token authentication will not work until Redis is connected.`);
        errorLogged = true;
      }
    });

    redis.connect().catch(() => {
      // initial connect failure handled by error event
    });

    return redis;
  },
  inject: [ConfigService],
};
