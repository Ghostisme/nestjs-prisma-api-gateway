#!/bin/bash
set -e

IMAGE_NAME=$1
IMAGE_TAG=$2
IMAGE_FILE=$3
CONTAINER_NAME="${IMAGE_NAME}"
HOST_PORT=9008
CONTAINER_PORT=9008

if [ -z "$IMAGE_NAME" ] || [ -z "$IMAGE_TAG" ] || [ -z "$IMAGE_FILE" ]; then
    echo "用法: bash deploy.sh <镜像名> <镜像标签> <镜像文件>"
    echo "示例: bash deploy.sh lumax-service 42 lumax-service-42.tar.gz"
    exit 1
fi

echo "=========================================="
echo "  部署 ${IMAGE_NAME}:${IMAGE_TAG}"
echo "=========================================="

echo ">>> [1/5] 加载 Docker 镜像"
docker load < "${IMAGE_FILE}"

echo ">>> [2/5] 停止旧容器"
docker stop "${CONTAINER_NAME}" 2>/dev/null || true
docker rm "${CONTAINER_NAME}" 2>/dev/null || true

echo ">>> [3/5] 启动新容器"
docker run -d \
    --name "${CONTAINER_NAME}" \
    --restart unless-stopped \
    -p ${HOST_PORT}:${CONTAINER_PORT} \
    -e NODE_ENV=production \
    -e TZ=Asia/Shanghai \
    --memory=512m \
    --cpus=1 \
    --log-opt max-size=50m \
    --log-opt max-file=3 \
    "${IMAGE_NAME}:${IMAGE_TAG}"

echo ">>> [4/5] 等待服务启动..."
sleep 5

if docker ps --filter "name=${CONTAINER_NAME}" --filter "status=running" | grep -q "${CONTAINER_NAME}"; then
    echo ">>> [5/5] 服务启动成功!"
    docker logs --tail 20 "${CONTAINER_NAME}"
else
    echo ">>> [5/5] 服务启动失败!"
    docker logs "${CONTAINER_NAME}"
    exit 1
fi

echo ">>> 清理旧镜像"
docker image prune -f --filter "label!=keep" 2>/dev/null || true
rm -f "${IMAGE_FILE}"

echo "=========================================="
echo "  部署完成: ${IMAGE_NAME}:${IMAGE_TAG}"
echo "  服务地址: http://localhost:${HOST_PORT}"
echo "=========================================="
