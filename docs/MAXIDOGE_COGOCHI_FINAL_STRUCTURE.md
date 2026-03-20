# Maxidoge x Cogochi Final Structure

Last updated: 2026-03-19

This document locks the final convergence direction:

- keep `Cogochi` as the product and repo
- import only the strongest `Maxidoge` interaction and tone patterns
- center the game around `Lab -> delta -> rerun`
- demote battle from main activity to proof activity

This is the current system-of-record for the player-facing structure.

## 1. Product Decision

Do not merge the products conceptually.

The right move is:

- `Cogochi` keeps the product logic, AI training fantasy, and repo
- `Maxidoge` contributes tone, liveliness, terminal energy, and selection UX

This means:

- no full port of Maxidoge routes
- no loss of Cogochi training systems
- no pure dashboard front door

## 2. Final Product Read

The game is not:

- a battle game with AI flavor
- a crypto dashboard with mascots
- an autonomous hedge fund toy

The game is:

> a trading-agent lab game where the player builds AI agents from strategy archetypes,
> repeatedly tests them, improves them, proves them in battle, and only later rents them out.

## 3. Main Fantasy

> I build my own AI trading agents, run them through repeated tests, and make them better than before.

The emotional promise is:

- `this is my squad`
- `this is my doctrine`
- `I changed the setup`
- `the next run really improved`

If the player only feels `I watched a battle`, the product is off target.

## 4. What To Keep From Cogochi

- squad-based agent ownership
- growth lanes
- memory banks and retrieval
- training runs
- benchmark and artifact lineage
- battle as proof
- rental as late prestige

## 5. What To Import From Maxidoge

Import these patterns from Maxidoge:

- a stronger living front door
- a more aggressive hero section
- a right-side rotating cast wall
- terminal/war-room visual energy
- live market chips and status rails
- clearer CTA hierarchy

Concrete source references:

- home hero framing: [frontend/src/routes/+page.svelte](/Users/ej/Downloads/maxidoge-clones/frontend/src/routes/+page.svelte)
- lab/workbench framing: [frontend/src/routes/lab/+page.svelte](/Users/ej/Downloads/maxidoge-clones/frontend/src/routes/lab/+page.svelte)
- terminal/war-room interaction density: [frontend/src/components/terminal/WarRoom.svelte](/Users/ej/Downloads/maxidoge-clones/frontend/src/components/terminal/WarRoom.svelte)

## 6. What Not To Import

Do not import:

- wallet-first onboarding
- operator-heavy terminal controls
- raw strategy jargon as first-run UX
- live execution or copy-trade framing as a front-door promise
- market panels that compete with the core loop

Maxidoge is good reference material for tone.
It is not the player-facing product model.

## 7. Core Loop Lock

The final core loop is:

`select -> setup -> backtest -> simulate -> modify -> rerun -> battle proof -> promote -> rent later`

The most important CTA in the whole product is:

`Run Again`

Not:

- `Fight`
- `Mint`
- `Rent`
- `Open Market`

## 8. Primary Aesthetics

Using the game-feel lens, the primary aesthetics are:

- `Challenge`
- `Expression`

Secondary:

- `Competence`
- `Discovery`

This means the product must reward:

- making a build choice
- seeing the build express itself in data
- watching a revised setup outperform the previous version
- discovering better archetype combinations

## 9. Final Information Architecture

- `/` -> Home / Recruitment Wall
- `/team` -> Setup / Growth Draft
- `/lab` -> Trading Lab
- `/battle` -> Arena Proof
- `/agent/[id]` -> Agent HQ
- `/market` -> Rental Market

Optional later:

- `/world` -> historical progression map

The world map is not the front door.

## 10. Screen Specs

### `/` Home / Recruitment Wall

Purpose:

- choose several agents fast
- feel immediate attachment
- move into setup

Structure:

- left: bold fantasy promise and selected squad tray
- center: current pinned squad / mission teaser
- right: rotating wall of dozens of candidate agents
- top: live market chips and command nav
- bottom: one obvious CTA to setup

