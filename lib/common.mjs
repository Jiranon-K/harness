// Shared helpers for hooks and scripts. Zero dependencies; Node >= 22.
import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

export const DESCRIPTOR = 'harness.json'

/** Read all of stdin as JSON. Hooks receive their payload this way. */
export function readStdinJson() {
  return new Promise((res) => {
    let data = ''
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', (c) => (data += c))
    process.stdin.on('end', () => {
      try {
        res(data.trim() ? JSON.parse(data) : {})
      } catch {
        res({})
      }
    })
    if (process.stdin.isTTY) res({})
  })
}

/** Project root: CLAUDE_PROJECT_DIR when set, else the payload's cwd, else process.cwd(). */
export function projectRoot(payload = {}) {
  return resolve(process.env.CLAUDE_PROJECT_DIR || payload.cwd || process.cwd())
}

/** Load harness.json from root. Returns null when the project has no harness (hooks must no-op). */
export function loadDescriptor(root) {
  const file = join(root, DESCRIPTOR)
  if (!existsSync(file)) return null
  try {
    const d = JSON.parse(readFileSync(file, 'utf8'))
    return { ...withDefaults(d), _file: file }
  } catch (err) {
    return { _error: `harness.json is not valid JSON: ${err.message}`, _file: file }
  }
}

export const DEFAULT_PATHS = {
  progress: 'claude-progress.md',
  features: 'feature_list.json',
  specs: '.scratch',
  harness_docs: 'docs/harness',
}

export function withDefaults(d) {
  return {
    ...d,
    commands: d.commands ?? {},
    paths: { ...DEFAULT_PATHS, ...(d.paths ?? {}) },
    requires: d.requires ?? {},
  }
}

export function readJsonSafe(file) {
  try {
    return { value: JSON.parse(readFileSync(file, 'utf8')) }
  } catch (err) {
    return { error: err.message }
  }
}

export function readTextSafe(file) {
  try {
    return readFileSync(file, 'utf8')
  } catch {
    return null
  }
}

export function mtime(file) {
  try {
    return statSync(file).mtimeMs
  } catch {
    return 0
  }
}

export const FEATURE_STATUSES = ['not_started', 'in_progress', 'blocked', 'passing']

/**
 * Validate a feature list against the harness invariants. Pure; returns a list of problems.
 * `root` is used to check that `spec` paths exist.
 */
export function checkFeatureList(list, root) {
  const problems = []
  if (!list || typeof list !== 'object') return ['feature list is not an object']
  if (!Array.isArray(list.features)) return ['feature list has no "features" array']
  const ids = new Set()
  const byId = new Map()
  for (const f of list.features) byId.set(f.id, f)
  let active = 0
  for (const f of list.features) {
    const tag = f.id ?? '(no id)'
    if (!f.id) problems.push('a feature has no id')
    else if (ids.has(f.id)) problems.push(`duplicate feature id: ${f.id}`)
    ids.add(f.id)
    if (!FEATURE_STATUSES.includes(f.status)) problems.push(`${tag}: invalid status "${f.status}"`)
    if (!Array.isArray(f.verification) || f.verification.length === 0)
      problems.push(`${tag}: verification steps are empty`)
    if (f.status === 'passing' && !(Array.isArray(f.evidence) && f.evidence.length > 0))
      problems.push(`${tag}: status is "passing" but evidence is empty`)
    if (f.status === 'blocked' && !String(f.notes ?? '').trim())
      problems.push(`${tag}: "blocked" without a documented blocker in notes`)
    if (f.status === 'in_progress') {
      active++
      if (f.spec && root && !existsSync(resolve(root, f.spec)))
        problems.push(`${tag}: in_progress but spec "${f.spec}" does not exist`)
      for (const dep of f.depends_on ?? []) {
        const d = byId.get(dep)
        if (!d) problems.push(`${tag}: depends_on unknown feature "${dep}"`)
        else if (d.status !== 'passing')
          problems.push(`${tag}: in_progress while dependency "${dep}" is ${d.status}, not passing`)
      }
    }
    for (const dep of f.depends_on ?? []) if (dep === f.id) problems.push(`${tag}: depends on itself`)
  }
  if (active > 1) problems.push(`${active} features are in_progress; the rule is at most one`)
  return problems
}

/** Short, single-line summary of the feature list for SessionStart. */
export function summarizeFeatures(list) {
  const fs = Array.isArray(list?.features) ? list.features : []
  const count = (s) => fs.filter((f) => f.status === s).length
  const active = fs.find((f) => f.status === 'in_progress')
  const next = fs
    .filter((f) => f.status === 'not_started')
    .sort((a, b) => (a.priority ?? 1e9) - (b.priority ?? 1e9))[0]
  return {
    total: fs.length,
    passing: count('passing'),
    blocked: count('blocked'),
    active,
    next,
  }
}

/** Extract the "Current Verified State" section of a progress log (up to the next H2). */
export function currentVerifiedState(markdown) {
  if (!markdown) return null
  const m = markdown.match(/^## Current Verified State\s*\n([\s\S]*?)(?=^## |\s*$(?![\s\S]))/m)
  return m ? m[1].trim() : null
}

/** Walk up from `start` looking for a file; returns dir or null. */
export function findUp(start, name) {
  let dir = resolve(start)
  for (;;) {
    if (existsSync(join(dir, name))) return dir
    const parent = dirname(dir)
    if (parent === dir) return null
    dir = parent
  }
}
