# STOCKCLAW Worktree Guide

Last updated: 2026-03-06

This file is repo-local and worktree-aware. Treat the current git worktree rooted at this repository as active; do not assume a sibling clone path is canonical.

## Read First

1. `README.md`
2. `AGENTS.md`
3. `docs/README.md`
4. `docs/SYSTEM_INTENT.md`
5. `ARCHITECTURE.md`

## Execution Defaults

- Start every task with `git status --short --branch`.
- Use `npm run safe:status` before edits and `npm run safe:sync` before push.
- Record semantic working memory with:
  - `npm run ctx:checkpoint -- --work-id "<W-ID>" --surface "<surface>" --objective "<objective>"`
- Build resume artifacts with:
  - `npm run ctx:compact`
- Validate handoff quality with:
  - `npm run ctx:check -- --strict`

## Canonical Authority

- Execution rules: `AGENTS.md`
- Collaboration SSOT: `README.md`
- Root map: `ARCHITECTURE.md`
- Task-level doc router: `docs/README.md`
- Canonical docs: `docs/{DESIGN,FRONTEND,PLANS,PRODUCT_SENSE,QUALITY_SCORE,RELIABILITY,SECURITY}.md`

## Code Standards

- **모듈화 우선**: 컴포넌트, 유틸, API는 항상 분리된 파일로. 한 파일 200줄 넘으면 분리 검토.
- **재사용 가능하게**: 하드코딩 금지. 색상은 tokens.css, 데이터는 별도 ts 파일.
- **타입 안전**: TypeScript interface/type 선언 필수. any 금지.
- **리팩토링 친화적**: import path가 바뀌지 않도록 index.ts barrel export 활용.

## Guardrails

- `docs/archive/` is historical context, not current authority.
- `.agent-context/` is local runtime memory only; never commit it.
- If architecture, ownership, or behavior changes, update the relevant canonical doc under `docs/`.
- Keep pre-push hooks active via `npm run safe:hooks`.
