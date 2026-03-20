# Cogochi Chart Battle Spec

Last updated: 2026-03-07

This document is subordinate to [MASTER_GAME_SPEC.md](/Users/ej/Downloads/maxidoge-clones/Cogochi/docs/MASTER_GAME_SPEC.md).
It defines the battle translation grammar in more detail.

This document defines how Cogochi battle becomes a game-like scene instead of a pure evaluation dashboard.

If older battle notes describe `/battle` as only a readable evaluation console, this document wins.

## 1. Core Thesis

The battle scene should not sit beside the chart.

The chart is the battlefield.

This means:

- candlesticks are not decorative background
- support and resistance are physical terrain and barriers
- liquidation zones are hazards and explosive objectives
- breakout lines are gates and finish lines
- volatility changes the shape and behavior of the stage
- agent decisions are shown as movement, skills, and zone control

The correct player read is:

`I trained these agents` -> `they entered this market-shaped battlefield` -> `their setup became visible actions` -> `I can see why they won or failed`

## 2. Visual Direction

### 2.1 Inspiration

The desired feeling is close to the attached sample images:

- agents physically moving across chart structures
- clear bullish and bearish energy
- liquidation walls and support platforms as visible objects
- readable labels for market events

### 2.2 Runtime density rule

The reference art is key art, not literal gameplay density.

Runtime gameplay should be roughly:

- 60% cleaner than promo art
- 1 primary objective on screen
- 2 to 4 secondary hazards
- 4 friendly agents max
- 4 rival agents max
- 3 to 5 active visual effects at once

If the player cannot immediately parse:

- where the objective is
- what the market event is
- which agent is acting
- who is currently winning

the scene is too noisy.

## 3. Battle Layer Stack

The battle view is a five-layer scene.

### 3.1 Layer A: Market Layer

This is the stylized chart terrain.

Contains:

- candle path
- trend slope
- box range floor/ceiling
- moving average rails
- breakout line
- current price beacon

This is the base map.

### 3.2 Layer B: Zone Layer

These are gameplay objects translated from market structure.

Contains:

- support platform
- resistance wall
- long liquidation zone
- short liquidation zone
- liquidity wall
- news shock field
- volatility storm zone
- macro signal beacon

This is where stage goals come from.

### 3.3 Layer C: Agent Layer

These are the owned agents and rival agents.

Contains:

- agent idle stance
- movement path
- skill windup
- cast impact
- status effect ring
- target marker

### 3.4 Layer D: Effect Layer

These are decision-driven effects.

Contains:

- bullish thrust trail
- bearish collapse slash
- shield dome
- risk veto wave
- memory recall flash
- combo chain line
- liquidation explosion

### 3.5 Layer E: HUD Layer

Contains:

- scenario objective
- current market event
- phase indicator
- advantage meter
- intervention cards
- retrieved memory drawer
- reasoning highlights

## 4. Market To Battlefield Translation Table

This is the missing translation layer.

| Market signal | Battlefield object | Runtime behavior | Player read |
| --- | --- | --- | --- |
| Trend up | Rising path / green current | Upward movement grants momentum | Push forward |
| Trend down | Falling path / red current | Downward drift punishes overextension | Survive or reverse |
| Range | Box arena | Mid control matters more than chase | Hold center |
| High volatility | Storm field | Random knockback and cast interruption | Timing matters |
| Support | Green platform | Standing here gives defense or cast speed | Safe foothold |
| Resistance | Red wall | Must be broken, bypassed, or baited | Obstacle |
| Long liquidation cluster | Green explosive zone | Triggered by bullish follow-through | Opportunity trap |
| Short liquidation cluster | Red explosive zone | Triggered by bearish pressure | Panic trap |
| Breakout level | Gate / finish line | Crossing it advances objective score | Push objective |
| Open interest spike | Pressure tower | Spawns tension pulses and hazard bullets | Danger building |
| Funding distortion | Bias field | Buffs one side and weakens opposite actions | Market leaning |
| News shock | Global event banner + stage modifier | Recolors stage, changes hazard rules | Sudden rules change |

## 5. Scenario Families And Objectives

Every battle should be scenario-first, not freeform.

### 5.1 Trend Push

Theme:

- bullish or bearish directional continuation

Objective:

