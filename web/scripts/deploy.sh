#!/bin/bash
set -e

# ============================================================
# lumax-agent 部署脚本
# 将构建产物和 nginx 配置部署到目标服务器
#
# Jenkins 自由风格项目 → Execute Shell 中调用
# 用法: bash scripts/deploy.sh
#
# 需要在 Jenkins 中配置以下环境变量（构建参数）:
#   DEPLOY_HOST        - 目标服务器 (如 root@your-server.example.com)
#   DEPLOY_PATH        - 前端部署路径 (默认 /usr/share/nginx/html/lumax-agent)
#   JAVA_GATEWAY_URL   - Java 网关地址 (如 https://api.example.com/api)
#   LUMAX_BFF_URL      - BFF 服务地址 (如 http://127.0.0.1:9008)
#   SERVER_NAME        - Nginx 域名 (如 lumax.example.com)
# ============================================================

DEPLOY_HOST="${DEPLOY_HOST:?'ERROR: DEPLOY_HOST is required (e.g. root@your-server.example.com)'}"
DEPLOY_PATH="${DEPLOY_PATH:-/usr/share/nginx/html/lumax-agent}"
JAVA_GATEWAY_URL="${JAVA_GATEWAY_URL:?'ERROR: JAVA_GATEWAY_URL is required'}"
LUMAX_BFF_URL="${LUMAX_BFF_URL:?'ERROR: LUMAX_BFF_URL is required'}"
SERVER_NAME="${SERVER_NAME:?'ERROR: SERVER_NAME is required (e.g. lumax.example.com)'}"

NGINX_CONF_PATH="/etc/nginx/conf.d/lumax-agent.conf"

echo "=========================================="
echo " lumax-agent deploy"
echo " Host   : ${DEPLOY_HOST}"
echo " Domain : ${SERVER_NAME}"
echo " Port   : 8080"
echo " Access : http://${SERVER_NAME}:8080"
echo " Path   : ${DEPLOY_PATH}"
echo " Gateway: ${JAVA_GATEWAY_URL}"
echo " BFF    : ${LUMAX_BFF_URL}"
echo "=========================================="

# ---- 1. 渲染 nginx 配置模板 ----
echo ">>> Rendering nginx config..."
export JAVA_GATEWAY_URL LUMAX_BFF_URL
export DEPLOY_PATH SERVER_NAME
envsubst '${JAVA_GATEWAY_URL} ${LUMAX_BFF_URL} ${DEPLOY_PATH} ${SERVER_NAME}' < nginx.conf > dist/lumax-agent.conf

echo "--- Generated nginx config ---"
cat dist/lumax-agent.conf
echo "------------------------------"

# ---- 2. 在目标服务器创建目录 ----
echo ">>> Preparing remote directory..."
ssh "${DEPLOY_HOST}" "mkdir -p ${DEPLOY_PATH}"

# ---- 3. 同步静态文件 ----
echo ">>> Syncing dist/ to ${DEPLOY_HOST}:${DEPLOY_PATH}..."
rsync -avz --delete \
  --exclude='lumax-agent.conf' \
  dist/ "${DEPLOY_HOST}:${DEPLOY_PATH}/"

# ---- 4. 部署 nginx 配置 ----
echo ">>> Deploying nginx config..."
scp dist/lumax-agent.conf "${DEPLOY_HOST}:${NGINX_CONF_PATH}"

# ---- 5. 测试并重载 nginx ----
echo ">>> Testing & reloading nginx..."
ssh "${DEPLOY_HOST}" "nginx -t && nginx -s reload"

echo "=========================================="
echo " Deploy complete!"
echo "=========================================="
