# Home Page

Route scope:
- `/`

Purpose:
- Define the landing-page contract around the email-first private-alpha landing.

## Primary User Job

- Feel the product promise immediately.
- Submit an email without leaving the page.

## Core Flow

1. Hero intro animates in and logs a `hero_view` funnel event.
2. User sees a cinematic hero, a strong visual trace panel, and a single email capture form.
3. Primary CTA submits into `POST /api/waitlist`.
4. Success state confirms the user is on the private-alpha list.
5. Returning-user state may route to a progress-aware continuation target after access is granted.

## Official Contract

1. Hero copy should communicate the product as a memory layer for market judgment.
2. The landing should build curiosity before asking for email.
3. The primary CTA should be a single email form, not a multi-choice routing step.
4. Returning-user CTA may route to the next eligible surface based on durable progression state.

## Guardrails

- Do not force wallet connection before the user understands the builder/copier choice.
- Do not force wallet connection before the user has seen the landing promise.
- Funnel events must reflect the real CTA and feature interactions, not an outdated terminal-first story.
- The page should not feel like a generic exchange dashboard or a plain signup form.

## Key UI Blocks

- animated hero and positioning copy
- single email capture form
- cinematic trace panel
- short curiosity cards
- trust strip and closing access prompt
- optional returning-user CTA

## State Authority

- email field state and success state: route local
- wallet connection and short address: `walletStore`
- funnel instrumentation: client analytics events
- progression-aware CTA routing: durable agent progression state, not hero-local flags

## Supporting APIs And Data

- route handoff targets: `POST /api/waitlist`, optional `/dashboard`
- wallet modal / connect flow from `walletStore`
- hero content and funnel names from the landing component

## Failure States

- wallet connect appears as the first or only action
- home still reads like a direct Terminal shortcut
- multiple competing CTAs dilute the email submit goal
- hero storytelling hides the actual next action

## Read These First

- `docs/SYSTEM_INTENT.md`
- `docs/PRODUCT_SENSE.md`
- `docs/product-specs/home.md`
- `docs/design-docs/cogochi-uiux-architecture.md`

## Applied Source Inputs

- `2026-03-01__STOCKCLAW_PRD_A01.md`
- `2026-02-20__STOCKCLAW_UserJourney_Lifecycle_v1.docx`
