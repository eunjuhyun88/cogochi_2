# Trading Agent Lab Loop

Purpose:
- Re-center the Steam release around the strongest player fantasy: building a personal AI trading agent, testing it repeatedly, and watching it genuinely improve.
- Prevent the product from drifting into a battle-first game or a dashboard-first tool.

Status:
- active canonical support for the current Steam release target

## Product Thesis

This should ship as a **trading strategy lab game** with an agent-growth shell.

The player is not here mainly to:
- win one flashy battle
- browse many dashboards
- connect a wallet

The player is here to:
- encode a strategy
- turn it into an agent
- test it through backtests and simulations
- adjust the setup
- see whether the next run actually got better
- eventually prove that the agent is good enough for someone else to rent

## Main Fantasy

The core fantasy is:

> My strategy becomes an AI agent.  
> I keep testing it until it becomes a model I trust.

The emotional reward is not just:
- "I won"

It is:
- "The change I made mattered"
- "The next simulation improved because of my decision"
- "I am shaping a better trading model over time"

If players feel they are only clicking through one-off battles, the release is missing the point.

## Core Loop

Canonical loop:

1. `Choose`
2. `Configure`
3. `Backtest`
4. `Simulate`
5. `Modify`
6. `Run again`
7. `Prove in battle`

Short form:

`select -> set -> test -> simulate -> tune -> rerun -> prove`

Important rule:
- `battle proof` is the capstone, not the center of gravity
- the center of gravity is repeated testing and measurable improvement

## Where The Game Becomes Fun

The game is not most fun when:
- one encounter is dramatic

The game is most fun when:
- the player changes a setting
- reruns the agent
- sees a better curve, better score, better survivability, or better precision

That means the real reward structure must be:
- before/after comparison
- visible deltas
- clear attribution
- repeated iteration

In plain terms:
- the product needs to make "I tuned it and it got better" feel addictive

## Dominant Player Question

Every major screen should answer one of these:

1. What agent am I building?
2. What did I change?
3. Did that change improve results?
4. What should I test next?

If a screen cannot answer one of those, it is likely secondary chrome.

## Revised Surface Model

### Home

Job:
- present the cast
- let the player pick multiple characters
- make the next action obvious

Fantasy:
- "I am drafting possible trading companions"

### Create / Setup

Job:
- choose the lead
- decide what kind of strategy to grow
- lock the first doctrine

Fantasy:
- "I am defining what this model tries to be good at"

### Lab

This becomes the true core surface.

Job:
- configure strategy parameters
- compare prior runs
- launch backtests and simulations
- show whether changes helped

Fantasy:
- "I am iterating on my own agent"

Required elements:
- preset + custom strategy setup
- backtest queue
- simulation queue
- before/after result comparison
- clear "run again" CTA

### Battle / Arena

Job:
- convert lab confidence into live proof
- create tension and legitimacy

Fantasy:
- "Now the model gets tested under pressure"

Rule:
- Arena should validate the loop, not replace it

### Agent HQ

Job:
- show improvement history
- show current specialization
- show readiness for public release or rental

Fantasy:
- "This agent has a real performance story now"

### Market

Job:
- rent proven agents
- expose public proof
- make monetization feel earned

Fantasy:
- "This is valuable because it has evidence"

## What Must Change In The Current Product

### 1. Mission must become lab-first

Current risk:
- `battle` still reads too central

Required change:
- the main progress shell should feel like:
  - `Roster`
  - `Setup`
  - `Lab`
  - `Arena`
  - `HQ`

Not:
  - `Home`
  - `Terminal`
  - `World`
  - `Arena`
  - `Passport`

Implementation implication:
- keep terminal and chart tone
- rename their meaning in the journey
- terminal becomes the player-facing `Lab`

### 2. Improvement must be more visible than action

Current risk:
- lots of UI explains what the agent is
- not enough UI proves the agent improved

Required change:
- every testing surface needs:
  - baseline result
  - current result
  - delta
  - "why it changed"

### 3. Backtest and simulation must earn the purchase

The monetizable behavior is not:
- clicking around the shell

It is:
- running many experiments
- saving variants
- comparing outcomes
- promoting the winners

Therefore the paid value should concentrate on:
- more backtest volume
- more simulation slots
- better comparison views
- saved model variants
- premium evaluation reports

Inference:
- this is stronger than monetizing one-off battle cosmetics because it aligns directly with the fantasy and repeated use

### 4. Rental must be downstream of proof

Rental is important, but it is not the opening fantasy.

Correct order:
1. build
2. test
3. improve
4. prove
5. rent

If rental appears before the player trusts the agent, it reads like web3 monetization instead of game payoff.

## Apple-Grade UX Implications

### What to preserve

- terminal tone
- chart-first visual language
- dark editorial console mood
- strong typography and mono metadata

### What to remove

- equal-weight surfaces that all feel primary
- decorative battle framing that hides the actual iteration loop
- public-market language before the player has evidence
- any panel that explains without helping decide

### Visual hierarchy rule

Across the product:
- charts and result deltas should dominate
- controls should be compact and decisive
- proof should be larger than metadata
- wallet and public-market controls should stay secondary

## GTM Positioning

Best external framing:

> Build your own AI trading agent.  
> Backtest it, simulate it, improve it, and prove it.

This is stronger than:
- "battle market whales"
- "wallet-connected AI pet"
- "crypto dashboard game"

Because it maps to a clearer paid behavior:
- repeated model iteration

## Monetization Direction

Primary paid behavior:
- pay to run more serious testing and simulation

Good paid units:
- simulation packs
- saved variants / model slots
- premium evaluation reports
- advanced strategy modules
- pro backtest history / comparison tools

Secondary monetization:
- rental marketplace for proven agents

Rule:
- revenue should come from helping players improve their agents faster and more deeply

## Steam Release Gate

For Steam Early Access, the game must already be playable and worth its price in its current state, not only based on future promises. That means the initial paid build must already include a satisfying loop of:
- build
- test
- compare
- improve
- prove

Source:
- Steamworks Early Access documentation: [Early Access](https://partner.steamgames.com/doc/store/earlyaccess)

## Release Slice Recommendation

The first Steam-worthy slice should include:

1. Draft multiple characters on Home
2. Pick one lead and growth path
3. Enter Lab and change real strategy parameters
4. Run at least one backtest and one simulation
5. See a before/after delta view
6. Enter one Arena proof run
7. Land in Agent HQ with a visible performance story

If step 4 and step 5 are weak, the whole product will still feel like a themed shell instead of a game.

## Design Rule To Hold

When tradeoffs appear, prioritize this question:

> Does this make the player want to run one more experiment?

If yes, it supports the product.
If not, it is likely secondary.
