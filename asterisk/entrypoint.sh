#!/bin/bash
# Asterisk foreground + /signals/reload watcher. AMI secret from env at runtime.
set -e

SIGNAL_DIR=/signals
SIGNAL_FILE="${SIGNAL_DIR}/reload"

mkdir -p "${SIGNAL_DIR}" 2>/dev/null || true

if [ -z "${AMI_SECRET}" ]; then
  echo "[entrypoint] AMI_SECRET is required" >&2
  exit 1
fi

TEMPLATE=/etc/asterisk/manager.conf.template
RUNTIME=/etc/asterisk/manager.conf
if [ -f "${TEMPLATE}" ]; then
  sed "s|__AMI_SECRET__|${AMI_SECRET}|g" "${TEMPLATE}" > "${RUNTIME}"
fi

(
  while sleep 2; do
    if [ -f "${SIGNAL_FILE}" ]; then
      rm -f "${SIGNAL_FILE}"
      echo "[reload-watcher] $(date) detected signal, reloading pjsip"
      asterisk -rx "pjsip reload" 2>/dev/null || true
      asterisk -rx "dialplan reload" 2>/dev/null || true
    fi
  done
) &

exec asterisk -f -vvv -T -W -U asterisk
