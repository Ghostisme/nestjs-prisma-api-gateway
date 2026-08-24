import { DynamicModule, Logger, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service';

/**
 * SchedulerModule
 * ----------------
 * Hosts the cron-driven aggregation/cleanup jobs (hourly token stats, daily
 * rollups, monthly summaries, quota-alert sweeps, log retention).
 *
 * These jobs assume a **long-running process** (`@nestjs/schedule` keeps timers
 * alive in memory). On a serverless host (e.g. Vercel functions) there is no
 * persistent process, so the timers would never fire — and worse, importing
 * `ScheduleModule.forRoot()` there just adds dead weight and misleading logs.
 *
 * Therefore registration is gated behind `SCHEDULER_ENABLED`:
 *   - Persistent host (Railway / Render / VM / Docker) → set `SCHEDULER_ENABLED=true`
 *     to run the full cron suite.
 *   - Serverless demo (Vercel) → leave it unset/`false`; the jobs are skipped
 *     and the equivalent numbers come from seeded/aggregated data instead.
 *
 * The job code itself is never removed — flipping one env var restores the
 * whole scheduling layer when deployed to a process-based host.
 */
@Module({})
export class SchedulerModule {
  private static readonly logger = new Logger(SchedulerModule.name);

  /**
   * Conditionally wires up the scheduler. Reads `SCHEDULER_ENABLED` from the
   * environment directly (not via ConfigService) because module registration
   * happens before the DI container — and thus before ConfigModule — is ready.
   */
  static register(): DynamicModule {
    const enabled = process.env.SCHEDULER_ENABLED === 'true';

    if (!enabled) {
      // No timers, no ScheduleModule — safe for serverless / short-lived processes.
      SchedulerModule.logger.log(
        'SCHEDULER_ENABLED is not "true" — cron jobs disabled (expected on serverless).',
      );
      return { module: SchedulerModule };
    }

    SchedulerModule.logger.log('SCHEDULER_ENABLED=true — registering cron jobs.');
    return {
      module: SchedulerModule,
      imports: [ScheduleModule.forRoot()],
      providers: [SchedulerService],
    };
  }
}
