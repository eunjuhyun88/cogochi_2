# Cogochi Master Game Spec

Last updated: 2026-03-07

This is the product-level source of truth for Cogochi.

If older docs make the game feel like:

- a spectator dashboard
- a generic autobattler
- a thin wrapper around trading metrics

this document wins.

## 1. Product Definition

Cogochi is a game where the player raises named AI agents, tunes their data, memory, doctrine, and retraining, assembles them into a squad, and sends them into a chart-shaped battlefield where market pressure is expressed as visible combat.

The product is not:

- a real trading terminal
- a stat-only battle simulator
- a pure AI ops console
- a passive animated chart viewer

The correct read is:

`my agents` -> `my setup` -> `my squad` -> `my battle` -> `my improvement`

## 2. Core Experience Stack

Cogochi has three stacked layers.

### 2.1 Layer 1: The game

This is the base layer.

The player:

- owns agents
- tunes them
- chooses a squad
- enters a scenario
- wins or loses through preparation and limited live intervention
- grows stronger over time

If this layer is weak, the product fails no matter how pretty the visuals are.

### 2.2 Layer 2: Role expression

Each agent should feel like a character with a job and a style.

The character is not just cosmetic.

Its role is visible in:

- what it notices
- what it tries to protect
- how it attacks
- how it reacts to traps
- what kind of market situations it excels at

This is where the "role-play" feeling comes from.

### 2.3 Layer 3: Spectacle

The market should be dramatized into readable action.

Examples:

- long pressure rises from below
- short pressure slams from above
- liquidation zones eat overextended units
- breakout runs feel like surfing a launch ramp
- bad calls feel like being trapped, dragged, or crushed

This layer is not the core system, but it is essential to the fantasy.

## 3. Player Fantasy

The player should feel all of the following:

- `this is my agent`
- `I trained it this way`
- `it reacts to the market in its own style`
- `my squad pushed the chart upward`
- `that loss happened because my read or setup was wrong`
- `I know what to change next`

If the player instead feels:

- `I watched numbers go up`
- `I clicked generic units`
- `the battle outcome was arbitrary`

the game is off target.

## 4. What The Player Is Actually Doing

The real game is:

1. choosing what an agent sees
2. choosing how it interprets what it sees
3. choosing how it remembers
4. choosing how four agents work together
5. choosing when to intervene during battle
6. interpreting the result and improving the agents

The player is not directly placing trades.

The player is acting as:

- trainer
- strategist
- systems tuner
- squad captain

## 5. Core Loops

### 5.1 Long-term loop

`obtain base model` -> `create agent` -> `specialize` -> `build squad identities` -> `unlock harder scenarios` -> `promote stronger artifacts` -> `beat tougher opponents`

### 5.2 Session loop

`inspect roster` -> `edit one or more agents` -> `run one battle` -> `watch what happened` -> `collect lessons` -> `queue one improvement`

### 5.3 Match loop

`scenario loads` -> `market becomes a stage` -> `agents read/retrieve/act` -> `price pressure becomes combat` -> `player uses limited cards` -> `objective resolves` -> `rewards and lessons write back`

## 6. Primary Player-Facing Systems

### 6.1 Agent ownership

The player owns `AgentInstance`, not anonymous species.

Each agent has:

- name
- model base
- role
- combat expression style
- doctrine
- memory bank
- training history
- bond
- specialization
- visible battle identity

### 6.2 Agent training

Training means:

- prompt and doctrine edits
- data binding changes
- retrieval tuning
- memory curation
- fine-tune and artifact promotion later

Training must visibly change future battle behavior.

### 6.3 Squad tactics

A squad is always a meaningful four-agent combination, not four random units.

The squad answers:

- who scouts
- who interprets
- who protects
- who commits

### 6.4 Chart battle

The chart is a stage.

The player sends the squad into a scenario where:

- price movement becomes terrain
- volatility becomes hazard
- support/resistance become structures
- order flow becomes pressure
- liquidation becomes a trap or predator

### 6.5 Growth

Growth includes:

- level
- bond
- specialization depth
- memory quality
- tool unlocks
- signature move unlocks
- better battle expression

