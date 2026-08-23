# Lumax Service — Server (NestJS API Gateway)

The backend API gateway + core services for the Lumax multi-tenant AI platform.
Handles authentication, per-tenant isolation, usage metering, quota limiting,
a content-safety engine, and scheduled jobs — with auto-generated Swagger docs.

## Tech stack

- **NestJS 11** (Express) + **TypeScript 5**
- **Prisma 7.8** + **@prisma/adapter-pg** → **PostgreSQL 16**
- **Redis** via **ioredis** (atomic quota limiter + caching)
- **@nestjs/schedule** cron jobs · **@nestjs/swagger** OpenAPI docs
- **Nacos** service discovery (optional) · **http-proxy-middleware** upstream proxy

## Architecture at a glance

```
Client ─▶ NestJS Gateway ─▶ Prisma ─▶ PostgreSQL (per-tenant schemas)
             │  ├─ OpaqueTokenGuard      (Redis-backed opaque tokens)
             │  ├─ Quota Limiter         (Redis + Lua, atomic)
             │  ├─ Usage Metering        (high-precision token accounting)
             │  ├─ Banned-words engine   (Trie/Regex safety filter)
             │  ├─ Cron scheduler        (@nestjs/schedule rollups)
             │  └─ JavaProxyMiddleware   (upstream gateway passthrough)
             └─ Swagger/OpenAPI @ /api-docs
```

## Modules

`auth` · `api-key` · `usage-metering` · `token-management` · `subscription` ·
`dashboard` · `conversation` · `banned-words` · `knowledge-base` · `llm-model` ·
`agent-monitor` · `collector` · `org` · `user` · `partner` · `dict` · `file` ·
`scheduler` · `proxy` · `deerflow-proxy` · `nacos` · `health`

## Quick start

```bash
pnpm install
cp .env.example .env                 # then fill in DATABASE_URL / Redis / etc.

pnpm prisma:generate                 # generate Prisma client
pnpm prisma:migrate                  # or apply SQL migrations in database/scripts

pnpm run start:dev                   # watch mode on PORT (default 9008)
```

- API base prefix: `/api`
- Swagger UI: `http://localhost:9008/api-docs`
- Set `AUTH_MOCK=true` for local dev to bypass the Redis opaque-token check.

## Database

Versioned SQL migrations live in [`database/scripts/`](database/scripts) (`V001__…` → `V010__…`),
and the Prisma schema is in [`prisma/schema.prisma`](prisma/schema.prisma).

```bash
pnpm db:seed                         # seed dictionary/reference data
```

## Tests

```bash
pnpm test          # unit tests (Jest)
pnpm test:e2e      # e2e tests
pnpm test:cov      # coverage
```

## Scripts

- `pnpm apifox:sync` — push the live OpenAPI spec to Apifox (needs `APIFOX_*` env vars).
