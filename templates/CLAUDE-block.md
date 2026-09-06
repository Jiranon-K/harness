
<!-- harness:start -->
## Harness

This repository uses the harness plugin (harness {{harness_version}}). The plugin injects the
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
