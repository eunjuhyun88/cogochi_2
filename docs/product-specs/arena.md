# Battle Product Spec

Legacy file path:
- `docs/product-specs/arena.md`

Canonical surface label:
- `Mission Arena`

Purpose:
- Short product spec for the primary playable encounter loop and its result path.

## Primary User Job

Resolve one meaningful encounter and produce a result, reflection, and next-run motivation.

## Surface Role In The Release IA

`Arena` is the core playable stage inside `Mission`.

It is where the product stops being a setup tool and becomes a game.

## Current Route Shape

- `/arena` currently includes `Lobby` and `SquadConfig` before the phase loop begins.
- The same match can be viewed through arena, chart, mission, and card modes.
- Result flow currently includes reward modal, replay state, match history, and tournament bracket support.
- Use `docs/page-specs/arena-page.md` for the actual route shell; keep this file focused on Arena intent and migration semantics.

## Phase Model

1. `DRAFT`
2. `ANALYSIS`
3. `HYPOTHESIS`
4. `BATTLE`
5. `RESULT`

## Core Flows

1. Enter as the next mission step after creation and training.
2. Read the situation quickly.
3. Commit to a stance or intervention.
4. Observe the encounter resolve.
5. Review explicit outcome and consequence.
6. Return the durable result to `Agent HQ` and the next mission recommendation.

## Product Constraints

- Arena should preserve `same data, different interpretation`.
- The player must understand the current phase and what changed.
- The first contact should not require choosing between many view modes.
- The playfield must dominate the screen more than chrome.
- Result screens should feel like encounter resolution, not generic dashboard output.
- Durable outcomes should remain compatible with GameRecord, ORPO, and memory systems.
- The shipped route is broader than the target Arena loop, so lobby, replay, and tournament concerns will need pruning or remapping over time.

## Target IA

- User-facing label: `Arena`
- Parent surface: `Mission`
- Entry source: `Mission / Train`
- Return targets: `Agent HQ`, next mission, optional replay

## Local Authority

Read these before using any external design document:
- `docs/design-docs/steam-ship-blueprint.md`
- `docs/design-docs/steam-ready-game-reset.md`
- `docs/design-docs/six-surface-game-loop.md`
- `docs/design-docs/arena-domain-model.md`
- `docs/design-docs/learning-loop.md`
- `docs/generated/game-record-schema.md`

## Supporting Docs

- `docs/design-docs/steam-ship-blueprint.md`
- `docs/design-docs/arena-domain-model.md`
- `docs/design-docs/learning-loop.md`
- `docs/generated/game-record-schema.md`
- `docs/references/active/ARENA_SYSTEM_SPEC_V3_0.md`
- `docs/references/active/ORPO_DATA_SCHEMA_PIPELINE_v1_2026-02-26.md`
