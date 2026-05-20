#!/usr/bin/env bash
# postToolUse: static after Write/Edit/StrReplace/Shell.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/denwa-hook-lib.sh"

ROOT="$(denwa_root "$(pwd)" 2>/dev/null || true)"
[[ -z "${ROOT:-}" ]] && ROOT="$(denwa_root "$PWD" 2>/dev/null || true)"
[[ -z "${ROOT:-}" ]] && exit 0

input=$(cat)
tool=$(echo "$input" | jq -r '.tool_name // empty')

post_checks() {
  local rel="$1"
  if [[ "$rel" == "$ROOT"* ]]; then
    rel="${rel#"$ROOT"/}"
  fi
  if ! denwa_is_source_path "$rel"; then
    return 0
  fi
  denwa_mark_dirty "$ROOT"
  if ! out=$(denwa_run_static "$ROOT" "$rel" 2>&1); then
    ctx="denwa post static failed:\n${out}\nFull harness: agent stop, git push, CI."
    jq -n --arg c "$ctx" '{ additional_context: $c }'
    exit 0
  fi
  if ! out=$(denwa_run_harness_fast "$ROOT" 2>&1); then
    ctx="denwa post harness:fast failed:\n${out}\nFull harness (tests): agent stop, pre-push, CI."
    jq -n --arg c "$ctx" '{ additional_context: $c }'
    exit 0
  fi
}

case "$tool" in
  Write|Edit|StrReplace|search_replace)
    rel=$(denwa_tool_path "$input")
    [[ -n "$rel" ]] && post_checks "$rel"
    ;;
  Shell)
    cmd=$(echo "$input" | jq -r '.tool_input.command // empty')
    if [[ "$cmd" =~ git[[:space:]]+push ]] && [[ ! "$cmd" =~ --no-verify ]]; then
      jq -n '{ additional_context: "denwa: git commit → harness:fast (pre-commit). git push / CI → npm run harness (full)." }'
      exit 0
    fi
    ;;
esac

echo '{}'
