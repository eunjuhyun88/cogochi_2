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

### W-20260318-0702-cogochi-codex

- Start (KST): 2026-03-18 07:02
- End (KST): 2026-03-18 07:02
- Branch: `main`
- Scope (planned):
  - command deck 기반의 새 메인 플로우 구현
  - 다중 캐릭터 선택 -> 성장 방향 선택 -> 학습 -> 전투 -> 임대 흐름의 첫 vertical slice 연결
  - 홈/팀/랩/마켓 화면을 새 제품 구조에 맞게 리와이어
- Overlap check (before work):
  - 기존 dirty worktree 존재
  - 사용자 변경은 건드리지 않고 Cogochi 내부 화면/상태 레이어만 확장
- Changes (actual):
  - `src/lib/aimon/data/growthLanes.ts` 추가
  - starter stable을 24개 후보로 확장
  - `src/routes/+page.svelte`를 rotating candidate wall + multi-select command deck으로 재작성
  - `src/routes/team/+page.svelte`를 growth draft 화면으로 재작성
  - `src/routes/lab/+page.svelte`에 active growth program과 training queue action 추가
  - `src/routes/market/+page.svelte` 신규 추가
  - `src/routes/+layout.svelte`, `src/lib/aimon/stores/gameStore.ts`, `src/lib/aimon/stores/rosterStore.ts`, `src/lib/aimon/stores/squadStore.ts`, `src/lib/aimon/data/agentSeeds.ts`, `src/lib/aimon/types.ts` 갱신
  - `npm run check`, `npm run build` 통과
- Diff vs plan:
  - battle runtime 자체는 유지하고 front-door와 pre-battle growth flow에 집중
- Commit / Push:
  - pending
- Status: DONE

---

### W-20260318-1500-cogochi-maxidoge-tone-restore

- Start (KST): 2026-03-18 15:00
- End (KST): 2026-03-18 15:25
- Branch: `main`
- Scope (planned):
  - front-door IA와 카피가 지나치게 foundry/backtest 쪽으로 기울어진 부분을 되돌림
  - `maxidoge` 게임 허브 톤을 복구하고 Lab만 실험실 역할로 재정렬
- Overlap check (before work):
  - 기존 rotating candidate wall, growth draft, lab, battle, market 기능은 유지
  - 변경 범위는 상단 브랜딩과 홈/랩/마켓 카피 중심으로 제한
- Changes (actual):
  - `src/routes/+layout.svelte`에서 상단 브랜드를 `MAXIDOGE COMMAND` 톤으로 복구하고 nav를 `Deck / Roster / Team / Battle / Lab / Market` 구조로 재정렬
  - `src/routes/+page.svelte`에서 홈 hero, CTA, flow strip, rotating pool, late-game market 카피를 다시 게임 허브 중심으로 조정
  - `src/routes/lab/+page.svelte`에서 hero와 주요 섹션명을 `TRAINING LAB` 기준으로 재정의해 실험실 역할은 유지하되 앞단 게임성을 덮지 않도록 정리
  - `src/routes/market/+page.svelte`에서 market을 후반 보상 레이어로 다시 설명
  - 이후 추가로 `frontend/static/blockparty` 자산을 `Cogochi/static/blockparty`로 가져오고 `src/components/shared/MaxidogeBackground.svelte`를 추가
  - `src/routes/+page.svelte`를 Maxidoge visual grammar 기준으로 재구성: war-room hero, feature rail, right-wall rotating pool, pack board
  - `progress.md` 업데이트
  - `npm run check`, `npm run build` 통과
- Diff vs plan:
  - 구조와 기능은 유지하고 메시지/IA만 되돌리는 선에서 마감
- Commit / Push:
  - pending
- Status: DONE

### W-20260318-0000-cogochi-codex

- Start (KST): 2026-03-18 00:00
- End (KST): 2026-03-18 00:00
- Branch: `main`
- Scope (planned):
  - user가 제시한 대형 GDD와 현재 Cogochi 방향을 재점검
  - Steam 출시 수준의 front-door/player-flow 기준으로 제품 구조 재정의
  - main 화면의 다중 캐릭터 선택, 성장 계획, 학습, 플레이, 임대 흐름을 문서 정본에 반영
- Overlap check (before work):
  - 문서 중심 작업
  - 현재 앱 코드와 route shell은 변경하지 않음
- Changes (actual):
  - `docs/STEAM_RELEASE_REFRAME.md` 신규 추가
  - `docs/MASTER_GAME_SPEC.md`, `docs/PRODUCT_BLUEPRINT.md`, `docs/UIUX_SYSTEM.md`, `docs/INDEX.md`를 새 front-door 기준으로 정렬
  - `docs/exec-plans/completed/2026-03-18-steam-release-reframe.md` 추가
- Diff vs plan:
  - 정책/배포 제약은 별도 트랙으로 분리하고 이번 작업에서는 제품/UX 구조 정리만 수행
- Commit / Push:
  - pending
- Status: DONE

### W-20260307-1553-cogochi-codex

