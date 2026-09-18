# syntax=docker/dockerfile:1.7
#
# Lumax Service（NestJS + Prisma）生产镜像。
#
# 相比早期版本修掉了三处会让干净检出构建失败或运行异常的问题：
#
#   1. 不再 `COPY .env.production`。该文件被 .gitignore 排除（规则 `.env*`），
#      从 GitHub 干净检出时根本不存在，COPY 必然失败。配置改为运行时由
#      Jenkins Credentials / docker run --env-file 注入，密钥也就不会被
#      烘进镜像层（镜像层是可导出的，写进去等于泄露）。
#
#   2. `prisma generate` 与生产依赖裁剪的顺序。generate 的产物落在
#      node_modules/.prisma/client（见 schema.prisma 的 output），若在
#      generate 之后再跑 `pnpm install --prod`，pnpm 会按 lockfile 重建
#      node_modules 从而清掉这份产物，容器启动即报 "@prisma/client did not
#      initialize yet"。这里改为生产依赖单独在 prod-deps 阶段安装，
#      再把 builder 生成的 .prisma 单独叠上去，两者互不干扰。
#
#   3. Node 版本对齐 package.json 的 "engines": { "node": "24.x" }，
#      不再用 node:20-alpine。
#
# 构建上下文约定为仓库的 server/ 目录。

# ---------- builder：全量依赖，负责编译与 Prisma Client 生成 ----------
FROM node:24-bookworm-slim AS builder

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# prisma.config.ts 通过 env('DATABASE_URL') 提供 datasource url，
# 变量缺失时 CLI 直接报错。但 generate 只读 schema 不连库，
# 给一个语法合法的占位串即可；真实地址在运行时注入。
ENV DATABASE_URL="postgresql://placeholder:placeholder@127.0.0.1:5432/placeholder?schema=public"
RUN pnpm prisma generate

RUN pnpm build


# ---------- prod-deps：只装运行时依赖，产出精简 node_modules ----------
FROM node:24-bookworm-slim AS prod-deps

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
# --ignore-scripts：@prisma/client 的 postinstall 会尝试再跑一次 generate，
# 但这个阶段没有 prisma/ 目录，让它跑只会失败。Client 产物从 builder 复制。
RUN pnpm install --frozen-lockfile --prod --ignore-scripts


# ---------- runtime ----------
FROM node:24-bookworm-slim AS runtime

ENV NODE_ENV=production

# curl 供 HEALTHCHECK 使用。
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=prod-deps /app/node_modules ./node_modules
# Prisma Client 的生成产物。必须在 prod-deps 的 node_modules 之后叠加，
# 否则会被前一层覆盖掉。
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# 有序 SQL 迁移及其运行器。迁移不走 prisma migrate，而是由
# scripts/apply-migrations.mjs 按文件名顺序应用 database/scripts/V*.sql。
# 打进镜像后，Jenkins 可以用同一个镜像起一次性容器执行迁移，
# 保证「跑迁移的代码」与「跑服务的代码」永远是同一个版本。
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/database ./database

# 以内置非 root 用户运行。
USER node

ENV PORT=9008
EXPOSE 9008

# main.ts 里 Swagger 挂在 /api-docs，全局前缀为 api。
# 这里探活打 /api/health（若该路由不存在，改成 /api-docs 亦可）。
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -fsS "http://127.0.0.1:${PORT}/api/health" || exit 1

# 产物路径是 dist/src/main.js 而非 dist/main.js：根目录的 prisma.config.ts
# 一同参与编译，把 TypeScript 推断出的 rootDir 抬到了 server/，
# 于是 src/ 这一层在输出里被保留。改动 tsconfig 前不要动这个路径。
CMD ["node", "dist/src/main.js"]
