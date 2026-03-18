# Create Agent Product Spec

Purpose:
- Short product spec for the activation flow that mints and configures a usable agent.

## Primary User Job

Finish creation with one result: a usable starter agent that can enter `Terminal` and complete the first mission.

## Target Flow

1. Choose character shell.
2. Name the agent.
3. Choose one starter doctrine or temperament.
4. Bind AI or starter brain source.
5. Save starter setup.
6. Enter `Terminal`.
7. Offer optional wallet or ownership upgrade later, not as the first gate.

## Product Constraints

- The creation flow should feel like a game ceremony, not account setup.
- Wallet connection must not block first-session value.
- Ownership and mint semantics are optional depth for Steam Early Access.
- Creation and AI setup should remain one flow, not separate products.
- The output should be clear:
  - `Agent ID created`
  - `Stage 1 active`
  - `Terminal unlocked`

## Route Target

- `/create`
- not yet shipped

## Supporting Docs

- `docs/design-docs/steam-ship-blueprint.md`
- `docs/design-docs/steam-ready-game-reset.md`
- `docs/product-specs/home.md`
- `docs/product-specs/terminal.md`
