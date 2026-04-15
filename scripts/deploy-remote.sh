#!/usr/bin/env bash
# 远程部署：
# - full: SSH 到服务器执行 git pull + docker compose 全量重建
# - admin-frontend-static: 本地构建 admin-frontend/dist 并热更新远端静态资源
#
# 用法：
#   ./scripts/deploy-remote.sh [host] [path] [mode]
# 默认：
#   host=100.64.0.5, path=/opt/zhaobiao, mode=full

set -euo pipefail
cd "$(dirname "$0")/.."

DEPLOY_HOST="${1:-100.64.0.5}"
DEPLOY_PATH="${2:-/opt/zhaobiao}"
DEPLOY_MODE="${3:-full}"
ENV_FILE=".env.backend"
LOCAL_ADMIN_DIST="admin-frontend/dist"
REMOTE_ADMIN_DIST="/tmp/zhaobiao-admin-dist"
REMOTE_ADMIN_CONTAINER="zhaobiao-backend-admin-frontend-1"

deploy_full() {
  echo ">>> 远程部署（full）：$DEPLOY_HOST:$DEPLOY_PATH"
  echo ">>> 执行 git pull + docker compose up -d --build"
  echo ""

  ssh "$DEPLOY_HOST" \
    "cd '$DEPLOY_PATH' && git pull --rebase && docker compose --env-file '$ENV_FILE' -f docker-compose.backend.yml up -d --build"

  echo ""
  echo ">>> 全量部署完成。"
}

deploy_admin_frontend_static() {
  echo ">>> 远程部署（admin-frontend-static）：$DEPLOY_HOST:$DEPLOY_PATH"
  echo ">>> 本地构建 admin-frontend，远端热更新静态资源"
  echo ""

  (cd admin-frontend && npm run build)

  rsync -a --delete "$LOCAL_ADMIN_DIST"/ "$DEPLOY_HOST:$REMOTE_ADMIN_DIST"/

  ssh "$DEPLOY_HOST" "
    set -euo pipefail
    cd '$DEPLOY_PATH'
    git pull --rebase

    if docker ps --format '{{.Names}}' | grep -qx '$REMOTE_ADMIN_CONTAINER'; then
      docker cp '$REMOTE_ADMIN_DIST'/.' '$REMOTE_ADMIN_CONTAINER':/usr/share/nginx/html/
      docker exec '$REMOTE_ADMIN_CONTAINER' sh -lc 'ls /usr/share/nginx/html/assets >/dev/null'
    else
      docker compose -f docker-compose.backend.yml build admin-frontend
      docker compose --env-file '$ENV_FILE' -f docker-compose.backend.yml up -d --no-deps admin-frontend
    fi
  "

  echo ""
  echo ">>> admin-frontend 静态资源已更新。"
}

case "$DEPLOY_MODE" in
  full)
    deploy_full
    ;;
  admin-frontend-static)
    deploy_admin_frontend_static
    ;;
  *)
    echo "未知部署模式: $DEPLOY_MODE" >&2
    echo "可选模式: full, admin-frontend-static" >&2
    exit 1
    ;;
esac
