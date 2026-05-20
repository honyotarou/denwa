#!/usr/bin/env bash
# postToolUse: static after Write/Edit/StrReplace; git push reminder after Shell.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=denwa-hook-lib.sh
source "$SCRIPT_DIR/denwa-hook-lib.sh"

ROOT="$(denwa_root "$(pwd)" 2>/dev/null || true)"
[[ -z "${ROOT:-}" ]] && ROOT="$(denwa_root "$PWD" 2>/dev/null || true)"
[[ -z "${ROOT:-}" ]] && exit 0

input=$(cat)
tool=$(echo "$input" | jq -r '.tool_name // empty')

post_static() {
  local rel="$1"
  if [[ "$rel" == "$ROOT"* ]]; then
    rel="${rel#"$ROOT"/}"
  fi
  if ! denwa_is_source_path "$rel"; then
    return 0
  fi
  denwa_mark_dirty "$ROOT"
  if ! out=$(denwa_run_static "$ROOT" "$rel" 2>&1); then
    ctx="denwa post-check failed:\n${out}\nHarness (full) runs on agent **stop** and **git push**."
    jq -n --arg c "$ctx" '{ additional_context: $c }'
    exit 0
  fi
}

case "$tool" in
  Write|Edit|StrReplace|search_replace)
    rel=$(denwa_tool_path "$input")
    [[ -n "$rel" ]] && post_static "$rel"
    ;;
  Shell)
    cmd=$(echo "$input" | jq -r '.tool_input.command // empty')
    if [[ "$cmd" =~ git[[:space:]]+push ]] && [[ ! "$cmd" =~ --no-verify ]]; then
      jq -n '{ additional_context: "denwa: git push runs npm run harness (lefthook pre-push)." }'
      exit 0
    fi
    ;;
esac

echo '{}'
