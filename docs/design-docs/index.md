# Design Docs Index

Purpose:
- Catalog major design documents and clarify which one wins when they overlap.

| Doc | Status | Use when | Notes |
| --- | --- | --- | --- |
| `docs/design-docs/steam-ready-game-reset.md` | active canonical | you need the current release-shaping IA and Steam-quality journey target | Start here for `Home -> Mission -> Agent HQ -> Market`. |
| `docs/design-docs/steam-ship-blueprint.md` | active canonical support | you need the detailed Steam-facing product, UX, and GTM blueprint | Use this for genre, first-session design, and release gates. |
| `docs/design-docs/starter-roster-loop.md` | active canonical support | you need the roster-first onboarding, growth-path, and rentability loop | Use this when implementing `draft crew -> raise specialist -> prove -> rent`. |
| `docs/design-docs/trading-agent-lab-loop.md` | active canonical support | you need the trading-first fantasy, repeated testing loop, and paid simulation thesis | Use this when implementing `choose -> set -> backtest -> simulate -> modify -> rerun -> prove`. |
| `docs/SYSTEM_INTENT.md` | active canonical | you need product thesis and invariants | Read immediately after the release reset doc. |
| `docs/design-docs/unified-product-model.md` | active canonical | you need the merged StockClaw + Cogochi object model and loops | Domain model and monetization context live here. |
| `docs/design-docs/six-surface-game-loop.md` | active canonical support | you need the broader world model and earlier final IA | Valuable context, but not the current release-shaping authority. |
| `docs/design-docs/six-surface-ux-contract.md` | active canonical support | you need implementation-grade UX rules from the six-surface phase | Use only after the release reset doc. |
| `docs/design-docs/core-beliefs.md` | active canonical | you need agent-first working principles | Stable operating beliefs. |
| `docs/design-docs/arena-domain-model.md` | active canonical | you need Arena and Arena War semantics | Local semantic authority. |
| `docs/design-docs/learning-loop.md` | active canonical | you need ORPO, RAG, and Passport learning semantics | Local semantic authority. |
| `docs/DESIGN.md` | active canonical | you need the authority stack itself | Root design router. |
| `docs/references/active/FRONTEND_REFACTOR_EXECUTION_DESIGN_2026-03-06.md` | active working design | you need the current structural refactor baseline | Working design, not top authority. |
| `docs/archive/historical/root-cleanup-2026-03-17/overall-architecture-design.md` | historical reference | you need older rationale | Do not treat as newest authority. |
| `../STOCKCLAW_UNIFIED_DESIGN.md` | upstream deep reference | you need edge-case product semantics not localized here yet | Prefer local canonical docs first. |

Rule:
- If a dated working design becomes durable, summarize its stable parts into canonical docs.
