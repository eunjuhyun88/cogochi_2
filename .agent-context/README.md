# Agent Context

Use this directory for compact context snapshots that help the next Codex session resume work quickly.

Recommended pattern:

- `compact/<branch>-latest.md` for the latest condensed state
- short summaries of product direction, active files, unresolved issues, and next steps

When major decisions or workflow changes happen:

1. update `CLAUDE.md`
2. update `docs/PROJECT_CONTEXT.md`
3. append `docs/AGENT_WATCH_LOG.md`
4. refresh the latest compact snapshot in `.agent-context/`
