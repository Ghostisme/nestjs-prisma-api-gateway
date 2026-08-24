# Deployment Guide

Lumax ships as two deployables from **one repo**, each deployed as its own
project — exactly like a `web` + `server` split:

| Part | Folder | Platform | Root Directory |
|------|--------|----------|----------------|
| React SPA | `web/` | Vercel | `web` |
| NestJS gateway | `server/` | Vercel (serverless) | `server` |

Managed data services (free tiers are enough for a public demo):

- **PostgreSQL** → [Neon](https://neon.tech) (auto-detected for SSL by the app)
- **Redis** → [Upstash](https://upstash.com) (auto-detected for TLS by the app)

The visitor only ever sees a single `https://<web>.vercel.app` link; it calls
the gateway project over its public URL. Same pattern as any Vercel front-end +
Vercel serverless back-end.

> **Prefer a persistent host?** The server also runs great as a long-lived
> process (Railway/Render/Docker/VM) — see [Persistent host](#alt-persistent-host)
> at the bottom. That mode additionally unlocks the cron jobs.

---

## 1. Database — Neon

1. Create a project at [neon.tech](https://neon.tech); copy the connection
   string (looks like `postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require`).
2. Apply the schema. Locally, with `DATABASE_URL` pointed at Neon:
   ```bash
   cd server
   pnpm install
   pnpm prisma migrate deploy     # or: apply database/scripts/V001..V010 in order
   pnpm db:seed                   # seed dictionary / reference data
   ```
   `prisma.service.ts` auto-enables TLS for `*.neon.tech`, so no extra flag is
   needed.

## 2. Redis — Upstash

1. Create a database at [upstash.com](https://upstash.com).
2. From its details page grab the **host**, **port**, and **password**.
   `redis.provider.ts` auto-enables TLS for `*.upstash.io`.

## 3. Backend project — `server/` on Vercel

1. [vercel.com](https://vercel.com) → **New Project** → import this repo.
2. **Root Directory** = `server`.
3. Vercel picks up `server/vercel.json` automatically: it runs
   `pnpm install && pnpm prisma generate`, builds `api/index.ts` as the
   serverless function, and rewrites all routes to it.
4. Add Environment Variables:

   | Var | Value |
   |-----|-------|
   | `DATABASE_URL` | your Neon connection string |
   | `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | from Upstash |
   | `REDIS_DATABASE` | `0` |
   | `REDIS_TLS` | `true` |
   | `NACOS_ENABLED` | `false` |
   | `SCHEDULER_ENABLED` | `false` *(no persistent process on serverless)* |
   | `SWAGGER_ENABLED` | `false` *(or `true` to expose `/api/api-docs`)* |
   | `AUTH_MOCK` | `true` *(demo: injects a mock user, skips Redis token check)* |
   | `CORS_ORIGINS` | your web URL, e.g. `https://lumax-web.vercel.app` |

5. Deploy. Verify: `https://<server>.vercel.app/api/health` → `{ "status": "ok" }`
   and `.../api/health/ready` reports DB reachability.

### What changes on serverless (and why it's safe)

- **Cron jobs** (`@nestjs/schedule`) need a long-running process, so they're
  gated behind `SCHEDULER_ENABLED` and skipped here — dashboards read seeded /
  on-the-fly aggregates instead. Flip the flag on a persistent host to restore
  the full suite. See `server/src/modules/scheduler/scheduler.module.ts`.
- **Nacos** service discovery is off (`NACOS_ENABLED=false`).
- **Postgres/Redis** connect best-effort at cold start and never crash boot;
  the `/health/ready` probe is what the SPA polls to render its wakeup overlay.

## 4. Frontend project — `web/` on Vercel

1. **New Project** → same repo → **Root Directory** = `web`.
2. `web/vercel.json` already rewrites all routes to `/` (SPA history fallback).
3. Add Environment Variables:

   | Var | Value |
   |-----|-------|
   | `VITE_APP_API_BASE_URL` | `https://<server>.vercel.app/api` |
   | `VITE_LUMAX_BFF_URL` | `https://<server>.vercel.app` |
   | `VITE_API_BASE_BUSINESS_CODE` | `ai` |
   | `VITE_APP_ROUTER_MODE` | `frontend` |
   | `VITE_ENABLE_WAKEUP_GATE` | `true` |

   There is **no Vite dev proxy in production**, so the SPA must call the
   gateway by its absolute URL — that's what `VITE_APP_API_BASE_URL` is for.
4. Deploy. Open `https://<web>.vercel.app`.

## 5. Wire the two together

After both are live, set the backend's `CORS_ORIGINS` to the web URL and
redeploy the server once so cross-origin requests are allowed. Done — share the
`web` URL.

---

<a id="alt-persistent-host"></a>
## Alternative: persistent host (Railway / Render / Docker / VM)

The backend is a normal long-running NestJS process too. On a persistent host
you additionally get the cron jobs (set `SCHEDULER_ENABLED=true`).

### Docker

```bash
cd server
docker build -t lumax-service:latest .
docker run -d --name lumax-service --restart unless-stopped \
  -p 9008:9008 \
  -e NODE_ENV=production \
  -e DATABASE_URL="postgresql://user:pass@db-host:5432/lumax?schema=public" \
  -e REDIS_HOST="redis-host" -e REDIS_PORT=6379 -e REDIS_PASSWORD="…" \
  -e SCHEDULER_ENABLED=true \
  -e SWAGGER_ENABLED=false -e NACOS_ENABLED=false \
  lumax-service:latest
```

A ready-made `server/deploy.sh` (load image → stop old → run new → health check)
and a `server/Jenkinsfile` (install → prisma generate → build → rsync → pm2)
implement the full CI/CD flow. Copy `server/.env.example` for the complete list
of variables.

### Frontend on a static host

`web` also builds to a plain static bundle (`pnpm build` → `dist/`) served by
Nginx (`web/nginx.conf`, deploy via `web/scripts/deploy.sh`).
