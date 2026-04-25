#!/usr/bin/env bash
#
# aggre-api 手动部署脚本
#
# 平时由 .github/workflows/deploy.yml 自动跑(GH Actions build → push GHCR
# → SSH 触发本脚本的 pull/up 等价逻辑)。本脚本保留用于:
#   - GH Actions 故障时人肉部署
#   - 临时回滚到指定 tag(AGGRE_API_IMAGE=ghcr.io/...:sha-xxx ./deploy.sh)
#
# 关键:本脚本 **不再 build**(docker compose build 在 8GB VPS 上会 OOM)。
# 只做 git pull + docker compose pull + up -d。
#
set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/data/stable/aggre-api}"
LOG_FILE="${LOG_FILE:-/var/log/aggre-deploy.log}"
LOCK_FILE="${LOCK_FILE:-/tmp/aggre-deploy.lock}"

if [ -f "$LOCK_FILE" ]; then
  echo "$(date '+%Y-%m-%d %H:%M:%S') [SKIP] Deploy already in progress" | tee -a "$LOG_FILE"
  exit 0
fi
trap 'rm -f "$LOCK_FILE"' EXIT
touch "$LOCK_FILE"

{
  echo "========================================"
  echo "$(date '+%Y-%m-%d %H:%M:%S') [START] Manual deploy"

  cd "$PROJECT_DIR"

  echo "[INFO] git pull (compose / env may have changed)"
  git pull --ff-only origin main

  echo "[INFO] docker compose pull aggre-api (image: ${AGGRE_API_IMAGE:-ghcr.io/runcoor/aggre-api:latest})"
  docker compose pull aggre-api

  echo "[INFO] docker compose up -d --no-build"
  docker compose up -d --no-build

  echo "[INFO] docker image prune -f"
  docker image prune -f || true

  echo "$(date '+%Y-%m-%d %H:%M:%S') [DONE] Manual deploy completed"
  echo "========================================"
} 2>&1 | tee -a "$LOG_FILE"
