# Cogochi Battle Runtime And Presentation Spec

Last updated: 2026-03-07

This document defines how Cogochi battle actually runs moment to moment.

It answers the practical question:

`Do we let AI invent the whole scene every time, or do we script everything?`

The answer is:

`neither`

Cogochi battle must use a hybrid runtime where:

- scenarios define the arena rules
- market simulation defines the live state changes
- AI agents decide intentions
- battle grammar compiles intentions into game actions
- presentation systems render those actions as readable moves

If this layer is missing, the game collapses into either:

- a dashboard with effects
- or a scripted cutscene with fake agency

## 1. Core Thesis

The AI does not decide pixels, animations, or camera cuts directly.

The AI decides:

- what it wants to do
- why it wants to do it
- what it is targeting
- how confident it is
- what memory influenced it

The runtime then translates that into:

- battle actions
- structure interactions
- pressure changes
- camera emphasis
- move callouts
- result splashes

So the correct split is:

- `AI decides intention`
- `the game resolves rules`
- `the presentation layer visualizes the result`

## 2. Why Full AI Control Is Wrong

If the AI invents every movement and scene on the fly:

- results become visually inconsistent
- the player cannot learn the game language
- balance becomes impossible
- readability collapses
- bugs become impossible to diagnose

AI should never be responsible for free-form cinematography in the core loop.

## 3. Why Full Scripting Is Also Wrong

If everything is pre-scripted:

- battles stop reflecting agent setup
- memory and RAG stop mattering
- repeated runs feel fake
- the squad does not feel alive

So Cogochi must not be a fixed animation reel.

## 4. Runtime Architecture

Battle runtime should be split into six layers.

### 4.1 Scenario Director

This defines the match frame.

It owns:

- scenario family
- objective
- turn limit or match horizon
- allowed data kinds
- stage modifiers
- rival profile template
- event schedule hooks

Example:

- `Breakout Push`
- objective = push through breakout gate
- stage modifier = bullish volume windows grant momentum

### 4.2 Market Simulator

This produces live battlefield state.

It owns:

- candles
- price delta
- volume surge
- funding bias
- open interest stress
- support and resistance condition
- liquidation cluster pressure
- volatility shock

This is the source of truth for:

- what the arena looks like now
- which hazards are active
- where momentum is building

### 4.3 Agent Decision Engine

This is where AI actually acts.

It consumes:

- current market packet
- scenario packet
- memory retrieval
- doctrine
- squad context

It outputs:

- intent
- target
- confidence
- thesis
- risk posture
- signature move hint

It does not output raw animation instructions.

### 4.4 Battle Grammar Compiler

This is the most important translation layer.

It converts AI intention into gameplay actions.

Examples:

- intent `LONG` + strong volume + breaker role
  - compile to `LONG_PUSH` + `BREAK_WALL`
- intent `SHORT` + rival exposed support
  - compile to `SHORT_SLAM`
- scout detects hidden stop pocket
  - compile to `SONAR_TAG`
- risk agent blocks reckless executor
  - compile to `RISK_VETO`

This compiler is what makes the game coherent.

### 4.5 Scene Resolver

This combines:

- scenario state
- market state
- unit action plans
- structural damage
- active hazards

into a single visible combat scene.

It owns:

- where agents stand
- what structure is breaking
- which direction pressure flows
- whether a trap has closed
- whether breakout is live
- who is currently advantaged

### 4.6 Presentation Director

This decides how to show important events.

It picks among:

- chartfield live mode
- command cut-in
- scan overlay
- impact emphasis
- capture moment
- victory splash

This layer should be rule-based, not improvisational.

## 5. The Golden Boundary

This boundary must be enforced:

### AI owns

- intention
- choice
- target preference
- confidence
- memory-influenced reasoning

### Game runtime owns

- collision
- stage event resolution
- objective progress
- trap trigger
- support break
- breakout success
- liquidation capture

### Presentation layer owns

- move naming
- cut-ins
- camera emphasis
- scan rings
- impact flashes
- victory splash timing

If these boundaries blur, debugging and tuning become impossible.

## 6. Runtime Data Flow

```text
ScenarioDirector
-> MarketSimulator
-> AgentContextBuilder
-> Retrieval
-> AgentDecisionEngine
-> BattleGrammarCompiler
-> ActionResolver
-> SceneResolver
-> PresentationDirector
-> AnimationLibrary
-> HUD and Battle View
-> Eval and Reflection
```

## 7. Per-Tick Runtime Loop

Each battle tick should work like this.

1. update market frame
2. update stage structures and hazards
3. gather agent context
4. retrieve memory
5. ask each agent for intention if needed
6. compile intentions into action plans
7. resolve collisions, support hits, trap triggers, and capture states
8. select presentation beats for significant events
9. emit a scene frame to the renderer
10. if objective or round end is reached, score and reflect

