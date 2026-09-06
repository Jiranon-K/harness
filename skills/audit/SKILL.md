---
name: audit
description: Audit the harness in the current repository — score the five subsystems (instructions, state, verification, scope, lifecycle), check feature-list invariants, and report drift against the current harness templates. Use for "audit the harness", "is the harness healthy", "harness score", or after a harness upgrade.
disable-model-invocation: true
argument-hint: "[--min-score N]"
---

# /harness:audit

Deterministic first, judgment second. Run the validator, then read the repository to explain the
findings and propose the two or three changes that matter most.

## Steps

1. Run the validator from the repository root:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/validate.mjs" --target "$PWD" $ARGUMENTS
   ```

2. Report the five scores and every `FAIL`. FAIL items are the same invariants the Stop gate
   enforces (one `in_progress`, evidence for `passing`, documented blockers, real specs, met
   dependencies, a `verify` command); they are not suggestions.

3. For the lowest-scoring subsystem, read the relevant files and say what concretely would raise
   it. Follow the method map: add the *smallest* artifact that addresses an observed failure mode.
   Do not propose dumping more text into CLAUDE.md.

   | Failure mode observed | Smallest fix |
   | --- | --- |
   | sessions re-derive setup | `harness.json` commands + `init.sh` (verification) |
   | several features half-done | one `in_progress`, `depends_on`, `spec` links (scope) |
   | "done" before proof | evidence entries with command + result (state) |
   | next session cannot tell what is verified | progress log Current Verified State, handoff (lifecycle) |
   | CLAUDE.md is an encyclopedia | move knowledge to `docs/`, keep a routing table (instructions) |

4. **Drift.** If the validator reports the project was scaffolded with an older harness version, or
   that `init.sh` differs from the template, show the diff before proposing a refresh:

   ```bash
   diff "${CLAUDE_PLUGIN_ROOT}/templates/init.sh" init.sh
   ```

   Refreshing is the user's call. `/harness:init --force` replaces harness-owned files only.

5. Do not "fix" the state to make the audit pass. If the feature list is wrong about reality,
   correct it to match reality and say what was wrong.
