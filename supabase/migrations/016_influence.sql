-- 016: Channel Influence Score (W-A325)

-- 채널별 영향력 점수 (일 1회 갱신)
CREATE TABLE IF NOT EXISTS channel_influence (
  channel_id    VARCHAR(100) PRIMARY KEY,
  channel_name  VARCHAR(200),
  participants  INT NOT NULL DEFAULT 0,
  influence     FLOAT NOT NULL DEFAULT 15,           -- 콜드스타트: 0.15×50 + 0.15×50 = 15
  tier          VARCHAR(10) NOT NULL DEFAULT '낮음', -- 낮음|보통|높음|최상
  caller_prior  FLOAT NOT NULL DEFAULT 1.0,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5개 컴포넌트 원시값
CREATE TABLE IF NOT EXISTS influence_components (
  channel_id       VARCHAR(100) PRIMARY KEY REFERENCES channel_influence(channel_id),
  engagement       FLOAT NOT NULL DEFAULT 0,
  content          FLOAT NOT NULL DEFAULT 0,
  reach            FLOAT NOT NULL DEFAULT 0,
  spread           FLOAT NOT NULL DEFAULT 50,
  hit              FLOAT NOT NULL DEFAULT 50,
  engagement_scale FLOAT NOT NULL DEFAULT 1000,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 콜 방향 감지 + 적중 이력
CREATE TABLE IF NOT EXISTS influence_hit_log (
  channel_id     VARCHAR(100) NOT NULL,
  msg_id         BIGINT NOT NULL,
  ticker         VARCHAR(50) NOT NULL,
  call_direction SMALLINT NOT NULL,  -- +1 bull, -1 bear
  price_return   FLOAT,              -- NULL = 24h 미경과
  reward         FLOAT,              -- NULL = 미계산
  msg_ts         TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (channel_id, msg_id, ticker)
);

CREATE INDEX IF NOT EXISTS idx_ihl_channel ON influence_hit_log (channel_id);
CREATE INDEX IF NOT EXISTS idx_ihl_pending  ON influence_hit_log (msg_ts) WHERE reward IS NULL;
