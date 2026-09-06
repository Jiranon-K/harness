# harness

A personal, installable engineering harness for Claude Code: the constraints that live *outside the
model* so that work in any repository starts consistently, stays in scope, proves completion, and
resumes across sessions.

## Language

### Layers

**Runtime**:
The part of the harness delivered as a Claude Code plugin: skills, slash commands, hooks, and
subagents. Present in every project the plugin is enabled in; never copied into a repository.
_Avoid_: plugin (when meaning the whole harness), core, engine

**Scaffold**:
The set of files written into a project and committed with it: `CLAUDE.md`, `harness.json`,
`init.sh`, `feature_list.json`, the progress log, and `docs/harness/*`.
_Avoid_: template (reserved for the source a Scaffold is generated from), boilerplate, starter

**Profile**:
The user layer: `~/.claude/CLAUDE.md` and the harness-owned entries in `~/.claude/settings.json`.
Applies to every project on this machine.
_Avoid_: global config, user settings, preferences

**Template**:
A file in the harness repository from which a Scaffold file is generated.

### Enforcement

**Gate**:
A deterministic check run by a hook that can block the agent. A Gate does not depend on the model
choosing to comply.
_Avoid_: check, guard, validation (when the hook is meant)

**Rule**:
A constraint written in an instruction file. The model is asked to follow it; nothing enforces it.
_Avoid_: invariant (when a Gate is meant), policy

**Operating Loop**:
The fixed sequence a session follows: confirm root, recover state, pick one Feature, verify
baseline, work, hand off.

### State

**Feature**:
One entry in `feature_list.json`: a user-visible behaviour with a status, verification steps,
evidence, and optionally a path to its Spec. At most one Feature is `in_progress` at a time.
_Avoid_: task, ticket (reserved for `.scratch/` issue files), story

**Evidence**:
The recorded proof that a Feature's verification actually ran: the command and its result. A Feature
cannot be `passing` without it.
_Avoid_: proof, result, log

**Spec**:
The design document for one Feature, kept under `.scratch/<feature>/` by the agent-skills flow. A
Feature points to it via its `spec` field.

**Progress Log**:
The repository-local session journal read at session start and updated before handoff.
_Avoid_: changelog, notes, memory

**Handoff**:
The compact end-of-session note that lets a fresh session continue with no chat history.
_Avoid_: summary, recap

### Knowledge

**Digest**:
The harness's own condensed account of the harness-engineering course: the principles, the
failure-mode map, and the checklists an agent actually reads.
_Avoid_: notes, summary, docs

**Source**:
A vendored, pinned copy of an upstream reference kept in the repository for on-demand reading. Never
installed into a project.
_Avoid_: reference, upstream, vendor

**Descriptor**:
`harness.json`: the machine-readable statement of a project's commands, paths, and harness version
that the Runtime, `init.sh`, and the Scaffold all read.
_Avoid_: config, manifest, settings
