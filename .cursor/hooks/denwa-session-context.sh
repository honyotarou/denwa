#!/usr/bin/env bash
# Inject denwa TDD context at session start (lightweight).
set -euo pipefail

jq -n --arg c \
  "denwa: /denwa N → steps-denwa.md §N 必読 + legacy/docs してから実装（OpenPBX 全文は毎回読まない）。メニュー 0→9。Step 2-8: pre/post check:static・stop で harness。Step 9: commit/push。T-XXX は TDD-REBUILD-PLAN から1つ。SKILL: .cursor/skills/denwa/SKILL.md" \
  '{ additional_context: $c }'
