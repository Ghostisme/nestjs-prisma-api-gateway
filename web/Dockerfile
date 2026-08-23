FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
ARG VITE_MODE=test
RUN pnpm exec vite build --mode ${VITE_MODE}

FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf.template
ENV DEPLOY_PATH=/usr/share/nginx/html
EXPOSE 80
CMD ["/bin/sh", "-c", "envsubst '${JAVA_GATEWAY_URL} ${LUMAX_BFF_URL} ${DEPLOY_PATH}' < /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
