---
status: accepted
---
# `.agent/context.md` is generated from `harness.json`, not maintained by hand

Skills in agent-skills read `.agent/context.md` written by `/setup-context`; the harness introduces
`harness.json` as the Descriptor. Two hand-maintained truths would drift, so `/harness:init` generates
`.agent/context.md` from the Descriptor with a generated-file header. Intended follow-up: once the
Descriptor is stable, teach agent-skills to read `harness.json` directly and drop the generated file.
