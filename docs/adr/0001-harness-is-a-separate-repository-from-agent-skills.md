---
status: accepted
---
# The harness is a separate repository from agent-skills

`Jiranon-K/agent-skills` already exists as a user-level library of *how-to* skills installed by copy
into `~/.claude/skills`. The harness could have been a folder inside it. We keep it separate because
the two answer different questions and change at different rates: skills say *how* to do work,
the harness says *what must hold* and *when it is enforced* (Codex/Claude Code's separation of
CLAUDE.md, skills, and hooks). The harness treats agent-skills as a recommended companion, never a
dependency it reaches into.
