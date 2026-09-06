# Harness Engineering — Digest

Condensed from the course *Learn Harness Engineering* (walkinglabs, MIT; pinned copy under
`sources/learn-harness-engineering/`). This is the version an agent should read. Every section names
the source file for the full argument. Our own additions are marked **[harness]**.

## 1. What a harness is

A harness is everything around the model that determines whether capable models actually finish
work: system prompt, instruction files, tools, environment, state files, verification commands,
hooks, evaluators. The core loop (call model → run tool → observe → call again) is a skeleton; the
systems *around* the loop decide reliability. Changing any harness piece changes the effective agent.
*Source: lectures 1–2; `harness-designs/claude-code/index.md` "In One Sentence".*

**Five subsystems** (the course's frame): Instructions · Tools · Environment · State · Feedback.
The bundled `harness-creator` skill uses a five-part variant tuned for repositories: Instructions ·
State · Verification · Scope · Lifecycle. **[harness]** We score the second set in `/harness:audit`.

## 2. Why capable agents fail (the failure-mode map)

| Failure mode | Looks like | Primary fix | Artifact |
| --- | --- | --- | --- |
| Cold-start confusion | new session spends its time rediscovering setup and status | repository as system of record | progress log |
| Scope sprawl | several features started, none finished | restrict active scope | feature list (one `in_progress`) |
| Premature completion | "done" after edits, before runnable proof | bind completion to evidence | clean-state checklist, Stop gate |
| Fragile startup | every session re-learns how to boot | standardize setup + verification | `init.sh` |
| Weak handoff | next session cannot tell what is verified, broken, next | explicit handoff | session handoff |
| Subjective review | quality depends on taste or memory | fixed scoring categories | evaluator rubric |

Operating principle: add the *smallest* artifact that addresses the observed failure. Do not fix
reliability by dumping text into one global instruction file.
*Source: `resources/reference/method-map.md`; lectures 5, 7, 9.*

## 3. The repository is the system of record

Every session starts with a fresh context window. Anything that lives only in chat is gone. So:
write conclusions to files in the session they are reached; keep progress, feature state, and
decisions as repository artifacts; make them discoverable with short files and clear names; keep
one truth per fact (delete stale copies).
*Source: lecture 3; `openai-advanced/sops/encode-knowledge-into-repo.md`.*

Success test for an initialized repo: a fresh session with no chat history can answer *what this
repo does, how to start it, how to verify it, what is unfinished, what the next best step is.*
*Source: `resources/reference/initializer-agent-playbook.md`.*

## 4. One giant instruction file fails

A single encyclopedia-style instruction file cannot be checked for coverage, freshness or ownership,
so it drifts. Codex's answer: **AGENTS.md is a directory page** of roughly 100 lines that routes
into `docs/`; **enforce invariants, don't micromanage implementation**. Claude Code's answer:
**layered scopes** (org → user → project → local; subdirectory files load on demand) so instructions
load close to where they apply.
*Source: lecture 4; `harness-designs/codex/index.md`; `harness-designs/claude-code/index.md`.*

**[harness]** Our project `CLAUDE.md` targets ~60 lines: a routing table, project invariants,
commands. The Operating Loop is not in it (ADR-0004); shared invariants live in the Profile.

## 5. The Operating Loop

Start: `pwd` → read progress log → read feature list → `git log --oneline -5` → run `init.sh` →
baseline smoke → if red, fix first → pick the highest-priority unfinished feature → work only on it
until verified or explicitly blocked.
End (mirror): record progress → update feature state → handoff if needed → commit safe work → leave a
clean restart path.
*Source: `resources/reference/coding-agent-startup-flow.md`.*

**[harness]** The SessionStart hook injects the start half plus live state; `/harness:end` runs the
end half; the Stop gate enforces the feature-state invariants.

## 6. Feature lists are harness primitives

A machine-readable feature list with `status ∈ {not_started, in_progress, blocked, passing}`,
runnable `verification` steps, and recorded `evidence`. Rules: exactly one `in_progress`; `passing`
requires evidence; never rewrite the list to hide unfinished work; never weaken verification to make
work look complete.
*Source: lecture 8; `resources/templates/feature_list.json`; `lecture-08/code/pass-gate-policy.md`.*

**[harness]** Added `spec` (path to the feature's design under `.scratch/`) and `depends_on`
(must be `passing` before this becomes `in_progress`). Both are checked by the Stop gate.

## 7. Agents declare victory too early

Anthropic's harness article observed agents that "confidently praised their work". The fix is not a
plea in the prompt but a **deterministic check outside the model**: Claude Code's `Stop` and
`PostToolUse` hooks run checks and feed results back; the one doing the work is separated from the
one checking it.
*Source: lecture 9; `harness-designs/claude-code/index.md` "Feedback and Verification".*

**[harness]** Gate vs Rule (CONTEXT.md). Our Gates: stop gate, format hook, git guard. When review
feedback recurs, promote the Rule into a Gate.

## 8. End-to-end testing changes results

Verification only counts when the complete flow works. Put verification commands in the
specification (the repo), make them a default component of the harness, and turn repeated review
feedback into a mechanical rule or linter.
*Source: lecture 10; `lecture-10/code/review-feedback-to-rule.md`.*

## 9. Observability and clean state

Logs are append-only and replayable; sessions leave a good handoff because the storage layer makes
it cheap, not because memory is good. Every session ends in a clean state: startup still works,
verification still runs, progress recorded, feature state honest, no half-finished step undocumented.
*Source: lectures 11–12; `resources/templates/clean-state-checklist.md`.*

## 10. Loops and evaluators (maker / checker)

Separate the **maker** (does the work) from the **checker** (scores it with a fixed rubric in a
fresh context). Out of the box agents are poor self-judges: they list problems then approve. Tune
the rubric against human judgment over 3–5 rounds and record each change. Keep a **quality
document** that grades the codebase over time, distinct from the per-session rubric.
*Source: lectures 13–14; `resources/templates/evaluator-rubric.md`, `quality-document.md`.*

**[harness]** `harness-evaluator` subagent + default rubric in `agents/`; project override in
`docs/harness/evaluator-rubric.md`, created lazily when tuning starts.

## 11. Claude Code as a harness (what we adopt)

1. Layer instructions by scope. 2. Compaction lossless before lossy. 3. Hooks for deterministic
checks. 4. Isolate subagent context. 5. Append-oriented, replayable session storage.
Separation of responsibilities: CLAUDE.md = *what*, Skills = *how*, MCP = *where to connect*,
hooks = *when to enforce*. Mixing these layers leaks context.
*Source: `harness-designs/claude-code/index.md`.*

**[harness]** This is why the harness (what/when) is a separate repository from agent-skills (how): ADR-0001.

## 12. Codex as a harness (what we adopt)

AGENTS.md as directory page; invariants not micromanagement; worktree isolation per task;
verification commands in the spec; context strategy **Write–Select–Compress–Isolate**.
*Source: `harness-designs/codex/index.md`.*

## 13. Simplify as models improve

Every harness component encodes an assumption about what the model cannot do. Periodically: take a
quality snapshot, remove one component, run the benchmark tasks, snapshot again. If grades held, the
component was overhead.
*Source: `resources/templates/index.md` "Harness simplification tie-in".*

## Where the full material lives

`sources/learn-harness-engineering/docs-en/`: `lectures/` (14), `harness-designs/` (Pi, Claude Code,
Codex, DeepSeek), `resources/templates/`, `resources/reference/`, `resources/openai-advanced/`
(advanced repo skeleton and SOPs), `projects/` (8 exercises). The bundled `harness-creator` skill is
under `sources/learn-harness-engineering/skills/`.
