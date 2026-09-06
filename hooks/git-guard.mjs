#!/usr/bin/env node
// PreToolUse (Bash): deny destructive git commands. Runs in every project, harness or not:
// losing history is never project-specific. --force-with-lease is allowed.
import { readStdinJson } from '../lib/common.mjs'
import { destructiveGitReason } from '../lib/git-rules.mjs'

const payload = await readStdinJson()
const reason = destructiveGitReason(payload?.tool_input?.command ?? '')
if (reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: `harness git guard: ${reason}. If the user explicitly wants this, they run it themselves.`,
      },
    }),
  )
}
process.exit(0)