## 8. Data Contracts

These contracts are the runtime backbone.

### 8.1 `ScenarioFrame`

Defines the current match shell.

```ts
interface ScenarioFrame {
  scenarioId: string;
  family: 'BREAKOUT_PUSH' | 'RANGE_HOLD' | 'LIQUIDITY_HUNT' | 'MACRO_DEFENSE' | 'NEWS_SPIKE_RACE';
  objectiveLabel: string;
  objectiveProgress: number;
  allowedDataKinds: string[];
  stageModifiers: string[];
  round: number;
  tick: number;
}
```

### 8.2 `MarketFrame`

Defines the live market-to-stage state.

```ts
interface MarketFrame {
  regime: 'TREND' | 'RANGE' | 'VOLATILE';
  price: number;
  priceDelta: number;
  volumeImpulse: number;
  fundingBias: number;
  oiStress: number;
  supportIntegrity: number;
  resistanceIntegrity: number;
  breakoutReadiness: number;
  liquidationPressureTop: number;
  liquidationPressureBottom: number;
}
```

### 8.3 `AgentIntent`

This is what AI is allowed to produce.

```ts
interface AgentIntent {
  agentId: string;
  action: 'LONG' | 'SHORT' | 'FLAT';
  tacticalVerb:
    | 'SCAN'
    | 'TAG'
    | 'LOCK'
    | 'PUSH'
    | 'SLAM'
    | 'GUARD'
    | 'RIDE'
    | 'TRAP'
    | 'BREAK'
    | 'RESCUE';
  preferredTarget:
    | 'SUPPORT'
    | 'RESISTANCE'
    | 'BREAKOUT_GATE'
    | 'LONG_LIQ'
    | 'SHORT_LIQ'
    | 'RIVAL_LEAD'
    | 'CENTER_BOX';
  confidence: number;
  thesis: string;
  memoryIds: string[];
  signatureMoveHint?: string;
}
```

### 8.4 `BattleActionPlan`

This is produced by the compiler, not by AI directly.

```ts
interface BattleActionPlan {
  agentId: string;
  state:
    | 'LONG_PUSH'
    | 'SHORT_SLAM'
    | 'DEFEND_SUPPORT'
    | 'BREAK_WALL'
    | 'RIDE_BREAKOUT'
    | 'LAY_TRAP'
    | 'TRAP_CAUGHT'
    | 'LIQUIDATION_GRAB'
    | 'MEMORY_RECALL'
    | 'RISK_VETO'
    | 'RECOVER';
  targetId?: string;
  force: number;
  durationMs: number;
  presentationTag?: string;
}
```

### 8.5 `SceneEvent`

This is what the resolver emits.

```ts
interface SceneEvent {
  id: string;
  kind:
    | 'PRESSURE_UP'
    | 'PRESSURE_DOWN'
    | 'SUPPORT_HIT'
    | 'WALL_CRACK'
    | 'TARGET_REVEALED'
    | 'TRAP_TRIGGERED'
    | 'LIQUIDATION_CAPTURE'
    | 'BREAKOUT_RIDE'
    | 'PANIC'
    | 'VICTORY_BURST';
  actorIds: string[];
  targetIds: string[];
  intensity: number;
  position: { x: number; y: number };
  createdAt: number;
}
```

### 8.6 `PresentationBeat`

This is what the renderer uses to punctuate the fight.

```ts
interface PresentationBeat {
  id: string;
  mode:
    | 'CHARTFIELD'
    | 'COMMAND_CUTIN'
    | 'SCAN_OVERLAY'
    | 'IMPACT_VIEW'
    | 'CAPTURE_VIEW'
    | 'VICTORY_SPLASH';
  title?: string;
  subtitle?: string;
  focusAgentIds: string[];
  durationMs: number;
  priority: number;
}
```

## 9. How Reference-Style Moments Are Produced

The images you supplied imply very specific beats.

Here is how they should be produced.

### 9.1 Lock-on and liquidation reveal

Not hand-scripted.

Triggered when:

- scout or oracle intent compiles to reveal
- hidden liquidation zone exists

Runtime sequence:

1. AI emits `SCAN` or `TAG`
2. compiler maps to `MEMORY_RECALL` or reveal package
3. resolver emits `TARGET_REVEALED`
4. presentation director selects `SCAN_OVERLAY`
5. renderer shows:
   - crosshair
   - enemy label
   - liquidation line
   - named move banner

### 9.2 Breakout ride

Triggered when:

- price trend and volume support a breakout
- breaker or rider commits upward

Runtime sequence:

