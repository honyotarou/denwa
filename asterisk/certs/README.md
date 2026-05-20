# Asterisk TLS 証明書

WebRTC (wss + DTLS-SRTP) を有効にするには、このディレクトリに以下の2ファイルが必要です:

- `asterisk.pem` (証明書 + チェーン、PEM 形式)
- `asterisk.key` (秘密鍵、PEM 形式)

## ホスト Mac で自己署名証明書を作る (mkcert 推奨)

```bash
brew install mkcert nss
mkcert -install
mkcert -cert-file asterisk/certs/asterisk.pem -key-file asterisk/certs/asterisk.key \
  localhost 127.0.0.1 host.docker.internal $(hostname -s)
./scripts/gen-dev-asterisk-certs.sh
docker compose -f docker-compose.yml -f docker-compose.softphone-dev.yml up -d asterisk
```

`docker-compose.softphone-dev.yml` は **8089 をホスト公開**し、`http.dev.conf` で TLS を `0.0.0.0:8089` にバインドします（本番 `docker-compose.yml` だけでは WSS は届きません）。

ブラウザで一度 `https://<host>:8089/` にアクセスして自己署名を承認しておく必要があります。
