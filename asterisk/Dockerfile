FROM ubuntu:22.04@sha256:4f838adc7181d9039ac795a7d0aba05a9bd9ecd480d294483169c5def983b64d

ENV DEBIAN_FRONTEND=noninteractive

# F-015: APT 版を pin（CVE 追随は意図的 bump + image rebuild）
# jammy universe（amd64 / arm64 共通。18.20.4 pin は ports で消えていた）
ARG ASTERISK_PKG_VERSION=1:18.10.0~dfsg+~cs6.10.40431411-2

# Ubuntu 22.04 universe には asterisk 18.x が含まれる（Apple Silicon = arm64 対応）。
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      asterisk=${ASTERISK_PKG_VERSION} \
      asterisk-core-sounds-en \
      ca-certificates \
      openssl \
      curl \
      tzdata \
 && rm -rf /var/lib/apt/lists/*

# 録音ディレクトリ
RUN mkdir -p /var/spool/asterisk/monitor \
 && chown -R asterisk:asterisk /var/spool/asterisk

# foreground 実行。冗長ログを CLI に出す。
CMD ["asterisk", "-f", "-vvv", "-T", "-W", "-U", "asterisk"]
