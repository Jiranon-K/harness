---
status: accepted
---
# The Operating Loop is injected by the SessionStart hook, not copied into CLAUDE.md

The course templates put the six-step Operating Loop (confirm root, read progress, read features,
`git log`, `init.sh`, pick one feature) into every project's `CLAUDE.md`, so it was duplicated per
project and drifted. We inject it from the plugin's SessionStart hook together with the live state
(Current Verified State, active feature, recent commits), and only in projects that have a
`harness.json`. Consequences: project `CLAUDE.md` files hold only project-specific routing and
invariants (Codex's "directory page"); improving the loop is a single change at the centre; the
Profile stays short because it does not need the loop either. Rejected: the Profile (would apply to
projects without a harness) and per-project copies (drift).
