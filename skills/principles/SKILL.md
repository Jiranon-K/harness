---
name: principles
description: Harness-engineering principles for making coding agents reliable — five subsystems, repository as system of record, one active feature, evidence before done, deterministic gates over prompted rules, session handoff. Use when designing or changing CLAUDE.md, hooks, feature lists, progress logs, or when an agent keeps forgetting context, overreaching, or declaring victory early.
---

# Harness principles

The harness is everything outside the model weights that shapes the agent's behavior. The same
model performs an order of magnitude differently in different harnesses. These are the rules this
harness is built on; the full account with sources is in the Digest.

## The five subsystems

| Subsystem | Question it answers | This harness's artifact |
| --- | --- | --- |
| Instructions | what must hold | `CLAUDE.md` (routing + invariants), Profile |
| State | where are we | `feature_list.json`, progress log |
| Verification | how do we know | `harness.json` commands, `init.sh`, evidence |
| Scope | what is in play | one `in_progress`, `depends_on`, `spec` |
| Lifecycle | how do sessions connect | SessionStart hook, `/harness:end`, handoff, Stop gate |

## Rules

1. **The repository is the system of record.** Anything that lives only in chat is lost at the next
   session. Write conclusions into files in the same session they are reached.
2. **CLAUDE.md is a directory page, not an encyclopedia.** Roughly 60 lines: routing table plus
   inviolable invariants plus verification commands. Knowledge goes in `docs/` and is loaded when needed.
3. **Enforce invariants; do not micromanage implementation.** Say what must never be violated and
   how to verify; leave the how to the model.
4. **One active feature.** Overreach and under-finish are the same failure. `in_progress` is
   singular; dependencies must be `passing` first.
5. **Done means evidence.** A feature is `passing` only when every verification step ran and the
   command plus result is recorded. Agents confidently praise their own work; do not trust the claim.
6. **Gates beat Rules.** A Rule is text the model may ignore; a Gate is a hook that blocks. Whenever
   the same review feedback recurs, promote it from Rule to Gate (a hook, a lint, a test).
7. **Fix the baseline first.** Never stack feature work on a red `init.sh`.
8. **Every session ends with a handoff.** Progress log, feature state, next best step, commit when
   safe. The next session must be able to continue from repo artifacts alone.
9. **Add the smallest artifact that fixes the observed failure.** Do not solve reliability by
   growing a global instruction file.
10. **Simplify as models improve.** Every harness component encodes an assumption about what the
    model cannot do. Periodically remove one, run the benchmark, and keep it only if quality dropped.

## Where to read more

- Digest (this harness's condensed course notes): `${CLAUDE_PLUGIN_ROOT}/docs/digest/en.md` (Thai: `th.md`)
- Vendored Source, pinned: `${CLAUDE_PLUGIN_ROOT}/sources/learn-harness-engineering/docs-en/`
  - method map: `resources/reference/method-map.md`
  - Claude Code breakdown: `harness-designs/claude-code/index.md`
  - Codex breakdown (AGENTS.md as directory page): `harness-designs/codex/index.md`
  - lectures 1–14: `lectures/`
