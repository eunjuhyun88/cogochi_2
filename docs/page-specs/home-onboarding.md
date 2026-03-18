# Home And Onboarding

Route scope:
- `/`

Purpose:
- Define the landing-page contract as it exists now while aligning it to the Steam-first release IA.

## Primary User Job

- Understand the fantasy from the hero without reading a manual.
- Browse a living cast and pin a starter crew.
- Choose the next mission step in one click.

## Core Flow

1. Hero loads with one clear positioning message.
2. Right-side cast rail cycles through many candidate characters.
3. User can pin up to 3 starters for the next mission.
4. Primary CTA routes to `/create` as the start of `Mission`.
5. Secondary CTA routes to `/terminal` for returning players.
6. Arena CTA is available only as a valid next step, not as the only meaningful action.
7. Wallet actions, if present, remain secondary to the mission flow.

## Current Route Contract

- Primary CTA: `Start Mission`
- Secondary CTA: `Resume Training`
- Conditional CTA: `Enter Arena`
- Right-side support block: rotating cast showcase, starter selection, and lightweight progress
- The route should feel like an editorial landing page, not a feature rail or dashboard

## Target Migration Contract

As the release IA hardens:

1. Home should become a progression-aware continue screen.
2. The primary CTA should route to the next eligible mission step, not a static route forever.
3. Wallet or ownership depth should remain optional for Steam Early Access.
4. Market and public proof should stay off the first-decision path.

## Guardrails

- Do not let wallet connect become the first or loudest action.
- Do not reintroduce duplicate surface cards below the hero.
- Do not split the page into multiple equal-weight hero panels.
- Keep desktop and mobile hierarchy aligned: message first, next action second, current agent third.
- Home should not read like a terminal shortcut or finance dashboard.

## Key UI Blocks

- hero message
- market context chips
- mission CTA row
- rotating cast showcase
- starter crew selector
- compact agent progress cards
- optional wallet action in the agent support panel

## State Authority

- hero CTA ordering and temporary layout state: route local
- current agent status: shared progression and game state stores
- starter roster selection: shared progression store
- wallet connection and modal state: wallet stores
- future progress-aware CTA routing: durable mission progression state

## Supporting APIs And Data

- route handoff targets: `/create`, `/terminal`, `/arena`
- current agent and score state from shared game stores
- starter roster state from shared progression stores
- wallet modal flow from wallet stores

## Failure States

- Home still behaves like a route directory instead of a start screen
- Wallet connect visually outranks `Start Mission`
- Arena is entered before the player understands what a run is
- The right-side cast area becomes a static mascot card instead of a living roster draft
- First-time players cannot explain what happens after clicking the primary CTA

## Read These First

- `docs/design-docs/steam-ready-game-reset.md`
- `docs/design-docs/steam-ship-blueprint.md`
- `docs/design-docs/starter-roster-loop.md`
- `docs/product-specs/home.md`
- `docs/PRODUCT_SENSE.md`
