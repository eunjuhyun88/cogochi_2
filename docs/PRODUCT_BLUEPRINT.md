# Cogochi Product Blueprint

Last updated: 2026-03-06

## One-Line Definition

Cogochi is a creature-raising strategy game where the player owns AI agents, tunes how they read the world, builds a squad, and wins through better preparation.

## Player Fantasy

The player should feel:

- `this is my agent`
- `I trained it this way`
- `my squad won because of my setup`

If the game feels like selecting anonymous units from a dex, the product is off-target.

## Core Loop

`owned agent -> roster -> training/retraining -> squad -> battle -> result -> growth/evolution`

## Product Pillars

### 1. My Agents Matter

The player remembers individuals, not just species.

Required implications:

- per-agent identity
- per-agent growth
- per-agent training setup

### 2. Setup Creates Outcome

Battles should reflect the player's preparation.

Required implications:

- indicator choices matter
- retraining path matters
- squad composition matters

### 3. Battles Prove, They Do Not Define

Battle is the proof screen, not the entire product.

Required implications:

- roster and detail screens are first-class
- growth must be visible outside battle
- the game still makes sense when not inside the arena

## Current Information Architecture

- `/` -> Trainer Hub
- `/roster` -> Owned Agents
- `/battle` -> Live Battle
- `/team` -> Squad Builder
- `/lab` -> Growth Lab

## Domain Model Target

### OwnedAgent

The actual unit the player owns.

### TrainingLoadout

The indicator set, behavior bias, risk profile, and retraining path attached to one agent.

### Squad

The active 4-agent team.

### OpponentSnapshot

The opponent squad representation used for PvE, ghost battles, or async PvP.

### MatchResult

The result package that feeds growth back into the roster.

## Current Technical Reality

- UI has already moved toward hub/roster-first
- state is still prototype-level and dex-driven
- `playerStore.ts` is still carrying too much
- internal `aimon` namespace is a technical leftover, not a product naming decision

## Next Build Priorities

1. Introduce true `OwnedAgent` data
2. Split `playerStore` into player/roster/squad stores
3. Make battle rewards per-agent
4. Add agent detail route and training controls
5. Move from dex selection to roster management
