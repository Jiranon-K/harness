#!/usr/bin/env node
// SessionStart: recover durable state into the fresh context window.
// No-op when the project has no harness.json. Never fails the session.
import { execSync } from 'node:child_process'
import { join } from 'node:path'
import {
  currentVerifiedState,
  loadDescriptor,
  mtime,
  projectRoot,
  readJsonSafe,
  readStdinJson,
  readTextSafe,
  summarizeFeatures,
} from '../lib/common.mjs'

const payload = await readStdinJson()
const root = projectRoot(payload)
const d = loadDescriptor(root)
if (!d) process.exit(0)

const lines = []
lines.push(`# Harness: ${d.project ?? 'project'} (harness ${d.harness_version ?? '?'})`)
if (d._error) {
  lines.push(`!! ${d._error}. Fix harness.json before doing anything else.`)
  emit(lines)
}

// The Operating Loop lives here, once, instead of being copied into every project's CLAUDE.md.
lines.push('')
lines.push('## Operating Loop (this session)')
lines.push(`1. You are in \`${root}\`. Confirm with \`pwd\` before writing.`)
lines.push(
  `2. The state below comes from \`${d.paths.progress}\` and \`${d.paths.features}\`. Read them in full only if the summary is not enough.`,
)
lines.push(
  `3. Run \`./init.sh\` (install: \`${d.commands.install ?? 'n/a'}\`, verify: \`${d.commands.verify ?? 'n/a'}\`). If the baseline is red, fix that first; never stack feature work on a broken base.`,
)
lines.push('4. Work on exactly one feature (`in_progress`) until it is verified with evidence or documented as `blocked`.')
lines.push(
  '5. Before you stop: run `/harness:end` (progress log, feature state, clean-state checklist, commit when safe). A Stop gate validates the feature list; do not weaken it.',
)

// Progress log: Current Verified State
const progressFile = join(root, d.paths.progress)
const progress = readTextSafe(progressFile)
lines.push('')
lines.push(`## Current Verified State (${d.paths.progress})`)
if (progress == null) lines.push('!! progress log missing. Run `/harness:init` or create it before working.')
else {
  const cvs = currentVerifiedState(progress)
  lines.push(cvs ?? '(no "## Current Verified State" section found)')
  const ageDays = (Date.now() - mtime(progressFile)) / 86_400_000
  if (ageDays > 1) {
    lines.push('')
    lines.push(
      `_Progress log last touched ${ageDays.toFixed(0)} day(s) ago; the baseline has not been re-verified since. Run ./init.sh before trusting it._`,
    )
  }
}

// Feature list summary
const feat = readJsonSafe(join(root, d.paths.features))
lines.push('')
lines.push(`## Features (${d.paths.features})`)
if (feat.error) lines.push(`!! ${d.paths.features}: ${feat.error}`)
else {
  const s = summarizeFeatures(feat.value)
  lines.push(`${s.passing}/${s.total} passing, ${s.blocked} blocked.`)
  if (s.active) {
    lines.push(
      `Active (in_progress): **${s.active.id}** — ${s.active.title}${s.active.spec ? ` (spec: ${s.active.spec})` : ''}`,
    )
  } else if (s.next) {
    lines.push(
      `No active feature. Highest-priority unfinished: **${s.next.id}** — ${s.next.title}. Set it to in_progress before working on it.`,
    )
  } else lines.push('No unfinished features.')
}

// Recent commits and working-tree state
try {
  const opts = { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }
  const log = execSync('git log --oneline -5', opts).toString().trim()
  if (log) {
    lines.push('')
    lines.push('## Recent commits')
    lines.push('```')
    lines.push(log)
    lines.push('```')
  }
  const dirty = execSync('git status --porcelain', opts).toString().trim()
  if (dirty) {
    lines.push('')
    lines.push(`_Working tree has ${dirty.split('\n').length} uncommitted change(s). Understand them before editing._`)
  }
} catch {
  /* not a git repo, or git missing */
}

emit(lines)

function emit(ls) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: ls.join('\n') },
    }),
  )
  process.exit(0)
}
