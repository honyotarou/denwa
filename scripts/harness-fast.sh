#!/usr/bin/env bash
# Fast harness for TDD inner loop + pre-commit (~数秒〜十数秒).
# See .cursor/skills/denwa/SKILL.md
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "== denwa harness:fast: static =="
node scripts/check-denwa-static.mjs

if [ -d packages/pbx-core ]; then
  echo "== denwa harness:fast: @openpbx/core typecheck =="
  npm run typecheck -w @openpbx/core
  echo "== denwa harness:fast: @openpbx/core test =="
  npm test -w @openpbx/core
fi

echo "== denwa harness:fast: OK =="
