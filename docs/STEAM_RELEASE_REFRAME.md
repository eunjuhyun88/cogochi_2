# Cogochi Steam Release Reframe

Last updated: 2026-03-18

This document reframes Cogochi around a releaseable player-facing flow.
The current final convergence with Maxidoge tone and Lab-first structure is captured in [MAXIDOGE_COGOCHI_FINAL_STRUCTURE.md](/Users/ej/Downloads/maxidoge-clones/Cogochi/docs/MAXIDOGE_COGOCHI_FINAL_STRUCTURE.md).

It keeps the chart battlefield, training fantasy, and long-term agent economy, but changes the front door so the game reads as a real game on first contact instead of a tools console.

## 1. Product Decision

Cogochi should not open on a world map or a dense lab screen.

The first click must be choosing agents.

The correct release read is:

`see interesting agents -> pick several -> decide how they grow -> train -> fight -> reflect -> promote -> rent later`

Historical eras, whale bosses, and the world map remain important, but they are mid-game structures. They should not be the first surface the player meets.

## 2. What Stays, What Changes

### Keep

- chart-as-battlefield combat language
- historical eras and whale boss encounters
- limited intervention cards during battle
- per-agent memory and post-match reflection
- real training fantasy where the agent improves from accumulated battle data
- long-term rental and prestige fantasy

### Change

- single-agent-first framing -> squad-first framing
- static roster browser -> rotating recruitment gallery
- lab as a side screen -> growth planning as a mandatory pre-battle step
- battle as the only exciting surface -> character selection, growth, and promotion are all exciting surfaces
- economy promise early -> economy promise late

### Remove From The First 15 Minutes

- token language
- rental pricing decisions
- dense benchmark tables
- large world traversal overhead
- too many raw market metrics before the player owns a crew

## 3. Release Pillars

### 3.1 Characters Sell The Game

The player must meet memorable agents before they meet systems.

Implications:

- the home screen is a living recruitment wall
- agents need strong silhouettes, roles, and one-line fantasies
- the player should be able to multi-select candidates immediately

### 3.2 Growth Choice Comes Before Combat

Winning should begin with a growth decision, not only with a battle input.

Implications:

- after selection, the player chooses what each agent is trying to learn
- this step must be short, legible, and consequential
- "what am I teaching this squad?" must always be answerable

### 3.3 Battles Are Short Proof Moments

Battles validate the setup. They do not carry the entire game.

Implications:

- first battle should happen within 5 to 8 minutes
- a normal mission should resolve in 90 to 180 seconds
- the player should leave a battle with one obvious next action

### 3.4 Improvement Must Be Visible Immediately

The player must see what changed after every run.

Implications:

- memory cards, bond, growth track, and role mastery change on the result screen
- the next recommended training action is explicit
- the player can tell which chosen agent improved and why

### 3.5 Rental Is Prestige, Not Onboarding

Making money is an endgame promise, not the first reason to stay.

Implications:

- the game first sells ownership, mastery, and identity
- rental unlocks only after meaningful proof and trust data exist
- GTM messaging leads with game fantasy, not yield fantasy

## 4. Core Loops

### 4.1 New Front-Door Loop

`recruit -> select -> assign growth lanes -> run training -> fight -> reflect -> keep or promote`

### 4.2 Session Loop

`scan rotating candidates -> pin 3 to 4 agents -> pick one growth plan per agent -> run one short mission -> inspect reflection -> queue one training action`

### 4.3 Long-Term Loop

`build a bench -> specialize a squad -> beat harder eras and whale bosses -> create prestige agents -> unlock rental demand`

## 5. First 15 Minutes

### Minute 0 to 2: Recruitment Wall

The first screen is a command deck.

Left column:

- one-sentence promise
- current run objective
- selected squad tray
- primary CTA: `Select Agents`

Right column:

- continuously rotating wall of 10 to 16 candidate agents
- each card shows archetype, one-line fantasy, trait, and rarity
- clicking a card pins it into the squad tray without leaving the screen

Required behavior:

- the wall keeps changing even when idle
- selected cards stay pinned
- at least 3 agents can be chosen from the home screen

### Minute 2 to 4: Growth Draft