- Start (KST): 2026-03-07 15:53
- End (KST): 2026-03-07 15:53
- Branch: `main`
- Scope (planned):
  - battle를 chart-driven tactical scene으로 재정의
  - chart -> battlefield translation, role skill mapping, scenario objectives, HUD, runtime scene model 문서화
  - 기존 product/ui 문서를 새 battle 정본에 맞게 연결
- Overlap check (before work):
  - 문서 중심 작업
  - 현재 battle 구현은 유지하고 source-of-truth만 먼저 확정
- Changes (actual):
  - `docs/CHART_BATTLE_SPEC.md` 신규 추가
  - `docs/INDEX.md`, `docs/GAME_DESIGN.md`, `docs/UIUX_SYSTEM.md`, `docs/PRODUCT_BLUEPRINT.md`에서 새 battle 정본 참조 반영
  - `docs/exec-plans/completed/2026-03-07-chart-battle-spec.md` 추가
- Diff vs plan:
  - 구현 변경은 포함하지 않고 설계 정본과 연결 문서까지만 처리
- Commit / Push:
  - pending
- Status: DONE

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

---

### W-20260307-0115-cogochi-codex

- Start (KST): 2026-03-07 01:15
- End (KST): 2026-03-07 01:30
- Branch: `main`
- Scope (planned):
  - eval/reflection 로직을 store에서 서비스로 분리
  - execution plan 기준으로 battle -> eval -> reflection -> memory writeback 흐름 정리
- Overlap check (before work):
  - 직전 context-engineering 정리 이후 동일 repo 내부 AI runtime 작업만 ادامه
  - 기존 UI와 runtime adapter는 유지하고 scoring/writeback 경계만 이동
- Changes (actual):
  - `src/lib/aimon/services/evalService.ts` 추가
  - `src/lib/aimon/services/reflectionService.ts` 추가
  - `src/lib/aimon/types.ts`에 `FailureMode`, `ReflectionNote` 추가
  - `matchStore.ts`에서 inline scoring 제거, `recordEvalMatchResult`로 단순화
  - `labStore.ts`에서 battle memory 생성 제거, `appendMemoryRecords`로 변경
  - `battleStore.ts`를 `draft eval -> reflection -> durable memory -> final match result` 흐름으로 리와이어
  - `/agent/[id]`, `/lab`에서 reflection lesson과 failure mode 표시 보강
  - 실행 계획을 `docs/exec-plans/completed/2026-03-07-eval-reflection-services.md`로 완료 처리
  - `npm run check`, `npm run build` 통과
- Diff vs plan:
  - reward packet 적용은 기존 `playerStore`/`rosterStore` 함수와의 호환성을 위해 이번 단계에서는 유지
- Commit / Push:
  - pending
- Status: DONE

---

### W-20260307-0140-cogochi-codex

- Start (KST): 2026-03-07 01:40
- End (KST): 2026-03-07 02:05
- Branch: `main`
- Scope (planned):
  - eval 결과를 SFT/preference dataset bundle로 변환하는 `datasetBuilder` 구현
  - battle 종료 시 `contextPackets`와 `datasetBundleId`를 match history에 연결
  - `labStore`에 dataset bundle 영속화 및 랩 UI 표시 추가
- Overlap check (before work):
  - 직전 eval/reflection 분리 작업과 동일한 agent-sim 범위
  - 기존 local 미커밋 변경은 모두 같은 AIMON runtime 흐름 연장선으로 판단
- Changes (actual):
  - `src/lib/aimon/services/datasetBuilder.ts` 추가
  - `TrainingDatasetBundle`를 match-level bundle + `agentIds`/`sourceMatchId` 구조로 정리
  - `battleStore.ts`에서 `contextPackets` 생성 후 dataset bundle 저장 및 `datasetBundleId`를 eval result에 기록
  - `labStore.ts`에 `datasetBundles` persistence 추가
  - `/lab`, `/agent/[id]`에 dataset bundle 상태와 match 연결 표시 추가
  - `docs/AI_IMPLEMENTATION_CONTRACTS.md`, 실행 계획, 품질표, tech debt tracker 갱신
  - `npm run check`, `npm run build` 통과
- Diff vs plan:
  - bundle은 per-agent가 아니라 per-match 구조로 잡아 `matchResult.datasetBundleId` 단일 참조를 유지
- Commit / Push:
  - pending
- Status: DONE

---

### W-20260307-0430-cogochi-codex

- Start (KST): 2026-03-07 04:30
- End (KST): 2026-03-07 05:20
- Branch: `main`
- Scope (planned):
  - 게임 본체 기준의 마스터 설계를 새 정본 문서로 통합
  - 기존 product/game/battle/progression/ui 문서가 새 정본을 가리키게 정렬
  - 다음 구현 우선순위를 게임 문법 기준으로 다시 고정
- Overlap check (before work):
  - 기존 문서가 기능별로 분산돼 있어 충돌보다 중복/우선순위 혼선이 더 큰 상태
  - 코드 변경 없이 문서 정합성 위주로 진행