## 7. Two-Layer Role System

Every agent has two roles at once.

This is essential.

### 7.1 Functional squad role

This controls the strategic job in the 4-slot team.

- `SCOUT`
- `ANALYST`
- `RISK`
- `EXECUTOR`

### 7.2 Combat expression role

This controls how that agent is visually and mechanically expressed on the battlefield.

- `PUSHER`
  - drives upward pressure
  - good at riding trend continuation
- `CRUSHER`
  - drives downward pressure
  - good at punishing weak support
- `GUARDIAN`
  - holds support zones
  - creates shields and anchors
- `BREAKER`
  - cracks resistance walls
  - excels at breakout finish
- `TRAPPER`
  - lures enemies into liquidation
  - excels in bait and fakeout scenarios
- `RIDER`
  - surfs momentum bursts
  - strongest when a move is already live
- `ORACLE`
  - exposes hidden pathing and false signals
  - enhances recall and timing clarity
- `MAW`
  - specializes in liquidation punish
  - turns panic into capture

An agent is not locked to one expression forever, but it should feel committed enough to have identity.

## 8. Agent Identity Model

An agent identity is made of:

- `Base Model`
  - example: Qwen base
- `Functional Role`
  - scout, analyst, risk, executor
- `Expression Role`
  - pusher, crusher, guardian, breaker, trapper, rider, oracle, maw
- `Doctrine`
  - behavioral laws the player imposes
- `Memory`
  - past cases and tactical lessons
- `Data View`
  - what the agent is allowed to see
- `Signature Moves`
  - visible actions that grow stronger over time

This combination is what makes the agent feel like a character rather than a config blob.

## 9. The Battlefield Thesis

The chart is not next to the battle.

The chart is the battle.

This means:

- candles are path and momentum
- volume is force
- support is a foothold
- resistance is a wall
- breakout is a climb or launch
- failed breakout is a fall
- liquidation is a mouth, trap, hole, or predator event
- violent upside is a ride
- violent downside is a collapse

The player should immediately understand:

- who is pushing upward
- who is pressing downward
- what objective is being fought over
- where a trap exists
- which agent is responsible for the current move

## 10. Stage Grammar

### 10.1 Vertical ownership rule

The battlefield should read vertically.

- player squad starts from the lower side of the chart
- rival squad starts from the upper side of the chart
- long pressure usually rises
- short pressure usually falls

This rule is more important than left-right cleanliness.

### 10.2 Structural objects

The stage can spawn:

- `Support Platform`
- `Resistance Wall`
- `Breakout Gate`
- `Range Box`
- `Long Liquidation Trap`
- `Short Liquidation Trap`
- `Volume Spring`
- `Volatility Storm`
- `Funding Bias Beam`
- `Macro Shock Beacon`

### 10.3 Dynamic objects

The stage can animate:

- ramping candles
- falling candles
- pressure arrows
- volume bursts from below
- slam strikes from above
- wall break fractures
- engulfing liquidation jaws
- support shield domes
- breakout rails

## 11. Market Event To Gameplay Mapping

| Market event | Gameplay translation | Visual read |
| --- | --- | --- |
| Bullish volume expansion | upward force source | energy rises from below |
| Bearish sell pressure | downward slam source | red mass presses from above |
| Support reclaim | safe foothold | agent braces and glows on a platform |
| Resistance rejection | wall collision | units bounce, crack, or get repelled |
| Breakout | launch path | units surf or leap along a rising rail |
| Breakdown | floor collapse | units slide, fall, or get buried |
| Long liquidation cluster | bullish trap opportunity | a green unstable zone can explode upward |
| Short liquidation cluster | bearish trap opportunity | a red unstable zone can explode downward |
| False breakout | bait | path looks open, then turns into a trap |
| Imminent liquidation | capture threat | maw/jaw/monster closes in on overextended unit |
| Trend continuation | momentum lane | pusher/rider units gain long runs |
| Volatility shock | chaos field | spells get interrupted and units stagger |

## 12. Battle Action Grammar

This is the most important translation layer.

Agent decisions must not end as text.

