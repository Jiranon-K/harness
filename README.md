# harness

**Personal, installable engineering harness for Claude Code.** The constraints that live *outside the
model* so that work in any repository starts consistently, stays in scope, proves completion, and
resumes across sessions. Built on the [Learn Harness Engineering](https://github.com/walkinglabs/learn-harness-engineering) course.

> ภาษาไทย: อ่าน [docs/digest/th.md](docs/digest/th.md) สำหรับหลักการ และหัวข้อ "การติดตั้ง" ด้านล่าง

## What it is

Three layers, one repository:

| Layer | Delivered as | Contents |
| --- | --- | --- |
| **Runtime** | Claude Code plugin `harness@jiranon` | 4 hooks (session-start, stop gate, format-on-edit, git guard), skills `/harness:init` `/harness:audit` `/harness:end` `principles`, subagent `harness-evaluator` |
| **Scaffold** | files written into a project by `/harness:init` | `harness.json`, `init.sh`, `feature_list.json`, `claude-progress.md`, `docs/harness/*`, a block in `CLAUDE.md`, generated `.agent/context.md` |
| **Profile** | `~/.claude/CLAUDE.md` via `install.ps1` / `install.sh` | user-level rules that apply to every project |

The vocabulary (Runtime, Scaffold, Profile, Gate vs Rule, Descriptor, …) is defined in [CONTEXT.md](CONTEXT.md).
Design decisions are in [docs/adr/](docs/adr/).

## How it behaves in a project

- **Session start**: the hook injects the Operating Loop, the progress log's *Current Verified State*,
  the active feature, and recent commits. Nothing to remember, nothing copied into `CLAUDE.md`.
- **While editing**: `commands.format` from `harness.json` runs on each edited file.
- **On `git`**: history-destroying commands (`push --force`, `reset --hard`, `clean -f`, `branch -D`,
  whole-tree `checkout`/`restore`, `rebase -i`, `stash drop`) are denied. `--force-with-lease` is allowed.
- **On stop**: `feature_list.json` must satisfy the invariants — one `in_progress`, evidence for
  `passing`, a documented blocker for `blocked`, an existing `spec`, `passing` dependencies — or the
  agent cannot stop. The progress log lagging behind is a warning, not a block.
- **`/harness:end`**: verify, record evidence, update the log, walk the clean-state checklist, commit when safe.
- **`harness-evaluator`**: a fresh-context checker that scores a feature against the rubric from evidence only.

All hooks are no-ops in a repository without `harness.json`, except the git guard.

## Install (การติดตั้ง)

Requirements: Claude Code, Node ≥ 22, Git Bash on Windows.

```powershell
git clone https://github.com/Jiranon-K/harness.git D:\Project\harness
cd D:\Project\harness
.\install.ps1          # copies the Profile, registers marketplace "jiranon", enables harness@jiranon
```

```bash
git clone https://github.com/Jiranon-K/harness.git ~/harness
cd ~/harness && ./install.sh
```

Then restart Claude Code (or `/plugin marketplace update jiranon` → `/plugin install harness@jiranon`).
Developing the harness itself: `.\install.ps1 -Local` registers this clone as the marketplace.

In any project:

```
/harness:init            # detect stack, write the Scaffold (dry run first, never overwrites)
/harness:audit           # five-subsystem score, invariants, drift
/harness:end             # close the session
```

Update later: `git pull` in the clone, re-run `install.ps1` for the Profile; the plugin updates through
the marketplace. Scaffolded files are never auto-updated: `/harness:audit` reports drift and
`/harness:init --force` refreshes harness-owned files on request.

## harness.json (Descriptor)

```json
{
  "harness_version": "0.1.0",
  "project": "yakusub",
  "commands": {
    "install": "pnpm install --frozen-lockfile",
    "verify": "pnpm verify",
    "start": "pnpm dev:extension",
    "format": "pnpm exec biome check --write {file}"
  },
  "paths": { "progress": "claude-progress.md", "features": "feature_list.json", "specs": ".scratch", "harness_docs": "docs/harness" },
  "requires": { "node": ">=22", "pnpm": ">=10" }
}
```

`init.sh` is identical in every project and reads this file; project values never go into scripts.
Schemas: [schemas/](schemas/).

## Repository layout

```
.claude-plugin/   plugin.json, marketplace.json (marketplace "jiranon")
hooks/            hooks.json + 4 hook scripts (Node, zero deps)
skills/           init, audit, end, principles
agents/           harness-evaluator + default rubric
schemas/          harness.json and feature_list.json JSON Schemas
templates/        Scaffold sources ({{var}} placeholders)
scripts/          scaffold.mjs, validate.mjs, sync-sources.sh
profile/          user-level CLAUDE.md
docs/digest/      condensed course notes (en, th)
docs/adr/         decisions
sources/          vendored, pinned copy of the course (docs/en + harness-creator)
test/             node:test suite + fixture project
```

This repository runs its own harness (`harness.json`, `feature_list.json`, `claude-progress.md`, `init.sh`).

```bash
npm run verify     # tests + self-audit
```

## Companion

[Jiranon-K/agent-skills](https://github.com/Jiranon-K/agent-skills) holds the *how-to* skills
(grilling → spec → tickets → implement). The harness says what must hold and when it is enforced;
the skills say how to do the work. `/harness:init` generates the `.agent/context.md` those skills read.

## Credits and license

MIT. Templates and the vendored course are from walkinglabs / learn-harness-engineering (MIT); see
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
