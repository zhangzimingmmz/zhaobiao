#!/usr/bin/env bash
# 在 100.64.0.5 服务器上检查定时任务执行情况
# 用法：cd /opt/zhaobiao && ./scripts/check_scheduler_status.sh

set -e
cd "$(dirname "$0")/.."

# 从 .env.backend 读取 ADMIN_TOKEN
ADMIN_TOKEN=""
if [[ -f .env.backend ]]; then
  ADMIN_TOKEN=$(grep '^ADMIN_TOKEN=' .env.backend | cut -d= -f2- | tr -d '"' | tr -d "'")
fi

if [[ -z "$ADMIN_TOKEN" ]]; then
  echo "错误：未找到 ADMIN_TOKEN，请确保 .env.backend 存在且包含 ADMIN_TOKEN"
  exit 1
fi

# 宿主机执行时用 127.0.0.1:8000（api 容器映射到宿主机）
API_URL="${API_URL:-http://127.0.0.1:8000}"

echo "========== 1. 最近 10 条采集运行记录 =========="
curl -s -X GET "${API_URL}/api/admin/crawl/runs?limit=10" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" | python3 -m json.tool 2>/dev/null || true

echo ""
echo "========== 2. Scheduler 容器最近日志（最近 50 行）=========="
docker compose --env-file .env.backend -f docker-compose.backend.yml logs --tail=50 scheduler 2>/dev/null || echo "（无法获取，请确认 docker compose 可用）"
