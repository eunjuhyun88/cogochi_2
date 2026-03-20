# Cogochi Game Design

Last updated: 2026-03-06

The authoritative game-first design now lives in [MASTER_GAME_SPEC.md](/Users/ej/Downloads/maxidoge-clones/Cogochi/docs/MASTER_GAME_SPEC.md).
This file remains the shorter gameplay summary.

## 1. Product Definition

Cogochi is an AI agent raising and evaluation simulator.

The player does not merely collect units.

The player:

- creates owned agents on top of a base model
- configures prompts, policy, and data access
- manages long-term memory and retrieval behavior
- builds a 4-agent squad
- sends that squad into evaluation matches
- studies the result and improves the agents

## 2. Player Fantasy

The player should feel:

- `this is my agent`
- `I trained its memory and policy`
- `the result came from my preparation`

If the product feels like a spectator battle dashboard, the design is off target.

## 3. Design Pillars

### Pillar 1. Individual agents matter

- the player remembers named agents, not anonymous species
- different prompt stacks and memory histories should create meaningful differences

### Pillar 2. Preparation creates outcome

- data source selection matters
- retrieval policy matters
- prompt and role setup matter
- squad composition matters

### Pillar 3. Evaluation is visible

- the player must see what the agent saw
- the player must see what memory was retrieved
- the player must see why the agent decided that way

### Pillar 4. Reflection changes the next run

- every match should feed memory and progression
- failure should produce a useful next action

## 4. Non-Goals

Current non-goals:

- real-money trading product behavior
- exchange UI mimicry
- large-scale cloud training orchestration
- pretraining from scratch as a core loop

## 5. Core Loops

### Product loop

`base model -> owned agent -> data and memory setup -> prompt/retraining -> squad -> eval match -> reflection -> progression`

### Session loop

- inspect roster
- adjust one or more agents
- run an evaluation match
- read result and lesson cards
- queue the next training action

### Long-term loop

- specialize agents by role
- improve memory quality
- unlock tools, data sources, and training actions
- build stronger squads for harder scenarios

## 6. One Match Flow

The default evaluation match phases are:

1. `OBSERVE`
   - current structured state is revealed
2. `RETRIEVE`
   - role-relevant memory is loaded
3. `REASON`
   - each agent builds its local thesis
4. `DEBATE`
   - squad messages are exchanged
5. `DECIDE`
   - executor proposes the team action and risk can veto
6. `RESOLVE`
   - the scenario outcome is scored
7. `REFLECT`
   - lessons and rewards are generated

## 6.1 Battlefield model

The battle should no longer be treated as a detached abstract console.

The chart is the battlefield.

This means:

- support and resistance are terrain
- liquidation zones are hazards and objectives
- breakout lines are gates and finish lines
- agent decisions become visible skills, movement, and zone control

The detailed battle translation grammar lives in [CHART_BATTLE_SPEC.md](/Users/ej/Downloads/maxidoge-clones/Cogochi/docs/CHART_BATTLE_SPEC.md).

## 7. Content Structure

### Base models

The base model is the starting substrate.

Example:

- Qwen family models

### Archetypes

Archetypes exist for visual identity and starter defaults.

They are not the core gameplay object.

### Agent roles

The four default squad roles are:

- `SCOUT`
- `ANALYST`
- `RISK`
- `EXECUTOR`

### Evaluation targets

The game should expand in this order:

1. PvE benchmark scenarios
2. ghost opponent duels
3. async PvP

## 8. Match Scoring

Default score priorities:

- return quality
- risk control
- directional accuracy
- confidence calibration
- reasoning quality
- team coordination

Winning is important, but readable performance diagnosis is more important than a single binary flag.

## 9. Success Criteria

The game design is correct only if the following are true:

1. the player remembers specific agents by role and behavior
2. changing memory or prompt setup changes outcomes
3. a match result produces a clear next training action
4. the roster and lab screens feel as important as battle
5. the battle screen feels like a chart-driven tactical game, not just an evaluation dashboard
