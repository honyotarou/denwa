#!/usr/bin/env bash
# Shared helpers for denwa Cursor hooks.
set -euo pipefail

denwa_root() {
  local dir="${1:-$PWD}"
  while [[ "$dir" != "/" ]]; do
    if [[ -f "$dir/package.json" ]] && grep -q '"name"[[:space:]]*:[[:space:]]*"denwa"' "$dir/package.json" 2>/dev/null; then
      echo "$dir"
      return 0
    fi
    dir="$(dirname "$dir")"
  done
  return 1
}

denwa_is_source_path() {
  local rel="$1"
  [[ "$rel" == packages/* || "$rel" == apps/* || "$rel" == scripts/* ]] &&
    [[ "$rel" =~ \.(ts|tsx|js|mjs|cjs)$ ]]
}

denwa_mark_dirty() {
  local root="$1"
  mkdir -p "$root/.cursor"
  date +%s >"$root/.cursor/.denwa-dirty"
}

denwa_is_dirty() {
  local root="$1"
  [[ -f "$root/.cursor/.denwa-dirty" ]]
}

denwa_clear_dirty() {
  local root="$1"
  rm -f "$root/.cursor/.denwa-dirty"
}

# Debounce rapid static runs (ms default 1500)
denwa_run_static() {
  local root="$1"
  local target="${2:-}"
  local lock="$root/.cursor/.denwa-static.lock"
  local now
  now=$(date +%s)
  mkdir -p "$root/.cursor"
  if [[ -f "$lock" ]]; then
    local last
    last=$(cat "$lock" 2>/dev/null || echo 0)
    if (( now - last < 2 )); then
      return 0
    fi
  fi
  echo "$now" >"$lock"
  if [[ -n "$target" ]]; then
    node "$root/scripts/check-denwa-static.mjs" "$target"
  else
    node "$root/scripts/check-denwa-static.mjs"
  fi
}

denwa_tool_path() {
  local input="$1"
  echo "$input" | jq -r '
    .tool_input.path //
    .tool_input.file_path //
    .tool_input.target_file //
    .tool_input.filePath //
    empty
  ' 2>/dev/null || true
}
