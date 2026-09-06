#!/usr/bin/env node
// Scaffold: write harness files into a project. Never overwrites without --force.
//
//   node scripts/scaffold.mjs --target DIR [--dry-run] [--force] [--json]
//        [--project NAME] [--install CMD] [--verify CMD] [--start CMD] [--format CMD]
//        [--requires JSON] [--rubric] [--agents-md] [--refresh-context] [--no-agent-context]
//
// --refresh-context regenerates only .agent/context.md from an existing harness.json.
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadDescriptor } from '../lib/common.mjs'
import { detectProject } from '../lib/detect.mjs'

const HARNESS_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const TEMPLATES = join(HARNESS_ROOT, 'templates')
const VERSION = JSON.parse(readFileSync(join(HARNESS_ROOT, 'package.json'), 'utf8')).version

const args = parseArgs(process.argv.slice(2))
if (args.help) {
  console.log(readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(1, 9).join('\n').replace(/^\/\/ ?/gm, ''))
  process.exit(0)
}
const root = resolve(args.target ?? process.cwd())
if (!existsSync(root)) die(`target does not exist: ${root}`)
const dry = !!args.dryRun
const force = !!args.force
const today = new Date().toISOString().slice(0, 10)
const results = []

// ---------------------------------------------------------------- context-only refresh
if (args.refreshContext) {
  const d = loadDescriptor(root)
  if (!d || d._error) die(d?._error ?? 'harness.json not found; run a full scaffold first')
  const det = detectProject(root)
  writeAgentContext(d, det)
  finish()
}

// ---------------------------------------------------------------- detect + merge overrides
const det = detectProject(root)
const existing = loadDescriptor(root)
const vars = {
  harness_version: VERSION,
  project: args.project ?? existing?.project ?? det.project,
  description: args.description ?? existing?.description ?? det.description ?? '',
  install: args.install ?? existing?.commands?.install ?? det.commands.install,
  verify: args.verify ?? existing?.commands?.verify ?? det.commands.verify,
  start: args.start ?? existing?.commands?.start ?? det.commands.start,
  format: args.format ?? existing?.commands?.format ?? det.commands.format,
  test: args.test ?? existing?.commands?.test ?? det.commands.test,
  requires: JSON.stringify(existing?.requires && Object.keys(existing.requires).length ? existing.requires : det.requires),
  date: today,
  root: root.replace(/\\/g, '/'),
  stack: det.stack,
  package_manager: det.package_manager || 'n/a',
  specs: existing?.paths?.specs ?? '.scratch',
}
vars.harness_block = render('CLAUDE-block.md', vars).trim()
if (args.requires) vars.requires = JSON.stringify(JSON.parse(args.requires))

// ---------------------------------------------------------------- files
// harness.json: render, then drop empty command keys so the descriptor stays honest.
{
  const rendered = JSON.parse(render('harness.json', vars))
  for (const k of Object.keys(rendered.commands)) if (!rendered.commands[k]) delete rendered.commands[k]
  if (vars.test) rendered.commands.test = vars.test
  if (!rendered.description) delete rendered.description
  if (args.agentsMd) rendered.agents_md = true
  write('harness.json', `${JSON.stringify(rendered, null, 2)}\n`)
}
write('init.sh', read('init.sh'), { exec: true })
write('feature_list.json', render('feature_list.json', vars))
write('claude-progress.md', render('claude-progress.md', vars))
for (const f of ['session-handoff.md', 'clean-state-checklist.md', 'quality-document.md']) {
  write(`docs/harness/${f}`, render(`docs/harness/${f}`, vars))
}
if (args.rubric) write('docs/harness/evaluator-rubric.md', render('docs/harness/evaluator-rubric.md', vars))
if (args.agentsMd) write('AGENTS.md', render('AGENTS.md', vars))

