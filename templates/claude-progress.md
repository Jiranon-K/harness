# Progress Log

Read at session start (the harness SessionStart hook injects the section below); update before
handoff with `/harness:end`. Chat summaries are not state; this file is.

## Current Verified State

- Repository root: `{{root}}`
- Standard startup path: `./init.sh` — not yet verified
- Standard verification path: `{{verify}}` — not yet verified
- Current highest-priority unfinished feature: `example-001`
- Current blocker: none

## Session Log

### Session 001 — {{date}}

- **Goal**: install the harness and verify the baseline.
- **Completed**: harness scaffolded by `/harness:init` (harness {{harness_version}}).
- **Verification run**: (record the exact commands and their results)
- **Evidence captured**: (what proves it)
- **Commits**: (hashes)
- **Known risk or unresolved issue**: none recorded yet
- **Next best step**: replace `example-001` in `feature_list.json` with the real feature list, then run `./init.sh`.