They must become action states.

### 12.1 Core action states

- `LONG_PUSH`
  - push from lower field toward upper objective
- `SHORT_SLAM`
  - slam from upper field toward lower structure
- `DEFEND_SUPPORT`
  - plant and protect a floor
- `BREAK_WALL`
  - attack the resistance gate
- `RIDE_BREAKOUT`
  - climb and accelerate on a trend rail
- `LAY_TRAP`
  - prepare a liquidation bait zone
- `TRAP_CAUGHT`
  - become stuck in a fake move or hazard
- `LIQUIDATION_GRAB`
  - get seized by maw/predator when overextended
- `MEMORY_RECALL`
  - flashback-driven buff or correction
- `RISK_VETO`
  - defensive cancel wave that stops reckless action
- `RECOVER`
  - pull back, regain balance, reset footing

### 12.2 Direction semantics

- `LONG_PUSH`
  - should visually originate from below and move upward
- `SHORT_SLAM`
  - should visually originate from above and move downward
- `RISK_VETO`
  - should feel like a shield, anchor, or cancel barrier
- `TRAP_CAUGHT`
  - should feel like slipping, sticking, or being pinned
- `LIQUIDATION_GRAB`
  - should feel like being eaten, dragged, or swallowed

### 12.3 Signature move presentation packages

The provided references imply a missing layer that must be designed explicitly:

named combat moves with readable battle callouts.

Cogochi battles should not only show vectors and zones.

They should also surface signature move moments such as:

- `LIQUIDATION SNIPE`
  - scout or oracle reveals a hidden liquidation line
  - visual package:
    - crosshair
    - lock-on beam
    - enemy weak-point label
    - short text callout
- `SONAR TAG`
  - reveal enemy identities, trap nodes, or hidden pressure
  - visual package:
    - expanding ring pulse
    - enemy outline highlight
    - found marker
    - reveal banner
- `RESONANT TRACKER-SCAN`
  - large-area scan that marks multiple targets or zones
  - visual package:
    - sweeping circular UI field
    - multiple red target reticles
    - zone labels appear on top of the chart
- `SEISMIC WAVE`
  - pressure shock that affects multiple targets or structures
  - visual package:
    - radial shock pulse
    - candle path shiver
    - support or wall fracture response
- `BREAKOUT RIDE`
  - executor or rider latches onto a live upward move
  - visual package:
    - curved green launch trail
    - unit surfing or being carried upward
    - breakout badge at the gate
- `SUPPORT HOLD`
  - guardian anchors the lower field and prevents collapse
  - visual package:
    - shield floor
    - stabilizing ring
    - support label brightens
- `SHORT HAMMER`
  - crusher or rival short force slams downward
  - visual package:
    - red hammer or sell candle impact
    - broken floor fragments
    - panic callout
- `MAW CAPTURE`
  - maw archetype catches a trapped or overleveraged unit
  - visual package:
    - jaw, monster, or swallowing portal
    - pull line toward the hazard
    - liquidation warning text

These moves are not only cosmetic.

Each move package must map to:

- one or more action states
- one role family
- one market condition
- one scoring implication

### 12.4 Combat verbs that must be visibly expressible

The battle needs a finite vocabulary of readable verbs.

At minimum, runtime should be able to show:

- `scan`
- `tag`
- `lock`
- `push`
- `slam`
- `guard`
- `ride`
- `bait`
- `trap`
- `reveal`
- `break`
- `rescue`
- `swallow`
- `panic`
- `squeeze`
- `win burst`

If the runtime cannot express these verbs, it will not match the references you supplied.

### 12.5 Failure and payoff states

The game must also explicitly support the emotional states shown in the reference images.

Required failure states:

- `BROKEN_SUPPORT`
- `FALSE_BREAKOUT`
- `OVEREXTENDED`
- `TRAP_CAUGHT`
- `LIQUIDATION_IMMINENT`
- `LIQUIDATION_GRAB`
- `PANIC_CASCADE`

Required payoff states:

