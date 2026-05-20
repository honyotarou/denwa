#!/usr/bin/env bash
# Inject denwa TDD context at session start (optional; lightweight).
set -euo pipefail
cat <<'EOF'
{
  "additional_context": "denwa: menu 0→9. Steps 2-8: pre static / post harness:fast / stop harness. Mutations: server/services/* (validate+db+sync+audit). Steps: .cursor/skills/denwa/steps-denwa.md §N. One T-XXX from TDD-REBUILD-PLAN §7."
}
EOF
