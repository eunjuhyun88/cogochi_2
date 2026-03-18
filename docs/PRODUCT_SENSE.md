# PRODUCT_SENSE

Purpose:
- Product-facing constraints that should shape implementation decisions.
- Intended for agents making UI, flow, or feature-scope choices.

## Core Product Heuristics

1. The player must understand the fantasy and first action in under 30 seconds.
   - If the screen needs explanation, it is too dense.

2. The release journey is `Home -> Mission -> Agent HQ -> Market`.
   - Internal routes may stay separate in code.
   - They should not feel like separate products.

3. One screen, one dominant decision.
   - Remove secondary cards that repeat navigation or restate the same status.

4. Fast legibility beats lore density.
   - Tone and worldbuilding matter only if the player still knows what to do next.

5. Same data, different interpretation.
   - Human-vs-agent value comes from reasoning quality, not hidden information asymmetry.

6. Gameplay must reinforce evidence.
   - Character growth, rank, or status should come from trades, backtests, or proven discipline.
   - Fake grind that does not improve trust or outcomes should be removed.

7. The first session should end in proof.
   - A completed Arena outcome is more valuable than ten setup screens.

8. Action surfaces must feel trustworthy.
   - If a feature touches money, ownership, licensing, or ranking, server authority and validation win over convenience.

9. Social proof must stay evidence-backed.
   - “My AI is strong” works only if users can inspect track record, specialization, or version history.

10. Wallet-first friction is not acceptable for the release loop.
    - Ownership can deepen the experience later.
    - It cannot be required before the user understands the game.

## Acceptance Questions

Before shipping a surface change, answer:
- Does this make the primary job clearer or noisier?
- Does the player know the next step without rereading the UI?
- Does the user understand what they can own, improve, or prove here?
- Is the state ownership obvious?
- Does the user understand what is transient vs durable?
- Is this progression earned by evidence or simulated by UI theater?
- Does this keep the `Mission` flow legible?
- If an agent reads the repo later, can it reconstruct the intended behavior?

## Source Docs

- `docs/design-docs/steam-ready-game-reset.md`
- `docs/design-docs/steam-ship-blueprint.md`
- `docs/SYSTEM_INTENT.md`
- `docs/design-docs/unified-product-model.md`
- `docs/design-docs/six-surface-game-loop.md`
- `docs/product-specs/index.md`
- `docs/design-docs/learning-loop.md`