Required behaviors:

- right wall rotates even when idle
- player can multi-select from home
- selected agents pin instantly
- at least 3 to 4 agents can be chosen without route changes

Tone source:

- Maxidoge home hero, cast wall, live chips

### `/team` Setup / Growth Draft

Purpose:

- answer `what exactly am I teaching this squad`

Structure:

- one card per chosen agent
- choose growth lane
- choose doctrine bias
- choose risk posture
- show squad role map
- show expected synergy and weakness

Outputs:

- saved training setup
- recommended first benchmark pack

### `/lab` Trading Lab

Purpose:

- this is the main game screen
- player should spend the most time here

The first viewport must show:

- current benchmark pack
- selected variant
- `before / after / delta`
- `run local backtest`
- `run simulation`
- one obvious `next tweak`

The second layer shows:

- training queue
- benchmark manifests
- proof artifacts
- memory health
- dataset lineage

This screen should feel like:

- Maxidoge terminal tone
- Cogochi training logic

Critical rule:

- every run must produce visible change
- if there is no visible delta, the loop is broken

### `/battle` Arena Proof

Purpose:

- prove the build under pressure

Structure:

- arena first
- mission brief second
- combat feed third
- scenario detail collapsible

Critical rule:

- battle is short
- battle validates lab work
- battle should send the player back to lab or setup with a clear lesson

### `/agent/[id]` Agent HQ

Purpose:

- show whether the agent is improving enough to become a prestige asset

Must show:

- version history
- doctrine history
- artifact lineage
- benchmark deltas
- battle proof history
- rental readiness

This is where the player sees:

- `v1 -> v2 -> v3`
- `what changed`
- `what worked`

### `/market` Rental Market

Purpose:

- monetize proven agents only

Entry condition:

- only agents with enough proof, trust, and readiness should appear here

The market must never be the onboarding screen.

## 11. UI Tone And Manner

Lock these visual rules:

- terminal-dark base
- chart-first composition
- bright accent rails and live chips
- collectible character cards with stronger color pops
- Orbitron + JetBrains Mono stack
- bolder hero copy than current Cogochi

The key balance:

- keep charts and terminal seriousness
- add Maxidoge liveliness and instant character appeal
- do not drift into casino UI

## 12. Monetization Position

[추정] The paid value should attach to experimentation depth, not to access itself.

Best paid surfaces:

- more backtest windows
- more simultaneous simulation slots
- longer replay/history packs
- saved variants and compare slots
- premium evaluation reports
- premium data packs

Late-stage monetization:

- rental listing
- marketplace take rate

Do not lead with:

- token
- yield
- rent income

Lead with:

- build better agents
- prove better models

## 13. GTM Read

Primary ICP:

- trader-curious users who want AI strategy experimentation without full quant tooling

Secondary ICP:

- game-native users who like squad building, optimization, and progression

The launch message should be:

> Build a trading AI squad. Test it. Improve it. Prove it.

Not:

> Rent AI traders and earn.

That is endgame messaging, not acquisition messaging.

## 14. Ship Gate

Do not call the build ship-ready until all of these are true:

- home clearly reads as multi-agent recruitment
- setup clearly answers what is being taught
- lab visibly shows before/after delta on every run
- battle clearly reads as proof, not the whole game
- agent HQ shows versioned improvement
- market is gated behind proof

## 15. Implementation Priority

1. rebuild `/` around rotating candidate wall and multi-select tray
2. strengthen `/team` into a real setup screen
3. turn `/lab` into the unquestioned core screen
4. keep `/battle` short and proof-oriented
5. upgrade `/agent/[id]` into version/proof HQ
6. leave `/market` until proof and HQ are credible

## 16. One-Line Lock

> Use Maxidoge to make Cogochi feel alive.
> Use Cogochi to make Maxidoge’s energy actually playable.
> The center of gravity is the Lab.
