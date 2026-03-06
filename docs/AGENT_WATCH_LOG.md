# AGENT Watch Log

Purpose: Cogochi 작업 중복을 막고, 작업 전/후 실제 변경 이력을 시간 기준으로 고정 기록한다.

## Entry Format

- ID: `W-YYYYMMDD-HHMM-cogochi-<agent>`
- Start (KST):
- End (KST):
- Branch:
- Scope (planned):
- Overlap check (before work):
- Changes (actual):
- Diff vs plan:
- Commit / Push:
- Status: `IN_PROGRESS | DONE`

---

## Entries

### W-20260306-2057-cogochi-codex

- Start (KST): 2026-03-06 20:57
- End (KST): 2026-03-06 20:57
- Branch: `main`
- Scope (planned):
  - standalone prototype app를 `Cogochi/`로 rename
  - separate git repo initialize
  - GitHub remote 연결
  - repo-local context 문서 정리
- Overlap check (before work):
  - root `maxidoge-clones`는 non-git
  - `frontend/`는 별도 git repo이므로 Cogochi 초기화와 직접 충돌 없음
- Changes (actual):
  - `/Users/ej/Downloads/maxidoge-clones/aimon` -> `/Users/ej/Downloads/maxidoge-clones/Cogochi`
  - `git init -b main`
  - `origin` -> `https://github.com/eunjuhyun88/Cogochi`
  - `README.md`, `docs/PROJECT_CONTEXT.md`, `CLAUDE.md` 추가/정리
  - Trainer Hub / Roster / Battle route 구조 유지
- Diff vs plan:
  - 최초 HTTPS push는 GitHub auth 부재로 실패했고, 이후 SSH remote로 전환해 해결
- Commit / Push:
  - local commit `35a9c75` created
  - pushed to `origin/main`
- Status: DONE

---

### W-20260306-2111-cogochi-codex

- Start (KST): 2026-03-06 21:11
- End (KST): 2026-03-06 21:11
- Branch: `main`
- Scope (planned):
  - root `CLAUDE.md`의 컨텍스트 관리 규칙을 Cogochi repo 내부에 이식
  - repo-local watch log / agent-context 자리 생성
- Overlap check (before work):
  - standalone Cogochi repo 내부 문서만 수정
  - 앱 코드와 전투 로직은 건드리지 않음
- Changes (actual):
  - `CLAUDE.md`에 작업 시작 전 / Git-Sync 운영 규칙 / Context Engineering 규칙 추가
  - `.agent-context/README.md` 추가
  - `docs/AGENT_WATCH_LOG.md` 신설
- Diff vs plan:
  - 없음
- Commit / Push:
  - local commit `61498fb` created
  - pushed to `origin/main`
- Status: DONE

---

### W-20260306-2120-cogochi-codex

- Start (KST): 2026-03-06 21:20
- End (KST): 2026-03-06 21:20
- Branch: `main`
- Scope (planned):
  - Cogochi 문서를 repo 전용 문서 체계로 개편
  - 외부 root 문서 의존도 제거
- Overlap check (before work):
  - 문서 파일만 수정
  - 앱 코드/배틀 로직 변경 없음
- Changes (actual):
  - `README.md`를 Cogochi 제품 소개 문서로 재작성
  - `CLAUDE.md`에서 root extraction plan 의존 제거
  - `docs/PRODUCT_BLUEPRINT.md` 신규 추가
  - `docs/PROJECT_CONTEXT.md`를 Cogochi 전용 source-of-truth 관점으로 수정
- Diff vs plan:
  - watch log에 현재 항목까지 함께 기록
- Commit / Push:
  - local commit `18cfabf` created
  - pushed to `origin/main`
- Status: DONE

---

### W-20260306-2123-cogochi-codex

- Start (KST): 2026-03-06 21:23
- End (KST): 2026-03-06 21:23
- Branch: `main`
- Scope (planned):
  - Cogochi 전용 정식 설계문서 4종 추가
  - 기존 context 문서에서 새 설계문서 체계를 정본으로 연결
- Overlap check (before work):
  - 문서 파일만 수정
  - 앱 코드 변경 없음
- Changes (actual):
  - `docs/GAME_DESIGN.md` 추가
  - `docs/TECH_ARCHITECTURE.md` 추가
  - `docs/UIUX_SYSTEM.md` 추가
  - `docs/PROGRESSION_MODEL.md` 추가
  - `README.md`, `CLAUDE.md`, `docs/PROJECT_CONTEXT.md`에서 새 문서 링크/정본 체계 반영
- Diff vs plan:
  - AIMON 원본 문서 중 로컬에서 직접 확인 가능한 것은 `GDD`와 `Prototype HTML`뿐이었고, 나머지는 현재 Cogochi 방향과 기존 정리 문서를 바탕으로 재구성
- Commit / Push:
  - pending
- Status: DONE

---

### W-20260306-2116-cogochi-codex

- Start (KST): 2026-03-06 21:16
- End (KST): 2026-03-06 21:16
- Branch: `main`
- Scope (planned):
  - Cogochi 초기 커밋들을 원격에 push
  - push/auth 전환 이력 기록
- Overlap check (before work):
  - remote `origin`은 비어 있었고, 로컬 `main`만 존재
  - merge 대상 브랜치 없음
