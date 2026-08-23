# Deployment Guide

Lumax is two deployables: a **NestJS gateway** (`server/`, a long-running Node
process) and a **static React SPA** (`web/`, built once and served by Nginx/CDN).
Because the backend is a persistent server, use a container/VM host
(Railway, Render, Fly.io, AWS, a plain VPS) — **not** a serverless platform.

---

## Prerequisites

- **PostgreSQL 16** (managed is fine — Supabase, RDS, Neon, …)
- **Redis** (managed or self-hosted)
- **Node 20+** and **pnpm** on the build host

---

## Backend — `server/`

### Option A: Docker (recommended)

```bash
cd server
docker build -t lumax-service:latest .
docker run -d --name lumax-service \
  --restart unless-stopped \
  -p 9008:9008 \
  -e NODE_ENV=production \
  -e DATABASE_URL="postgresql://user:pass@db-host:5432/lumax?schema=public" \
  -e REDIS_HOST="redis-host" -e REDIS_PORT=6379 -e REDIS_PASSWORD="…" \
  -e SWAGGER_ENABLED=false \
  lumax-service:latest
```

A ready-made `deploy.sh` (load image → stop old → run new → health check) ships
in `server/`.

### Option B: PM2 (bare metal / VM)

The included `server/Jenkinsfile` implements the full CI/CD flow:

1. `pnpm install --frozen-lockfile`
2. `npx prisma generate`
3. `pnpm build`
4. `rsync` `dist/` + `node_modules/` + `prisma/` to the deploy dir
5. `pm2 reload` (or first-time `pm2 start dist/src/main.js`) + `pm2 save`

Point the Jenkins job's env at your `DEPLOY_DIR` and provide a production
`.env.production` (never commit it — see `.env.example`).

### Database migrations

Apply the ordered SQL in `server/database/scripts/` (V001 → V010), or use Prisma:

```bash
pnpm prisma migrate deploy
pnpm db:seed        # seed dictionary/reference data
```

### Environment

Copy `server/.env.example` and set at minimum `DATABASE_URL`, the `REDIS_*`
values, `JAVA_GATEWAY_URL` (upstream), and `SWAGGER_ENABLED`. Disable
`AUTH_MOCK` in production. Nacos is optional (`NACOS_ENABLED=false` to skip).

---

## Frontend — `web/`

Build a static bundle and serve it with Nginx (config template in `web/nginx.conf`).

```bash
cd web
pnpm install
cp .env.example .env.production      # set VITE_API_BASE_URL to your gateway
pnpm build                           # outputs dist/
```

`web/scripts/deploy.sh` renders `nginx.conf`, rsyncs `dist/` to the target host,
and reloads Nginx. It expects these env vars:

| Var | Example |
|-----|---------|
| `DEPLOY_HOST` | `root@your-server.example.com` |
| `DEPLOY_PATH` | `/usr/share/nginx/html/lumax-agent` |
| `JAVA_GATEWAY_URL` | `https://api.example.com/api` |
| `LUMAX_BFF_URL` | `http://127.0.0.1:9008` |
| `SERVER_NAME` | `lumax.example.com` |

For a quick public demo you can also deploy the SPA to Vercel/Netlify and point
`VITE_API_BASE_URL` at a hosted backend.

---

## Recommended demo stack

For a low-cost, publicly reachable portfolio demo:

- **Backend** → Railway or Render (persistent Node service)
- **Database** → Supabase or Neon (managed PostgreSQL 16)
- **Redis** → Upstash or the host's managed Redis
- **Frontend** → Vercel / Netlify static hosting

This mirrors the production topology while staying inside free/low tiers.
