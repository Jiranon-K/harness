---
name: end
description: Close a working session cleanly — update the progress log and feature state with evidence, walk the clean-state checklist, write a handoff when the session was long, and commit when the repository is safe to resume. Use for "end session", "wrap up", "handoff", "before I stop", or when the Stop gate warns the progress log is stale.
disable-model-invocation: true
---

# /harness:end

The mirror of session start. Everything the next session needs must be in files before this one
ends; chat is not state. Do these in order and do not skip the ones that feel redundant.

## Steps

1. **Verify before recording.** Run `commands.verify` from `harness.json` (or `./init.sh`) now.
   Whatever it prints is the evidence you record; do not write down a result you did not see.

2. **Feature state** (`feature_list.json`):
   - The feature you worked on: `passing` only if every step in its `verification` list actually
     ran; append evidence entries of the form `YYYY-MM-DD: <command> → <result>`.
   - Otherwise leave it `in_progress` with `notes` saying exactly where it stands, or set `blocked`
     with the blocker in `notes`.
   - Never mark anything `passing` to make the list look finished. Never remove a feature to hide it.
   - Update `last_updated`.

3. **Progress log** (`claude-progress.md`):
   - Rewrite the *Current Verified State* section so it is true right now: startup path status,
     verification status (with date), highest-priority unfinished feature, current blocker.
   - Append a session entry: goal, completed, verification run (commands + results), evidence,
     commits, files updated, known risk or unresolved issue, next best step. The next best step is
     the most important line in the file; make it specific enough to start on without reading anything else.

4. **Docs in the same session.** If behavior changed, update the doc that describes it
   (`docs/ARCHITECTURE.md`, `CONTEXT.md`, an ADR, `docs/harness/quality-document.md` if a domain's
   grade moved). Deferred doc updates do not happen.

5. **Clean-state checklist.** Walk `docs/harness/clean-state-checklist.md` item by item and state
   the result of each. Anything unchecked goes into the progress log as a known risk.

6. **Handoff note.** If the session was long, touched several areas, or leaves an unfinished
   feature mid-way, fill `docs/harness/session-handoff.md`. Short sessions: the progress log entry is enough.

7. **Commit** when the repository is safe to resume (baseline green or the breakage documented):
   `git add` the specific files you changed, commit with a message that names the feature id and what
   was verified. Do not push unless the user asked.

8. **Stop.** The Stop gate re-validates `feature_list.json`. If it blocks, fix the state, not the gate.

## Anti-patterns to refuse

- "Verified" with no command output seen this session.
- A next-best-step that says "continue".
- Editing the evidence of a feature you did not touch.
