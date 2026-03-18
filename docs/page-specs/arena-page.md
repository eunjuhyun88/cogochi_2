# Arena Page

Route scope:
- `/arena`

Purpose:
- Define the primary playable encounter route inside `Mission`.

## Primary User Job

- Resolve one meaningful encounter and leave with a clear result, reflection, and next step.

## Current Route Shape

- `/arena` still includes pre-match lobby and configuration behavior.
- The same match can be viewed through multiple presentation modes.
- Result flow includes more shell complexity than the release target needs.

This file defines the route contract while making the Steam release simplification explicit.

## Core Flow

1. User enters Arena as the next mission step.
2. Route establishes the current mission and encounter state quickly.
3. User commits to a stance or intervention.
4. Encounter resolves through the active battle phase.
5. Result screen shows consequence, score change, and next recommended action.
6. User exits toward `Agent HQ` or the next mission step.

## Release Target Contract

For the Steam-target version of `/arena`:

1. First contact should expose one primary battle presentation, not many equal view choices.
2. Lobby and setup chrome should be compressed or folded below the playable field.
3. The battle field must visually dominate the page more than HUD chrome.
4. The player must always know:
   - current phase
   - current stake
   - current next action
5. The result path must create replay desire, not only summarize telemetry.

## Guardrails

- Do not let pre-match setup dominate first view.
- Do not make tiny HUD labels compete with the playfield.
- Do not require wallet connection for the core mission loop.
- Do not expose tournament or bracket complexity before the base encounter is fun.
- Do not keep multiple same-weight panels if they delay the first decision.

## Key UI Blocks

- mission header with compact status
- main encounter field
- one compact mission or objective card
- one compact combat log or event feed
- hypothesis or stance commit panel
- result screen with consequence and next-step CTA

## State Authority

- route phase, view mode, and transient encounter UI state: route local
- durable match state and result payload: server-backed Arena endpoints
- agent progression updates: shared progression and agent stores
- live market context: canonical live price store and route-specific read models

## Supporting APIs And Data

- `/api/arena/**`
- match and result payloads
- progression update endpoints
- live market context from shared price and market services

## Failure States

- first-time players see a lobby instead of a game
- too many view modes make the first decision unclear
- result screens feel like dashboards instead of encounter conclusions
- the route cannot explain why the player won or lost
- the player exits without a compelling reason to start another run

## Read These First

- `docs/design-docs/steam-ready-game-reset.md`
- `docs/design-docs/steam-ship-blueprint.md`
- `docs/product-specs/arena.md`
- `docs/design-docs/arena-domain-model.md`
- `docs/design-docs/learning-loop.md`
