#!/usr/bin/env bash
# Install the harness Profile and register the plugin marketplace for Claude Code (macOS / Linux / Git Bash).
#   ./install.sh            install or update
#   ./install.sh --local    register this clone as the marketplace (harness development)
#   ./install.sh --uninstall
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_DIR="${HOME}/.claude"
PROFILE_SRC="$ROOT/profile/CLAUDE.md"
PROFILE_DST="$CLAUDE_DIR/CLAUDE.md"
SETTINGS="$CLAUDE_DIR/settings.json"
MARKER='github.com/Jiranon-K/harness'
MODE=install
for a in "$@"; do case "$a" in --uninstall) MODE=uninstall ;; --local) LOCAL=1 ;; esac; done
mkdir -p "$CLAUDE_DIR"
command -v node >/dev/null || { echo "node is required (>= 22)" >&2; exit 1; }
[ -f "$SETTINGS" ] || echo '{}' > "$SETTINGS"

if [ "$MODE" = uninstall ]; then
  if [ -f "$PROFILE_DST" ] && grep -q "$MARKER" "$PROFILE_DST"; then rm "$PROFILE_DST"; echo "removed $PROFILE_DST"; else echo "profile not installed by harness; left alone"; fi
  node -e '
    const fs=require("fs");const f=process.argv[1];const s=JSON.parse(fs.readFileSync(f,"utf8"));
    if(s.enabledPlugins) delete s.enabledPlugins["harness@jiranon"];
    if(s.extraKnownMarketplaces) delete s.extraKnownMarketplaces.jiranon;
    fs.writeFileSync(f,JSON.stringify(s,null,2)+"\n")' "$SETTINGS"
  echo "settings.json: removed marketplace jiranon and harness@jiranon"
  exit 0
fi

# 1. Profile
if [ -f "$PROFILE_DST" ] && ! grep -q "$MARKER" "$PROFILE_DST"; then
  BAK="$PROFILE_DST.bak-$(date +%Y%m%d-%H%M%S)"; cp "$PROFILE_DST" "$BAK"
  echo "existing ~/.claude/CLAUDE.md is not the harness Profile; backed up to $BAK"
fi
cp "$PROFILE_SRC" "$PROFILE_DST"
echo "profile -> $PROFILE_DST"

# 2. settings.json (merge)
node -e '
  const fs=require("fs");const [f,local,root]=process.argv.slice(1);
  const s=JSON.parse(fs.readFileSync(f,"utf8"));
  s.extraKnownMarketplaces ??= {};
  s.extraKnownMarketplaces.jiranon = { source: local==="1" ? { source:"directory", path: root } : { source:"github", repo:"Jiranon-K/harness" } };
  s.enabledPlugins ??= {}; s.enabledPlugins["harness@jiranon"] = true;
  fs.writeFileSync(f,JSON.stringify(s,null,2)+"\n")' "$SETTINGS" "${LOCAL:-0}" "$ROOT"
echo "settings.json: marketplace jiranon (${LOCAL:+local: $ROOT}${LOCAL:-github: Jiranon-K/harness}), enabledPlugins.harness@jiranon = true"

cat <<'EOF'

Next:
  1. Restart Claude Code (or run /plugin marketplace update jiranon, then /plugin install harness@jiranon).
  2. In a project: /harness:init
  3. Optional companion: https://github.com/Jiranon-K/agent-skills
EOF
