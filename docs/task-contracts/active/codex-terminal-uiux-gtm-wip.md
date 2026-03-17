# Task Contract: terminal-uiux-gtm-wip

- Branch: `codex/terminal-uiux-gtm-wip`
- Surface: `home`
- Type: `implementation`
- Status: `ready_for_push`

## Goal

Implement the first runtime bridge from the old shell into the new six-surface IA by shifting `Home` and primary navigation toward `Create Agent / Terminal / World / Agent`.

## Scope

- update `Home` hero copy and CTA hierarchy so the first action is `Create Agent`
- replace primary navigation labels and active surfaces with the six-surface bridge set
- add minimal runtime bridge routes for `/create`, `/world`, and `/agent`
- keep existing `/arena`, `/lab`, `/passport`, and `/signals` behavior reachable as legacy or secondary surfaces
- avoid deep rewrites of Terminal, Arena, Lab, or Passport internals in this slice

## Finish Line

- [x] home primary CTA routes to `/create` instead of `/terminal`
- [x] home copy and surface rail reflect `Create Agent -> Terminal -> World -> Battle -> Agent`
- [x] desktop and mobile primary navigation use `Home / Create / Terminal / World / Agent`
- [x] `/create`, `/world`, and `/agent` load valid bridge pages instead of 404
- [x] existing secondary or legacy flows remain reachable without breaking current runtime behavior
- [x] validation evidence is recorded for the runtime slice

## Evidence

- `npm run check`
- `npm run docs:check`
- `npm run build`
- final file list and validation summary in the watch log

## Non-Goals

- rewriting Terminal, Arena, Lab, or Passport internals beyond bridge-level entry changes
- changing branch strategy, push policy, or unrelated WIP already present in this worktree
