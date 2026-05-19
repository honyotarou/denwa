#!/usr/bin/env bash
# Inject denwa TDD context at session start (optional; lightweight).
set -euo pipefail
cat <<'EOF'
{
  "additional_context": "denwa: follow SKILL menu 0→9. Steps 2-8: pre/post auto check:static; stop auto harness. Step 9: commit/push. Pick one T-XXX from TDD-REBUILD-PLAN. Skill: .cursor/skills/denwa/SKILL.md"
}
EOF
