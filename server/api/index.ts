import { NestFactory } from '@nestjs/core';
import type { Express, Request, Response } from 'express';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/main';

/**
 * Vercel serverless entry point for the NestJS gateway.
 * ------------------------------------------------------
 * Vercel runs this file as a single function; every request to the project is
 * routed here (see `vercel.json` rewrites). A serverless function has no
 * persistent process, so instead of `app.listen()` we:
 *
 *   1. Build the Nest app once (NestFactory defaults to the Express platform,
 *      so an underlying Express instance already exists — no need to depend on
 *      `express` directly, which isn't a first-party dep of this package),
 *   2. Apply the shared {@link configureApp} setup (prefix/pipes/CORS/Swagger),
 *   3. `init()` it (wires DI + middleware, but starts NO HTTP listener),
 *   4. Pull the underlying Express instance out via the HTTP adapter and use it
 *      as the handler — an Express app is already a `(req, res)` function,
 *      exactly what Vercel expects.
 *
 * Cold-start reuse: the built app is cached in a module-scoped promise, so
 * within a warm function instance subsequent requests skip bootstrap entirely.
 *
 * Serverless caveats (for whoever deploys this):
 *   - Cron jobs are disabled here (SCHEDULER_ENABLED unset) — see scheduler.module.ts.
 *   - Nacos service discovery must be off (NACOS_ENABLED=false).
 *   - Use serverless-friendly managed Redis/Postgres (Upstash / Neon);
 *     connections re-establish on cold start (both are handled gracefully).
 */

// Cached bootstrap promise — one per warm function instance.
let cachedServer: Promise<Express> | null = null;

/**
 * Builds and initialises the Nest app exactly once, returning the underlying
 * Express instance. Concurrent cold-start requests all await the same promise.
 */
async function bootstrapServer(): Promise<Express> {
  const app = await NestFactory.create(AppModule);

  configureApp(app);

  // init() (not listen()) — sets up routes/middleware without binding a port.
  await app.init();

  // The default platform is Express; grab the raw instance to serve requests.
  return app.getHttpAdapter().getInstance() as Express;
}

/**
 * Vercel Node function handler. Lazily bootstraps (and caches) the server,
 * then delegates the raw request/response to the Express instance.
 */
export default async function handler(req: Request, res: Response) {
  if (!cachedServer) {
    cachedServer = bootstrapServer();
  }
  const server = await cachedServer;
  server(req, res);
}
