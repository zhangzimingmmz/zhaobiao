#!/usr/bin/env bash
# 一键部署：commit + push + 小程序编译（如有变更）+ 按变更类型选择部署方式
# 用法：./scripts/deploy.sh [commit消息]
# 环境变量：
#   DEPLOY_SKIP_COMMIT=1   跳过提交
#   DEPLOY_SKIP_MINIAPP=1  跳过小程序编译
#   DEPLOY_MODE=...        强制指定部署模式（full/admin-frontend-static/skip）

set -euo pipefail
cd "$(dirname "$0")/.."

DEPLOY_HOST="${DEPLOY_HOST:-100.64.0.5}"
DEPLOY_PATH="${DEPLOY_PATH:-/opt/zhaobiao}"
COMMIT_MSG="${1:-deploy: $(date +%Y-%m-%d\ %H:%M)}"

git fetch origin 2>/dev/null || true

collect_changed_files() {
  local files=""

  if ! git diff --quiet HEAD -- 2>/dev/null; then
    files+=$'\n'"$(git diff --name-only HEAD --)"
  fi

  local untracked
  untracked="$(git ls-files --others --exclude-standard)"
  if [[ -n "$untracked" ]]; then
    files+=$'\n'"$untracked"
  fi

  if git rev-parse --verify origin/main >/dev/null 2>&1; then
    local branch_diff
    branch_diff="$(git diff --name-only origin/main...HEAD -- 2>/dev/null || true)"
    if [[ -n "$branch_diff" ]]; then
      files+=$'\n'"$branch_diff"
    fi
  fi

  printf '%s\n' "$files" | sed '/^$/d' | sort -u
}

CHANGED_FILES="$(collect_changed_files)"

has_changed_prefix() {
  local prefix="$1"
  printf '%s\n' "$CHANGED_FILES" | grep -q "^${prefix}"
}

has_non_admin_runtime_changes() {
  printf '%s\n' "$CHANGED_FILES" | grep -Eq \
    '^(server/|crawler/|deploy/|Dockerfile\.backend|docker-compose\.backend\.yml|scripts/docker/|scripts/deploy-remote\.sh|scripts/deploy\.sh|admin-frontend/Dockerfile|admin-frontend/nginx\.conf|requirements|server/requirements\.txt|crawler/requirements\.txt)'
}

has_admin_frontend_changes() {
  has_changed_prefix "admin-frontend/"
}

has_miniapp_changes() {
  has_changed_prefix "miniapp/"
}

determine_deploy_mode() {
  if [[ -n "${DEPLOY_MODE:-}" ]]; then
    printf '%s\n' "$DEPLOY_MODE"
    return
  fi

  if [[ -z "$CHANGED_FILES" ]]; then
    printf '%s\n' "skip"
    return
  fi

  if has_non_admin_runtime_changes; then
    printf '%s\n' "full"
    return
  fi

  if has_admin_frontend_changes; then
    printf '%s\n' "admin-frontend-static"
    return
  fi

  printf '%s\n' "skip"
}

DEPLOY_KIND="$(determine_deploy_mode)"

# 1. 提交并推送
if [[ -z "${DEPLOY_SKIP_COMMIT:-}" ]]; then
  if ! git diff-index --quiet HEAD -- 2>/dev/null; then
    echo ">>> 存在未提交修改，执行 git add + commit..."
    git add -A
    git commit -m "$COMMIT_MSG"
  fi
  echo ">>> git push..."
  git push
fi

# 2. 小程序编译（若有 miniapp 变更）
if [[ -z "${DEPLOY_SKIP_MINIAPP:-}" ]]; then
  if has_miniapp_changes; then
    echo ">>> 检测到 miniapp 变更，执行编译..."
    (cd miniapp && npm ci --silent 2>/dev/null || true && npm run build:weapp)
    echo ">>> 小程序编译完成，产出位于 miniapp/dist，可导入微信开发者工具上传"
  else
    echo ">>> 无 miniapp 变更，跳过编译"
  fi
fi

# 3. 远程部署
case "$DEPLOY_KIND" in
  full)
    echo ">>> 检测到后端/运行时变更，执行全量远程部署"
    ./scripts/deploy-remote.sh "$DEPLOY_HOST" "$DEPLOY_PATH" full
    ;;
  admin-frontend-static)
    echo ">>> 仅检测到 admin-frontend 变更，执行静态资源热更新"
    ./scripts/deploy-remote.sh "$DEPLOY_HOST" "$DEPLOY_PATH" admin-frontend-static
    ;;
  skip)
    echo ">>> 本次变更无需服务器部署，跳过远程部署"
    ;;
  *)
    echo ">>> 未知部署模式: $DEPLOY_KIND" >&2
    exit 1
    ;;
esac

echo ""
echo ">>> 部署流程完成。"
