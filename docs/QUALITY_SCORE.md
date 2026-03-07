# Cogochi Quality Score

Last updated: 2026-03-07

This file tracks repo readability and agent-operability, not just user-facing polish.

## Scoring Legend

- `A`: strong and durable
- `B`: usable but still fragile
- `C`: partially present
- `D`: missing or unreliable

## Current Scorecard

| Area | Score | Notes |
| --- | --- | --- |
| Product truth in repo docs | A | Product and architecture docs exist and are cross-linked |
| AI runtime design clarity | A | Runtime and implementation contract docs now exist |
| Repo entrypoint clarity | B | `AGENTS.md` and docs index added, but code-level doc drift still possible |
| Plan hygiene | C | Plan directories and tracker are added, but active plan inventory is still sparse |
| Mechanical context validation | A | Context lint now checks structure, cross-links, package wiring, and implementation-contract freshness |
| Eval reliability discipline | B | Reliability policy exists and benchmark run manifests are emitted, but authoritative runs are still local-only |
| Artifact lineage and promotion rigor | B | Local artifact lineage is recorded and promotion is tracked, but provider-backed registry and rollback workflows are still pending |
| Async PvP snapshot readiness | C | Storage model is designed, implementation is pending |

## Next Upgrades

1. Add execution-plan templates
2. Export benchmark manifests to durable storage
3. Add provider-backed artifact registry persistence
4. Add snapshot validation for async PvP
5. Add doc-gardening automation
