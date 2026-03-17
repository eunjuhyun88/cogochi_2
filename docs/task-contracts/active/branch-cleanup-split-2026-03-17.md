# Task Contract: branch-cleanup-split-2026-03-17

- Branch: `codex/terminal-uiux-gtm-wip`
- Surface: `branch-hygiene`
- Type: `workflow`
- Status: `ready_for_push`

## Goal

Separate the current dirty branch into pushable slices and sandbox-only leftovers without losing any existing work.

## Scope

- preserve the full current dirty state before slicing
- ignore local-only output noise from future status views
- isolate a shippable runtime/docs branch state on `codex/terminal-uiux-gtm-wip`
- park arena-heavy experiments and local assets on a separate sandbox branch

## Finish Line

- [x] current dirty state is backed up before any slicing
- [x] local output noise no longer pollutes default git status
- [x] pushable runtime/docs slice remains on `codex/terminal-uiux-gtm-wip`
- [x] remaining arena/asset experiments are preserved on a separate branch or stash
- [x] branch cleanup summary is recorded in the watch logs

## Evidence

- `git status --short --branch`
- branch or stash names for preserved WIP
- final branch/state summary in the watch logs
- `npm run docs:check`
- `npm run check`
- `npm run build`

## Non-Goals

- pushing to remote in this slice
- deleting experimental work permanently
- rewriting arena experiments to make them shippable
