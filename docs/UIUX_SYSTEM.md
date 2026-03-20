# Cogochi UIUX System

Last updated: 2026-03-18

The product and game priorities referenced here are defined in [MASTER_GAME_SPEC.md](/Users/ej/Downloads/maxidoge-clones/Cogochi/docs/MASTER_GAME_SPEC.md) and [STEAM_RELEASE_REFRAME.md](/Users/ej/Downloads/maxidoge-clones/Cogochi/docs/STEAM_RELEASE_REFRAME.md).
The final screen-level convergence with Maxidoge tone is locked in [MAXIDOGE_COGOCHI_FINAL_STRUCTURE.md](/Users/ej/Downloads/maxidoge-clones/Cogochi/docs/MAXIDOGE_COGOCHI_FINAL_STRUCTURE.md).

## 1. Experience Goal

Cogochi should feel like:

- a command deck full of recruitable agents on entry
- a training forge between upgrades
- a chartfield battle game during missions
- a prestige stable once the player owns proven agents

The center of gravity is not spectacle.

The center of gravity is ownership, choice, tuning, and diagnosis.

## 2. UX Priorities

### 2.1 The first screen must sell characters

- the player should see many candidate agents immediately
- multi-select must happen on the home screen

### 2.2 Growth choice comes before the match

- the player must decide what each chosen agent is trying to learn
- the growth-planning step must sit between selection and battle

### 2.3 The battle explains itself

- the player should see retrieved memory, not just animations

### 2.4 Every screen should imply the next action

- pin candidate
- set growth lane
- compact memory
- swap squad role
- run mission

## 3. Information Architecture

```text
/
  Command Deck
/roster
  Stable And Bench
/agent/[id]
  Agent Detail
/team
  Mission Prep
/battle
  Signal Mission
/lab
  Training Foundry
/market
  Rental Exchange
```

## 4. Screen Responsibilities

### `/`

Must show:

- bold top-level product promise
- current selected squad tray
- a rotating right-side wall of candidate agents
- fast multi-select without route changes
- one obvious CTA into the growth draft

### `/roster`

Must show:

- owned agent grid or stable list
- filters by role, growth lane, status, and readiness
- active, benched, and rentable states
- performance and memory health indicators

### `/agent/[id]`

This is the core screen.

It must show:

- agent identity
- base model
- prompt stack
- data bindings
- retrieval policy
- memory bank preview
- training history
- recent evaluation logs

### `/team`

Must behave as a mission prep board:

- scout
- analyst
- risk
- executor
- squad synergy
- mission objective

### `/battle`

Must show:

- main chart battlefield in the center
- scenario goal and current market event
- agent positions, skills, and hazard zones
- limited intervention cards
- retrieved memory and reasoning in secondary drawers or side panes
- one clear result and next-action path at the end

The detailed battlefield translation grammar lives in [CHART_BATTLE_SPEC.md](/Users/ej/Downloads/maxidoge-clones/Cogochi/docs/CHART_BATTLE_SPEC.md).

### `/lab`

Must show:

- data source setup
- prompt variants
- memory compaction controls
- training queue
- benchmark presets
- visible progress toward the next training upgrade

### `/market`

Must show:

- only proven agents
- trust and lineage markers
- versioned performance proof
- rental status and demand

## 5. Visual Direction

### Mood

- deep terminal-dark foundation
- signal green and restrained red for combat clarity
- brighter, more collectible color pops on character cards
- strong contrast between recruitable agents and owned agents

### Typography

- display: Orbitron or equivalent
- data and metrics: JetBrains Mono
- body: current readable sans

### Panels

- hard-rounded technical panels
- visible section hierarchy
- stronger contrast between current state and historical logs
- the home screen should feel more alive than the settings screens

### Battle scenes

- chart layer first, panel chrome second
- objective and advantage must be readable in under 3 seconds
- runtime battle density must stay cleaner than promo art

## 6. Interaction Rules

### Selection

- selected agent should remain visually pinned across routes when relevant
- multi-select should be obvious and reversible
- home-screen selections should persist into team and lab

### Editing

- prompt and policy edits can autosave
- large training actions should create a queued run card
- growth-lane choice should be faster than full prompt editing

### Battle feedback

- retrieved memory cards should be visible per phase
- reasoning and score changes should be traceable
- the result view should link directly to the affected agents
- the result view should also return the player to the command deck with visible changes

## 7. Mobile Rules

- roster becomes a stacked list with sticky filters
- agent detail becomes tabbed
- battle collapses detail panes into drawers
- squad assignment becomes tap-first, not drag-first

## 8. UX Check Questions

1. does the first screen look like agent operations rather than a spectator dashboard
2. does the first screen make selecting several agents feel exciting
3. can the player understand an agent's setup from one detail screen
4. can the player see retrieved memory during evaluation
5. does a failed match suggest a next training action
