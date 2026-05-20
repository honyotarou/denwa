#!/usr/bin/env bash
# Inject denwa TDD context at session start (optional; lightweight).
set -euo pipefail
cat <<'EOF'
{
  "additional_context": "denwa: menu 0→9. Mutations ONLY in server/services/* (T-ARCH-006). Actions: no ctx.db. Audit: server/audit.ts (not actions). app/actions.ts + api-handlers.ts = barrel only (T-SOC-004/005). Gate: npm run check:static (denwa-architecture-gate.mjs). Edit: pre static / post harness:fast / stop harness. Steps: .cursor/skills/denwa/steps-denwa.md §N. One T-XXX from TDD-REBUILD-PLAN §7."
}
EOF
