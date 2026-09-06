import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { test } from 'node:test'

const ROOT = resolve(import.meta.dirname, '..')
const run = (hook, payload, root) =>
  spawnSync(process.execPath, [join(ROOT, 'hooks', hook)], {
    input: JSON.stringify(payload),
    encoding: 'utf8',
    env: { ...process.env, CLAUDE_PROJECT_DIR: root },
  })

function project({ features, progress = '# Progress\n\n## Current Verified State\n\n- ok\n' } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'harness-proj-'))
  writeFileSync(join(root, 'harness.json'), JSON.stringify({ harness_version: '0.1.0', project: 'p', commands: { verify: 'true' } }))
  if (features) writeFileSync(join(root, 'feature_list.json'), JSON.stringify(features))
  writeFileSync(join(root, 'claude-progress.md'), progress)
  return root
}

test('every hook is a no-op in a project without harness.json', () => {
  const bare = mkdtempSync(join(tmpdir(), 'harness-bare-'))
  for (const h of ['session-start.mjs', 'stop-gate.mjs', 'format-on-edit.mjs']) {
    const r = run(h, {}, bare)
    assert.equal(r.status, 0, `${h}: ${r.stderr}`)
    assert.equal(r.stdout, '', `${h} should print nothing`)
  }
})

test('stop-gate blocks a passing feature without evidence and lets a clean list through', () => {
  const bad = project({ features: { features: [{ id: 'a-001', status: 'passing', verification: ['x'], evidence: [] }] } })
  const r1 = run('stop-gate.mjs', {}, bad)
  assert.equal(r1.status, 2)
  assert.match(r1.stderr, /evidence is empty/)

  const good = project({ features: { features: [{ id: 'a-001', status: 'passing', verification: ['x'], evidence: ['ran x: ok'] }] } })
  const r2 = run('stop-gate.mjs', {}, good)
  assert.equal(r2.status, 0, r2.stderr)
})

test('stop-gate respects stop_hook_active to avoid loops', () => {
  const bad = project({ features: { features: [{ id: 'a-001', status: 'passing', verification: ['x'], evidence: [] }] } })
  assert.equal(run('stop-gate.mjs', { stop_hook_active: true }, bad).status, 0)
})

test('stop-gate fails when the feature list is missing', () => {
  const root = project()
  const r = run('stop-gate.mjs', {}, root)
  assert.equal(r.status, 2)
  assert.match(r.stderr, /missing or not valid JSON/)
})

test('session-start injects loop, verified state, features and warnings as additionalContext', () => {
  const root = project({
    features: {
      features: [
        { id: 'a-001', priority: 2, title: 'Second', status: 'not_started', verification: ['x'] },
        { id: 'a-002', priority: 1, title: 'First', status: 'in_progress', verification: ['x'], spec: 'spec.md' },
      ],
    },
  })
  const r = run('session-start.mjs', { cwd: root }, root)
  assert.equal(r.status, 0, r.stderr)
  const out = JSON.parse(r.stdout)
  const ctx = out.hookSpecificOutput.additionalContext
  assert.equal(out.hookSpecificOutput.hookEventName, 'SessionStart')
  assert.match(ctx, /Operating Loop/)
  assert.match(ctx, /- ok/)
  assert.match(ctx, /Active \(in_progress\): \*\*a-002\*\* — First \(spec: spec\.md\)/)
  assert.match(ctx, /0\/2 passing/)
})

test('session-start reports a broken harness.json instead of crashing', () => {
  const root = mkdtempSync(join(tmpdir(), 'harness-broken-'))
  writeFileSync(join(root, 'harness.json'), '{ not json')
  const r = run('session-start.mjs', {}, root)
  assert.equal(r.status, 0)
  assert.match(JSON.parse(r.stdout).hookSpecificOutput.additionalContext, /not valid JSON/)
})

test('format-on-edit runs commands.format with {file} substituted and reports failures', () => {
  const root = mkdtempSync(join(tmpdir(), 'harness-fmt-'))
  const marker = join(root, 'marker.txt')
  const script = join(root, 'fmt.mjs')
  writeFileSync(script, `import{writeFileSync}from'node:fs';writeFileSync(${JSON.stringify(marker)},process.argv[2]);process.exit(process.argv[2].endsWith('bad.ts')?1:0)`)
  writeFileSync(
    join(root, 'harness.json'),
    JSON.stringify({ harness_version: '0.1.0', project: 'p', commands: { format: `"${process.execPath}" "${script}" {file}` } }),
  )
  writeFileSync(join(root, 'good.ts'), 'x')
  writeFileSync(join(root, 'bad.ts'), 'x')
  const ok = run('format-on-edit.mjs', { tool_input: { file_path: join(root, 'good.ts') } }, root)
  assert.equal(ok.status, 0, ok.stderr)
  assert.match(readFileSync(marker, 'utf8'), /good\.ts$/)
  const bad = run('format-on-edit.mjs', { tool_input: { file_path: join(root, 'bad.ts') } }, root)
  assert.equal(bad.status, 2)
  assert.match(bad.stderr, /format hook .* failed on bad\.ts/)
  // state files are skipped
  const skip = run('format-on-edit.mjs', { tool_input: { file_path: join(root, 'harness.json') } }, root)
  assert.equal(skip.status, 0)
})

test('git-guard denies via permissionDecision and stays silent otherwise', () => {
  const deny = run('git-guard.mjs', { tool_input: { command: 'git reset --hard' } }, tmpdir())
  assert.equal(deny.status, 0)
  assert.equal(JSON.parse(deny.stdout).hookSpecificOutput.permissionDecision, 'deny')
  const ok = run('git-guard.mjs', { tool_input: { command: 'git status' } }, tmpdir())
  assert.equal(ok.stdout, '')
})
