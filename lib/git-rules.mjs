// Destructive-git detection shared by the PreToolUse guard and its tests.

const RULES = [
  [/\bpush\b(?![\s\S]*--force-with-lease)[\s\S]*\s(?:--force|-f)\b/, 'git push --force rewrites remote history; use --force-with-lease and ask first'],
  [/\breset\b[\s\S]*\s--hard\b/, 'git reset --hard discards uncommitted work'],
  [/\bclean\b[\s\S]*\s-[a-zA-Z]*[fdxX]/, 'git clean -f/-d/-x deletes untracked files permanently'],
  [/\bbranch\b[\s\S]*\s(?:-D|--delete\s+--force|--force\s+--delete)\b/, 'git branch -D force-deletes a branch'],
  [/\bcheckout\b\s+(?:--\s+)?\.(?:\s|$)/, 'git checkout . discards every working-tree change'],
  [/\brestore\b(?![\s\S]*--staged)[\s\S]*\s\.(?:\s|$)/, 'git restore . discards every working-tree change'],
  [/\brebase\b[\s\S]*\s(?:-i|--interactive)\b/, 'interactive rebase is not supported in this environment'],
  [/\bstash\b[\s\S]*\b(?:drop|clear)\b/, 'git stash drop/clear destroys stashed work'],
  [/\bfilter-branch\b/, 'git filter-branch rewrites history'],
  [/\bupdate-ref\s+-d\b/, 'git update-ref -d deletes a ref'],
]

/**
 * Returns a reason string when `command` contains a destructive git invocation, else null.
 * One segment = one command between pipes / && / || / ; so each command is judged on its own.
 */
export function destructiveGitReason(command) {
  for (const seg of String(command).split(/\|\||&&|;|\|/)) {
    const s = seg.trim()
    if (!/^(?:\S+=\S+\s+)*git\b/.test(s)) continue
    for (const [re, why] of RULES) if (re.test(s)) return why
  }
  return null
}
