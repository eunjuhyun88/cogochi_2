# Cogochi Technical Architecture

Last updated: 2026-03-06

## 1. 아키텍처 목표

Cogochi의 기술 구조는 아래 목표를 따라야 한다.

- 독립 repo로 운영 가능해야 한다
- 배틀 로직은 UI와 분리되어야 한다
- 초기에는 simulator-first로 빠르게 반복 가능해야 한다
- 나중에 async PvP와 per-agent progression으로 자연스럽게 확장 가능해야 한다

## 2. 현재 기술 스택

- SvelteKit 2
- Svelte 5
- TypeScript 5
- Vite
- localStorage 기반 클라이언트 저장

현재는 standalone frontend app이며 서버 의존 없이 동작한다.

## 3. 현재 디렉토리 구조

```text
src/
  routes/
    +page.svelte
    battle/+page.svelte
    roster/+page.svelte
    team/+page.svelte
    lab/+page.svelte
  components/
    aimon/
    shared/
  lib/
    aimon/
      data/
      engine/
      market/
      stores/
      types.ts
```

주의:

- `aimon` namespace는 제품명이 아니라 초기 프로토타입의 내부 네임스페이스 흔적이다
- 문서와 제품명은 `Cogochi` 기준으로 유지한다
- namespace rename은 기능 안정화 이후 별도 작업으로 다룬다

## 4. 레이어 분리 원칙

### Routes

- 화면 조립과 화면 단위 상태 진입만 담당
- 복잡한 계산과 도메인 규칙을 직접 가지지 않는다

### Components

- 시각 표현과 상호작용 표시 담당
- 배틀 규칙, 성장 규칙은 포함하지 않는다

### Stores

- 화면 orchestration
- persistence 연결
- engine 호출과 state sync 담당

### Engine

- 순수 규칙 계층
- battle, state machine, orb, evolution, reward 계산 담당

### Data

- dex, type chart, training profile, synergy 같은 정적/준정적 데이터 담당

## 5. 현재 핵심 모듈

### Routes

- `src/routes/+page.svelte`
  - Trainer Hub
- `src/routes/roster/+page.svelte`
  - roster-first 메인 관리 화면
- `src/routes/battle/+page.svelte`
  - live battle proof screen

### Stores

- `playerStore.ts`
  - 현재는 player + roster + squad 성격이 섞여 있음
- `battleStore.ts`
  - 배틀 state orchestration
- `gameStore.ts`
  - screen state와 prototype scope 관리

### Engine

- `battleEngine.ts`
- `stateMachine.ts`
- `signalOrbSystem.ts`
- `evolutionSystem.ts`
- `marketSimulator.ts`

## 6. 현재 문제점

### 6.1 playerStore 과적재

현재 `playerStore`가:

- 전체 XP
- unlockedDexIds
- teamDexIds

를 한 번에 들고 있다.

이 구조는 `내 개체` 기반 게임으로 확장하기 어렵다.

### 6.2 Dex-driven state

현재 상태는 개체가 아니라 dex id 중심이다.

필요한 목표 상태:

- species definition
- owned agent instance
- active squad
- opponent snapshot

### 6.3 route naming and internal namespace mismatch

- 제품명은 Cogochi
- 내부 namespace는 `aimon`

이건 즉시 문제는 아니지만, 장기적으로 정리 포인트다.

## 7. 목표 도메인 모델

### SpeciesDexEntry

- 종족 데이터
- 타입, 기본 스탯, 진화 규칙, 학습 가능 지표

### OwnedAgent

- 플레이어가 소유한 개체
- 레벨, XP, bond, temperament, IV, loadout 포함

### TrainingLoadout

- 개체별 관측 지표
- behavior bias
- retraining path
- focus skill

### Squad

- 현재 출전하는 4개체 조합

### OpponentSnapshot

- PvE, ghost battle, async PvP에 공통 사용 가능한 상대 표현

### MatchResult

- 승패 결과와 개체별 보상 정보

## 8. 목표 상태 저장 구조

### playerStore

- trainer level
- research points
- currency
- unlocked systems

### rosterStore

- owned agents
- selected agent
- agent history

### squadStore

- active squad ids
- squad presets
- synergy summary

### battleStore

- runtime battle state only
- match start / tick / end orchestration

## 9. 데이터 플로우

```text
MarketSimulator
  -> battleStore
  -> stateMachine
  -> signalOrbSystem
  -> battleEngine
  -> rewardSystem
  -> rosterStore
  -> playerStore
```

route/component는 store를 읽고 action만 호출한다.

## 10. Persistence 전략

### 현재

- localStorage
- 프로토타입 개발에 적합

### 다음 단계

- player / roster / squad 분리 저장
- versioned storage key
- migration layer 추가

### 장기

- server snapshot
- async PvP opponent snapshot 저장
- account 기반 sync

## 11. 구현 순서

1. `types.ts`에 target domain type 추가
2. `playerStore` 분해
3. battle reward를 per-agent reward로 변경
4. `/agent/[id]` route 추가
5. opponent snapshot 구조 도입
6. 내부 namespace rename 여부 판단

## 12. 검증 기준

아키텍처 변경 후 최소 검증:

- `npm run check`
- `npm run build`

추가로 확인할 것:

- route가 store 역할을 침범하지 않는지
- store가 engine 계산을 중복하지 않는지
- per-agent progression이 UI와 state 양쪽에서 일관적인지
