# Home Product Spec

Purpose:
- Short product spec for the landing, activation entry, and first-action path.

## Primary User Job

Help the player understand the fantasy, see their current agent state, and start the next meaningful mission without friction.

## Surface Role In The Release IA

Home must explain, in plain language, that the product is:
- a place to raise an agent
- train its judgment in `Terminal`
- prove it in `Arena`
- carry the result into `Agent HQ`
- optionally browse public proof through `Market`

## Current Route Shape

- `/` currently behaves as a hero-led landing route, not a signup/demo wizard.
- Primary CTA should route into `Mission`.
- Secondary CTA can route into training or Arena only when progression state supports it.
- Wallet controls may exist, but they must be visually and semantically secondary.
- Use `docs/page-specs/home-onboarding.md` for the detailed route contract.

## Required Message Order

Home should communicate the loop in this order:
1. start or resume an agent
2. train its judgment in `Terminal`
3. resolve an `Arena` encounter
4. review what changed in `Agent HQ`
5. return for the next run

If Home cannot communicate those five steps quickly, the surface is failing.

## Core Flows

1. Land on the home route and understand the product promise in under 30 seconds.
2. See one active agent or one starter state.
3. Choose one next action:
   - start mission
   - resume training
   - enter Arena if already unlocked
4. Understand that proof and specialization matter more than wallet or monetization.

## Product Constraints

- The first valuable path should remain available without forced wallet connection.
- The page should explain the product through the hero, not through a long setup checklist.
- The hero should communicate the mission loop faster than any lore or market jargon.
- The current agent card should increase attachment, not become a second dashboard.
- Desktop and mobile layouts should keep the same semantic hierarchy.
- Home should not read like a shortcut into a tool.
- Public proof or monetization can be mentioned only after gameplay and progression are legible.

## Target IA

- Primary CTA: `Start Mission`
- Target handoff: `/create` as the first mission step
- Secondary CTA: `Resume Training`
- Returning-user CTA: progress-aware route into the next eligible mission step
- Optional third CTA: `Enter Arena` only if progression state is real
- Home must stop behaving like a feature directory or direct terminal shortcut

## Supporting Docs

- `docs/design-docs/steam-ship-blueprint.md`
- `docs/page-specs/home-onboarding.md`
- `docs/PRODUCT_SENSE.md`
- `docs/design-docs/steam-ready-game-reset.md`
- `docs/design-docs/unified-product-model.md`
- `docs/product-specs/create-agent.md`
