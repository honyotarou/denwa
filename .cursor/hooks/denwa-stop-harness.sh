#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=denwa-hook-lib.sh
source "$SCRIPT_DIR/denwa-hook-lib.sh"
status=$(echo "$(cat)" | jq -r '.status // empty')
[[ "$status" != "completed" ]] && exit 0
ROOT="$(denwa_root "$(pwd)" 2>/dev/null || true)"
[[ -z "${ROOT:-}" ]] && exit 0
denwa_is_dirty "$ROOT" || exit 0
denwa_clear_dirty "$ROOT"
if out=$(cd "$ROOT" && npm run harness 2>&1); then exit 0; fi
jq -n --arg m "denwa harness failed:\n$(echo "$out" | tail -n 40)" '{ followup_message: $m }'