1. AI emits `LONG` + `RIDE`
2. compiler maps to `RIDE_BREAKOUT`
3. resolver raises breakout progress
4. presentation shows:
   - green launch arc
   - surf trail
   - breakout banner
   - wall crack or gate clear

### 9.3 Trap and maw capture

Triggered when:

- agent overextends into a false move
- liquidation pressure spikes against it

Runtime sequence:

1. market frame marks trap active
2. intent commits in the wrong direction
3. compiler or resolver produces `TRAP_CAUGHT`
4. if capture threshold is reached, escalate to `LIQUIDATION_GRAB`
5. presentation shows:
   - warning flash
   - hazard mouth/jaw
   - drag or swallow motion

### 9.4 Broken support and panic cascade

Triggered when:

- support integrity drops under threshold
- short pressure continues

Runtime sequence:

1. support wall takes hits
2. resolver emits `SUPPORT_HIT`
3. if threshold crossed, emit `WALL_CRACK` and `PANIC`
4. presentation shows:
   - red impact
   - floor fracture
   - falling or staggered units

## 10. Presentation Modes

Cogochi should support these modes during one match.

### 10.1 `CHARTFIELD`

Default live mode.

Shows:

- chart terrain
- units
- pressure vectors
- structures
- hazards

### 10.2 `COMMAND_CUTIN`

Short move highlight.

Shows:

- move name
- acting unit
- target emphasis

Use for:

- liquidation snipe
- short hammer
- breakout ride
- support hold

### 10.3 `SCAN_OVERLAY`

Tactical reveal layer.

Shows:

- sonar ring
- lock-on reticle
- hidden labels
- discovered zones

### 10.4 `IMPACT_VIEW`

Short emphasis on structures or collisions.

Shows:

- wall crack
- support break
- trap trigger
- candle smash

### 10.5 `CAPTURE_VIEW`

For liquidation or maw moments.

Shows:

- predator mouth or warning field
- dragged target
- liquidation alert

### 10.6 `VICTORY_SPLASH`

For decisive payoff moments.

Shows:

- squeeze clear
- breakout complete
- shower of reward effects
- win caption

## 11. Animation Library Rule

The renderer should not invent new move styles at runtime.

It should pick from a library.

Each move package should define:

- entry effect
- sustained effect
- impact effect
- camera cue
- HUD label

Example library keys:

- `move.liquidation_snipe`
- `move.sonar_tag`
- `move.resonant_tracker_scan`
- `move.seismic_wave`
- `move.short_hammer`
- `move.breakout_ride`
- `move.maw_capture`
- `move.support_hold`

## 12. Determinism And Replay

To keep battles debuggable and replayable:

- scenario inputs must be serializable
- market frames must be reproducible from seeds or logged state
- AI intents must be logged
- action plans must be logged
- scene events and presentation beats must be logged

That gives us:

- replays
- diagnosis
- compare-before-after training runs

## 13. Implementation Mapping

Recommended ownership:

- `scenarioDirector.ts`
  - scenario shell and event schedule
- `marketStageSimulator.ts`
  - market-to-stage frame updates
- `intentCompiler.ts`
  - AI intent -> battle action plan
- `battleActionResolver.ts`
  - action plan -> structure, unit, and event updates
- `presentationDirector.ts`
  - scene event -> presentation beat
- `animationLibrary.ts`
  - move package metadata
- `battleSceneStore.ts`
  - current scene frame and active presentation beat

The existing `battleEngine.ts`, `battleStore.ts`, and `chartBattleScene.ts` can evolve toward this split.

## 14. Acceptance Criteria

This spec is implemented correctly only if:

1. AI agents are choosing intentions, not raw animations
2. scenarios and market state shape the battle without making it feel scripted
3. the same scenario can produce different visible fights from different agent setups
4. reference-style moments like reveal, lock-on, trap, support break, and breakout ride are possible through runtime rules
5. a player can tell why a move happened and what changed because of it

## 15. Reading Relationship

Read this after:

- [MASTER_GAME_SPEC.md](/Users/ej/Downloads/maxidoge-clones/Cogochi/docs/MASTER_GAME_SPEC.md)

Then use:

- [CHART_BATTLE_SPEC.md](/Users/ej/Downloads/maxidoge-clones/Cogochi/docs/CHART_BATTLE_SPEC.md)
  - for stage objects and battle grammar
- [AI_RUNTIME_TRAINING_SPEC.md](/Users/ej/Downloads/maxidoge-clones/Cogochi/docs/AI_RUNTIME_TRAINING_SPEC.md)
  - for retrieval, context, reflection, and training
- [AI_IMPLEMENTATION_CONTRACTS.md](/Users/ej/Downloads/maxidoge-clones/Cogochi/docs/AI_IMPLEMENTATION_CONTRACTS.md)
  - for strict interfaces and runtime contracts
