#!/usr/bin/env node
// Stop: deterministic "did not declare victory too early" gate.
// Blocks (exit 2) when the feature list violates the harness invariants.
// Warns (stderr, exit 0) when the progress log lags behind the feature list.
import { join } from 'node:path'
import { checkFeatureList, loadDescriptor, mtime, projectRoot, readJsonSafe, readStdinJson } from '../lib/common.mjs'

const payload = await readStdinJson()
// Avoid an infinite loop: if we already blocked once this turn, let it through.
if (payload?.stop_hook_active) process.exit(0)

const root = projectRoot(payload)
const d = loadDescriptor(root)
if (!d) process.exit(0)
if (d._error) fail([d._error])

const featuresFile = join(root, d.paths.features)
const feat = readJsonSafe(featuresFile)
if (feat.error) fail([`${d.paths.features} is missing or not valid JSON: ${feat.error}`])

const problems = checkFeatureList(feat.value, root)
if (problems.length) fail(problems)

// Soft signal only: a progress log older than the feature list means state moved but the log did not.
const progressAge = mtime(join(root, d.paths.progress))
const featuresAge = mtime(featuresFile)
if (progressAge && featuresAge && featuresAge - progressAge > 60_000) {
  process.stderr.write(
    `Stop gate (warning): ${d.paths.features} changed after ${d.paths.progress} was last updated. ` +
      'If real work happened this session, run /harness:end so the next session can resume.\n',
  )
}
process.exit(0)

function fail(list) {
  const name = d?.paths?.features ?? 'feature_list.json'
  process.stderr.write(
    `Stop gate: ${name} violates the harness rules.\n- ${list.join('\n- ')}\n` +
      'Fix the feature state (do not weaken the rules), update the progress log, then stop again.\n',
  )
  process.exit(2)
}
