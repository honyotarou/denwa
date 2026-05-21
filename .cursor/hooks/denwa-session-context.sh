#!/usr/bin/env bash
# Inject denwa TDD context at session start (optional; lightweight).
set -euo pipefail
cat <<'EOF'
{
  "additional_context": "denwa: menu 0→9. Legacy parity B (CDR/billing/concurrency/home): steps-denwa.md appendix D. Mutations ONLY server/services/* (T-ARCH-006). Actions: no ctx.db. Barrels: app/actions.ts, api-handlers.ts. Gate: check:static + harness. Steps: steps-denwa.md §N or appendix D. Coverage: npm run test:coverage:parity-b when touching parity core."
}
EOF
