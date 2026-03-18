#!/usr/bin/env bash
# 一键部署：commit + push + 小程序编译（如有变更）+ 远程部署
# 用法：./scripts/deploy.sh [commit消息]
# 环境变量：DEPLOY_SKIP_COMMIT=1 跳过提交，DEPLOY_SKIP_MINIAPP=1 跳过小程序编译

set -e
cd "$(dirname "$0")/.."

DEPLOY_HOST="${DEPLOY_HOST:-100.64.0.5}"
DEPLOY_PATH="${DEPLOY_PATH:-/opt/zhaobiao}"
ENV_FILE=".env.backend"
COMMIT_MSG="${1:-deploy: $(date +%Y-%m-%d\ %H:%M)}"

# 1. 检查 miniapp 是否有变更（在 push 前）
MINIAPP_CHANGED=
git fetch origin 2>/dev/null || true
git diff --name-only HEAD -- miniapp/ 2>/dev/null | grep -q . && MINIAPP_CHANGED=1
git diff --name-only origin/main...HEAD -- miniapp/ 2>/dev/null | grep -q . && MINIAPP_CHANGED=1

# 2. 提交并推送
if [[ -z "$DEPLOY_SKIP_COMMIT" ]]; then
  if ! git diff-index --quiet HEAD -- 2>/dev/null; then
    echo ">>> 存在未提交修改，执行 git add + commit..."
    git add -A
    git commit -m "$COMMIT_MSG"
  fi
  echo ">>> git push..."
  git push
fi

# 3. 小程序编译（若有 miniapp 变更）
if [[ -z "$DEPLOY_SKIP_MINIAPP" ]]; then
  if [[ -n "$MINIAPP_CHANGED" ]]; then
    echo ">>> 检测到 miniapp 变更，执行编译..."
    (cd miniapp && npm ci --silent 2>/dev/null || true && npm run build:weapp)
    echo ">>> 小程序编译完成，产出位于 miniapp/dist，可导入微信开发者工具上传"
  else
    echo ">>> 无 miniapp 变更，跳过编译"
  fi
fi

# 4. 远程部署
echo ""
echo ">>> 远程部署：$DEPLOY_HOST:$DEPLOY_PATH"
ssh "$DEPLOY_HOST" "cd $DEPLOY_PATH && git pull --rebase && docker compose --env-file $ENV_FILE -f docker-compose.backend.yml up -d --build"

echo ""
echo ">>> 部署完成。"
