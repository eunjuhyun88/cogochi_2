# Starter Roster Loop

Purpose:
- Define the roster-first onboarding and progression loop for the Steam release target.
- Translate the current single-agent mission shell into a more game-like "pick a crew, raise a specialist, prove it, rent it" journey.

Status:
- active canonical support for the current Steam release target

## Why This Exists

The current release reset solved the navigation problem, but not the fantasy problem.

Right now the product still begins like:
- choose one shell
- bind one model
- move into a terminal

That is structurally cleaner than before, but it still reads closer to "tool setup" than "game start."

The Steam-ready version should begin like:
- see a living roster
- draft a starter crew
- choose how to raise them
- train one run-ready specialist
- prove that specialist in play
- build enough record to rent that specialist out later

This creates stronger fantasy, better first-session attachment, and a clearer long-term money loop.

## One-Line Player Promise

Draft a starter crew, shape one market companion into a specialist, prove it in runs, and grow an agent other players will want to rent.

## Release Fantasy

The player should feel:
- "I am choosing from a cast, not filling out a setup form."
- "I decide what kind of specialist this becomes."
- "The game is collecting evidence from my runs."
- "My agent improves because I played and trained it."
- "If I raise it well enough, it becomes economically valuable."

If the player instead feels:
- "I configured an AI tool"
- "I connected a wallet"
- "I opened another dashboard"

the release is not ready.

## Revised Journey

### 1. Home — Draft The Crew

Job:
- make the cast feel alive
- invite selection
- show that the player is beginning with a roster, not a form

Required behavior:
- the right rail cycles through many candidate characters
- the player can pin up to 3 starters
- the primary CTA advances with those selections

Output:
- `starter roster` saved
- player understands they are drafting a crew

### 2. Create — Choose The Raise Plan

Job:
- confirm the selected starters
- decide what type of specialist to build first
- name the first lead companion

Required decisions:
- which starter is the lead
- what growth path the lead will pursue
- what doctrine or temperament it begins with

Output:
- one lead agent identity
- one starter growth focus
- clear handoff into training

### 3. Train — Produce First Readiness

Job:
- turn the chosen growth plan into visible preparation
- give the player the feeling that training changes how the agent will behave

Required outputs:
- readiness completion
- first memory seed or doctrine confirmation
- clear Arena unlock

### 4. Play — Build The Agent Through Runs

Job:
- create tension
- let the player influence outcomes
- generate data worth keeping

Required outputs:
- run result
- performance evidence
- training deltas
- next recommended improvement

### 5. Agent HQ — Compound Identity

Job:
- show what changed
- show what data was earned
- show why the next run matters

Required sections:
- overview
- growth path
- memory / proof
- lease readiness

### 6. Market — Monetize Proven Specialists

Job:
- only after proof exists, expose the rent-and-earn loop

Required framing:
- other players rent proven agents
- price follows proof and specialization
- money is downstream of play, not upstream of onboarding

## Core Loop

### First-Session Loop

1. browse cast
2. pin 3 starters
3. choose lead + growth plan
4. complete one short training sequence
5. clear one Arena run
6. see proof and one unlocked improvement

### Ongoing Loop

1. run
2. review
3. tune
4. retrain
5. rerun
6. publish or rent

## Growth Paths

The player should choose how the first agent grows before the first real run.

Release-safe starter paths:
- `Signal Hunter`
  - better at reading momentum and direction shifts
- `Risk Keeper`
  - better at protecting downside and surviving bad calls
- `Memory Gardener`
  - better at recall, reflection, and pattern carry-over

These are better release-facing nouns than abstract AI setup language.

## UX Rules

### Home
- right side should feel alive and collectible
- selection must be visual first, explanatory second
- the player should never face a dead static "current agent" card before they have drafted one

### Create
- no duplicate hero above the actual action
- show selected crew immediately
- "what to raise" must be more important than wallet or model plumbing

### Train
- read as a prep room, not a terminal dashboard
- readiness items must map to the chosen growth path

### Agent HQ
- show proof before public-market mechanics
- show how runs changed the agent

## GTM Implications

This roster-first opening improves the Steam pitch:

Old framing:
- create an agent
- train it
- maybe rent it later

Better framing:
- recruit a cast
- raise one specialist
- sharpen it through runs
- publish a proven companion others can rent

That is a stronger store page loop because it introduces:
- character attachment
- build identity
- run-based mastery
- optional economy

## Implementation Priorities

1. Home supports rotating cast plus multi-select starter roster
2. Journey store persists `starter roster` and `growth focus`
3. Create route reflects the chosen roster instead of pretending the player starts from zero there
4. Train route adapts messaging to the chosen growth path
5. Agent HQ exposes lease readiness as an earned state, not a default CTA

## Release Guardrails

- Do not require wallet to pin a starter roster.
- Do not mention rental income before the player has seen proof and growth.
- Do not collapse the roster fantasy back into a single static mascot.
- Do not expose "model marketplace" vocabulary in the first session.
- Do not let setup nouns outrank verbs like `draft`, `raise`, `train`, `prove`, and `rent`.