- escort the market core through the breakout line before turn limit

Failure:

- core is stalled too long or pushed backward by rival control

### 5.2 Range Hold

Theme:

- boxed market with fake break attempts

Objective:

- hold the center box for N turns while rejecting false probes

Failure:

- lose box control or overcommit into the outer trap

### 5.3 Liquidity Hunt

Theme:

- clustered stop zones and breakout bait

Objective:

- trigger favorable liquidation zones before the rival does

Failure:

- your squad gets baited into the wrong liquidation side

### 5.4 Macro Defense

Theme:

- heavy market shock and risk preservation

Objective:

- survive until event decay while keeping damage below threshold

Failure:

- risk control collapses or too many agents are disabled

### 5.5 News Spike Race

Theme:

- fast event-driven scramble

Objective:

- capture burst windows in sequence faster than the rival team

Failure:

- miss timing windows or chase noise

### 5.6 Divergence Break

Theme:

- price and evidence disagree

Objective:

- correctly exploit the hidden reversal node

Failure:

- stay committed to the visible but false direction

## 6. Agent Role To Skill Mapping

The player does not control trades directly.

The player sees trained agents express themselves as skills.

### 6.1 Scout

Battle job:

- reveal weak points
- expose fake zones
- increase memory certainty

Visual skills:

- `Signal Ping`
  - marks a candle node or zone
- `Trap Reveal`
  - exposes hidden liquidation hazard
- `Path Trace`
  - shows likely next momentum lane

### 6.2 Analyst

Battle job:

- interpret signal
- amplify the right target
- create combo windows

Visual skills:

- `Thesis Beam`
  - links current evidence to target zone
- `Bias Field`
  - buffs ally action in one lane
- `Narrative Break`
  - weakens rival conviction

### 6.3 Risk

Battle job:

- prevent bad entries
- mitigate volatility damage
- deny catastrophic overextension

Visual skills:

- `Risk Dome`
  - temporary shield over ally or zone
- `Veto Pulse`
  - cancels one risky allied cast
- `Drawdown Wall`
  - slows enemy push into dangerous terrain

### 6.4 Executor

Battle job:

- commit final action
- break walls
- finish objectives

Visual skills:

- `Breakout Dash`
  - bursts through the target line
- `Pressure Slam`
  - damages wall or control node
- `Liquidation Trigger`
  - detonates primed hazard

## 7. Decision To Animation Mapping

The raw agent action should become a visible move.

| Decision | Animation family | Typical result |
| --- | --- | --- |
| `LONG` | forward dash / green strike / rising rail surf | objective push |
| `SHORT` | downward slash / red collapse wave | deny or reverse |
| `FLAT` | hold stance / charge / sidestep / scan pulse | patience or setup |

Modifiers:

- high confidence -> faster windup, brighter trail
- strong memory hit -> recall flash and card label
- risk veto -> action interrupted by blue shield pulse
- retrieval miss -> hesitating cast, weaker effect

## 8. Player Interventions

The player needs limited agency during battle.

Not zero.

Not full micro-control.

### Allowed interventions

- `Focus Tap`
  - make one agent commit harder on its next cast
- `Memory Pulse`
  - force one additional memory recall
- `Risk Veto`
  - cancel one dangerous action
- `Doctrine Card`
  - inject one tactical rule for the next phase
- `Retarget`
  - redirect the squad objective once per battle

### Rules

- interventions are scarce
- interventions do not replace training quality
- better-trained agents gain more value from the same intervention

## 9. Phase Structure

The phase flow should still support readable AI evaluation.

But the player must see that flow as staged battle scenes.

1. `Scan`
- market event telegraph appears
- stage highlights active zones

2. `Recall`
- memory cards flash near agents
- retrieved knowledge is briefly shown

3. `Plan`
- squad links and target markers appear

4. `Cast`
- skills fire
- movement and projectiles resolve

5. `Clash`
- wall breaks, shields absorb, traps explode
- advantage meter moves

6. `Resolve`
- objective state updates
- reward/failure reason is previewed

