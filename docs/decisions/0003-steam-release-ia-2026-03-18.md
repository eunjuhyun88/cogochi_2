# Steam Release IA Reset

Date:
- 2026-03-18

Status:
- accepted

## Context

The repo already had a broader six-surface model, but the current user goal is narrower:
- ship something coherent enough for real players
- reduce page-hopping and IA ambiguity
- make the product feel like one game journey instead of many equal pages

Without an explicit decision, work will keep drifting between:
- the older six-surface target
- page-by-page UI cleanup
- route names that expose implementation instead of player-facing structure

## Decision

For the current release target, the player-facing IA becomes:

1. `Home`
2. `Mission`
3. `Agent HQ`
4. `Market`

And the internal mapping becomes:

1. `Mission` contains `Create`, `Train`, and `Arena`
2. `Agent HQ` contains `Overview`, `Training`, and `Record`
3. `World` is demoted from top-level release navigation
4. `Lab` is demoted into `Agent HQ / Training`
5. `Passport` is demoted into `Agent HQ / Record`

## Why

This structure matches the actual player promise better:
- start an agent
- train it
- prove it
- grow it

It also reduces the top-level nouns the player has to learn and creates a clearer Steam-style first session.

## Impact

- top-level navigation should collapse toward `Mission`, `Agent`, and `Market`
- `Home` should act as a continue-state screen, not a feature directory
- `Create`, `Terminal`, and `Arena` can stay as separate routes in code while reading as one guided flow
- future route work should prefer grouped player-facing language over implementation nouns

## Relationship To Prior Decisions

This decision narrows the release-facing IA from `0002-cogochi-stockclaw-source-placement-2026-03-17.md`.

`0002` remains useful for source and placement rules.
This decision supersedes its release-facing surface labels for the current ship target.

## Rollback

If this decision is reversed, a new record must explicitly answer:
- whether `World` returns as a top-level release promise
- whether `Lab` and `Passport` become separate top-level surfaces again
- whether the release target is a broader multi-surface app instead of a guided game journey
