"""
DB helpers — psycopg2 기반 동기 레이어.
환경변수 DATABASE_URL 필요 (SvelteKit와 동일한 Supabase 연결).
"""
from __future__ import annotations

import hashlib
import logging
import os
from contextlib import contextmanager
from typing import Any

import psycopg2
import psycopg2.extras

logger = logging.getLogger(__name__)

_pool: psycopg2.pool.ThreadedConnectionPool | None = None


def get_pool() -> psycopg2.pool.ThreadedConnectionPool:
    global _pool
    if _pool is None:
        url = os.environ["DATABASE_URL"]
        _pool = psycopg2.pool.ThreadedConnectionPool(1, 10, url)
    return _pool


@contextmanager
def conn():
    pool = get_pool()
    c = pool.getconn()
    try:
        yield c
        c.commit()
    except Exception:
        c.rollback()
        raise
    finally:
        pool.putconn(c)


def query(sql: str, **params) -> list[dict]:
    with conn() as c:
        with c.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(sql, params)
            return [dict(r) for r in cur.fetchall()]


def query_one(sql: str, **params) -> dict | None:
    rows = query(sql, **params)
    return rows[0] if rows else None


def execute(sql: str, **params) -> None:
    with conn() as c:
        with c.cursor() as cur:
            cur.execute(sql, params)


def scalar(sql: str, **params) -> Any:
    with conn() as c:
        with c.cursor() as cur:
            cur.execute(sql, params)
            row = cur.fetchone()
            return row[0] if row else None


# ── Collection state ────────────────────────────────────────

def get_last_msg_id(channel: str) -> int:
    row = query_one(
        "SELECT last_msg_id FROM mindshare_collection_state WHERE channel = %(ch)s",
        ch=channel,
    )
    return row["last_msg_id"] if row else 0


def update_last_msg_id(channel: str, msg_id: int) -> None:
    execute(
        """
        INSERT INTO mindshare_collection_state (channel, last_msg_id, updated_at)
        VALUES (%(ch)s, %(mid)s, NOW())
        ON CONFLICT (channel) DO UPDATE
          SET last_msg_id = GREATEST(mindshare_collection_state.last_msg_id, %(mid)s),
              updated_at  = NOW()
        """,
        ch=channel,
        mid=msg_id,
    )


# ── Raw messages ────────────────────────────────────────────

def text_hash(text: str) -> str:
    return hashlib.sha256(text.strip().lower().encode()).hexdigest()[:16]


def insert_raw_message(
    channel: str,
    msg_id: int,
    ts,
    text: str,
    has_media: bool,
    views: int,
    reactions: int,
    forwards: int,
    comments: int,
) -> None:
    execute(
        """
        INSERT INTO raw_mindshare_messages
          (channel, msg_id, ts, text, text_hash, processed,
           has_media, views, reactions, forwards, comments)
        VALUES
          (%(ch)s, %(mid)s, %(ts)s, %(text)s, %(th)s, FALSE,
           %(media)s, %(views)s, %(reactions)s, %(forwards)s, %(comments)s)
        ON CONFLICT (channel, msg_id) DO NOTHING
        """,
        ch=channel,
        mid=msg_id,
        ts=ts,
        text=text,
        th=text_hash(text),
        media=has_media,
        views=views,
        reactions=reactions,
        forwards=forwards,
        comments=comments,
    )


def get_unprocessed_messages() -> list[dict]:
    return query(
        """
        SELECT id, channel, msg_id, ts, text, text_hash, has_media,
               views, reactions, forwards, comments
        FROM raw_mindshare_messages
        WHERE processed = FALSE
        ORDER BY ts
        """
    )


def mark_processed(msg_id_pk: int) -> None:
    execute(
        "UPDATE raw_mindshare_messages SET processed = TRUE WHERE id = %(id)s",
        id=msg_id_pk,
    )


def count_distinct_channels_for_hash(text_hash_val: str, hour_bucket) -> int:
    row = query_one(
        """
        SELECT COUNT(DISTINCT channel) AS n
        FROM raw_mindshare_messages
        WHERE text_hash = %(th)s
          AND date_trunc('hour', ts) = %(bkt)s
        """,
        th=text_hash_val,
        bkt=hour_bucket,
    )
    return int(row["n"]) if row else 0


# ── Tickers ─────────────────────────────────────────────────

def get_all_tickers() -> list[dict]:
    return query("SELECT ticker, keyword, logo_url, pretge FROM mindshare_tickers")


# ── Hits ────────────────────────────────────────────────────

def get_hit_count(ts_bucket, ticker: str, channel: str, pretge: bool) -> int:
    row = query_one(
        """
        SELECT hit_count FROM mindshare_hits
        WHERE ts_bucket = %(bkt)s
          AND ticker    = %(tk)s
          AND channel   = %(ch)s
          AND pretge    = %(pg)s
        """,
        bkt=ts_bucket,
        tk=ticker,
        ch=channel,
        pg=pretge,
    )
    return int(row["hit_count"]) if row else 0


