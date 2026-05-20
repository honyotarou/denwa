#!/usr/bin/env bash
# Shared harness steps for harness-check.sh, harness-fast.sh, and hooks.
# shellcheck disable=SC2034
set -euo pipefail

_harness_lib_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HARNESS_ROOT="$(cd "$_harness_lib_dir/.." && pwd)"

denwa_harness_workspaces() {
  node -e "
    const p = require(process.argv[1]);
    for (const w of p.workspaces || []) console.log(w);
  " "$HARNESS_ROOT/package.json"
}

denwa_harness_static() {
  local target="${1:-}"
  echo "== denwa harness: static =="
  if [[ -n "$target" ]]; then
    node "$HARNESS_ROOT/scripts/check-denwa-static.mjs" "$target"
  else
    node "$HARNESS_ROOT/scripts/check-denwa-static.mjs"
  fi
}

denwa_harness_typechecks() {
  local ws name
  for ws in $(denwa_harness_workspaces); do
    if [[ ! -f "$HARNESS_ROOT/$ws/package.json" ]]; then
      continue
    fi
    if ! node -e "
      const s = require(process.argv[1]).scripts || {};
      process.exit(s.typecheck ? 0 : 1);
    " "$HARNESS_ROOT/$ws/package.json"; then
      continue
    fi
    name=$(node -p "require('$HARNESS_ROOT/$ws/package.json').name")
    echo "== denwa harness: $name typecheck =="
    npm run typecheck -w "$name"
  done
}

denwa_harness_test_gate() {
  echo "== denwa harness: test:gate =="
  npm run test:gate
}

denwa_harness_fast() {
  denwa_harness_static "${1:-}"
  denwa_harness_typechecks
}

denwa_harness_full() {
  denwa_harness_static "${1:-}"
  denwa_harness_typechecks
  denwa_harness_test_gate
}
