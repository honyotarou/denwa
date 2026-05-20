#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=denwa-hook-lib.sh
source "$SCRIPT_DIR/denwa-hook-lib.sh"
ROOT="$(denwa_root "$(pwd)" 2>/dev/null || true)"
[[ -z "${ROOT:-}" ]] && exit 0
input=$(cat)
tool=$(echo "$input" | jq -r '.tool_name // empty')
post_static() {
  local rel="$1"
  [[ "$rel" == "$ROOT"* ]] && rel="${rel#"$ROOT"/}"
  denwa_is_source_path "$rel" || return 0
  denwa_mark_dirty "$ROOT"
  if ! out=$(denwa_run_static "$ROOT" "$rel" 2>&1); then
    jq -n --arg c "denwa post-check failed:\n${out}" '{ additional_context: $c }'
    exit 0
  fi
}
case "$tool" in
  Write|Edit|StrReplace|search_replace)
    rel=$(denwa_tool_path "$input")
    [[ -n "$rel" ]] && post_static "$rel"
    ;;
esac
echo '{}'
