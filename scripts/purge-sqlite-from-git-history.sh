#!/usr/bin/env bash
# Git 履歴から SQLite DB バイナリを除去（漏洩後の履歴清掃）。
# 実行前: 作業ツリーを commit または stash すること。
# 実行後: force-push が必要（origin は filter-repo が削除するので git remote add で戻す）。
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PATHS=(
  apps/web/data/db/command-room.sqlite
  apps/web/data/db/command-room.sqlite-shm
  apps/web/data/db/command-room.sqlite-wal
  data/db/command-room.sqlite.broken
  data/db/command-room.sqlite.corrupt-20260522-174730
  data/db/command-room.sqlite.corrupt-20260522-174730-shm
  data/db/command-room.sqlite.corrupt-20260522-174730-wal
)

if ! command -v git-filter-repo >/dev/null 2>&1; then
  echo "git-filter-repo が必要です: pip3 install git-filter-repo" >&2
  exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "警告: 未 commit の変更があります。filter-repo 後に stash pop / 再適用が必要な場合があります。" >&2
  git status --short >&2
fi

ARGS=()
for p in "${PATHS[@]}"; do
  ARGS+=(--path "$p")
done

echo "Rewriting git history to remove tracked SQLite files..."
ORIGIN_URL=""
if git remote get-url origin >/dev/null 2>&1; then
  ORIGIN_URL="$(git remote get-url origin)"
fi

git filter-repo --force --invert-paths "${ARGS[@]}"

if [[ -n "$ORIGIN_URL" ]]; then
  git remote add origin "$ORIGIN_URL" 2>/dev/null || git remote set-url origin "$ORIGIN_URL"
fi

echo "Done. Verify: git log --all -- '*.sqlite*'  (empty expected)"
echo "If remote exists: git remote add origin <url> && git push --force-with-lease --all"
