# Cogochi Project Context

Last updated: 2026-03-06

## Product Definition

Cogochi is not a trading interface reskin and not a documentation alias for AIMON.

It is its own product repo for a creature-raising game built around:

`owned agents -> roster -> training/retraining -> squad -> battle -> growth`

The player fantasy is:

- own individual AI agents
- choose what they watch and how they learn
- send them into battle against another squad
- see who wins
- grow, evolve, and refine the team

## Source Of Truth

This repo should be understandable without opening root-level project notes.

Read in this order:

1. `CLAUDE.md`
2. `docs/PROJECT_CONTEXT.md`
3. `docs/PRODUCT_BLUEPRINT.md`
4. `docs/GAME_DESIGN.md`
5. `docs/TECH_ARCHITECTURE.md`
6. `docs/UIUX_SYSTEM.md`
7. `docs/PROGRESSION_MODEL.md`

## Current State

Implemented:

- standalone SvelteKit app under `Cogochi/`
- Trainer Hub at `/`
- Roster screen at `/roster`
- Battle screen moved to `/battle`
- Team Builder at `/team`
- Lab screen at `/lab`
- separate git repository initialized for this app

Current limitation:

- UI is roster-first, but data model is still prototype-level
- `playerStore` still uses `unlockedDexIds`, `teamDexIds`, and global XP
- real `OwnedAgent`, `rosterStore`, `squadStore`, and per-agent progression are not implemented yet
- code still uses internal `aimon` namespaces as prototype leftovers

## Important Files

- `src/routes/+page.svelte`
- `src/routes/roster/+page.svelte`
- `src/routes/battle/+page.svelte`
- `src/components/aimon/RosterGrid.svelte`
- `src/components/aimon/AgentDetailPanel.svelte`
- `src/lib/aimon/stores/playerStore.ts`
- `src/lib/aimon/data/trainingProfiles.ts`

## Design Priorities

1. make the game feel like raising `my agents`, not selecting dex entries
2. keep the arena battle readability from STOCKCLAW
3. make training and retraining decisions affect battle outcomes
4. move toward async PvP or opponent snapshots after the roster model is real

## Documentation Rules

When the product direction or implementation boundary changes, update:

- `CLAUDE.md`
- `docs/PROJECT_CONTEXT.md`
- `docs/PRODUCT_BLUEPRINT.md`
- `docs/GAME_DESIGN.md`
- `docs/TECH_ARCHITECTURE.md`
- `docs/UIUX_SYSTEM.md`
- `docs/PROGRESSION_MODEL.md`
- `docs/AGENT_WATCH_LOG.md`

## Next Engineering Steps

1. Add domain types for:
   - `OwnedAgent`
   - `TrainingLoadout`
   - `Squad`
   - `OpponentSnapshot`
   - `MatchResult`
2. Split stores:
   - `playerStore`
   - `rosterStore`
   - `squadStore`
3. Replace global XP rewards with per-agent progression
4. Connect battle results to growth, evolution, and retraining progress
5. Add agent detail route like `/agent/[id]`

## Validation

Expected to pass after changes:

- `npm run check`
- `npm run build`
