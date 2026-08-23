#!/bin/bash
set -e

# ============================================================
# lumax-agent 构建脚本
# Jenkins 自由风格项目 → Execute Shell 中调用
# 用法: bash scripts/build.sh [test|staging|production]
# ============================================================

BUILD_MODE="${1:-test}"

echo "=========================================="
echo " lumax-agent build (mode: ${BUILD_MODE})"
echo "=========================================="

# ---- Node / pnpm 版本检查 ----
echo "Node: $(node -v)"
echo "pnpm: $(pnpm -v 2>/dev/null || echo 'not installed')"

if ! command -v pnpm &>/dev/null; then
  echo ">>> Installing pnpm via corepack..."
  corepack enable
  corepack prepare pnpm@latest --activate
fi

# ---- 安装依赖 ----
echo ">>> pnpm install..."
pnpm install --frozen-lockfile

# ---- 构建 ----
echo ">>> Building with mode: ${BUILD_MODE}..."
pnpm exec vite build --mode "${BUILD_MODE}"

echo "=========================================="
echo " Build complete → dist/"
echo "=========================================="
ls -lh dist/