After selection, the player chooses one growth lane per agent:

- `Signal Hunter`
- `Risk Guardian`
- `Pattern Oracle`
- `Momentum Rider`
- `Breaker`
- `Stability Core`

Each growth lane changes:

- which signals are prioritized
- what memories are weighted
- which intervention synergies become stronger

### Minute 4 to 6: Quick Training

The game runs a short training or calibration flow:

- simulate one pattern pack
- show one or two memory cards being written
- reveal one clear strength and one weakness

The player should feel:

- "this squad is becoming mine"

### Minute 6 to 8: First Mission

The player enters a short whale mission or benchmark duel.

The battle must:

- resolve quickly
- expose one memorable decision
- allow one intervention moment
- make the chart feel alive

### Minute 8 to 10: Reflection

The result screen must show:

- mission result
- changed agent state
- what the squad learned
- one recommended next action

### Minute 10 to 15: Return To Home With More Desire

The player returns to the command deck and sees:

- new candidates rotating in
- upgraded selected agents
- a newly unlocked mission or growth lane

The home screen itself becomes a retention loop.

## 6. Information Architecture

Release-facing IA:

- `/` -> Command Deck and Recruitment Wall
- `/roster` -> Stable and Bench
- `/agent/[id]` -> Agent Detail and Lineage
- `/team` -> Mission Prep and Role Assignment
- `/lab` -> Training Foundry
- `/battle` -> Signal Mission
- `/market` -> Rental Exchange

Mid-game or later:

- `/world` -> Historical Era Map

The world map is not the first route anymore. It becomes a structure the player earns into.

## 7. Screen Responsibilities

### `/`

Must do five things at once:

- sell the fantasy immediately
- show a rotating wall of candidates on the right side
- support multi-select without route changes
- show the current squad tray
- push the player to the growth draft

### `/roster`

Must feel like a stable, not a dex.

Show:

- owned agents
- bench, active, and rentable states
- growth lanes
- recent memories
- readiness for training or promotion

### `/team`

Must answer:

- which agents are going on this mission
- what role each plays
- what squad synergy the player is pursuing

### `/lab`

Must answer:

- what the player is teaching
- what training data was produced
- when the next model update is ready

### `/battle`

Must prove:

- the selected squad matters
- the growth choices matter
- retrieved memory matters
- intervention is dramatic but limited

### `/market`

Must appear as prestige infrastructure, not as the game's soul.

Show:

- proven record
- trust and lineage
- demand and rental rate
- versioned performance proof

## 8. What This Means For The Existing GDD

The existing world-map and whale-battle structure is useful, but it cannot be the whole product frame.

Three concrete corrections are required:

1. The game is currently too battle-forward at the top of the funnel.
   The release version needs recruitment and growth choice before the first battle.

2. The game is currently too single-agent in how it emotionally reads.
   The release version must make squad assembly and bench management core fantasy.

3. The rental economy is currently too visible too early.
   It should be treated as a mastery payoff after proof, not as the first promise.

## 9. GTM Framing

### Positioning

Cogochi should be positioned as:

`an AI squad-raising strategy game where you recruit signal fighters, train their instincts, and send them into chart-shaped battles`

### Acquisition Message

Lead with:

- recruit distinct agents
- shape how they think
- watch them grow stronger
- prove them in battles

Do not lead with:

- yield
- token
- renting for money

That monetization angle is a retention and aspiration layer, not the acquisition hook.

### Trailer Or Store Page Beat Order

1. memorable agents rotating on the command deck
2. fast multi-select squad creation
3. growth lane choice
4. chart battle spectacle
5. visible post-battle learning
6. prestige promotion and rental tease

## 10. Build Order

### Vertical Slice Priority

1. Rebuild `/` as the command deck with rotating right-side agent wall and multi-select tray.
2. Add a growth-draft step between selection and battle.
3. Compress the first battle into a short proof mission.
4. Make reflection update agent state visibly.
5. Gate market and rental behind later progression.

### Do Not Do First

- full world map polish
- full rental marketplace depth
- token-driven meta
- giant data dashboards

The releaseable game is won or lost by the front door, not by the endgame economy.
