#!/usr/bin/env bash
set -euo pipefail
input=$(cat)
command=$(echo "$input" | jq -r '.command // empty')
[[ "$command" =~ ^git[[:space:]]+commit ]] || { echo '{ "permission": "allow" }'; exit 0; }
if [[ "$command" =~ \.env ]] || [[ "$command" =~ credentials\.json ]]; then
  jq -n '{ permission: "deny", user_message: "denwa: do not commit .env or credentials" }'
  exit 2
fi
echo '{ "permission": "allow" }'