// CLAUDE.md: new file from template, or insert/refresh the harness block in an existing one.
{
  const target = join(root, 'CLAUDE.md')
  if (!existsSync(target)) write('CLAUDE.md', render('CLAUDE.md', vars))
  else {
    const current = readFileSync(target, 'utf8')
    const block = vars.harness_block
    const re = /<!-- harness:start -->[\s\S]*?<!-- harness:end -->/
    const m = current.match(re)
    if (!m) put(target, 'CLAUDE.md', `${current.replace(/\s*$/, '')}\n\n${block}\n`, { status: 'block-appended' })
    else if (m[0] === block) results.push({ path: 'CLAUDE.md', status: 'unchanged' })
    else if (!force)
      results.push({ path: 'CLAUDE.md', status: 'block-stale', reason: 'harness block differs from the current template; pass --force to refresh it' })
    else put(target, 'CLAUDE.md', current.replace(re, block), { status: 'block-refreshed' })
  }
}

if (!args.noAgentContext) writeAgentContext({ ...vars, commands: vars, paths: { specs: vars.specs } }, det)
finish()

// ---------------------------------------------------------------- helpers
function writeAgentContext(d, det) {
  const v = {
    project: d.project,
    description: d.description ?? '',
    stack: det.stack,
    package_manager: det.package_manager || 'n/a',
    verify: d.commands?.verify ?? '',
    test: d.commands?.test ?? d.commands?.verify ?? '',
    install: d.commands?.install ?? '',
    start: d.commands?.start ?? '',
    format: d.commands?.format ?? '',
    specs: d.paths?.specs ?? '.scratch',
    harness_version: d.harness_version ?? VERSION,
  }
  const target = join(root, '.agent', 'context.md')
  const content = render('agent-context.md', v)
  const current = existsSync(target) ? readFileSync(target, 'utf8') : null
  if (current !== null && !current.startsWith('<!-- GENERATED by /harness:init') && !force) {
    results.push({ path: '.agent/context.md', status: 'skipped', reason: 'hand-written file; pass --force to replace' })
    return
  }
  if (current === content) results.push({ path: '.agent/context.md', status: 'unchanged' })
  else put(target, '.agent/context.md', content, { status: current === null ? 'written' : 'regenerated' })
}

function read(name) {
  return readFileSync(join(TEMPLATES, name), 'utf8')
}
function render(name, v) {
  let s = read(name)
  for (const [k, val] of Object.entries(v)) s = s.split(`{{${k}}}`).join(String(val ?? ''))
  return s
}
function write(rel, content, { exec = false } = {}) {
  const target = join(root, rel)
  if (existsSync(target) && !force) {
    results.push({ path: rel, status: 'skipped', reason: 'exists' })
    return
  }
  put(target, rel, content, { status: existsSync(target) ? 'overwritten' : 'written', exec })
}
function put(target, rel, content, { status, exec = false }) {
  if (!dry) {
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, content, 'utf8')
    if (exec) {
      try {
        chmodSync(target, 0o755)
      } catch {
        /* windows */
      }
    }
  }
  results.push({ path: rel, status: dry ? `would-${status}` : status })
}
function finish() {
  if (args.json) {
    console.log(JSON.stringify({ target: root, harness_version: VERSION, detected: det, results }, null, 2))
  } else {
    console.log(`harness ${VERSION} → ${root}${dry ? ' (dry run)' : ''}`)
    console.log(`detected: ${det.stack}${det.package_manager ? ` / ${det.package_manager}` : ''}`)
    for (const r of results) console.log(`  ${pad(r.status, 16)} ${r.path}${r.reason ? `  (${r.reason})` : ''}`)
    for (const n of det.notes ?? []) console.log(`  note: ${n}`)
    const written = results.filter((r) => /written|appended|refreshed|regenerated|overwritten/.test(r.status)).length
    if (!dry && written) console.log('\nNext: review harness.json, replace example-001 in feature_list.json, run ./init.sh.')
  }
  process.exit(0)
}
function pad(s, n) {
  return String(s).padEnd(n)
}
function die(msg) {
  console.error(`scaffold: ${msg}`)
  process.exit(1)
}
function parseArgs(argv) {
  const a = {}
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i]
    if (!t.startsWith('--')) {
      a.target ??= t
      continue
    }
    const [k, inline] = t.slice(2).split('=', 2)
    const key = k.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
    if (inline !== undefined) a[key] = inline
    else if (argv[i + 1] !== undefined && !argv[i + 1].startsWith('--')) a[key] = argv[++i]
    else a[key] = true
  }
  return a
}