def upsert_hit(ts_bucket, pretge: bool, ticker: str, channel: str, hit_count: int) -> None:
    execute(
        """
        INSERT INTO mindshare_hits (ts_bucket, pretge, ticker, channel, hit_count)
        VALUES (%(bkt)s, %(pg)s, %(tk)s, %(ch)s, %(hc)s)
        ON CONFLICT (ts_bucket, pretge, ticker, channel)
        DO UPDATE SET hit_count = %(hc)s
        """,
        bkt=ts_bucket,
        pg=pretge,
        tk=ticker,
        ch=channel,
        hc=hit_count,
    )


def sum_hits(ticker: str, pretge: bool | None, start, end) -> int:
    if pretge is None:
        row = query_one(
            """
            SELECT COALESCE(SUM(hit_count), 0) AS total
            FROM mindshare_hits
            WHERE ticker = %(tk)s AND ts_bucket >= %(s)s AND ts_bucket < %(e)s
            """,
            tk=ticker,
            s=start,
            e=end,
        )
    else:
        row = query_one(
            """
            SELECT COALESCE(SUM(hit_count), 0) AS total
            FROM mindshare_hits
            WHERE ticker = %(tk)s AND pretge = %(pg)s
              AND ts_bucket >= %(s)s AND ts_bucket < %(e)s
            """,
            tk=ticker,
            pg=pretge,
            s=start,
            e=end,
        )
    return int(row["total"]) if row else 0


# ── Summary ─────────────────────────────────────────────────

def upsert_summary(
    period_days: int,
    pretge: bool,
    ticker: str,
    keyword: str,
    logo_url: str | None,
    mentions: int,
    prev_count: int,
    trend_score: float,
    mention_share: float,
    total_reactions: int,
    total_forwards: int,
    total_comments: int,
    updated_at,
) -> None:
    execute(
        """
        INSERT INTO mindshare_summary
          (period_days, pretge, ticker, keyword, logo_url,
           rank, mentions, prev_count, trend_score, mention_share,
           total_reactions, total_forwards, total_comments, updated_at)
        VALUES
          (%(pd)s, %(pg)s, %(tk)s, %(kw)s, %(logo)s,
           0, %(mn)s, %(prev)s, %(ts)s, %(ms)s,
           %(tr)s, %(tf)s, %(tc)s, %(ua)s)
        ON CONFLICT (period_days, pretge, ticker) DO UPDATE SET
          keyword         = EXCLUDED.keyword,
          logo_url        = EXCLUDED.logo_url,
          mentions        = EXCLUDED.mentions,
          prev_count      = EXCLUDED.prev_count,
          trend_score     = EXCLUDED.trend_score,
          mention_share   = EXCLUDED.mention_share,
          total_reactions = EXCLUDED.total_reactions,
          total_forwards  = EXCLUDED.total_forwards,
          total_comments  = EXCLUDED.total_comments,
          updated_at      = EXCLUDED.updated_at
        """,
        pd=period_days,
        pg=pretge,
        tk=ticker,
        kw=keyword,
        logo=logo_url,
        mn=mentions,
        prev=prev_count,
        ts=trend_score,
        ms=mention_share,
        tr=total_reactions,
        tf=total_forwards,
        tc=total_comments,
        ua=updated_at,
    )


# ── Influence ───────────────────────────────────────────────

def init_channel(channel_id: str) -> None:
    """channel_influence + influence_components에 기본값 행 생성 (없을 때만)."""
    execute(
        """
        INSERT INTO channel_influence (channel_id, channel_name, participants, updated_at)
        VALUES (%(cid)s, %(cid)s, 0, NOW())
        ON CONFLICT (channel_id) DO NOTHING
        """,
        cid=channel_id,
    )
    execute(
        """
        INSERT INTO influence_components (channel_id, updated_at)
        VALUES (%(cid)s, NOW())
        ON CONFLICT (channel_id) DO NOTHING
        """,
        cid=channel_id,
    )


def update_channel_participants(channel_id: str, participants: int) -> None:
    execute(
        """
        UPDATE channel_influence
           SET participants = %(p)s, updated_at = NOW()
         WHERE channel_id = %(cid)s
        """,
        p=participants,
        cid=channel_id,
    )


def get_channels_for_batch() -> list[dict]:
    """influence_batch_daily에서 사용. channel_id, participants, caller_prior, hit 반환."""
    return query(
        """
        SELECT ci.channel_id,
               ci.participants,
               ci.caller_prior,
               COALESCE(ic.hit, 50.0) AS hit
        FROM channel_influence ci
        LEFT JOIN influence_components ic USING (channel_id)
        """
    )


