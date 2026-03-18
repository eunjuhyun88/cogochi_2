# Steam Ship Blueprint

Purpose:
- Detailed product, UX, and GTM blueprint for shipping this project as a real Steam game.
- Extends `steam-ready-game-reset.md` with genre definition, player promise, session design, and release strategy.

Status:
- active canonical support for the current release target

## Product Definition

This should ship as a **trading strategy lab game with an AI companion**, not as a trading dashboard.

Working genre:
- companion strategy
- run-based forecasting encounters
- meta-progression through agent specialization

Store-facing promise:
- Build an AI trading agent from your own strategy.
- Backtest it and simulate it.
- Tune it until the next run gets better.
- Prove it under pressure.
- Grow a specialist worth keeping or renting out.

## What It Must Not Feel Like

It must not feel like:
- a crypto wallet onboarding flow
- a multi-tab operator dashboard
- a terminal tool with game skin on top
- a fake battle minigame disconnected from the player's decisions

If the player thinks "this is a finance UI" before they think "this is a game," the product is not ready for Steam.

## Steam-Appropriate Positioning

### Primary ICP

Players who already enjoy:
- system-heavy single-player strategy
- deckbuilder and roguelite decision loops
- mastery through repeated runs
- interpretable stats, builds, and post-run review

Closest behavioral neighbors:
- `Balatro`
- `Slay the Spire`
- `FTL`
- `Into the Breach`
- `Luck be a Landlord`

### Secondary ICP

Players who are:
- crypto-curious
- market-sim curious
- interested in AI companions or build optimization

### GTM Implication

The game should be marketed first as a **strategy game with a novel market signal theme**.

Do not lead with:
- wallet
- token
- copy trading
- monetization
- model marketplace

Those can exist later as optional depth or external web companion layers.

## Apple-Grade UX Direction

### Interface Principles

1. One dominant action per screen.
2. Fewer nouns, stronger verbs.
3. Large type for meaning, small type for metadata only.
4. Empty space should create focus, not expose missing content.
5. Every panel must justify its existence through action or consequence.
6. Repeated cards that only restate navigation must be removed.
7. Real game state should be more visually dominant than chrome.

### Visual Grammar

- `Home`: editorial landing with one clear continue action
- `Mission`: guided operational shell with explicit step state
- `Arena`: the most game-like screen in the product
- `Agent HQ`: reflective, evidence-rich, lower-adrenaline surface
- `Market`: optional public discovery surface, visually subordinate to the core game loop

### UI Smells To Eliminate

- tiny condensed labels everywhere
- wallet/connect controls visually equal to the main CTA
- duplicate surface cards under global nav
- multiple same-weight hero cards on first fold
- battle screens where data chrome is louder than the playable field

## Core Game Loop

Using MDA and Steam retention logic, the core loop should be:

1. choose a build direction
2. configure the agent
3. run a backtest
4. run a simulation
5. compare results
6. adjust the agent
7. prove it in Arena

### Micro Loop

`parameter change -> run starts -> result appears -> delta becomes legible`

Length:
- `[target]` 30 to 90 seconds

### Core Loop

`configure -> backtest -> simulate -> modify -> rerun -> prove`

Length:
- `[target]` 8 to 15 minutes

### Meta Loop

`specialize agent -> unlock traits -> improve record -> tackle harder mission sets`

Length:
- multi-session

## Player Fantasy

The player fantasy is not "I opened a terminal."

The fantasy is:
- I am turning my strategy into an agent
- I can feel its judgment sharpen through testing
- each run produces evidence, not just spectacle
- I am building a companion that becomes mine through performance

That means:
- identity must compound
- results must matter
- reflection must be legible
- upgrades must feel earned

## First 30 Minutes

### First 3 Minutes

The player should:
- understand the fantasy
- see one active agent
- click `Start Mission`
- enter a guided setup flow

### First 10 Minutes

The player should:
- choose an agent shell
- set one or two doctrine traits
- complete one short backtest or simulation
- understand that the next run can change because of those settings

### First 30 Minutes

The player should:
- clear at least one full test loop
- see a before/after result card with explicit deltas
- unlock one visible specialization or trait change
- reach `Agent HQ` and understand why a second run would differ

If the first 30 minutes end without a memorable improvement screen, the game has no Steam hook yet.

## Release IA