- Changes (actual):
  - `gh auth login`으로 GitHub auth 복구
  - remote URL을 HTTPS -> SSH로 전환
  - `git push -u origin main` 성공
- Diff vs plan:
  - merge는 필요 없었음. 원격이 empty repo였기 때문에 첫 push만 수행
- Commit / Push:
  - no code commit
  - `main` successfully pushed and upstream configured
- Status: DONE

---

### W-20260306-2159-cogochi-codex

- Start (KST): 2026-03-06 21:59
- End (KST): 2026-03-06 22:08
- Branch: `main`
- Scope (planned):
  - agent-sim 방향으로 제품 설계를 재고정
  - RAG, training, eval battle 중심의 buildable design 문서 추가
  - source-of-truth 문서 체계를 새 설계 기준으로 정렬
- Overlap check (before work):
  - 문서 파일만 수정
  - 앱 코드와 현재 battle shell은 변경하지 않음
- Changes (actual):
  - `docs/AGENT_SYSTEM_DESIGN.md` 신규 추가
  - `README.md`, `CLAUDE.md`, `docs/PROJECT_CONTEXT.md`, `docs/PRODUCT_BLUEPRINT.md`를 agent-sim 기준으로 수정
  - `docs/GAME_DESIGN.md`, `docs/TECH_ARCHITECTURE.md`, `docs/UIUX_SYSTEM.md`, `docs/PROGRESSION_MODEL.md`를 agent-sim 기준으로 재작성
  - git 상태 확인 결과 `git version 2.50.1`, remote는 `git@github.com:eunjuhyun88/Cogochi.git`
- Diff vs plan:
  - user가 채팅에 공유한 GitHub PAT는 보안상 사용하지 않고 폐기 대상으로 처리
- Commit / Push:
  - pending
- Status: DONE

---

### W-20260306-2209-cogochi-codex

- Start (KST): 2026-03-06 22:09
- End (KST): 2026-03-06 22:24
- Branch: `main`
- Scope (planned):
  - `types.ts`를 OwnedAgent / MemoryBank / TrainingRun / Squad / MatchState 중심으로 확장
  - `playerStore` 분리 후 `rosterStore`, `squadStore`, `labStore`, `matchStore` 추가
  - 현재 허브/로스터/팀/랩/배틀 화면이 새 stores를 읽도록 최소 리와이어
- Overlap check (before work):
  - 앱 코드와 문서 모두 변경
  - 현재 battle shell은 유지하되 데이터 경계만 교체
- Changes (actual):
  - `src/lib/aimon/types.ts`에 agent-sim 도메인 타입 대량 추가
  - `src/lib/aimon/data/baseModels.ts`, `src/lib/aimon/data/labCatalog.ts`, `src/lib/aimon/data/agentSeeds.ts` 추가
  - `src/lib/aimon/stores/rosterStore.ts`, `squadStore.ts`, `labStore.ts`, `matchStore.ts` 추가
  - `playerStore.ts`를 trainer profile 전용으로 축소
  - `battleStore.ts`, `battleEngine.ts`를 roster/squad 기준으로 수정하고 battle 결과를 roster/lab/match에 반영
  - `/`, `/roster`, `/team`, `/lab`, `/battle` 및 관련 컴포넌트를 owned-agent 중심으로 리와이어
  - `npm run check`, `npm run build` 통과
- Diff vs plan:
  - `/agent/[id]` route 생성은 이번 범위에서 제외
  - eval battle은 full redesign 대신 기존 shell 위에 match history / memory writeback만 최소 연결
- Commit / Push:
  - pending
- Status: DONE

---

### W-20260307-0030-cogochi-codex

- Start (KST): 2026-03-07 00:30
- End (KST): 2026-03-07 01:06
- Branch: `main`
- Scope (planned):
  - runtime/provider 타입 오류 정리
  - eval scenario를 battle/runtime/memory 흐름에 연결
  - AI runtime/training 상세 설계와 implementation contracts 문서화
  - context engineering 구조를 repo 내부에 실제로 세팅
- Overlap check (before work):
  - 기존 Cogochi 변경분이 아직 commit되지 않은 상태였고, 모두 같은 agent-sim 방향 작업으로 판단
  - 별도 사용자 수동 변경과 충돌하는 파일은 확인되지 않음
- Changes (actual):
  - `modelProvider`, `battleStore`, `agent/[id]` 타입 오류 수정 후 `npm run check`, `npm run build` 통과
  - `evalScenarios`, `matchStore`, `battleEngine`, `marketSimulator`, `contextAssembler`를 scenario-driven eval 구조로 확장
  - `docs/AI_RUNTIME_TRAINING_SPEC.md`, `docs/AI_IMPLEMENTATION_CONTRACTS.md` 추가
  - `AGENTS.md`, `docs/INDEX.md`, `docs/CONTEXT_ENGINEERING.md`, `docs/RELIABILITY.md`, `docs/PLANS.md`, `docs/QUALITY_SCORE.md`, `docs/exec-plans/` 추가
  - `scripts/check-context-docs.mjs` 추가 및 `npm run check`에 context-doc validation 연결
- Diff vs plan:
  - Anthropic 글은 context 관리 자체보다 eval noise 통제 문서로 반영했고, OpenAI 글은 repo map/progressive disclosure/mechanical validation 규칙으로 반영
- Commit / Push:
  - local commit `8427797` created
  - pushed to `origin/main`
- Status: DONE
