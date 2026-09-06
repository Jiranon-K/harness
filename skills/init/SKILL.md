---
name: init
description: Install or refresh the harness in the current repository — detect the stack, write harness.json, init.sh, feature_list.json, the progress log and docs/harness/, and add the harness block to CLAUDE.md. Use for "install the harness", "set up harness", "harness init", or when the Stop gate or SessionStart hook reports harness.json is missing.
disable-model-invocation: true
argument-hint: "[--dry-run] [--force] [--rubric] [--agents-md] [--refresh-context]"
---

# /harness:init

Install the Scaffold into the current project, or refresh it. Never overwrites a file the project
already has unless the user passes `--force`; even then only harness-owned files are replaced.

## Steps

1. **Dry run first.** From the repository root:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/scaffold.mjs" --target "$PWD" --dry-run $ARGUMENTS
   ```

   Show the user the detected stack and commands and the list of files that would be written,
   skipped, or appended. Detection reads package manifests and lockfiles; it never asks first.

2. **Correct detection before writing.** If a command is wrong or missing (no `verify` is the
   usual gap), pass overrides: `--verify "pnpm verify"`, `--format "pnpm exec biome check --write {file}"`,
   `--install`, `--start`, `--requires '{"node":">=22"}'`. A project without a runnable verify
   command cannot gate completion; say so plainly and ask which command should count.

3. **Write.** Re-run without `--dry-run`. Then:
   - Open `harness.json` and confirm every command is real. Run `commands.verify` once yourself; a
     descriptor that documents a command nobody has run is worse than none.
   - Replace `example-001` in `feature_list.json` with the project's real first features, or leave
     the example and tell the user it is a placeholder the audit will keep flagging.
   - Run `./init.sh`. Record the result in the progress log's Current Verified State.

4. **Existing CLAUDE.md.** The scaffold appends a `<!-- harness:start -->…<!-- harness:end -->`
   block and touches nothing else. If the file already contains a copied Operating Loop (the
   `pwd` → read progress → read features → `git log` → `init.sh` sequence), offer to delete that
   section: the SessionStart hook now injects it, and the project file should hold only what is
   specific to the project.

5. **Legacy project hooks.** If `.claude/settings.json` in the project defines `Stop` or
   `PostToolUse` hooks that duplicate the plugin's (a stop gate, a formatter), tell the user they can
   remove them and rely on the plugin; do not remove them silently.

6. Finish with `/harness:audit` and report the score and any FAIL items.

## Flags

- `--rubric`: also write `docs/harness/evaluator-rubric.md` (a project override; the evaluator subagent uses the harness default until this exists).
- `--agents-md`: also write an `AGENTS.md` pointer for non-Claude agents and set `agents_md: true`.
- `--refresh-context`: only regenerate `.agent/context.md` from `harness.json` (after editing commands).
- `--force`: replace harness-owned files (`init.sh`, `docs/harness/*`, the CLAUDE.md block, a generated `.agent/context.md`). Never use it without telling the user which files it will replace.

## Rules

- Never write a secret or token into any scaffolded file.
- Never invent a verification command. Leave it empty and say so.
- Do not commit. Tell the user what changed and let them commit, or let `/harness:end` do it at the
  end of a working session.
