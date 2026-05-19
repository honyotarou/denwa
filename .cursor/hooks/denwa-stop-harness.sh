#!/usr/bin/env bash
# stop: full harness when source was dirty (late gate, end of agent turn).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/denwa-hook-lib.sh"

input=$(cat)
status=$(echo "$input" | jq -r '.status // empty')
[[ "$status" != "completed" ]] && exit 0

ROOT="$(denwa_root "$(pwd)" 2>/dev/null || true)"
[[ -z "${ROOT:-}" ]] && ROOT="$(denwa_root "$PWD" 2>/dev/null || true)"
[[ -z "${ROOT:-}" ]] && exit 0

if ! denwa_is_dirty "$ROOT"; then
  exit 0
fi

denwa_clear_dirty "$ROOT"

if out=$(cd "$ROOT" && npm run harness 2>&1); then
  exit 0
fi

tail_out=$(echo "$out" | tail -n 40)
jq -n \
  --arg m "denwa harness failed after this agent turn. Fix, then reply done.\n\n${tail_out}" \
  '{ followup_message: $m }'
