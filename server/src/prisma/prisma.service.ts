import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly pool: Pool;

  constructor() {
    const connectionString =
      process.env.DATABASE_URL ??
      'postgresql://postgres:postgres@localhost:5432/lumax?schema=public';

    // Managed/cloud Postgres (Aiven, Supabase, Neon, RDS, …) require TLS.
    // Enable SSL when the URL asks for it, when DATABASE_SSL=true, or for a
    // known managed host — but keep local connections plain.
    const wantsSsl =
      process.env.DATABASE_SSL === 'true' ||
      /sslmode=(require|verify-ca|verify-full|prefer)/i.test(connectionString) ||
      /[.]aivencloud[.]com|[.]supabase[.]co|[.]neon[.]tech|rds[.]amazonaws[.]com/i.test(
        connectionString,
      );

    // Strip `sslmode` so pg-connection-string doesn't force verify-full
    // (which rejects managed providers' self-signed CA chains); TLS is driven
    // explicitly via the `ssl` option below.
    let cleanConnectionString = connectionString;
    try {
      const parsed = new URL(connectionString);
      parsed.searchParams.delete('sslmode');
      cleanConnectionString = parsed.toString();
    } catch {
      // keep the raw string if it isn't a parseable URL
    }

    const pool = new Pool({
      connectionString: cleanConnectionString,
      ...(wantsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
    });
    const adapter = new PrismaPg(pool);

    super({ adapter });
    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('PostgreSQL connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
    this.logger.log('PostgreSQL disconnected');
  }
}
