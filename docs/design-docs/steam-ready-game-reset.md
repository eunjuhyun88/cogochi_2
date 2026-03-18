# Steam-Ready Game Reset

Purpose:
- Active canonical design brief for the current release target.
- Defines the player-facing journey that should feel coherent enough to ship as a real game.
- Resolves the gap between the broader six-surface model and the simpler Steam-first release shape.

Status:
- active canonical for the current release target

## One-Line Promise

Train a market agent, throw it into Arena encounters, and grow it into a specialist worth keeping.

## Why This Reset Exists

The repo currently contains too many equal-weight nouns:
- `Create`
- `Terminal`
- `World`
- `Battle`
- `Agent`
- `Lab`
- `Passport`
- `Signals`

That creates a navigation problem instead of a game journey.

For a Steam-quality release, the player should not have to reverse-engineer the information architecture.
They should understand:
- who they are
- what their agent is
- what the next action is
- what counts as progress

within the first session.

## Steam Release Bar

The release target should satisfy all of the following:

1. Fantasy plus first action are legible in under 30 seconds.
2. The first meaningful run completes in under 10 minutes.
3. The first session ends with a result, a reward, and a clear next step.
4. Wallet or ownership friction is not required before the user understands the game.
5. The app feels like one journey with supporting hubs, not many disconnected pages.

## Target IA

### Home
- Purpose:
  - explain the fantasy quickly
  - show current agent state
  - offer one clear continue action
- Primary output:
  - enter `Mission`

### Mission
- Purpose:
  - own the playable progression loop
  - keep the user moving forward without reinterpreting the app structure
- Internal steps:
  - `Create`
  - `Train`
  - `Arena`
- Notes:
  - `World` is not a top-level release surface
  - if `World` remains in code, it behaves as internal mission content or a scenario mode, not primary navigation

### Agent HQ
- Purpose:
  - show what improved
  - show what the agent is becoming
  - let the player tune and review evidence
- Internal sections:
  - `Overview`
  - `Training`
  - `Record`
- Notes:
  - current `Lab` responsibilities map into `Training`
  - current `Passport` responsibilities map into `Record`

### Market
- Purpose:
  - public proof, signal discovery, external context
- Notes:
  - secondary to the main release journey
  - current implementation may still live under `/signals`

## Legacy Route Bridge

Current code can keep legacy routes while the release IA shifts:

- `/create` -> `Mission / Create`
- `/terminal` -> `Mission / Train`
- `/world` -> internal `Mission` mode, not top-level nav
- `/arena`, `/arena-war`, `/arena-v2` -> `Mission / Arena`
- `/agent` -> `Agent HQ / Overview`
- `/lab` -> `Agent HQ / Training`
- `/passport` -> `Agent HQ / Record`
- `/signals` -> `Market`

## First-Session Happy Path

1. Land on `Home`
2. Understand the pitch and current state
3. Enter `Mission`
4. Complete agent creation or resume an unfinished setup
5. Train just enough doctrine or readiness to unlock an Arena run
6. Finish one Arena encounter
7. See a result screen that rolls forward into `Agent HQ`
8. Review proof, growth, and the next recommended mission

## Screen Contract

Every release-facing screen must answer:
- where am I in the journey
- what is the next action
- what did I just earn, unlock, or learn

If a surface cannot answer those three questions, it should not be a top-level release surface.

## Design Rules

1. One screen, one job.
2. One dominant CTA per step.
3. Remove repeated cards that restate the navigation.
4. Do not make setup, lore, and proof compete at equal weight.
5. Use UI density to support action, not to simulate complexity.
6. Progress must come from proof, training, or Arena outcomes.
7. Public trust signals belong in `Market` or `Agent HQ`, not everywhere.

## Non-Goals For This Release

- shipping every experimental route as a first-class surface
- making `World` a separate top-level promise
- forcing wallet-first onboarding
- splitting training, record, and proof into multiple disconnected hubs

## Implementation Priorities

1. Collapse top-level navigation into `Mission`, `Agent`, and `Market`.
2. Treat `Create`, `Terminal`, and `Arena` as one guided mission sequence.
3. Treat `Lab` and `Passport` as sections inside `Agent HQ`.
4. Rewrite `Home` around continue-state, not feature inventory.
5. Keep route compatibility while the IA changes underneath.

## Authority Order

When documents conflict, use this order:

1. `docs/design-docs/steam-ready-game-reset.md`
2. `docs/SYSTEM_INTENT.md`
3. `docs/design-docs/unified-product-model.md`
4. `docs/design-docs/six-surface-game-loop.md`

`docs/design-docs/six-surface-game-loop.md` remains valuable as broader world context, but it is not the current release-shaping authority.