- `SHORT_SQUEEZE_POP`
- `BREAKOUT_CLEAR`
- `WALL_SHATTER`
- `SUPPORT_HELD`
- `TARGET_REVEALED`
- `MULTI_TARGET_LOCK`
- `VICTORY_RIDE`

## 13. Match State Machine

The full match loop should use these phases:

1. `SCAN`
   - reveal current market structure and dynamic objective
2. `RECALL`
   - retrieve relevant memory and doctrine
3. `PLAN`
   - assign which agents will push, guard, trap, or break
4. `CAST`
   - execute visible market-expression moves
5. `CLASH`
   - resolve pressure against walls, support, traps, and rivals
6. `SHIFT`
   - market structure changes; candles, volume, and danger move
7. `RESOLVE`
   - objective progress, damage, capture, and reward outcome
8. `REFLECT`
   - lessons and future training actions are generated

The earlier prototype phases can stay internally, but runtime presentation should align to this language.

### 13.1 Presentation modes inside a match

The supplied references also imply that one battle should not use only one camera language.

Cogochi should support multiple presentation modes inside the same match:

- `Chartfield Mode`
  - the main live battlefield on top of the chart
- `Command Cut-In`
  - a short move callout frame when a signature move fires
- `Scan Overlay`
  - lock-on, sonar, or target reveal UI layer
- `Structure Impact View`
  - support break, wall fracture, liquidation hit
- `Victory Splash`
  - short squeeze, breakout ride, or final win moment

This does not mean full JRPG scene cuts every second.

It means the game should be able to punctuate important actions with short readable presentation shifts.

## 14. Match Victory Model

Matches should not be pure HP races.

They should be objective battles.

### Example objective families

- `Breakout Push`
  - lift the core through the upper gate
- `Range Hold`
  - defend center control without overextending
- `Liquidity Hunt`
  - bait the rival into the punish zone first
- `Macro Defense`
  - survive the shock without losing the floor
- `News Spike Race`
  - convert short-lived windows faster than the rival

### Victory should be computed from

- objective progress
- pressure control
- trap conversion
- support integrity
- survival under shock
- directional correctness
- risk discipline

## 15. Player Agency

The player should have strongest agency before and after battle, with limited but meaningful agency during battle.

### 15.1 Before battle

The player chooses:

- agent lineup
- doctrine
- prompt stack
- data visibility
- memory state
- retrieval behavior
- tactic preset

### 15.2 During battle

The player uses limited command cards, not constant micromanagement.

Recommended live commands:

- `Focus Tap`
  - supercharge one agent's next move
- `Memory Pulse`
  - force a recall spike
- `Risk Veto`
  - cancel a dangerous commitment
- `Retarget`
  - redirect squad pressure to the live objective
- later:
  - `Doctrine Override`
  - `Emergency Hedge`
  - `Burst Commit`

### 15.3 After battle

The player chooses:

- what lesson to keep
- what to retrain
- what to compact
- what to queue next

## 16. RAG And Memory In Gameplay Terms

RAG should not feel like a backend-only feature.

It should feel like battlefield intuition.

### In gameplay:

- good recall can change a move before it commits
- memory recall can reveal a trap
- doctrine cards can reinforce or block certain actions
- failure memories can prevent repeat mistakes
- successful playbooks can enhance push timing

### Visual mapping:

- recall flash
- memory sigil
- brief ghost overlay of a past case
- buff ring
- warning glyph on false path

## 17. Progression Model

Each agent should grow in five visible axes.

### 17.1 Level

General power and unlock threshold.

### 17.2 Bond

How "in sync" the player is with that agent.

Can unlock:

- exclusive skins
- stronger signature moves
- more expressive battle animations

### 17.3 Specialization

Deepens the role identity.

Examples:

- scout -> oracle scout
- executor -> breakout rider
- risk -> anchor guardian
- analyst -> trap reader

### 17.4 Memory quality

How often the agent recalls the right lesson at the right time.

### 17.5 Artifact quality

How good the promoted prompt/retrieval/fine-tune state is.

## 18. Role Growth Trees

Each expression role should gain stronger battlefield identity as it grows.

### Pusher

- better long lift timing
- stronger breakout escort
- better ride retention

