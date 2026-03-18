# Workflow Protocols

Purpose:
- Provide a lightweight, repo-local version of the `superpowers` workflow.
- Keep product, UX, and implementation work structured without importing a heavy software-only process.
- Make it easier for a human and coding agent to collaborate on this project repeatedly.

Status:
- active working protocol

## Default Workflow

Use the smallest workflow that fits the task.

1. `Brainstorm`
   - clarify the player fantasy, loop position, screen job, and success test
2. `Game Plan`
   - turn the clarified idea into a small execution contract
3. `UI Pass`
   - refactor the screen with one dominant purpose and visible next action
4. `Validate`
   - run build/check and verify the actual rendered result

This is intentionally lighter than the full `superpowers` stack.

It does **not** require:
- heavy TDD-first workflow for every UI pass
- subagent fan-out for every task
- giant plan documents before every change

It **does** require:
- product intent before code
- one screen purpose at a time
- before/after evidence
- explicit validation

## When To Use Which Template

### `brainstorm-template.md`

Use when:
- the user asks to redesign a loop
- the task changes product meaning, IA, or player flow
- the request is still fuzzy

### `game-plan-template.md`

Use when:
- the task is clear enough to implement
- you need a small execution contract before editing files
- multiple screens or surfaces may be affected

### `ui-pass-template.md`

Use when:
- the task is mainly UI/UX cleanup
- the user says the screen feels cluttered, tiny, or off-balance
- you are iterating on layout, hierarchy, or text

## Repo-Specific Rules

1. Do not jump from a vague request straight into many files.
2. Do not treat every page as equally important.
3. `Home`, `Setup`, `Lab`, `Arena`, and `Agent HQ` are the core surfaces.
4. `Lab` is the center of gravity for the product.
5. `Battle/Arena` is proof, not the whole game.
6. UI passes should optimize for:
   - one primary action
   - readable type scale
   - balanced layout ratio
   - visible game-state consequence
7. Stable findings must be promoted into canonical docs:
   - `docs/design-docs/*.md`
   - `docs/product-specs/*.md`
   - `docs/page-specs/*.md`

## Minimal Done Definition

A task is not done because the code changed.

A task is done when:
- the intended player action is obvious within 3 seconds
- the screen hierarchy is cleaner than before
- `npm run build` passes
- `npm run check -- --fail-on-warnings=false` does not add new errors
- a screenshot or real render confirms the result
