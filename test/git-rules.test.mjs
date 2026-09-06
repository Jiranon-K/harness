import assert from 'node:assert/strict'
import { test } from 'node:test'
import { destructiveGitReason } from '../lib/git-rules.mjs'

const denied = [
  'git push --force origin main',
  'git push -f',
  'git push origin main --force',
  'git reset --hard HEAD~1',
  'git clean -fd',
  'git clean -xdf',
  'git branch -D feature',
  'git checkout -- .',
  'git checkout .',
  'git restore .',
  'git rebase -i HEAD~3',
  'git stash drop',
  'git stash clear',
  'git filter-branch --all',
  'cd repo && git reset --hard',
  'GIT_DIR=.git git push --force',
]
const allowed = [
  'git push --force-with-lease origin main',
  'git push origin main',
  'git status',
  'git reset --soft HEAD~1',
  'git reset HEAD file.txt',
  'git branch -d merged',
  'git checkout -b new',
  'git checkout main',
  'git restore --staged .',
  'git restore src/file.ts',
  'git rebase main',
  'git stash',
  'git stash pop',
  'echo "git reset --hard is dangerous"',
  'grep -r "git clean -fd" docs/',
  'npm run build',
]

for (const c of denied) test(`denies: ${c}`, () => assert.ok(destructiveGitReason(c), 'expected a reason'))
for (const c of allowed) test(`allows: ${c}`, () => assert.equal(destructiveGitReason(c), null))