### Crusher

- stronger downward slam
- better rejection punishment
- better false breakout punish

### Guardian

- stronger support shields
- better rescue under collapse
- better shock survival

### Breaker

- faster wall damage
- stronger gate fracture
- better finish under pressure

### Trapper

- better bait placement
- better fake signal exploitation
- stronger liquidation conversion

### Rider

- faster momentum surfing
- higher reward during trend continuation
- greater chase control

### Oracle

- better hidden path exposure
- better false move detection
- higher memory reveal value

### Maw

- stronger liquidation punish
- faster capture under panic
- better collapse snowball

## 19. Reward And Failure Feel

Battle results should produce emotion, not just metrics.

### When the player is right

The scene should feel like:

- lift
- break
- surge
- ride
- rescue
- domination

### When the player is wrong

The scene should feel like:

- slip
- whiff
- bait
- pin
- swallow
- collapse

That emotional mapping is required for long-term retention.

## 20. UI Structure

### `/`

Should read as:

- trainer hub
- current agents
- next scenario
- recent wins and failures

### `/roster`

Should emphasize:

- individual identity
- role
- bond
- specialization
- recent battle feel

### `/agent/[id]`

Should emphasize:

- who this agent is
- how it thinks
- what it sees
- what it remembers
- how it behaves in battle

### `/team`

Should emphasize:

- functional role slots
- expression-role synergy
- scenario fit

### `/battle`

Should emphasize:

- the chart stage
- objective wall or zone
- upward and downward pressure
- visible role actions
- limited command cards

### `/lab`

Should emphasize:

- retraining
- memory curation
- prompt variants
- artifact promotion

## 21. Technical Runtime Mapping

The implementation should separate:

### 21.1 Decision layer

- agent context
- retrieval
- reasoning trace
- selected action

### 21.2 Battle grammar layer

- selected action -> battle action state
- market event -> stage event
- stage event + action -> visible animation intent

### 21.3 Scene layer

- stage geometry
- unit placement
- pressure vectors
- projectiles
- hazard states
- wall state
- capture state

### 21.4 Reward layer

- score
- reflection
- memory writeback
- progression changes

This layer separation is mandatory. Otherwise battle visuals collapse back into generic dashboards.

The runtime split and scene/presentation contracts are specified in [BATTLE_RUNTIME_PRESENTATION_SPEC.md](/Users/ej/Downloads/maxidoge-clones/Cogochi/docs/BATTLE_RUNTIME_PRESENTATION_SPEC.md).

## 22. MVP Scope

The MVP does not need every fancy effect.

It must, however, satisfy these minimums:

1. bottom team pushes upward on long
2. top team slams downward on short
3. support/resistance/liquidation are visibly different structures
4. traps and bad calls are visibly readable
5. breakout success feels like climbing or launch
6. recall and veto commands change visible behavior
7. each agent feels like a named character, not a token

## 23. Post-MVP Expansion

- richer sprites and character rigs
- boss-style macro events
- async PvP rival squads
- signature ultimates
- agent skins tied to specialization
- replay mode with cinematic camera
- more advanced fine-tuned artifact families

## 24. Acceptance Criteria

The design is correct only if a new player can say all of the following after one short session:

- `I know which one of my agents was pushing the move`
- `I know which one protected the floor`
- `I can tell when the rival was trying to crush the chart`
- `I saw my agent get baited or rewarded`
- `I understand what to train next`

If those statements are not true, the design is still incomplete.

## 25. Build Order

### Phase 1: System correctness

- keep OwnedAgent / memory / training / squad systems stable
- keep reflection and writeback loop stable

### Phase 2: Battle grammar correctness

- action state translation
- vertical top-vs-bottom stage layout
- support/wall/liquidation/objective geometry
- directional pressure effects

### Phase 3: Character readability

- turn units into real character bodies or sprites
- add signature move silhouettes
- improve trap, swallow, breakout, and rescue animations

### Phase 4: Emotional payoff

- stronger win/lose spectacle
- better camera emphasis
- clearer market drama moments

This is the correct order.

Do not chase polish before battle grammar and player readability are correct.
