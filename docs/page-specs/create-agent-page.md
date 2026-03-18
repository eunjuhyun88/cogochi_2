# Create Agent Page

Route scope:
- `/create`

Purpose:
- Define the first-run creation route that produces a usable starter agent and hands the player into `Terminal`.

## Primary User Job

- Confirm the selected starter crew, choose the lead companion, and decide what kind of specialist to raise first.

## Core Flow

1. User arrives with a starter roster already pinned from Home, or drafts it here if they skipped Home selection.
2. User chooses which starter becomes the lead companion.
3. User enters an agent name.
4. User chooses a starter growth focus and doctrine.
5. User binds an AI or starter brain source.
6. Completion state unlocks `Terminal` and routes the user there.
7. Optional wallet or ownership upgrade can be offered later without blocking first-session value.

## Guardrails

- Do not split creation and brain setup across separate top-level routes.
- Do not make wallet connection mandatory for the first playable run.
- The route must end with one concrete outcome, not vague setup debt.
- Errors must be explicit and recoverable in-route.
- The page should feel ceremonial, but not slow or overloaded.

## Key UI Blocks

- step progress header
- starter roster summary
- lead companion selector
- name input
- growth focus selector
- starter doctrine selector
- AI bind block
- completion summary and `Enter Terminal` CTA
- optional ownership upgrade block kept visually secondary

## State Authority

- selected starter roster, lead companion, draft name, growth focus, doctrine choice, and step UI state: shared progression plus route local state
- starter agent creation result: server-backed agent creation workflow
- optional wallet connection: wallet stores
- optional ownership result: server-authoritative wallet and mint state

## Supporting APIs And Data

- future create-agent API workflow
- starter roster metadata source
- optional wallet flow from wallet stores

## Failure States

- creation appears complete but does not produce a usable agent state
- player cannot tell which selected character becomes the lead
- AI binding fails silently
- user leaves without understanding whether Terminal is unlocked
- wallet flow interrupts the ceremony and feels like a separate product

## Read These First

- `docs/design-docs/steam-ready-game-reset.md`
- `docs/design-docs/steam-ship-blueprint.md`
- `docs/design-docs/starter-roster-loop.md`
- `docs/product-specs/create-agent.md`
- `docs/product-specs/terminal.md`
