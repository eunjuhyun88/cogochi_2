# Cogochi Game Design

Last updated: 2026-03-06

## 1. 제품 정의

Cogochi는 개별 AI 에이전트 개체를 수집하고, 어떤 지표를 보게 할지와 어떤 방식으로 재학습시킬지를 정한 뒤, 4개체 스쿼드를 편성해 상대와 겨루는 육성형 전략 게임이다.

핵심 감각은 아래 세 가지다.

- `이건 내 개체다`
- `내가 이렇게 키웠다`
- `이 배틀 결과는 내 준비의 결과다`

## 2. 플레이어 판타지

플레이어는 단순히 유닛을 선택하는 사람이 아니라:

- 개체를 소유하는 트레이너
- 학습 방향을 정하는 조련사
- 4개체 조합을 최적화하는 전략가

로 느껴져야 한다.

## 3. 디자인 원칙

### Pillar 1. 내 개체가 기억에 남아야 한다

- 종족보다 개체가 중심이어야 한다
- 개체별 닉네임, 성장, 전투 이력, 리트레이닝 선택이 의미 있어야 한다

### Pillar 2. 준비가 승패를 만든다

- 배틀 결과는 타입 상성만이 아니라 지표 선택과 리트레이닝 방향의 차이여야 한다
- 스쿼드 조합이 바뀌면 결과도 달라져야 한다

### Pillar 3. 배틀은 증명 화면이다

- 배틀은 제품의 전부가 아니다
- 로스터, 개체 상세, 성장 화면만 봐도 게임 정체성이 보여야 한다

### Pillar 4. 세계는 살아 있는 데이터처럼 보여야 한다

- 시장/환경 레짐은 전투의 배경이자 변수다
- 플레이어는 이를 직접 거래하지 않고 세계 상태로 받아들인다

## 4. Non-Goals

현재 버전에서 하지 않는 것:

- 실제 트레이딩 연동
- 실시간 강결합 PvP
- 3D 렌더링
- NFT/토크노믹스
- 금융 서비스형 UI 회귀

## 5. 코어 루프

### 제품 루프

`Owned Agent -> Roster -> Training/Retraining -> Squad -> Battle -> Result -> Growth`

### 시간축 루프

#### Micro Loop

- 1판 배틀 관전
- Focus 개입 1~2회
- 결과 확인

#### Core Loop

- 개체 훈련 세팅 변경
- 스쿼드 교체
- 2~3판 반복
- 성장/진화 결정

#### Meta Loop

- 장기 로스터 운영
- 희귀 개체 및 훈련 경로 해금
- async PvP / ladder / seasonal progression

## 6. 한 판 흐름

현재 Cogochi의 기본 배틀은 5 phase를 유지한다.

### OPEN

- 시장 레짐 공개
- 상대 스쿼드 스냅샷 확인
- 내 스쿼드 상태 확인

### EVIDENCE

- 개체들이 지표를 읽고 Signal Orb 생성
- 팀 내/팀 간 충돌 발생
- 플레이어는 Focus 개입

### DECISION

- 팀 consensus 확정
- 어떤 개체가 주도권을 잡았는지 읽힘

### MARKET

- 시뮬레이션된 세계 상태 변화 반영
- 준비된 판단이 실제 결과로 이어짐

### RESULT

- 승패 확인
- MVP / misread / 성장 보상 정산
- 개체별 XP 및 진화 진행 반영

## 7. 콘텐츠 구조

### 타입

현재 기준 6개 타입:

- Momentum
- Mean Reversion
- Flow
- Derivatives
- Sentiment
- Macro

### 팀

- 출전 스쿼드: 4개체
- 역할 관점: lead / support / disruptor / finisher 식으로 확장 가능

### 배틀 대상

단계적 확장:

1. PvE/ghost opponent
2. async PvP
3. ladder / league

## 8. 게임 모드 로드맵

### Sprint 1

- simulator only
- PvE only
- 6종 기본 개체
- 2레짐
- 성장/진화 기본 루프

### Sprint 2

- opponent snapshot 기반 async PvP
- 개체 상세 강화
- 리트레이닝 트랙 확장

### Sprint 3

- rank / league / seasonal loop
- match history
- richer opponent scouting

## 9. 성공 조건

이 문서 기준에서 게임이 맞게 가고 있는지 보는 질문:

1. 플레이어가 종족이 아니라 개체를 기억하는가
2. 지표 세팅과 리트레이닝이 승패에 영향을 주는가
3. 배틀 밖 화면만 봐도 성장 게임으로 읽히는가
4. 스쿼드 조합을 바꾸면 다른 결과가 나오는가
5. 전투 결과가 다시 성장으로 연결되는가
