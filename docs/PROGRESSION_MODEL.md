# Cogochi Progression Model

Last updated: 2026-03-06

## 1. 성장 철학

Cogochi의 성장은 `전역 레벨 숫자`보다 `내 개체가 어떻게 변했는가`를 우선해야 한다.

중요도 순서는 아래다.

1. 개체 성장
2. 개체 세팅 변화
3. 스쿼드 운영 변화
4. 플레이어 계정 성장

## 2. 성장 단위

### Player Profile

플레이어 전체 진행.

예시 항목:

- trainer level
- research points
- currency
- unlocked systems

### Owned Agent

성장의 핵심 단위.

예시 항목:

- level
- xp
- bond
- evolution state
- learned indicators
- retraining progress

### Squad

성장의 결과가 표현되는 조합 단위.

- 어떤 개체를 같이 쓸지
- 어떤 레짐에서 강한지
- 어떤 역할 조합인지

## 3. 현재 문제

현재 구현은:

- global XP 중심
- dex id 기반 squad 선택
- per-agent progression 부재

따라서 육성 게임 감각이 약하다.

## 4. 목표 성장 자원

### Agent XP

- 배틀 참여 개체가 직접 획득
- 레벨업의 기본 자원

### Bond

- 특정 개체를 오래 쓰거나 좋은 결과를 낼수록 증가
- focus skill 안정성, 특수 반응, cosmetic unlock에 연결 가능

### Research Point

- 플레이어 계정 단위 자원
- 새 지표, 새 retraining path, 시스템 unlock에 사용

### Retraining Progress

- 특정 학습 경로를 얼마나 진행했는지 표시
- 단순 레벨업이 아니라 플레이스타일 변화에 연결

## 5. 레벨업 모델

### 개체 레벨업

- 전투 결과 후 per-agent XP 분배
- MVP, participation, synergy contribution으로 가중치 가능

레벨업 효과:

- 기본 스탯 소폭 증가
- 새 지표 슬롯 해금
- retraining tier 개방

### 플레이어 레벨업

- 연구 시스템 해금
- squad preset 수 증가
- 더 높은 난이도/리그 접근

## 6. 리트레이닝 모델

리트레이닝은 단순 수치 버프가 아니라 `행동 스타일 변경`이어야 한다.

예시 경로:

- Trend Hunter
- Contrarian Loop
- Liquidity Oracle
- Volatility Sniper
- Crowd Whisper
- Macro Compass

경로 선택 결과:

- 읽는 지표 우선순위 변화
- behavior bias 변화
- focus skill 변화
- 특정 레짐에서 강약 변화

## 7. 진화 모델

진화는 개체 단위로 처리한다.

필수 조건 예시:

- 최소 레벨
- 특정 XP 도달
- 특정 이벤트 누적
- 특정 retraining tier 달성

진화 결과:

- 외형 변화
- 스킬/패시브 업그레이드
- 역할 명확화

## 8. 전투 보상 분배

### Match Result 기준 분배

배틀 종료 후 `MatchResult`는 아래 단위로 나뉘어야 한다.

#### Trainer Rewards

- research points
- ladder/rank delta
- unlock fragments

#### Agent Rewards

- xp
- bond
- retraining progress
- evolution trigger counter

핵심은 `팀이 이겼다`와 `누가 성장했다`를 분리해서 보여주는 것이다.

## 9. 성장 루프 예시

1. Flowling을 roster에서 선택
2. Whale-flow 중심 loadout 장착
3. squad에 투입
4. battle에서 승리
5. Flowling이 XP와 retraining progress 획득
6. Lab에서 evolution requirement 확인
7. 다음 battle 전에 build 재조정

이 감각이 살아야 Cogochi가 된다.

## 10. 구현 우선순위

### Step 1

- `OwnedAgent` 타입 도입
- 초기 starter/roster 생성

### Step 2

- `rosterStore`, `squadStore` 분리
- per-agent XP 저장

### Step 3

- battle reward를 개체 단위로 연결
- evolution counters 저장

### Step 4

- `/agent/[id]` 상세 페이지
- retraining path UI

### Step 5

- async PvP용 opponent snapshot reward loop

## 11. 설계 체크 질문

1. battle을 한 뒤 특정 개체가 성장했다는 감각이 남는가
2. 같은 종이라도 서로 다른 개체로 키워지는가
3. retraining이 +5 stat이 아니라 플레이스타일 차이로 느껴지는가
4. roster 관리가 실제 전략 행위가 되는가
5. 성장 결과가 다음 squad 선택을 바꾸는가
