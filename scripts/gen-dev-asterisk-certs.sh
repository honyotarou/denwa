#!/usr/bin/env bash
# dev: mkcert で Asterisk WSS 用証明書を生成（/softphone 用）
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CERT_DIR="${ROOT}/asterisk/certs"
mkdir -p "${CERT_DIR}"
if ! command -v mkcert >/dev/null 2>&1; then
  echo "mkcert が必要です: brew install mkcert nss && mkcert -install" >&2
  exit 1
fi
HOSTS="localhost 127.0.0.1 host.docker.internal $(hostname -s 2>/dev/null || echo local)"
mkcert -cert-file "${CERT_DIR}/asterisk.pem" -key-file "${CERT_DIR}/asterisk.key" ${HOSTS}
echo "OK: ${CERT_DIR}/asterisk.pem"
echo "次: docker compose -f docker-compose.yml -f docker-compose.softphone-dev.yml up -d --build asterisk"
