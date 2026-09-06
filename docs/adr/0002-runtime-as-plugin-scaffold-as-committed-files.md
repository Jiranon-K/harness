---
status: accepted
---
# Runtime ships as a Claude Code plugin; Scaffold ships as committed project files

Hooks, skills, and subagents are delivered once through a plugin so a fix at the centre reaches
every project without re-copying (the first hand-built harness in `yakusub` copied `stop-gate.mjs`
into the repo, which would drift). Files that carry project-specific content and must be visible in
the repository's history (`CLAUDE.md`, `harness.json`, `init.sh`, `feature_list.json`, the progress
log) are generated into the project by `/harness:init` instead. Rejected: a pure copy installer
(drifting hooks) and a pure plugin (cannot write project files, and project state must be committed).
