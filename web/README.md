# Lumax Agent — Web (React 19 + Vite)

The frontend dashboard for the Lumax multi-tenant AI gateway platform. A real-time
admin console for token/quota management, usage & cost analytics, an AI script
generator, a RAG knowledge base, and a safety audit view.

## Tech stack

- **React 19** + **TypeScript 5** + **Vite 6**
- **Ant Design 6** + **Tailwind CSS 4** + vanilla-extract design tokens
- **TanStack Query 5** for server state, **Zustand** for client state
- **React Router 7**, **ApexCharts** / **D3** for analytics, **react-hook-form** + **zod**
- **Biome** for lint/format, **Lefthook** git hooks

## Quick start

```bash
pnpm install
cp .env.example .env.development   # then adjust VITE_* values
pnpm dev
```

Open http://localhost:3001 (see `vite.config.ts` for the port). The dev server
proxies `/api` to the NestJS gateway (`VITE_LUMAX_BFF_URL`, default
`http://localhost:9008`).

## Build

```bash
pnpm build          # type-check + production build
pnpm preview        # preview the production bundle
```

## Structure

```
web/
├── src/
│   ├── api/          # Typed API clients (axios + TanStack Query)
│   ├── pages/        # Feature pages (aiDashboard, billingCenter, rbac, ...)
│   ├── components/   # Reusable UI (charts, tables, editors, nav)
│   ├── layouts/      # Dashboard / simple layouts
│   ├── routes/       # Route sections + guards
│   ├── store/        # Zustand stores (user, settings)
│   ├── theme/        # Design tokens + theme provider
│   └── ui/           # Low-level UI primitives
├── docs/             # Frontend design specification
└── vite.config.ts
```

See [`docs/frontend-design-specification.md`](docs/frontend-design-specification.md)
for the full architecture and design-system write-up.
