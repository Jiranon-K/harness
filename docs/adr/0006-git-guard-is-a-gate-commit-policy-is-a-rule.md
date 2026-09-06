---
status: accepted
---
# Destructive git is a Gate; commit/push policy is a Rule

The PreToolUse hook denies history-destroying git commands (`push --force` without lease,
`reset --hard`, `clean -f`, `branch -D`, whole-tree `checkout`/`restore`, `rebase -i`, `stash drop`)
in every project, harness or not, because losing work is never project-specific. It does *not*
block `git commit` or `git push`: the Operating Loop's last step asks the agent to commit when the
repository is safe to resume, so a commit Gate would fight the loop. "Never push unless asked" is a
Rule in the Profile instead. Rejected: an `agent_may_commit` switch in `harness.json` (a second
place to configure policy for little gain).