- Changes (actual):
  - `docs/MASTER_GAME_SPEC.md` 추가
  - 게임 정의, 역할 2층 구조, 차트 전장 문법, 전투 액션 문법, RAG의 게임적 의미, 성장, UI, 구현 단계까지 통합 정리
  - 레퍼런스 이미지가 요구하는 `기술 이름`, `락온/스캔`, `다중 타깃`, `청산 포식`, `승리 컷` 표현 계층을 `MASTER_GAME_SPEC`의 전투 문법과 match presentation mode에 추가
  - `docs/BATTLE_RUNTIME_PRESENTATION_SPEC.md` 추가
  - `scenario -> market -> AI intent -> action plan -> scene event -> presentation beat` 하이브리드 런타임 구조와 데이터 계약 정리
  - `docs/core/` 폴더 추가
  - 핵심 문서 5개를 `docs/core/` 안에 실제 본문 복사본으로 배치
  - shortcut 래퍼를 제거하고 `core/README.md`, `core/INDEX.md`만 남김
  - `docs/INDEX.md`, `docs/PRODUCT_BLUEPRINT.md`, `docs/GAME_DESIGN.md`, `docs/CHART_BATTLE_SPEC.md`, `docs/UIUX_SYSTEM.md`, `docs/PROGRESSION_MODEL.md`가 새 마스터 스펙을 참조하도록 갱신
  - `docs/INDEX.md`, `docs/MASTER_GAME_SPEC.md`가 새 battle runtime spec을 가리키도록 갱신
  - `docs/exec-plans/completed/2026-03-07-master-game-spec.md` 추가
- Diff vs plan:
  - 구현 계약서까지 다시 쓰지는 않고 게임 정체성과 전장 문법을 우선 고정
- Commit / Push:
  - pending
- Status: DONE

---

### W-20260307-0215-cogochi-codex

- Start (KST): 2026-03-07 02:15
- End (KST): 2026-03-07 02:45
- Branch: `main`
- Scope (planned):
  - `trainingOrchestrator`와 `fineTuneService`를 추가해 dataset bundle 이후 학습 잡 상태머신 구현
  - agent/lab UI에서 queue/start/promote 흐름 노출
  - artifact와 active promotion 상태를 agent profile에 연결
- Overlap check (before work):
  - 직전 dataset builder 단계 이후 동일한 AIMON runtime 흐름
  - 기존 uncommitted 상태가 없어 충돌 없음
- Changes (actual):
  - `types.ts`에 `TrainingJobState`, `TrainingJobResult`, `FineTuneJobPayload`, `FineTuneArtifactManifest`, `ModelArtifact`, `activeArtifactId` 추가
  - `labStore.ts`에 training job migration, artifact persistence, upsert/update helpers 추가
  - `rosterStore.ts`가 `activeArtifactId`와 agent status patch를 지원하도록 확장
  - `trainingOrchestrator.ts` 추가: queue/validate/start/cancel/promote 상태머신 구현
  - `fineTuneService.ts` 추가: local manifest packaging, artifact registration, benchmark compare, promotion hook 구현
  - `/agent/[id]`에서 queue 즉시 실행과 promotable candidate 승격 버튼 연결
  - `/lab`에서 artifact 상태와 training job state 표시 보강
  - `npm run check`, `npm run build` 통과
- Diff vs plan:
  - real GPU fine-tune 대신 local artifact manifest 기반 MVP로 마감
- Commit / Push:
  - pending
- Status: DONE

---

### W-20260307-0300-cogochi-codex

- Start (KST): 2026-03-07 03:00
- End (KST): 2026-03-07 03:30
- Branch: `main`
- Scope (planned):
  - repo governance 강화를 위해 architecture lint, code-aware context freshness, benchmark manifests, artifact lineage를 구현
  - `npm run check`에 강제 규칙 연결
  - lab UI에 운영 로그를 노출
- Overlap check (before work):
  - 직전 training orchestrator 단계 이후 동일 repo 내부 governance 보강
  - 기존 기능 구현과 충돌하지 않는 수준의 lint rule만 우선 적용
- Changes (actual):
  - `scripts/check-aimon-architecture.mjs` 추가 및 `package.json`의 `check` 체인에 연결
  - `scripts/check-context-docs.mjs`를 code-aware freshness 검증까지 확장
  - `benchmarkManifestService.ts` 추가
  - `types.ts`, `matchStore.ts`, `labStore.ts`, `battleStore.ts`에 benchmark manifest / artifact lineage persistence 추가
  - `trainingOrchestrator.ts`가 artifact created/promoted lineage를 기록하도록 확장
  - `/lab`에서 recent benchmark runs / artifact lineage 노출
  - `CONTEXT_ENGINEERING.md`, `QUALITY_SCORE.md`, implementation contracts, tech debt tracker 업데이트
  - `npm run check`, `npm run build` 통과
- Diff vs plan:
  - CPU/memory telemetry는 browser-local approximation으로 우선 기록
  - durable remote registry/export는 다음 단계 debt로 유지
- Commit / Push:
  - pending
- Status: DONE
