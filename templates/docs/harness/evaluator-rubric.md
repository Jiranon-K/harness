# Evaluator Rubric (project override)

The `harness-evaluator` subagent uses the harness default rubric unless this file exists. Copy the
default here only when you start tuning: the course's guidance is that agents are poor self-judges
out of the box and the rubric needs 3–5 rounds of sharpening against your own review before its
scores match yours. Record every change in the tuning log so you can see what improved alignment.

Score each dimension 0–2. Conclusion: **Accept** (≥ 10 and no 0), **Revise** (7–9, or one 0), **Block** (≤ 6).

| # | Dimension | 0 | 1 | 2 |
| --- | --- | --- | --- | --- |
| 1 | Correctness | behavior does not match the feature | matches with caveats | matches `user_visible_behavior` exactly |
| 2 | Verification | checks not run, or claimed without evidence | some steps ran | every `verification` step ran; evidence has command + result |
| 3 | Scope discipline | touched unrelated features | minor drift, explained | only the selected feature (plus a documented narrow fix) |
| 4 | Reliability | fails on re-run or restart | passes but fragile | survives `./init.sh` from clean |
| 5 | Maintainability | next session would have to reverse-engineer it | readable, docs partly updated | code and docs a fresh session can navigate |
| 6 | Handoff readiness | progress log / feature state stale | updated but vague | next session can continue from repo artifacts alone |

## Project-specific pass/fail sharpening

<!-- Add concrete, checkable criteria here as you discover where the evaluator and you disagree. -->

## Tuning log

| Date | Disagreement observed | Rubric change |
| --- | --- | --- |
