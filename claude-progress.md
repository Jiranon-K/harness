# Progress Log

Read at session start (the harness SessionStart hook injects the section below); update before
handoff with `/harness:end`. Chat summaries are not state; this file is.

## Current Verified State

- Repository root: `D:/Project/harness`
- Standard startup path: `./init.sh` — verified green 2026-09-06 (node gate, `npm run verify`)
- Standard verification path: `npm run verify` — node:test suite (56 tests) + `scripts/validate.mjs --target .`
- Current highest-priority unfinished feature: `profile-001` (run the installer on this machine, confirm the plugin loads), then `yakusub-001`
- Current blocker: none

## Session Log

### Session 001 — 2026-09-06

- **Goal**: design the harness with `/grill-with-docs` (4 rounds of questions, all recommendations accepted), then build v0.1.
- **Completed**:
  - Vocabulary (`CONTEXT.md`, 16 terms) and six ADRs (separate repo; plugin + scaffold; generated `.agent/context.md`; Operating Loop in SessionStart; stop gate blocks on feature state only; git guard is a Gate, commit policy a Rule).
  - Runtime: `hooks/` (session-start, stop-gate, format-on-edit, git-guard) + `hooks.json`; skills `init`, `audit`, `end`, `principles`; `agents/harness-evaluator.md` + default rubric; `.claude-plugin/plugin.json` and `marketplace.json` (marketplace `jiranon`).
  - Scaffold: `templates/` (harness-owned `init.sh` reading `harness.json`, `feature_list.json` with `spec`/`depends_on`, progress log, CLAUDE.md + block, AGENTS.md pointer, `.agent/context.md`, `docs/harness/*`), `scripts/scaffold.mjs` (detect node/python/rust/go; never overwrites), `scripts/validate.mjs` (five-subsystem score + drift), JSON Schemas.
  - Profile: `profile/CLAUDE.md`; `install.ps1` / `install.sh` (copy Profile, merge settings, `-Local` mode, uninstall).
  - Knowledge: `docs/digest/en.md` + `th.md`; vendored course (`docs/en` + `harness-creator`) pinned at 77e7a3e; `THIRD_PARTY_NOTICES.md`; `scripts/sync-sources.sh`.
  - Dogfood: this repo scaffolded with its own harness.
- **Verification run**:
  - `node --test "test/**/*.test.mjs"` → 56 tests, 56 pass.
  - `node scripts/scaffold.mjs --target test/fixtures/node-pnpm --dry-run` → detects pnpm + biome, 9 files would be written.
  - `./init.sh` on this repo → see Session 001 evidence line added by the run below.
- **Evidence captured**: in `feature_list.json` (`runtime-001`, `scaffold-001`, `audit-001`).
- **Commits**: initial commit (see `git log`).
- **Files or artifacts updated**: everything; first commit.
- **Known risk or unresolved issue**:
  - Plugin loading through the GitHub marketplace is not verified until Claude Code restarts with the new settings (`profile-001`).
  - `format-on-edit` quoting on paths with spaces is tested only through Node's shell; Windows cmd quoting of `{file}` in exotic formatters is untested.
- **Next best step**: run `.\install.ps1`, restart Claude Code, confirm `/harness:init` is listed; then migrate yakusub (`yakusub-001`).
