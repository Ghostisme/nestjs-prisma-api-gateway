# syntax=docker/dockerfile:1.7
# ═══════════════════════════════════════════════════════════════════════
#  Lumax Service — NestJS 11 + Prisma 7 网关
#
#  与原版相比的几处实质修正：
#
#  ① 基础镜像 node:20 → node:24。package.json 里 engines.node 写的是
#     "24.x"，用 20 构建属于配置漂移，某些依赖（Prisma 7）在低版本上
#     行为不一致。
#
#  ② 删掉了 `COPY --from=builder /app/.env.production`。仓库里根本没有
#     这个文件（只有 .env.example），这一行会让 docker build 直接失败。
#     环境变量改为运行时通过 --env-file 注入，这样密钥不会被烤进镜像层
#     （镜像层是任何拿到镜像的人都能解开看的）。
#
#  ③ 不再做 `pnpm install --prod` 裁剪。在 pnpm 的 symlink 布局下，
#     prisma generate 的产物位置（node_modules/.prisma/client）与 prod
#     裁剪之后的依赖树容易错位，表现为运行时报 "@prisma/client did not
#     initialize yet"。这里用磁盘换确定性，整体保留 builder 的依赖树。
#
#  ④ 额外把 database/ 和 scripts/ 拷进运行镜像。这样数据库迁移可以直接
#     在容器里执行（docker exec ... node scripts/apply-migrations.mjs），
#     Jenkins 那台机器完全不需要装 Node 或 psql。
#
#  基础镜像选 bookworm-slim 而不是 alpine：Prisma 在 musl libc 上需要
#  另一套引擎二进制，踩坑概率明显更高，省下的几十 MB 不值这个风险。
# ═══════════════════════════════════════════════════════════════════════

FROM node:24-bookworm-slim AS builder

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
# 与 package.json 的 packageManager 字段对齐
RUN corepack enable && corepack prepare pnpm@10.8.0 --activate

WORKDIR /app

# ── 依赖层 ────────────────────────────────────────────────────────────
#  单独先拷依赖清单，这是「源码变更」和「依赖变更」在构建层面的分界线：
#  只改业务代码时这一整层命中缓存，install 完全不执行。
COPY package.json pnpm-lock.yaml ./

# cache mount 专门优化「依赖变更」那种情况：lockfile 一改，上面那层缓存
# 就失效、install 必然重跑，但 pnpm store 被挂成持久缓存后，已经下载过的
# 包不用再从网上拉一遍 —— 对带 Prisma 引擎这种大包的项目差别很明显。
RUN --mount=type=cache,id=pnpm-store-lumax-server,target=/pnpm/store \
    pnpm install --frozen-lockfile --store-dir=/pnpm/store

COPY . .

# 必须在 build 之前 generate —— NestJS 的 TS 编译依赖 Prisma 生成的类型
RUN pnpm exec prisma generate \
 && pnpm build


FROM node:24-bookworm-slim AS runner

ENV NODE_ENV=production \
    # 有未捕获的 Promise 拒绝时直接崩掉进程，让 Docker 的 restart 策略
    # 接管。半死不活地继续跑（连接池已断但进程还在）比直接重启更难排查。
    NODE_OPTIONS=--unhandled-rejections=strict

WORKDIR /app

# node 镜像自带 uid 1000 的 node 用户，直接用它，不要跑 root
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist         ./dist
COPY --from=builder --chown=node:node /app/prisma       ./prisma
# 有序 SQL 迁移脚本 + 执行器，供 `docker exec` 手动跑迁移用
COPY --from=builder --chown=node:node /app/database     ./database
COPY --from=builder --chown=node:node /app/scripts      ./scripts
COPY --from=builder --chown=node:node /app/package.json ./package.json

USER node

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

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||9008)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# 产物路径是 dist/src/main.js 而不是 dist/main.js：tsconfig.build.json
# 没有排除根目录的 prisma.config.ts，TypeScript 据此把 rootDir 推断成了
# 项目根，于是编译结果多出一层 src/。
CMD ["node", "dist/src/main.js"]
