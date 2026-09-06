# Session Handoff

Fill this in at the end of a long session (or let `/harness:end` do it) so the next session can
continue using only repository artifacts. Optional for short sessions; the progress log is enough.

## Verified Now

- What is currently working:
- What verification actually ran (command + result):

## Changed This Session

- Code or behavior added:
- Infrastructure or harness changes:

## Broken Or Unverified

- Known defect:
- Unverified path:
- Risk for the next session:

## Next Best Step

- Highest-priority unfinished feature:
- Why it is next:
- What counts as passing:
- What must not change during that step:

## Commands

- Startup: `./init.sh`
- Verification: see `harness.json` → `commands.verify`
- Focused debug command:
