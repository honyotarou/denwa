#!/usr/bin/env bash
# dev: mkcert ローカル CA を macOS キーチェーンで信頼（softphone WSS 用）
set -euo pipefail
if ! command -v mkcert >/dev/null 2>&1; then
  echo "mkcert が必要です: brew install mkcert nss" >&2
  exit 1
fi
CAROOT="$(mkcert -CAROOT)"
echo "mkcert CA: ${CAROOT}/rootCA.pem"
echo ""
echo "次のどちらか:"
echo "  1) mkcert -install   （推奨・パスワード入力）"
echo "  2) 開くキーチェーンで rootCA を「常に信頼」"
echo ""
if [[ "$(uname -s)" == "Darwin" ]]; then
  open "${CAROOT}/rootCA.pem"
fi
