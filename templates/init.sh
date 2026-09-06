#!/usr/bin/env bash
# Standard startup + baseline verification. Run at the start of every session.
# If this fails, fix the baseline BEFORE starting feature work.
#
# This file is harness-owned and identical in every project: it reads all
# project-specific values from harness.json. Change harness.json, not this file.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"
echo "==> Working directory: $PWD"

if ! command -v node >/dev/null 2>&1; then
  echo "!! node not found. The harness needs Node >= 22 to read harness.json." >&2
  exit 1
fi
if [ ! -f harness.json ]; then
  echo "!! harness.json missing. Run /harness:init." >&2
  exit 1
fi

# Read one command out of harness.json (empty string when absent).
hcmd() { node -e 'const d=JSON.parse(require("fs").readFileSync("harness.json","utf8"));process.stdout.write((d.commands||{})[process.argv[1]]||"")' "$1"; }

# --- tool version gates ---------------------------------------------------
# harness.json "requires": {"node": ">=22", "pnpm": ">=10"} etc. Only major.minor.patch prefixes are compared.
node - <<'JS'
const { execSync } = require('node:child_process')
const d = JSON.parse(require('node:fs').readFileSync('harness.json', 'utf8'))
const req = d.requires || {}
let bad = 0
for (const [tool, range] of Object.entries(req)) {
  let out
  try { out = execSync(`${tool} --version`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString() } catch { console.error(`!! ${tool} not found (required ${range})`); bad++; continue }
  const m = out.match(/(\d+)\.(\d+)\.(\d+)/); if (!m) { console.log(`==> ${tool}: ${out.trim()} (unparsed; skipping check)`); continue }
  const have = m.slice(1, 4).map(Number)
  const r = range.match(/^(>=|\^|~|=)?\s*v?(\d+)(?:\.(\d+))?(?:\.(\d+))?$/)
  if (!r) { console.log(`==> ${tool}: ${have.join('.')} (range "${range}" unparsed; skipping)`); continue }
  const [, op = '>=', a, b = 0, c = 0] = r
  const want = [Number(a), Number(b), Number(c)]
  const cmp = have[0] - want[0] || have[1] - want[1] || have[2] - want[2]
  let ok = true
  if (op === '>=') ok = cmp >= 0
  else if (op === '^') ok = have[0] === want[0] && cmp >= 0
  else if (op === '~') ok = have[0] === want[0] && have[1] === want[1] && cmp >= 0
  else ok = cmp === 0
  console.log(`==> ${tool} ${have.join('.')} ${ok ? 'ok' : 'FAILS'} (${range})`)
  if (!ok) bad++
}
process.exit(bad ? 1 : 0)
JS

# --- install / verify / start ---------------------------------------------
INSTALL_CMD="$(hcmd install)"
VERIFY_CMD="$(hcmd verify)"
START_CMD="$(hcmd start)"

if [ -n "$INSTALL_CMD" ]; then
  echo "==> Syncing dependencies: $INSTALL_CMD"
  bash -c "$INSTALL_CMD"
fi

if [ -n "$VERIFY_CMD" ]; then
  echo "==> Running baseline verification: $VERIFY_CMD"
  bash -c "$VERIFY_CMD"
else
  echo "!! harness.json has no commands.verify. Add one; a harness without verification cannot gate completion." >&2
fi

if [ -n "$START_CMD" ]; then
  echo "==> Startup command"
  echo "    $START_CMD"
  if [ "${RUN_START_COMMAND:-0}" = "1" ]; then
    echo "==> Starting"
    exec bash -c "$START_CMD"
  fi
  echo "Baseline OK. Set RUN_START_COMMAND=1 to launch directly."
else
  echo "Baseline OK."
fi
