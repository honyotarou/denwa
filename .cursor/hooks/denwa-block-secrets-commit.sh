#!/usr/bin/env bash
# Block obvious secret/env files from git commit (fail-closed complement to check-denwa-static).
set -euo pipefail

input=$(cat)
command=$(echo "$input" | jq -r '.command // empty')

if [[ ! "$command" =~ ^git[[:space:]]+commit ]]; then
  echo '{ "permission": "allow" }'
  exit 0
fi

if [[ "$command" =~ \.env ]] || [[ "$command" =~ credentials\.json ]]; then
  jq -n \
    --arg u "denwa: .env / credentials must not be committed. See docs/LEGACY.md." \
    --arg a "Remove secret files from the commit. Use env vars / docker-compose overrides locally." \
    '{ permission: "deny", user_message: $u, agent_message: $a }'
  exit 2
fi

echo '{ "permission": "allow" }'
