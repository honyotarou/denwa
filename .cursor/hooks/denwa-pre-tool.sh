#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=denwa-hook-lib.sh
source "$SCRIPT_DIR/denwa-hook-lib.sh"
ROOT="$(denwa_root "$(pwd)" 2>/dev/null || true)"
[[ -z "${ROOT:-}" ]] && { echo '{ "permission": "allow" }'; exit 0; }
input=$(cat)
tool=$(echo "$input" | jq -r '.tool_name // empty')
case "$tool" in
  Write|Edit|StrReplace|search_replace)
    rel=$(denwa_tool_path "$input")
    [[ -z "$rel" ]] && { echo '{ "permission": "allow" }'; exit 0; }
    [[ "$rel" == "$ROOT"* ]] && rel="${rel#"$ROOT"/}"
    case "$rel" in
      docs/TDD-REBUILD-PLAN.md|lefthook.yml|.cursor/hooks.json|scripts/harness-check.sh|scripts/harness-fast.sh)
        msg="denwa: $rel is protected"
        jq -n --arg m "$msg" '{ permission: "deny", user_message: $m, agent_message: $m }'
        exit 0
        ;;
    esac
    if denwa_is_source_path "$rel"; then
      denwa_mark_dirty "$ROOT"
      if ! out=$(denwa_run_static "$ROOT" "$rel" 2>&1); then
        msg="denwa pre-check failed:\n${out}"
        jq -n --arg m "$msg" '{ permission: "deny", user_message: $m, agent_message: $m }'
        exit 0
      fi
    fi
    ;;
esac
echo '{ "permission": "allow" }'
