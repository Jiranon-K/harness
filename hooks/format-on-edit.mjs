#!/usr/bin/env node
// PostToolUse (Edit|Write): run the project's per-file formatter from harness.json commands.format.
// {file} is replaced with the edited path. No-op without harness.json or without commands.format.
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { loadDescriptor, projectRoot, readStdinJson } from '../lib/common.mjs'

const payload = await readStdinJson()
const root = projectRoot(payload)
const d = loadDescriptor(root)
if (!d || d._error || !d.commands.format) process.exit(0)

const file = payload?.tool_input?.file_path
if (!file) process.exit(0)
const abs = resolve(root, file)
if (!existsSync(abs)) process.exit(0)
const rel = relative(root, abs)
if (rel.startsWith('..')) process.exit(0) // outside the project

// Skip harness state files and lockfiles; formatters have no business there.
if (/(?:^|[\\/])(?:feature_list\.json|harness\.json|pnpm-lock\.yaml|package-lock\.json|yarn\.lock)$/.test(rel)) {
  process.exit(0)
}

const cmd = d.commands.format.split('{file}').join(quote(abs))
const r = spawnSync(cmd, { cwd: root, shell: true, encoding: 'utf8', timeout: 55_000 })
if (r.status !== 0) {
  const out = (r.stderr || r.stdout || '').trim().slice(0, 2000)
  process.stderr.write(`format hook (${d.commands.format}) failed on ${rel}:\n${out}\n`)
  process.exit(2) // feed the failure back to Claude
}
process.exit(0)

function quote(p) {
  return /[\s"']/.test(p) ? `"${p.replace(/"/g, '\\"')}"` : p
}
