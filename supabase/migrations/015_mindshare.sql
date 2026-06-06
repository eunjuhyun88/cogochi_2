-- 015: Mindshare Dashboard (W-A324)

CREATE TABLE IF NOT EXISTS raw_mindshare_messages (
  id          BIGSERIAL PRIMARY KEY,
  ts          TIMESTAMPTZ NOT NULL,
  channel     VARCHAR(100) NOT NULL,
  msg_id      BIGINT NOT NULL,
  text        TEXT NOT NULL,
  text_hash   CHAR(16),
  processed   BOOLEAN NOT NULL DEFAULT FALSE,
  has_media   BOOLEAN NOT NULL DEFAULT FALSE,
  views       INT NOT NULL DEFAULT 0,
  reactions   INT NOT NULL DEFAULT 0,
  forwards    INT NOT NULL DEFAULT 0,
  comments    INT NOT NULL DEFAULT 0,
  UNIQUE(channel, msg_id)
);
CREATE INDEX IF NOT EXISTS idx_rmm_ts   ON raw_mindshare_messages (ts);
CREATE INDEX IF NOT EXISTS idx_rmm_hash ON raw_mindshare_messages (text_hash, ts);

CREATE TABLE IF NOT EXISTS mindshare_collection_state (
  channel     VARCHAR(100) PRIMARY KEY,
  last_msg_id BIGINT NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS mindshare_hits (
  ts_bucket   TIMESTAMPTZ NOT NULL,
  pretge      BOOLEAN NOT NULL,
  ticker      VARCHAR(50) NOT NULL,
  channel     VARCHAR(100) NOT NULL,
  hit_count   INT NOT NULL DEFAULT 0,
  PRIMARY KEY (ts_bucket, pretge, ticker, channel)
);

CREATE TABLE IF NOT EXISTS mindshare_summary (
  period_days      INT NOT NULL,
  pretge           BOOLEAN NOT NULL,
  ticker           VARCHAR(50) NOT NULL,
  keyword          TEXT NOT NULL,
  logo_url         TEXT,
  rank             INT NOT NULL DEFAULT 0,
  mentions         INT NOT NULL DEFAULT 0,
  prev_count       INT NOT NULL DEFAULT 0,
  trend_score      FLOAT NOT NULL DEFAULT 0,
  mention_share    FLOAT NOT NULL DEFAULT 0,
  total_reactions  INT NOT NULL DEFAULT 0,
  total_forwards   INT NOT NULL DEFAULT 0,
  total_comments   INT NOT NULL DEFAULT 0,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (period_days, pretge, ticker)
);

CREATE TABLE IF NOT EXISTS mindshare_tickers (
  ticker    VARCHAR(50) PRIMARY KEY,
  keyword   TEXT NOT NULL,
  logo_url  TEXT,
  pretge    BOOLEAN NOT NULL DEFAULT FALSE
);

-- Seed: initial ticker list
INSERT INTO mindshare_tickers (ticker, keyword, logo_url, pretge) VALUES
  ('BTC',      '비트코인',      NULL, FALSE),
  ('ETH',      '이더리움',      NULL, FALSE),
  ('SOL',      '솔라나',        NULL, FALSE),
  ('HYPE',     '하이프',        NULL, FALSE),
  ('XRP',      '리플',          NULL, FALSE),
  ('BNB',      '바이낸스',      NULL, FALSE),
  ('AVAX',     '아발란체',      NULL, FALSE),
  ('LINK',     '체인링크',      NULL, FALSE),
  ('ARB',      '아비트럼',      NULL, FALSE),
  ('OP',       '옵티미즘',      NULL, FALSE),
  ('JTO',      '지토',          NULL, FALSE),
  ('ABSTRACT', '어브스트랙트',  NULL, TRUE),
  ('MONAD',    '모나드',        NULL, TRUE),
  ('BERACHAIN','베라체인',      NULL, TRUE),
  ('METAMASK', '메타마스크',    NULL, TRUE)
ON CONFLICT (ticker) DO NOTHING;
