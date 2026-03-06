# Cogochi UIUX System

Last updated: 2026-03-06

## 1. UX 목표

Cogochi UI는 `배틀 대시보드`보다 `트레이너 허브 + 개체 관리` 중심으로 읽혀야 한다.

비율로 표현하면:

- 55% 개체 소유/육성 감각
- 30% 데이터 실험실 감각
- 15% live battle HUD 감각

## 2. UX 원칙

### 2.1 개체 애착이 먼저다

- 배틀보다 로스터와 개체 상세가 먼저 보여야 한다
- 사용자는 내 개체 상태를 먼저 보고 다음 행동을 정해야 한다

### 2.2 정보는 많아도 시선은 명확해야 한다

- battle에서는 arena 중심
- roster에서는 selected agent 중심
- team에서는 active squad 중심

### 2.3 숫자는 의미로 번역되어야 한다

- raw stat만 나열하지 않는다
- retraining path, focus skill, readiness 상태처럼 해석 가능한 라벨이 같이 보여야 한다

## 3. 정보 구조

```text
/
  Trainer Hub
/roster
  Owned Agents
/agent/[id]
  Agent Detail
/team
  Squad Builder
/battle
  Live Battle
/lab
  Growth / Evolution / Research
```

현재 구현은 `/agent/[id]`가 아직 없고, `/roster` 우측 패널이 이를 부분 대체한다.

## 4. 화면별 역할

### 4.1 `/` Trainer Hub

보여줘야 하는 것:

- 대표 스쿼드
- 현재 성장 상태
- 진화 가능 개체
- 바로 해야 할 다음 행동

가장 중요한 CTA:

- Roster
- Team
- Battle

### 4.2 `/roster`

실질적 메인 화면이다.

필수 레이아웃:

- 좌측: collection grid
- 우측: selected agent detail

플레이어는 여기서:

- 어떤 개체를 집중 육성할지
- 어떤 개체를 스쿼드에 넣을지
- 어떤 retraining이 필요한지

를 결정한다.

### 4.3 `/team`

목표:

- 4개체 출전 보드 구성
- 역할/상성/레짐 대응 확인

현재는 선택 UI 수준이지만, 목표는 slot-first builder다.

### 4.4 `/battle`

목표:

- 배틀을 예쁘게 보여주는 것보다 왜 이기고 지는지 읽히게 만드는 것

핵심 정보:

- phase
- regime
- consensus
- orb interaction
- 각 개체 상태

### 4.5 `/lab`

목표:

- 성장과 해금을 관리하는 공간
- 숫자 창고가 아니라 실험실처럼 느껴져야 한다

## 5. 비주얼 시스템

### 5.1 톤

- deep navy background
- cyan glow
- subtle grid
- arcade terminal panel

### 5.2 컬러 역할

- cyan: global accent
- orange: active interaction
- green: positive/growth
- yellow: evolution/readiness
- red: danger/loss
- purple: advanced systems

타입 컬러는 전체 UI를 칠하지 말고 개체 카드, 링, 배지에 집중 사용한다.

### 5.3 타이포

- Display: Orbitron
- HUD / numeric: JetBrains Mono
- Body: Rajdhani

원칙:

- 제목은 짧고 강하게
- 숫자는 monospace
- 설명문은 길지 않게

### 5.4 쉐이프

- hard-rounded rectangle
- arcade panel frame
- 명확한 grid alignment

pill button 일변도로 가지 않는다.

## 6. 상호작용 원칙

### 선택

- hover: 약한 lift
- selected: line 강조 + glow
- active squad: badge 표시

### 훈련 편집

- 작은 변경은 즉시 반영
- 큰 retraining path 변경은 confirm 필요

### 전투 피드백

- focus tap은 개체와 orb 둘 다 반응해야 한다
- clash / counter / amplify는 색과 궤적이 구분돼야 한다
- result는 WIN/LOSS만 아니라 MVP와 성장 포인트도 함께 보여야 한다

## 7. 모바일 원칙

### Desktop

- hub: multi-panel dashboard
- roster: 2-column
- battle: arena + right HUD

### Mobile

- roster: vertical card stack + bottom sheet detail
- battle: canvas 우선, detail drawer 접기
- team: drag 대신 tap assign

모바일에서도 `내 개체 정보`와 `전장 정보` 둘 다 유지해야 한다.

## 8. 현재 구현 기준 체크포인트

현재 UI가 맞는지 확인하는 질문:

1. 첫 화면이 battle dashboard처럼 보이지 않는가
2. `/roster`가 실제 메인 화면처럼 느껴지는가
3. 사용자가 개체 하나를 골라 애착을 느낄 수 있는가
4. battle 정보가 많아도 시선이 흐트러지지 않는가
5. growth와 retraining의 다음 행동이 보이는가
