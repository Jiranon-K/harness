# AGENTS.md

This repository is maintained with the harness described in `CLAUDE.md`. Non-Claude agents: read
`CLAUDE.md` for the routing map, then follow the operating loop below (Claude Code receives it
from a plugin hook instead).

1. Confirm the repository root with `pwd`.
2. Read `claude-progress.md` (Current Verified State) and `feature_list.json`.
3. Run `./init.sh`; if the baseline is red, fix that first.
4. Work on exactly one feature (`in_progress`) until verified with evidence or documented as `blocked`.
5. Before stopping: update the progress log and feature state, walk `docs/harness/clean-state-checklist.md`, commit when safe.
