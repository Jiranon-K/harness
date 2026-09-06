#!/usr/bin/env bash
# Refresh the vendored Source copy of walkinglabs/learn-harness-engineering and record the pinned commit.
# Usage: scripts/sync-sources.sh [ref]   (default: main)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REF="${1:-main}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

git clone --depth 1 --branch "$REF" -q https://github.com/walkinglabs/learn-harness-engineering.git "$TMP/src"
SHA="$(git -C "$TMP/src" rev-parse HEAD)"
DATE="$(git -C "$TMP/src" log -1 --format=%cI)"

DEST="$ROOT/sources/learn-harness-engineering"
rm -rf "$DEST"
mkdir -p "$DEST/skills"
cp -r "$TMP/src/docs/en" "$DEST/docs-en"
cp -r "$TMP/src/skills/harness-creator" "$DEST/skills/"
cp "$TMP/src/LICENSE" "$DEST/LICENSE"
printf 'repo: https://github.com/walkinglabs/learn-harness-engineering\nref: %s\ncommit: %s\ncommitted: %s\nsynced: %s\ncontents: docs/en -> docs-en, skills/harness-creator, LICENSE\n' \
  "$REF" "$SHA" "$DATE" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$DEST/PINNED.txt"

# Update the pinned commit in THIRD_PARTY_NOTICES.md
if [ -f "$ROOT/THIRD_PARTY_NOTICES.md" ]; then
  sed -i.bak -E "s#(learn-harness-engineering @ )[0-9a-f]{7,40}#\1${SHA}#" "$ROOT/THIRD_PARTY_NOTICES.md" && rm -f "$ROOT/THIRD_PARTY_NOTICES.md.bak"
fi
echo "synced learn-harness-engineering @ $SHA ($DATE)"
