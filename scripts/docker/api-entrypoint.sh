#!/bin/sh
set -eu

APP_ROOT="${APP_ROOT:-/app}"
DEFAULT_ADMIN_TOKEN="admin-secret-token-change-in-production"
DEFAULT_JWT_SECRET="zhaobiao-dev-secret-2026"

mkdir -p "${APP_ROOT}/data" "${APP_ROOT}/logs/admin-crawl"

if [ -z "${ADMIN_TOKEN:-}" ] || [ "${ADMIN_TOKEN}" = "${DEFAULT_ADMIN_TOKEN}" ]; then
  echo "ADMIN_TOKEN must be set to a non-default value before container startup." >&2
  exit 1
fi

if [ -z "${JWT_SECRET:-}" ] || [ "${JWT_SECRET}" = "${DEFAULT_JWT_SECRET}" ]; then
  echo "JWT_SECRET must be set to a non-default value before container startup." >&2
  exit 1
fi

exec "$@"
