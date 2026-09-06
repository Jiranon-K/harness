#!/usr/bin/env node
// Audit a project's harness: five subsystems, invariants, and drift against the current templates.
//
//   node scripts/validate.mjs --target DIR [--json] [--quiet] [--min-score N]
//
// Exit 1 when any invariant fails or the score is below --min-score (default 70).
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { checkFeatureList, loadDescriptor, readJsonSafe, readTextSafe } from '../lib/common.mjs'

const HARNESS_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const VERSION = JSON.parse(readFileSync(join(HARNESS_ROOT, 'package.json'), 'utf8')).version

const args = parseArgs(process.argv.slice(2))
const root = resolve(args.target ?? process.cwd())
const minScore = Number(args.minScore ?? 70)

export function audit(root) {
  const findings = [] // { level: 'fail'|'warn'|'info', subsystem, message }
  const score = { instructions: 0, state: 0, verification: 0, scope: 0, lifecycle: 0 } // each 0..20
  const add = (level, subsystem, message) => findings.push({ level, subsystem, message })
  const has = (f) => existsSync(join(root, f))

  const d = loadDescriptor(root)
  if (!d) {
    add('fail', 'verification', 'harness.json missing: this project has no harness. Run /harness:init.')
    return { root, harness_version: null, current_version: VERSION, score, overall: 0, findings }
  }
  if (d._error) add('fail', 'verification', d._error)

  // ---- instructions (CLAUDE.md as a directory page)
  const claude = readTextSafe(join(root, 'CLAUDE.md'))
  if (!claude) add('fail', 'instructions', 'CLAUDE.md missing')
  else {
    score.instructions += 8
    const lines = claude.split('\n').length
    if (lines > 120) add('warn', 'instructions', `CLAUDE.md is ${lines} lines; the target is a ~60-line directory page. Move knowledge into docs/ and link it.`)
    else score.instructions += 4
    if (/<!-- harness:start -->/.test(claude)) score.instructions += 4
    else add('warn', 'instructions', 'CLAUDE.md has no harness block; /harness:init will append one.')
    if (/pwd|Operating loop|Operating Loop/i.test(claude) && /init\.sh/.test(claude) && /claude-progress|progress log/i.test(claude) && /## Operating/i.test(claude))
      add('info', 'instructions', 'CLAUDE.md still contains the Operating Loop; the SessionStart hook injects it now, so the copy can go.')
    else score.instructions += 4
  }

  // ---- state (feature list + progress log)
  const featPath = join(root, d.paths.features)
  const feat = readJsonSafe(featPath)
  if (feat.error) add('fail', 'state', `${d.paths.features}: ${feat.error}`)
  else {
    score.state += 6
    const problems = checkFeatureList(feat.value, root)
    for (const p of problems) add('fail', 'state', `${d.paths.features}: ${p}`)
    if (!problems.length) score.state += 6
    const fs = feat.value.features ?? []
    if (fs.some((f) => f.id === 'example-001')) add('warn', 'state', 'feature_list.json still contains the example feature.')
    if (fs.length && fs.every((f) => f.status === 'passing')) add('info', 'state', 'every feature is passing; add the next slice or archive the list.')
  }
  const progress = readTextSafe(join(root, d.paths.progress))
  if (!progress) add('fail', 'state', `${d.paths.progress} missing`)
  else {
    score.state += 4
    if (!/## Current Verified State/.test(progress)) add('warn', 'state', `${d.paths.progress} has no "## Current Verified State" section; SessionStart cannot summarise it.`)
    else score.state += 2
    if (/not yet verified/.test(progress)) add('info', 'state', 'progress log says the baseline is not yet verified. Run ./init.sh and record the result.')
    else score.state += 2
  }

  // ---- verification (descriptor commands + init.sh)
  if (!d._error) {
    score.verification += 4
    if (d.commands.verify) score.verification += 8
    else add('fail', 'verification', 'harness.json has no commands.verify; nothing can gate completion.')
    if (d.commands.install) score.verification += 2
    if (d.commands.format) score.verification += 2
    else add('info', 'verification', 'no commands.format: the format hook is disabled for this project.')
  }
  if (!has('init.sh')) add('fail', 'verification', 'init.sh missing')
  else {
    score.verification += 4
    const mine = sha(readTextSafe(join(root, 'init.sh')))
    const tmpl = sha(readTextSafe(join(HARNESS_ROOT, 'templates', 'init.sh')))
    if (mine !== tmpl) add('warn', 'verification', 'init.sh differs from the harness template. It is harness-owned; project values belong in harness.json. Diff it before replacing.')
  }

  // ---- scope (specs linked, dependencies)
  if (!feat.error) {
    const fs = feat.value.features ?? []
    score.scope += 8
    const withSpec = fs.filter((f) => f.spec).length
    if (fs.length && withSpec === 0) add('info', 'scope', 'no feature links a spec; add `spec` paths as features get designed.')
    else score.scope += 4
    const active = fs.filter((f) => f.status === 'in_progress')
    if (active.length === 1) score.scope += 4
    else if (active.length === 0) add('info', 'scope', 'no feature is in_progress.')
    const vague = fs.filter((f) => (f.verification ?? []).some((v) => /^(test|verify|check)( it)?\.?$/i.test(v.trim())))
    if (vague.length) add('warn', 'scope', `${vague.length} feature(s) have vague verification steps (e.g. "test it"); make them runnable.`)
    else score.scope += 4
  }

  // ---- lifecycle (handoff, checklist, quality doc)
  for (const [f, pts] of [['session-handoff.md', 6], ['clean-state-checklist.md', 7], ['quality-document.md', 7]]) {
    if (has(join(d.paths.harness_docs, f))) score.lifecycle += pts
    else add('warn', 'lifecycle', `${d.paths.harness_docs}/${f} missing`)
  }

  // ---- drift
  if (d.harness_version && d.harness_version !== VERSION) {
    add('warn', 'lifecycle', `scaffolded with harness ${d.harness_version}; current templates are ${VERSION}. Review the changelog, then re-run /harness:init --force on harness-owned files if wanted.`)
  }
  const ctx = readTextSafe(join(root, '.agent', 'context.md'))
  if (ctx && ctx.startsWith('<!-- GENERATED') && !ctx.includes(`harness_version**: ${d.harness_version}`))
    add('info', 'lifecycle', '.agent/context.md was generated by an older harness; run /harness:init --refresh-context.')

  const overall = Object.values(score).reduce((a, b) => a + b, 0)
  return { root, harness_version: d.harness_version ?? null, current_version: VERSION, score, overall, findings }
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` || process.argv[1].endsWith('validate.mjs')) {
  const r = audit(root)
  const fails = r.findings.filter((f) => f.level === 'fail')
  if (args.json) console.log(JSON.stringify(r, null, 2))
  else if (!args.quiet || fails.length || r.overall < minScore) {
    console.log(`harness audit: ${r.root}`)
    console.log(`scaffolded: ${r.harness_version ?? 'none'} · templates: ${r.current_version} · score ${r.overall}/100`)
    for (const [k, v] of Object.entries(r.score)) console.log(`  ${k.padEnd(13)} ${String(v).padStart(2)}/20`)
    const order = { fail: 0, warn: 1, info: 2 }
    for (const f of r.findings.sort((a, b) => order[a.level] - order[b.level])) console.log(`  ${f.level.toUpperCase().padEnd(4)} [${f.subsystem}] ${f.message}`)
    const lowest = Object.entries(r.score).sort((a, b) => a[1] - b[1])[0]
    console.log(`\nlowest subsystem: ${lowest[0]} (${lowest[1]}/20). Fix FAIL items first; they are gates, not suggestions.`)
  } else console.log(`harness audit ok: ${r.overall}/100`)
  process.exit(fails.length || r.overall < minScore ? 1 : 0)
}

function sha(s) {
  return createHash('sha256').update(String(s ?? '').replace(/\r\n/g, '\n')).digest('hex')
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
    else if (argv[i + 1] && !argv[i + 1].startsWith('--')) a[key] = argv[++i]
    else a[key] = true
  }
  return a
}
