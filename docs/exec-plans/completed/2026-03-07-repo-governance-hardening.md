# Repo Governance Hardening

Date: 2026-03-07
Status: completed

## Problem Statement

Cogochi already had baseline context docs, but repo governance was still too soft. Structure lint only checked doc presence, benchmark manifests were only specified in docs, and artifact lineage was not recorded as first-class state.

## Scope

- add AIMON architecture lint
- upgrade context lint with code-aware freshness checks
- emit benchmark run manifests for eval matches
- persist artifact lineage records
- surface manifests and lineage in the lab UI

## Non-Goals

- export manifests to remote storage
- build artifact diff viewer UI
- add automated doc-gardening bots

## Acceptance Criteria

- `npm run check` runs architecture and context governance checks
- eval matches emit benchmark run manifests
- artifact creation and promotion append lineage records
- lab UI shows recent benchmark runs and lineage entries
- `npm run check` and `npm run build` pass

## Result

- `npm run check` now runs both architecture and context governance lint
- eval matches emit `BenchmarkRunManifest` records into match history
- artifact creation and promotion append lineage events into lab state
- lab UI exposes recent benchmark manifests and artifact lineage
- verification passed with `npm run check` and `npm run build`

## Files Expected

- `package.json`
- `scripts/check-aimon-architecture.mjs`
- `scripts/check-context-docs.mjs`
- `src/lib/aimon/services/benchmarkManifestService.ts`
- `src/lib/aimon/stores/battleStore.ts`
- `src/lib/aimon/stores/matchStore.ts`
- `src/lib/aimon/stores/labStore.ts`
- `src/lib/aimon/services/trainingOrchestrator.ts`
- `src/routes/lab/+page.svelte`

## Risks

- stricter lint rules can fail on legacy imports if the boundaries are too aggressive
- browser-only runtime metadata is approximate, not server-authoritative
- local lineage registry is still weaker than a durable artifact backend
