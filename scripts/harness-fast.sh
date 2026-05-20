#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
echo "== denwa harness:fast: static =="
node scripts/check-denwa-static.mjs
if [ -d packages/pbx-core ]; then
  echo "== denwa harness:fast: @openpbx/core =="
  npm run typecheck -w @openpbx/core
  npm test -w @openpbx/core
fi
echo "== denwa harness:fast: OK =="
