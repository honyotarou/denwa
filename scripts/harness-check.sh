#!/usr/bin/env bash
# Full merge gate: static + all workspace typechecks + test:gate.
# Used by: npm run harness, lefthook pre-push, GitHub Actions CI, Cursor stop hook.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
# shellcheck source=scripts/harness-lib.sh
source "$ROOT/scripts/harness-lib.sh"
HARNESS_ROOT="$ROOT"

denwa_harness_full
echo "== denwa harness: OK =="
