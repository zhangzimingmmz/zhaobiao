#!/usr/bin/env bash
# 远程一键部署：SSH 到服务器执行 git pull + docker compose
# 用法：./scripts/deploy-remote.sh [host] [path]
# 默认：host=100.64.0.5, path=/opt/zhaobiao

set -e
cd "$(dirname "$0")/.."

DEPLOY_HOST="${1:-100.64.0.5}"
DEPLOY_PATH="${2:-/opt/zhaobiao}"
ENV_FILE=".env.backend"

echo ">>> 远程部署：$DEPLOY_HOST:$DEPLOY_PATH"
echo ">>> 执行 git pull + docker compose up -d --build"
echo ""

ssh "$DEPLOY_HOST" "cd $DEPLOY_PATH && git pull --rebase && docker compose --env-file $ENV_FILE -f docker-compose.backend.yml up -d --build"

echo ""
echo ">>> 部署完成。"
