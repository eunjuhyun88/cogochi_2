# Cogochi Product Blueprint

Last updated: 2026-03-18

The top-level product definition now lives in [MASTER_GAME_SPEC.md](/Users/ej/Downloads/maxidoge-clones/Cogochi/docs/MASTER_GAME_SPEC.md).
The release-facing flow reframe lives in [STEAM_RELEASE_REFRAME.md](/Users/ej/Downloads/maxidoge-clones/Cogochi/docs/STEAM_RELEASE_REFRAME.md).
The final convergence decision between Cogochi structure and Maxidoge tone now lives in [MAXIDOGE_COGOCHI_FINAL_STRUCTURE.md](/Users/ej/Downloads/maxidoge-clones/Cogochi/docs/MAXIDOGE_COGOCHI_FINAL_STRUCTURE.md).
This file remains a concise summary layer.

## One-Line Definition

Cogochi is an AI squad-raising game where the player recruits several agents, chooses how each one should grow, trains them on signal patterns, proves them in short chart battles, and eventually promotes the best ones into prestige or rentable assets.

## Player Fantasy

The player should feel:

- `this is my agent`
- `this is the squad I assembled`
- `I trained its memory and policy this way`
- `my squad won because of my setup`

If the game feels like selecting anonymous units from a dex, the product is off-target.

## Core Loop

`discover agents -> select several -> assign growth lanes -> train -> deploy in battle -> reflect -> promote or rent later`

## Product Pillars

### 1. My Agents Matter

The player remembers individuals, not just species.

Required implications:

- per-agent identity
- per-agent growth
- per-agent training setup
- per-agent memory history

### 2. Setup Creates Outcome

Battles should reflect the player's preparation.

Required implications:

- data source choices matter
- retrieval policy matters
- prompt and policy changes matter
- squad composition matters

### 3. Battles Prove, They Do Not Define

Battle is the proof screen, not the entire product.

Required implications:

- roster and detail screens are first-class
- growth must be visible outside battle
- the game still makes sense when not inside the arena
- when battle does appear, it should read as a chart-driven tactical scene rather than a static dashboard

### 4. Memory Is A System, Not Flavor

The product should feel like the agents remember and improve.

Required implications:

- past lessons are stored
- retrieved memory is visible at decision time
- match results write back into future behavior

### 5. The Front Door Is Character Selection

The game must open with living characters and immediate choice, not with a static dashboard.

Required implications:

- the home screen shows many candidate agents at once
- the right side of the main screen can rotate through dozens of candidates over time
- multi-select happens directly from home
- the player chooses who to grow before they enter battle

## Current Information Architecture

- `/` -> Command Deck and Recruitment Wall
- `/roster` -> Stable and Bench
- `/team` -> Mission Prep
- `/battle` -> Signal Mission
- `/lab` -> Training Foundry
- `/market` -> Rental Exchange

## Domain Model Target

### BaseModelDefinition

The inference model each owned agent is built on top of.

### OwnedAgent

The actual unit the player owns.

### TrainingLoadout

The prompt stack, data bindings, retrieval policy, risk profile, and tool setup attached to one agent.

### MemoryBank

The searchable long-term memory attached to one agent.

### TrainingRun

The recorded improvement job attached to one agent.

### Squad

The active 4-agent team.

### OpponentSnapshot

The opponent squad representation used for PvE, ghost battles, or async PvP.

### EvalMatchResult

The result package that feeds reflection and progression back into the roster.

## Current Technical Reality

- UI has already moved toward hub/roster-first
- state is still prototype-level and dex-driven
- `playerStore.ts` is still carrying too much
- internal `aimon` namespace is a technical leftover, not a product naming decision

Main gap versus release target:

- current front door is still too much like a roster dashboard
- candidate discovery and multi-select are not yet first-class
- growth planning is not yet a dedicated step between selection and battle
- rental should be an unlock, not a front-door surface

## Next Build Priorities

1. Rebuild `/` into a command deck with rotating candidate agents and a multi-select tray
2. Add a growth-draft step between agent selection and battle entry
3. Make the first battle happen faster and read as a short proof mission
4. Show visible per-agent progression changes directly in reflection and home
5. Gate market and rental behind progression instead of surfacing them immediately