### Home

Job:
- explain the promise
- show the current agent
- offer one clear next step

Primary CTA:
- `Start Mission`

Secondary actions:
- `Resume Training`
- `Enter Arena` only if the player already has a valid run state

### Mission

Job:
- move the player through setup, testing, and the next playable proof moment

Internal steps:
1. `Create`
2. `Lab`
3. `Arena`

Requirement:
- these must feel like one shell with progress state, not three unrelated pages

### Agent HQ

Job:
- convert outcome into attachment and long-term progression

Internal sections:
1. `Overview`
2. `Training`
3. `Record`

Requirement:
- this is where proof becomes identity

### Lab-First Rule

The center of gravity cannot be the battle screen alone.

The paid and sticky behavior should come from:
- running more tests
- comparing variants
- seeing which change improved performance

Inference:
- the product becomes more game-like when the player is chasing a better next model, not only a single win.

### Market

Job:
- optional public discovery and proof browsing

Requirement:
- never compete with the core loop for first-session attention

## Arena Design Direction

Arena is the real product test.

If Arena does not feel like a game, the rest of the stack reads as software.

### Arena Must Deliver

- immediate legibility of the current situation
- one meaningful decision at a time
- visible consequence
- phase clarity
- post-run reflection

### Arena Must Not Deliver

- giant pre-match lobby clutter
- multiple equivalent view modes at first contact
- tiny unreadable labels
- dense HUD chrome that hides the actual playfield

### Arena V1 Release Scope

For the Steam ship target, Arena should focus on:
- one main battle presentation
- one clear mission card
- one compact combat log
- one result summary path

Not on:
- tournaments
- bracket-heavy meta systems
- mode proliferation
- overly complex side panels

## Steam Release Scope

The honest target is **Early Access**, not full 1.0.

### Early Access V1 Should Include

- one clean Home
- one Mission shell
- one stable Arena loop
- one Agent HQ
- one playable starter agent set
- one clear difficulty ladder or encounter progression track
- one reason to replay

### Early Access V1 Should Exclude

- wallet-required onboarding
- broad marketplace complexity
- too many side routes
- every experimental Arena mode
- monetization-first UX

## Content Needed For A Real Steam Page

Before shipping, the product needs:
- a one-sentence genre label
- five screenshot-worthy moments
- one 45 to 75 second trailer structure
- one clear Early Access explanation
- a store description that explains the loop without crypto jargon

### Screenshot Set

1. Home with strong fantasy and agent showcase
2. Mission flow with clear step progression
3. Arena combat with readable playfield
4. Result screen with consequence and reward
5. Agent HQ showing progression and specialization

## GTM Motion

### Launch Motion

Recommended motion:
- `PLG` through demo and replayability
- `CLG` through devlogs, Discord, and playtest feedback

Do not rely on token-led growth for Steam.

### Channel Priority

1. Steam page and wishlist conversion
2. playable demo or closed playtest
3. X / Discord devlog loop
4. creator coverage from strategy-game audiences
5. crypto-native communities as secondary amplification, not primary validation

### Messaging Hierarchy

Message order:
1. train an AI companion
2. survive high-pressure signal encounters
3. evolve a specialist through repeated runs
4. optional public proof and market layers

## Ship Gates

The product should not be treated as Steam-ready until all of these are true:

1. New players can explain the loop after one session.
2. `[target]` Median time to first Arena result is under 12 minutes.
3. `[target]` First-session completion to one full run is above 60% in playtests.
4. `[target]` At least 3 out of 5 testers voluntarily start a second run.
5. The top nav does not expose implementation nouns the player should not care about.
6. Wallet connect is optional and visually secondary.
7. Arena screenshots look like a game, not a tool.

## Current Strategic Priority

In order:

1. Make `Mission` a real guided shell
2. Make `Arena` read like a game
3. Make `Agent HQ` create attachment and replay desire
4. Remove wallet-first and market-first friction from the main loop
5. Build a store-page-quality visual identity around those three screens

## Read With

- `docs/design-docs/steam-ready-game-reset.md`
- `docs/SYSTEM_INTENT.md`
- `docs/PRODUCT_SENSE.md`
- `docs/product-specs/home.md`
- `docs/product-specs/create-agent.md`
- `docs/product-specs/arena.md`
- `docs/product-specs/agents.md`
