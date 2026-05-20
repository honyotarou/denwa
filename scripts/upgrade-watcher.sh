#!/usr/bin/env bash
# ホスト側: data/signals/upgrade-run を監視して docker compose を実行
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SIGNAL="${ROOT}/data/signals/upgrade-run"
cd "${ROOT}"

while sleep 5; do
  if [[ ! -f "${SIGNAL}" ]]; then
    continue
  fi
  payload="$(cat "${SIGNAL}")"
  rm -f "${SIGNAL}"
  echo "[upgrade-watcher] $(date) payload=${payload}"
  docker compose pull
  docker compose up -d --build asterisk web
done
