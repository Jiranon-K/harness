# Evaluator Rubric (harness default)

Score each dimension 0–2. Conclusion: **Accept** (≥ 10 and no 0), **Revise** (7–9, or one 0), **Block** (≤ 6).

| # | Dimension | 0 | 1 | 2 |
| --- | --- | --- | --- | --- |
| 1 | Correctness | behavior does not match the feature | matches with caveats | matches `user_visible_behavior` exactly |
| 2 | Verification | checks not run, or claimed without evidence | some steps ran | every `verification` step ran; evidence has command + result |
| 3 | Scope discipline | touched unrelated features | minor drift, explained | only the selected feature (plus a documented narrow fix) |
| 4 | Reliability | fails on re-run or restart | passes but fragile | survives `./init.sh` from clean |
| 5 | Maintainability | next session would have to reverse-engineer it | readable, docs partly updated | code and docs a fresh session can navigate |
| 6 | Handoff readiness | progress log / feature state stale | updated but vague | next session can continue from repo artifacts alone |

Rules for the evaluator:

- Score from evidence you can see (diff, test output, files), never from the maker's description of the work.
- A dimension you cannot verify scores 0, and you say why.
- Do not talk yourself into Accept after listing problems. If you listed a 0, the conclusion is not Accept.
