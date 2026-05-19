#!/usr/bin/env bash
# preToolUse: static + protected paths (every Write/Edit/StrReplace).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/denwa-hook-lib.sh"

ROOT="$(denwa_root "$(pwd)" 2>/dev/null || true)"
[[ -z "${ROOT:-}" ]] && ROOT="$(denwa_root "$PWD" 2>/dev/null || true)"
if [[ -z "${ROOT:-}" ]]; then
  echo '{ "permission": "allow" }'
  exit 0
fi

input=$(cat)
tool=$(echo "$input" | jq -r '.tool_name // empty')

case "$tool" in
  Write|Edit|StrReplace|search_replace)
    rel=$(denwa_tool_path "$input")
    if [[ -z "$rel" ]]; then
      echo '{ "permission": "allow" }'
      exit 0
    fi
    if [[ "$rel" == "$ROOT"* ]]; then
      rel="${rel#"$ROOT"/}"
    fi
    case "$rel" in
      docs/TDD-REBUILD-PLAN.md|lefthook.yml|.cursor/hooks.json|scripts/harness-check.sh|scripts/harness-fast.sh)
        msg="denwa: $rel is protected. Change via human PR, not agent Write."
        jq -n --arg m "$msg" '{ permission: "deny", user_message: $m, agent_message: $m }'
        exit 0
        ;;
    esac
    if denwa_is_source_path "$rel"; then
      denwa_mark_dirty "$ROOT"
      if ! out=$(denwa_run_static "$ROOT" "$rel" 2>&1); then
        msg="denwa pre-check failed (check:static). Fix before this edit.\n${out}\nFull harness: agent stop or git push."
        jq -n --arg m "$msg" '{ permission: "deny", user_message: $m, agent_message: $m }'
        exit 0
      fi
    fi
    ;;
esac

echo '{ "permission": "allow" }'
