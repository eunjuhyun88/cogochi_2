"""
집계 잡 — mindshare_summary 갱신.
30분마다 실행. mindshare_hits → mindshare_summary.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from . import db as mdb

logger = logging.getLogger(__name__)

PERIOD_DAYS = [7, 14, 30, 90]


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def aggregate_once() -> None:
    now = utcnow()
    for period_days in PERIOD_DAYS:
        for pretge_filter in [True, False]:
            _aggregate_period(now, period_days, pretge_filter)
    logger.info("aggregate_once 완료")


def _aggregate_period(now: datetime, period_days: int, pretge_filter: bool) -> None:
    cur_start  = now - timedelta(days=period_days)
    prev_start = now - timedelta(days=period_days * 2)

    tickers = mdb.get_all_tickers()
    if pretge_filter:
        tickers = [t for t in tickers if t["pretge"]]

    pretge_where = True if pretge_filter else None

    rows = []
    for ticker in tickers:
        cur_count  = mdb.sum_hits(ticker["ticker"], pretge_where, cur_start, now)
        prev_count = mdb.sum_hits(ticker["ticker"], pretge_where, prev_start, cur_start)
        trend_score = (cur_count - prev_count) / max(prev_count, 1)

        eng = mdb.query_one(
            """
            SELECT
                COALESCE(SUM(m.reactions), 0) AS total_reactions,
                COALESCE(SUM(m.forwards),  0) AS total_forwards,
                COALESCE(SUM(m.comments),  0) AS total_comments
            FROM raw_mindshare_messages m
            WHERE m.ts >= %(start)s AND m.ts < %(end)s
              AND LOWER(m.text) LIKE '%%' || LOWER(%(kw)s) || '%%'
              AND (%(pg)s IS NULL OR EXISTS (
                  SELECT 1 FROM mindshare_tickers t
                  WHERE t.ticker = %(tk)s AND t.pretge = TRUE
              ))
            """,
            start=cur_start,
            end=now,
            kw=ticker["keyword"],
            tk=ticker["ticker"],
            pg=pretge_where,
        )

        rows.append({
            "ticker":   ticker,
            "cur":      cur_count,
            "prev":     prev_count,
            "trend":    trend_score,
            "eng":      eng or {"total_reactions": 0, "total_forwards": 0, "total_comments": 0},
        })

    total_mentions = sum(r["cur"] for r in rows)

    for row in rows:
        mention_share = row["cur"] / total_mentions if total_mentions > 0 else 0.0
        t = row["ticker"]
        e = row["eng"]
        mdb.upsert_summary(
            period_days=period_days,
            pretge=pretge_filter,
            ticker=t["ticker"],
            keyword=t["keyword"],
            logo_url=t["logo_url"],
            mentions=row["cur"],
            prev_count=row["prev"],
            trend_score=row["trend"],
            mention_share=mention_share,
            total_reactions=int(e["total_reactions"]),
            total_forwards=int(e["total_forwards"]),
            total_comments=int(e["total_comments"]),
            updated_at=now,
        )

    mdb.rerank_summary(period_days, pretge_filter)
    logger.info("period=%dd pretge=%s rows=%d", period_days, pretge_filter, len(rows))
