#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
echo "== denwa harness: static =="
node scripts/check-denwa-static.mjs
for ws in packages/pbx-core packages/pbx-db packages/pbx-infra apps/web; do
  if [ -f "$ws/package.json" ]; then
    name=$(node -p "require('./$ws/package.json').name")
    if node -e "const s=require('./$ws/package.json').scripts||{}; process.exit(s.typecheck?0:1)"; then
      echo "== denwa harness: $name typecheck =="
      npm run typecheck -w "$name"
    fi
  fi
done
echo "== denwa harness: test:gate =="
npm run test:gate
echo "== denwa harness: OK =="
