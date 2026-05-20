#!/usr/bin/env bash
# afterFileEdit / afterTabFileEdit: static on every editor save.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=denwa-hook-lib.sh
source "$SCRIPT_DIR/denwa-hook-lib.sh"

input=$(cat)
file=$(echo "$input" | jq -r '.file_path // empty')
[[ -z "$file" ]] && exit 0

ROOT="$(denwa_root "$(dirname "$file")" 2>/dev/null || true)"
[[ -z "${ROOT:-}" ]] && exit 0

rel="${file#"$ROOT"/}"
if ! denwa_is_source_path "$rel"; then
  exit 0
fi

denwa_mark_dirty "$ROOT"
if ! out=$(denwa_run_static "$ROOT" "$rel" 2>&1); then
  jq -n --arg c "denwa afterFileEdit failed for ${rel}:\n${out}" '{ additional_context: $c }'
  exit 0
fi

echo '{}'
