import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /** Liveness: the process is up. Cheap, never touches the database. */
  @Public()
  @Get()
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  /**
   * Readiness: verifies the database connection is awake.
   *
   * On a serverless / auto-suspending Postgres (e.g. a free tier that sleeps
   * when idle) this is the request that both triggers and waits out the
   * cold start — so the frontend can poll it to render a "waking up" state
   * and only load the app once the DB is actually reachable.
   */
  @Public()
  @Get('ready')
  async ready() {
    const startedAt = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ready',
        database: 'up',
        latencyMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        status: 'starting',
        database: 'down',
        latencyMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
