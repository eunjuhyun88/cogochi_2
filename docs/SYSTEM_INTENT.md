# STOCKCLAW System Intent

Purpose:
- Repo-local condensed brief for product intent and architectural invariants.
- Read this before opening larger design docs.
- Use it to keep StockClaw market intelligence and Cogochi character progression inside one coherent game loop.

Primary source:
- `docs/design-docs/steam-ready-game-reset.md`

Supporting sources:
- `docs/design-docs/unified-product-model.md`
- `docs/design-docs/arena-domain-model.md`
- `docs/design-docs/learning-loop.md`

## Current Release Target

The shipping mental model is:
- `Home`
- `Mission`
- `Agent HQ`
- `Market`

This is intentionally simpler than the broader six-surface model.

Legacy route bridge:
- `/create`, `/terminal`, `/world`, and `/arena*` belong to `Mission`
- `/agent`, `/lab`, and `/passport` belong to `Agent HQ`
- `/signals` remains the current implementation path for `Market`

## Product Thesis

STOCKCLAW is a character-anchored market game.

Users do not just browse signals. They:
- create or resume an agent
- train its judgment in `Terminal`
- prove it in `Arena`
- grow its identity, memory, and record over time

The product must feel like one playable journey, not a dashboard plus a separate pet game.

## Release Surface Model

- `Home`
  - explains the fantasy quickly and routes into the next meaningful action
- `Mission`
  - owns setup, training, and playable encounter progression
- `Agent HQ`
  - owns growth, memory, proof, and review
- `Market`
  - owns public signal discovery and external proof context

Implementation bridge:
- `Mission / Create` maps to `/create`
- `Mission / Train` maps to `/terminal`
- `Mission / Arena` maps to `/arena`
- `/world` is not a top-level release promise
- `Agent HQ / Overview` maps to `/agent`
- `Agent HQ / Training` maps to `/lab`
- `Agent HQ / Record` maps to `/passport`
- `Market` currently maps to `/signals`

## Non-Negotiable Invariants

1. Same data, different interpretation.
   - Human and AI should reason over the same market context whenever possible.
   - The value comes from interpretation quality, not hidden information asymmetry.

2. Character ownership must have operational meaning.
   - A character is not just a collectible skin.
   - It must anchor specialization, training history, and deployable identity.

3. Progression must be evidence-bound.
   - Trading outcomes, backtests, and learning records drive advancement.
   - Cosmetic progression can reinforce identity but cannot replace proof.

4. The game layer wraps real learning.
   - Game progression should make trading, training, and specialization more motivating.
   - It must not drift into a detached idle system with fake value.

5. The release journey must stay simpler than the full domain model.
   - Not every internal mode deserves top-level navigation.
   - `World` may remain as internal content without becoming a primary release surface.

6. Durable actions must produce legible records.
   - Product actions should be understandable as user behavior, system behavior, and future learning data.
   - Mission, Arena, Terminal, and Agent flows must remain compatible with proof and memory systems.

7. Create Agent is a strong first-run ceremony.
   - Minting, AI binding, and starter setup belong in one guided flow.

8. `frontend` is the canonical implementation target.
   - Do not land new behavior by copying changes into sibling clone folders.
   - New work happens once in the canonical tree.

9. First-session success matters more than feature inventory.
   - The player should reach a completed Arena result quickly.
   - Onboarding should end in proof, not endless setup.

10. Server-authoritative domains stay server-authoritative.
    - Ownership, holdings, rental state, quick trades, tracked signals, and durable history cannot rely on client-local truth.
    - Local storage is cache, offline support, or optimistic staging only.

11. `priceStore` is the canonical live-price owner on the client.
    - Route or feature stores may consume live prices.
    - They should not redefine market truth.

12. Route state is transient.
    - Route state owns view mode, local selections, temporary UI state, and flow control.
    - It should not become a hidden persistence or replication layer.

13. Archive is history, not authority.
    - Old audits and archived plans explain how the code got here.
    - They do not override newer canonical docs.

## Surface Intent

### Home
- Explain the fantasy, current state, and next action in one screen.
- Do not force setup before the value exchange is understood.

### Mission
- Own the forward-moving playable loop.
- Internal steps can be separate routes, but the player should read them as one continuous flow.

### Agent HQ
- Show growth, training options, and durable proof in one hub.
- Absorb selected responsibilities from the current `Lab` and `Passport` routes.

### Market
- Show public discovery, signals, and context.
- Stay secondary to the main progression loop.

## Architecture Heuristics

- Prefer a small number of canonical documents over many overlapping summaries.
- Promote stable rules into `README.md`, `AGENTS.md`, or the relevant canonical doc.
- Keep dated root docs as working references, not authority.
- Keep execution plans dated and task-specific.
- Archive superseded plans instead of leaving them mixed with active ones.
- Make future agent runs able to answer `where do I start?` within one or two file opens.

## When To Open The Larger Docs

- Open `docs/design-docs/steam-ready-game-reset.md` when you need the current release-shaping journey.
- Open `docs/design-docs/unified-product-model.md` when you need domain objects, progression, proof, or monetization context behind the release IA.
- Open `docs/design-docs/six-surface-game-loop.md` when you need broader world context or earlier route separation.
- Open `docs/design-docs/arena-domain-model.md` when you need the local Arena and Arena War semantic model.
- Open `docs/design-docs/learning-loop.md` when you need ORPO, RAG, Passport contribution, or boundary-learning semantics.
- Open `docs/references/active/FRONTEND_REFACTOR_EXECUTION_DESIGN_2026-03-06.md` when you need the current structural baseline for refactor work.
- Open surface-specific docs from `docs/README.md` only after this intent brief matches the task.
