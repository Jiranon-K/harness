import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { checkFeatureList, currentVerifiedState, summarizeFeatures } from '../lib/common.mjs'

const feature = (over = {}) => ({
  id: 'a-001',
  priority: 1,
  title: 't',
  user_visible_behavior: 'b',
  status: 'not_started',
  verification: ['run x'],
  evidence: [],
  notes: '',
  ...over,
})

test('a clean list passes', () => {
  assert.deepEqual(checkFeatureList({ features: [feature()] }), [])
})

test('passing without evidence fails', () => {
  const p = checkFeatureList({ features: [feature({ status: 'passing' })] })
  assert.match(p.join('\n'), /passing.*evidence is empty/)
})

test('two in_progress fails', () => {
  const p = checkFeatureList({
    features: [feature({ status: 'in_progress' }), feature({ id: 'a-002', status: 'in_progress' })],
  })
  assert.match(p.join('\n'), /2 features are in_progress/)
})

test('blocked needs a documented blocker', () => {
  const p = checkFeatureList({ features: [feature({ status: 'blocked' })] })
  assert.match(p.join('\n'), /blocked.*notes/)
  assert.deepEqual(checkFeatureList({ features: [feature({ status: 'blocked', notes: 'waiting on API key' })] }), [])
})

test('empty verification, duplicate id, invalid status', () => {
  const p = checkFeatureList({
    features: [feature({ verification: [] }), feature({ status: 'done' })],
  })
  assert.match(p.join('\n'), /verification steps are empty/)
  assert.match(p.join('\n'), /duplicate feature id/)
  assert.match(p.join('\n'), /invalid status "done"/)
})

test('in_progress with an unmet dependency fails; met dependency passes', () => {
  const dep = feature({ id: 'dep-001', status: 'not_started' })
  const me = feature({ id: 'me-001', status: 'in_progress', depends_on: ['dep-001'] })
  assert.match(checkFeatureList({ features: [dep, me] }).join('\n'), /dependency "dep-001" is not_started/)
  const done = { ...dep, status: 'passing', evidence: ['ran'] }
  assert.deepEqual(checkFeatureList({ features: [done, me] }), [])
  assert.match(checkFeatureList({ features: [feature({ status: 'in_progress', depends_on: ['ghost-001'] })] }).join('\n'), /unknown feature/)
})

test('in_progress spec must exist on disk when a root is given', () => {
  const root = mkdtempSync(join(tmpdir(), 'harness-'))
  const f = feature({ status: 'in_progress', spec: '.scratch/a/spec.md' })
  assert.match(checkFeatureList({ features: [f] }, root).join('\n'), /spec .* does not exist/)
  writeFileSync(join(root, 'spec.md'), '# spec')
  assert.deepEqual(checkFeatureList({ features: [feature({ status: 'in_progress', spec: 'spec.md' })] }, root), [])
})

test('summarizeFeatures picks the active and the next by priority', () => {
  const s = summarizeFeatures({
    features: [
      feature({ id: 'x-001', priority: 5 }),
      feature({ id: 'x-002', priority: 2 }),
      feature({ id: 'x-003', status: 'passing', evidence: ['ok'] }),
    ],
  })
  assert.equal(s.total, 3)
  assert.equal(s.passing, 1)
  assert.equal(s.active, undefined)
  assert.equal(s.next.id, 'x-002')
})

test('currentVerifiedState extracts the section up to the next heading', () => {
  const md = '# Progress\n\n## Current Verified State\n\n- a: 1\n- b: 2\n\n## Session Log\n\n### S1\n'
  assert.equal(currentVerifiedState(md), '- a: 1\n- b: 2')
  assert.equal(currentVerifiedState('# nothing'), null)
})
