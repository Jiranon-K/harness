---
status: accepted
---
# The Stop gate blocks only on feature-list invariants; the progress log is a warning

We could have made the Stop gate refuse to end any session whose progress log was not updated.
We block only on `feature_list.json` invariants (one `in_progress`, evidence for `passing`, a
documented blocker for `blocked`, an existing `spec`, `passing` dependencies) and merely warn when
the feature list is newer than the progress log. Reason: read-only sessions and quick questions
would otherwise be forced to write empty log entries, which devalues the log the harness depends
on. `/harness:end` owns the log; the gate owns the invariants that must never be false.
