# Docs Router

Purpose:
- `README.md` stays the collaboration and execution SSOT.
- This file is the doc entry router for product, design, and implementation work.
- Start here before opening many specs or old plans.

## Read These First

1. `docs/DESIGN.md`
2. `docs/design-docs/steam-ready-game-reset.md`
3. `docs/design-docs/steam-ship-blueprint.md`
4. `docs/SYSTEM_INTENT.md`
5. `docs/design-docs/unified-product-model.md`
6. `docs/FRONTEND.md`

## Structured Knowledge Base

- Active implementation target: current git worktree rooted at this repository
- `docs/design-docs/` contains stable design beliefs and release-shaping product models
- `docs/workflows/` contains lightweight product/UI execution workflows derived from the repo's collaboration style
- `docs/product-specs/` contains canonical surface specs
- `docs/page-specs/` contains page-level contracts
- `docs/exec-plans/` contains active and completed execution plans
- `docs/decisions/` contains stable decisions
- `docs/references/active/` contains non-canonical support docs that are still in use
- `docs/archive/` is historical context only

## Canonical Groups

- Product and UX canon:
  - `docs/design-docs/steam-ready-game-reset.md`
  - `docs/SYSTEM_INTENT.md`
  - `docs/PRODUCT_SENSE.md`
  - `docs/design-docs/unified-product-model.md`
  - `docs/design-docs/six-surface-game-loop.md`
- Engineering canon:
  - `docs/DESIGN.md`
  - `docs/FRONTEND.md`
  - `docs/API_CONTRACT.md`
  - `docs/FE_STATE_MAP.md`
  - `ARCHITECTURE.md`
- Working docs:
  - `docs/workflows/`
  - `docs/product-specs/`
  - `docs/page-specs/`
  - `docs/exec-plans/`
  - `docs/decisions/`
- Reference docs:
  - `docs/references/active/`
  - `docs/generated/`
- Archive:
  - `docs/archive/`

## Canonical Entry Docs

- `docs/DESIGN.md`
- `docs/design-docs/steam-ready-game-reset.md`
- `docs/design-docs/steam-ship-blueprint.md`
- `docs/SYSTEM_INTENT.md`
- `docs/design-docs/unified-product-model.md`
- `docs/FRONTEND.md`

## Reading Order By Need

| Need | Open first | Then |
| --- | --- | --- |
| current release IA | `docs/design-docs/steam-ready-game-reset.md` | `docs/SYSTEM_INTENT.md`, `docs/product-specs/index.md` |
| Steam ship target | `docs/design-docs/steam-ship-blueprint.md` | `docs/design-docs/steam-ready-game-reset.md`, relevant product specs |
| broader world model | `docs/design-docs/six-surface-game-loop.md` | `docs/design-docs/unified-product-model.md` |
| product heuristics | `docs/PRODUCT_SENSE.md` | relevant product spec |
| route or state ownership | `docs/FRONTEND.md` | `docs/FE_STATE_MAP.md`, `docs/API_CONTRACT.md` |
| page behavior | `docs/page-specs/index.md` | target page spec |
| implementation plan | `docs/PLANS.md` | relevant `docs/exec-plans/active/*.md` |
| product or UI execution protocol | `docs/workflows/README.md` | relevant workflow template |
| stable design decision | `docs/decisions/README.md` | target decision record |

## Root Docs Policy

Only these should be normal root entry points:
- `docs/README.md`
- `docs/DESIGN.md`
- `docs/SYSTEM_INTENT.md`
- `docs/PRODUCT_SENSE.md`
- `docs/FRONTEND.md`
- `docs/API_CONTRACT.md`
- `docs/FE_STATE_MAP.md`
- `docs/PLANS.md`
- `docs/SECURITY.md`
- `docs/RELIABILITY.md`
- `docs/QUALITY_SCORE.md`

## Conflict Resolution

When documents disagree, use this order:

1. `docs/design-docs/steam-ready-game-reset.md`
2. `docs/SYSTEM_INTENT.md`
3. canonical `docs/design-docs/*.md`
4. `docs/product-specs/*.md`
5. `docs/page-specs/*.md`
6. `docs/exec-plans/**/*.md`
7. `docs/references/**/*.md`
8. `docs/archive/**/*.md`

## Rules

- Do not start in `docs/archive/` unless a canonical doc points there.
- Do not bulk-read the whole `docs/` tree.
- Do not use old audits as authority when a newer canonical doc exists.
- When product behavior changes, update the canonical doc, not just a handoff note.

## Current Cleanup Reality

The remaining problem is not missing documents. It is authority drift.

The current cleanup goal is:
- one release-shaping IA
- one short read order
- one obvious answer to `where do I start`

Physical file moves can continue after authority is stabilized.
