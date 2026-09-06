# Third-party notices

This harness is derived from, and vendors, material by other people. Every source is recorded with a
pinned commit and its license.

## walkinglabs / learn-harness-engineering (MIT)

- Repository: https://github.com/walkinglabs/learn-harness-engineering
- Pinned: learn-harness-engineering @ 77e7a3e21469dcbece2558086c8d91657abeaa40 (2026-08-26). See `sources/learn-harness-engineering/PINNED.txt`.
- License: MIT, Copyright (c) 2025 WalkingLab. Full text in `sources/learn-harness-engineering/LICENSE`.
- What is used:
  - `sources/learn-harness-engineering/docs-en/`: verbatim copy of the English course (`docs/en`) kept as the Source for on-demand reading.
  - `sources/learn-harness-engineering/skills/harness-creator/`: verbatim copy of the bundled `harness-creator` skill.
  - `templates/`: `init.sh`, `feature_list.json`, `claude-progress.md`, `CLAUDE.md`, `docs/harness/*` are adapted from `docs/en/resources/templates/` and the `harness-creator` templates. Adaptations: commands moved into `harness.json`, `spec`/`depends_on` fields, Operating Loop moved into a SessionStart hook.
  - `docs/digest/`: our own condensed notes on the course; quotations are short and attributed.
- Update with `scripts/sync-sources.sh`.

## Anthropic — Claude Code documentation

Hook, plugin, skill, and subagent formats follow https://code.claude.com/docs. No content copied.

## mattpocock / skills (MIT)

- Repository: https://github.com/mattpocock/skills
- The `CONTEXT.md` glossary format and the ADR format used in `docs/adr/` follow the `domain-modeling` skill's conventions. No content copied.