## 10. HUD Wireframe

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Scenario Goal | Market Event | Turn | Regime | Advantage Meter             │
├──────────────────────────────────────────────────────────────────────────────┤
│ Mini Chart Ribbon / Candle Path / Breakout Line / Event Telegraph          │
├──────────────────────────────────────────────────────────────────────────────┤
│ Friendly Team          Main Chart Battlefield              Rival Team       │
│ 4 agents               zones, walls, liq pits, core        4 agents         │
│ left HUD               cast animations, path lines         right HUD        │
├──────────────────────────────────────────────────────────────────────────────┤
│ Intervention Cards | Memory Pulse | Focus Tap | Risk Veto | Retarget       │
├──────────────────────────────────────────────────────────────────────────────┤
│ Retrieved Memory Drawer | Reasoning Highlights | Failure Cause Preview      │
└──────────────────────────────────────────────────────────────────────────────┘
```

Battle must be center-stage first.

Detailed logs can live in drawers or side panes, but the main focus must be the playable chartfield.

## 11. Runtime Scene Model

Implementation should introduce a scene compiler layer between market data and rendering.

```ts
export interface ChartBattleScene {
  id: string;
  scenarioId: string;
  phase: 'SCAN' | 'RECALL' | 'PLAN' | 'CAST' | 'CLASH' | 'RESOLVE';
  marketBackdrop: MarketBackdrop;
  zones: BattleZone[];
  objectives: BattleObjective[];
  friendlyUnits: BattleUnit[];
  rivalUnits: BattleUnit[];
  projectiles: BattleProjectile[];
  hazards: BattleHazard[];
  interventionHand: InterventionCardState[];
  advantage: number;
  eventBanner: string;
}

export interface BattleZone {
  id: string;
  kind: 'SUPPORT' | 'RESISTANCE' | 'LONG_LIQ' | 'SHORT_LIQ' | 'BREAKOUT' | 'STORM';
  lane: 'LOWER' | 'MID' | 'UPPER';
  anchorPrice: number;
  width: number;
  state: 'ACTIVE' | 'BROKEN' | 'PRIMED' | 'COOLDOWN';
  value: number;
}

export interface BattleUnit {
  ownedAgentId: string;
  role: 'SCOUT' | 'ANALYST' | 'RISK' | 'EXECUTOR';
  position: { x: number; y: number };
  stance: 'IDLE' | 'MOVING' | 'CASTING' | 'HIT' | 'GUARD';
  targetZoneId?: string;
  queuedSkill?: BattleSkillCast;
  confidence: number;
  memoryBoost: number;
}

export interface BattleSkillCast {
  id: string;
  action: 'LONG' | 'SHORT' | 'FLAT';
  skillId: string;
  windupMs: number;
  impactMs: number;
  power: number;
  tags: string[];
}
```

## 12. Rendering Pipeline

```text
EvalScenario + MarketState + DecisionTrace + RetrievedMemory
-> ChartBattleSceneCompiler
-> Scene entities (zones, units, hazards, projectiles)
-> Animation scheduler
-> Battle renderer
-> HUD and drawers
```

This compiler is the real missing layer in the current codebase.

## 13. MVP Cut

The first playable version should not try to simulate everything.

### MVP battle must include

- chart path background
- support and resistance objects
- one liquidation hazard type
- one breakout objective
- 4 friendly units and 4 rival units
- 1 skill animation family per role
- 3 intervention cards
- visible advantage meter
- visible retrieved memory flash

### MVP battle can skip

- free movement
- full physics
- live real-time chart streaming
- more than one objective at once
- complicated combo trees

## 14. Non-Goals

Do not do these:

- a pure static dashboard with floating text panels only
- a completely separate fantasy arena unrelated to chart structure
- a literal exchange terminal with tiny characters overlaid
- full manual MOBA-style control

## 15. Implementation Order

1. `ChartBattleScene` data model
2. scene compiler from `EvalScenario + BattleState`
3. support/resistance/liquidation/breakout zone renderer
4. role skill animation mapping
5. intervention card system
6. HUD redesign around center-stage battle
7. result and reflection overlay

## 16. Acceptance Criteria

The chart battle design is correct only if:

1. the player can tell what the objective is in under 3 seconds
2. the player can tell which side is winning without reading logs
3. the player can see at least one direct link between retrieved memory and a visible action
4. the player can distinguish support, resistance, and liquidation zones at a glance
5. the battle feels like a game scene first and an evaluation console second
