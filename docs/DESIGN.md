# DESIGN

Purpose:
- Canonical design entry point for the frontend repo.
- Keeps broad design docs, release-shaping docs, and dated execution plans from competing.

## Design Authority Stack

1. `docs/design-docs/steam-ready-game-reset.md`
   - Current release-shaping IA and Steam-ready journey contract.
2. `docs/design-docs/steam-ship-blueprint.md`
   - Detailed Steam-facing product, UX, and GTM blueprint.
3. `docs/design-docs/trading-agent-lab-loop.md`
   - Trading-first fantasy, repeated testing loop, and paid simulation thesis.
4. `docs/SYSTEM_INTENT.md`
   - Product thesis and architectural invariants.
5. `docs/design-docs/unified-product-model.md`
   - Merged StockClaw + Cogochi object model, progression, and proof logic.
6. `docs/design-docs/six-surface-game-loop.md`
   - Broader world model and earlier final IA context.
7. `docs/CONTEXT_ENGINEERING.md`
   - Stable context-loading and retrieval policy.
8. `docs/design-docs/core-beliefs.md`
   - Agent-first operating beliefs and doc-writing rules.
9. `docs/design-docs/arena-domain-model.md`
   - Local canonical Arena and Arena War semantics.
10. `docs/design-docs/learning-loop.md`
   - Local canonical learning, memory, and proof semantics.
11. `docs/references/active/FRONTEND_REFACTOR_EXECUTION_DESIGN_2026-03-06.md`
   - Current structural refactor baseline.
12. `docs/archive/historical/root-cleanup-2026-03-17/overall-architecture-design.md`
   - Older broad architecture analysis; useful only for rationale.
13. `docs/workflows/README.md`
   - Lightweight execution protocol for product shaping and UI passes.

## Design Principles

1. A short map beats a giant manual.
2. Release-shaping IA must be explicit and repo-local.
3. Stable rules should graduate into canonical docs.
4. Route shells, view models, and presentation should stay separable.
5. Historical docs may explain why; they do not overrule newer canonical docs.
6. The player-facing journey matters more than route nouns leaked from implementation.

## Current Design Hotspots

- Home positioning and continue-state clarity
- Mission shell across `Create`, `Terminal`, and `Arena`
- Agent HQ consolidation across `Agent`, `Lab`, and `Passport`
- Market positioning vs public proof and social discovery
- Remaining sibling-clone drift vs canonical `frontend` implementation

## Required Promotion Path

- Stable release IA or UX rule -> `docs/design-docs/steam-ready-game-reset.md`
- Stable product thesis or invariant -> `docs/SYSTEM_INTENT.md`
- Stable object model or domain logic -> `docs/design-docs/unified-product-model.md`
- Stable surface behavior or scope -> `docs/product-specs/*.md`
- Active implementation sequence -> `docs/exec-plans/active/*.md`
- Repeatable product/UI workflow -> `docs/workflows/*.md`
- Stable route or state architecture -> `docs/FRONTEND.md`
- Risk tracking -> `docs/QUALITY_SCORE.md` or `docs/exec-plans/tech-debt-tracker.md`

## Source Docs

- `docs/design-docs/steam-ready-game-reset.md`
- `docs/design-docs/steam-ship-blueprint.md`
- `docs/design-docs/trading-agent-lab-loop.md`
- `docs/SYSTEM_INTENT.md`
- `docs/design-docs/unified-product-model.md`
- `docs/design-docs/six-surface-game-loop.md`
- `docs/design-docs/index.md`
- `docs/workflows/README.md`
- `docs/CONTEXT_ENGINEERING.md`
- `docs/design-docs/arena-domain-model.md`
- `docs/design-docs/learning-loop.md`
- `docs/FRONTEND.md`
- `docs/PRODUCT_SENSE.md`
- `docs/PLANS.md`
