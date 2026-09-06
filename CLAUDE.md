# CLAUDE.md — harness

Personal, installable engineering harness for Claude Code: a plugin Runtime (hooks, skills,
subagent), a project Scaffold written by `/harness:init`, and a user Profile. This repository runs
its own harness; the SessionStart hook injects the Operating Loop and current state.

<!-- harness:start -->
## Harness

This repository uses the harness plugin (harness 0.1.0). The plugin injects the
Operating Loop and the current verified state at session start.

| Need | File |
| --- | --- |
| Commands, paths, tool versions | `harness.json` |
| Startup + baseline verification | `./init.sh` |
| Feature state (one `in_progress`, `passing` needs evidence) | `feature_list.json` |
| Current verified state, session log | `claude-progress.md` |
| Handoff note, clean-state checklist, quality snapshot | `docs/harness/` |
| Specs and tickets per feature | `.scratch/<feature>/` (the `spec` field of a feature points here) |

End every working session with `/harness:end`. A Stop gate validates `feature_list.json`; if it
blocks you, fix the state, never the gate.
<!-- harness:end -->

## Invariants

- Hooks have zero dependencies and are no-ops in a repository without `harness.json` (the git guard is the one exception). They must never fail a session: catch, report, exit 0.
- `templates/init.sh` is identical in every project; project values live only in `harness.json`. Never add a project-specific line to it.
- Anything that the Stop gate enforces must also be in `lib/common.mjs#checkFeatureList` and covered by a test.
- Templates use `{{var}}` placeholders only; `scripts/scaffold.mjs` never overwrites without `--force`, and `--force` touches harness-owned files only.
- Vocabulary follows `CONTEXT.md` (Runtime / Scaffold / Profile / Gate vs Rule / Descriptor). Fix the glossary before using a new word.
- Vendored `sources/` is read-only; change it only through `scripts/sync-sources.sh`, which updates the pinned commit.

## Where things live

| Need | File |
| --- | --- |
| Vocabulary | `CONTEXT.md` |
| Why it is shaped this way | `docs/adr/` |
| Principles the harness encodes | `docs/digest/en.md` (Thai: `th.md`), skill `principles` |
| Plugin manifest, marketplace | `.claude-plugin/` |
| Hook contracts (stdin JSON, exit codes) | comments at the top of each `hooks/*.mjs` |
| Course source, pinned | `sources/learn-harness-engineering/` |
| Attribution | `THIRD_PARTY_NOTICES.md` |

## Commands

- Verify: `npm run verify` (node:test suite, then `scripts/validate.mjs` on this repo)
- Try the scaffold: `node scripts/scaffold.mjs --target <dir> --dry-run`
- Develop against a local marketplace: `.\install.ps1 -Local`
