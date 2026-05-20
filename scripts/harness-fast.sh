#!/usr/bin/env bash
# Fast gate: static + all workspace typechecks (no Vitest).
# Used by: npm run harness:fast, lefthook pre-commit, Cursor postToolUse hook.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
# shellcheck source=scripts/harness-lib.sh
source "$ROOT/scripts/harness-lib.sh"
HARNESS_ROOT="$ROOT"

denwa_harness_fast
echo "== denwa harness:fast: OK =="