def get_messages_30d(channel_id: str) -> list[dict]:
    return query(
        """
        SELECT text, has_media, views, reactions, forwards, comments, ts
        FROM raw_mindshare_messages
        WHERE channel = %(cid)s
          AND ts >= NOW() - INTERVAL '30 days'
        """,
        cid=channel_id,
    )


def upsert_influence(
    channel_id: str,
    influence: float,
    tier: str,
    caller_prior: float,
) -> None:
    execute(
        """
        UPDATE channel_influence
           SET influence    = %(inf)s,
               tier         = %(tier)s,
               caller_prior = %(cp)s,
               updated_at   = NOW()
         WHERE channel_id = %(cid)s
        """,
        inf=influence,
        tier=tier,
        cp=caller_prior,
        cid=channel_id,
    )


def upsert_components(
    channel_id: str,
    engagement: float,
    content: float,
    reach: float,
    spread: float,
    hit: float,
    engagement_scale: float,
) -> None:
    execute(
        """
        INSERT INTO influence_components
          (channel_id, engagement, content, reach, spread, hit, engagement_scale, updated_at)
        VALUES
          (%(cid)s, %(eng)s, %(cont)s, %(reach)s, %(spread)s, %(hit)s, %(scale)s, NOW())
        ON CONFLICT (channel_id) DO UPDATE SET
          engagement       = EXCLUDED.engagement,
          content          = EXCLUDED.content,
          reach            = EXCLUDED.reach,
          spread           = EXCLUDED.spread,
          hit              = EXCLUDED.hit,
          engagement_scale = EXCLUDED.engagement_scale,
          updated_at       = EXCLUDED.updated_at
        """,
        cid=channel_id,
        eng=engagement,
        cont=content,
        reach=reach,
        spread=spread,
        hit=hit,
        scale=engagement_scale,
    )


def insert_hit_log(
    channel_id: str,
    msg_id: int,
    ticker: str,
    call_direction: int,
    msg_ts,
) -> None:
    execute(
        """
        INSERT INTO influence_hit_log
          (channel_id, msg_id, ticker, call_direction, msg_ts)
        VALUES
          (%(cid)s, %(mid)s, %(tk)s, %(dir)s, %(ts)s)
        ON CONFLICT (channel_id, msg_id, ticker) DO NOTHING
        """,
        cid=channel_id,
        mid=msg_id,
        tk=ticker,
        dir=call_direction,
        ts=msg_ts,
    )


def get_pending_hit_logs() -> list[dict]:
    """24h 경과했지만 reward가 NULL인 콜 목록."""
    return query(
        """
        SELECT channel_id, msg_id, ticker, call_direction, msg_ts
        FROM influence_hit_log
        WHERE reward IS NULL
          AND call_direction != 0
          AND msg_ts <= NOW() - INTERVAL '24 hours'
        """
    )


def update_hit_log_reward(
    channel_id: str,
    msg_id: int,
    ticker: str,
    price_return: float,
    reward: float,
) -> None:
    execute(
        """
        UPDATE influence_hit_log
           SET price_return = %(pr)s, reward = %(rw)s
         WHERE channel_id = %(cid)s
           AND msg_id     = %(mid)s
           AND ticker     = %(tk)s
        """,
        pr=price_return,
        rw=reward,
        cid=channel_id,
        mid=msg_id,
        tk=ticker,
    )


def get_channel_rewards(channel_id: str) -> list[dict]:
    """EMA 재계산용 — 시간순 reward 목록."""
    return query(
        """
        SELECT reward FROM influence_hit_log
        WHERE channel_id   = %(cid)s
          AND reward IS NOT NULL
          AND call_direction != 0
        ORDER BY msg_ts ASC
        """,
        cid=channel_id,
    )


def get_channels_with_rewards() -> list[dict]:
    return query(
        "SELECT DISTINCT channel_id FROM influence_hit_log WHERE reward IS NOT NULL"
    )


def update_hit_score(channel_id: str, hit: float) -> None:
    execute(
        """
        UPDATE influence_components
           SET hit = %(hit)s, updated_at = NOW()
         WHERE channel_id = %(cid)s
        """,
        hit=hit,
        cid=channel_id,
    )


# ── Summary (rerank) ─────────────────────────────────────────

def rerank_summary(period_days: int, pretge: bool) -> None:
    """mentions 내림차순으로 rank 재계산."""
    execute(
        """
        WITH ranked AS (
          SELECT ticker,
                 ROW_NUMBER() OVER (ORDER BY mentions DESC) AS new_rank
          FROM mindshare_summary
          WHERE period_days = %(pd)s AND pretge = %(pg)s
        )
        UPDATE mindshare_summary s
        SET rank = r.new_rank
        FROM ranked r
        WHERE s.ticker = r.ticker
          AND s.period_days = %(pd)s
          AND s.pretge = %(pg)s
        """,
        pd=period_days,
        pg=pretge,
    )
