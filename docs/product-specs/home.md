# Home Product Spec

Purpose:
- Short product spec for the landing, activation entry, and first-action path.

## Primary User Job

Help the user feel the product instantly, then capture their email without adding setup drag.

## Surface Role In The Official IA

Home must explain, in plain language, that the product is:
- a private-alpha landing for a market memory agent
- a place where judgment becomes traceable and reusable
- an early-access entry point that collects email before deeper routing

## Current Route Shape

- `/` currently behaves as an email-first private-alpha landing route.
- The page should build curiosity, show the product mood quickly, and collect email.
- Builder/copier split is deferred to later surfaces and should not dominate the landing page.
- Use `docs/page-specs/home-onboarding.md` for the detailed route contract.

## Required Message Order

Home should communicate the loop in this order:
1. your edge should leave a trace
2. Cogochi turns judgment into a living agent
3. early access is email-first
4. the deeper product flow comes after the landing capture

If Home cannot communicate those four steps quickly, the surface is failing.

## Core Flows

1. Land on the home route and understand the product promise.
2. Scan one strong visual that makes the landing feel memorable.
3. Enter an email and receive a success state.
4. Decide whether to keep following the product after capture.
5. Understand that access is gated by interest, not by setup friction.

## Product Constraints

- The first valuable path should remain available without forced wallet connection.
- The page should explain the product through the hero, not through a long setup checklist.
- The hero should communicate the private-alpha promise faster than any lore or worldbuilding detail.
- The hero should make the email action obvious before the user hits any dense product detail.
- Desktop and mobile feature exploration should remain semantically aligned.
- Landing analytics should reflect email capture as the primary CTA.
- Home should not read like a direct shortcut into `Terminal`.
- Public earnings or rental upside can be mentioned later, but only after the landing hook is legible.

## Target IA

- Primary CTA: `Request access`
- Target handoff: `/api/waitlist`
- Secondary CTA: in-page anchors such as `Product`, `Workflow`, and `Proof`
- Returning-user CTA: continue into the appropriate product surface after access is granted

## Supporting Docs

- `docs/page-specs/home-onboarding.md`
- `docs/PRODUCT_SENSE.md`
- `docs/design-docs/cogochi-uiux-architecture.md`
- `docs/design-docs/unified-product-model.md`
- `docs/SYSTEM_INTENT.md`
