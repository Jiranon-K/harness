# CLAUDE.md — {{project}}

{{description}}

This repository is the system of record. Chat summaries are not state; files are. The harness
plugin injects the Operating Loop and the current verified state at session start; this file holds
only what is specific to this project.

{{harness_block}}

## Invariants

<!-- Hard constraints specific to THIS project. Not style preferences, not how-to. Examples:
- `packages/core` is pure TypeScript: no DOM, no framework imports.
- Secrets never leave the provider the user selected and are never logged.
-->

## Where things live

<!-- Route into the deeper docs. Keep this file under ~60 lines; put knowledge in docs/. -->

| Need | File |
| --- | --- |
| Architecture, package boundaries | `docs/ARCHITECTURE.md` |
| Domain vocabulary, decisions | `CONTEXT.md`, `docs/adr/` |

## Commands

- Start: `{{start}}`
- Verify: `{{verify}}`
