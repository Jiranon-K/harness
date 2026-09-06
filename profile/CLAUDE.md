# Profile (user-level rules, all projects)

Installed by github.com/Jiranon-K/harness `install.ps1` / `install.sh`. Keep under 40 lines; "how to"
belongs in skills, project facts belong in the project's CLAUDE.md.

## Language

- Talk to me in Thai. Write code, comments, commit messages, documentation, and agent-facing files in English.
- Expand an uncommon acronym the first time you use it.

## Invariants (every repository)

- The repository is the system of record. Chat summaries are not state; files are.
- One feature `in_progress` at a time. `passing` requires recorded evidence: the command that ran and its result.
- Never remove, skip, or weaken a test or verification step to make work look complete.
- Never rewrite a feature list or progress log to hide unfinished work.
- If the baseline (`./init.sh` or the project's verify command) is red, fix that before feature work.
- When the same review feedback recurs, promote it into a mechanical check (hook, lint, test) instead of re-explaining it.

## Git

- Commit when the repository is safe to resume, with a message that names what was verified. Never push, force-push, rebase interactively, or delete branches unless I ask for that specific action.
- Never commit secrets. Record variable names, not values.

## Working style

- Detect before asking: read manifests, lockfiles, existing docs. Ask only what detection cannot settle.
- Prefer the smallest artifact that fixes the observed failure over a longer instruction file.
- In a repository with `harness.json`, follow the Operating Loop the harness injects at session start and end with `/harness:end`.
- For non-trivial work, use the agent-skills flow when installed (`/ask` routes you): grilling → spec → tickets → implement.
