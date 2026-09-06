# Clean State Checklist

Walk this before ending a session. `/harness:end` runs through it; the Stop gate enforces the
feature-list items mechanically.

- [ ] `./init.sh` still passes (startup and baseline verification).
- [ ] `feature_list.json` reflects reality: nothing `passing` without evidence, at most one `in_progress`, every `blocked` has its blocker in `notes`.
- [ ] `claude-progress.md` has a session entry: goal, completed, verification run, evidence, commits, risks, next best step.
- [ ] The Current Verified State section names the next feature and any blocker.
- [ ] No half-finished step is left undocumented (in the progress log or the feature's `notes`).
- [ ] Docs that describe changed behavior were updated in this session, not deferred.
- [ ] Work is committed once the repository is safe to resume. Nothing is pushed unless asked.
- [ ] The next session can continue without manual repair.
