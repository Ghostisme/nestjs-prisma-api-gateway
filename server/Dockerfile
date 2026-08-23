FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

COPY . .
RUN npx prisma generate
RUN pnpm build

# 仅安装生产依赖，减小最终镜像体积
RUN pnpm install --frozen-lockfile --prod

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.env.production ./.env.production

EXPOSE 9008

CMD ["node", "dist/src/main.js"]
