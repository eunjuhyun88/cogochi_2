# 2026-03-18 Command Deck Vertical Slice

## Goal

Turn the redesigned player flow into a buildable UI slice:

`home multi-select -> growth draft -> training cue -> mission -> rental board`

## Scope

- add explicit growth-lane data
- expand the starter roster so the home screen can feel like a live candidate wall
- rewrite the main page around multi-select and command-deck behavior
- rewrite team as growth draft
- connect lab to growth-lane-driven training actions
- add a minimal market screen for rental fantasy

## Outputs

- added `src/lib/aimon/data/growthLanes.ts`
- updated starter roster generation and squad state helpers
- rewrote `src/routes/+page.svelte`
- rewrote `src/routes/team/+page.svelte`
- updated `src/routes/lab/+page.svelte`
- added `src/routes/market/+page.svelte`
- updated shell navigation

## Verification

- `npm run check`
- `npm run build`

## Status

DONE
