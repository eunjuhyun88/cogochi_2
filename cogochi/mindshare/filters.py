"""
어뷰징 필터 + 키워드 매칭 로직.
단위 테스트 가능하도록 DB 의존성 없이 순수 함수로 구성.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

SPAM_CHANNEL_THRESHOLD = 3  # 1h 내 동일 text_hash가 N개 이상 채널에서 등장하면 spam
HIT_CAP_PER_HOUR = 3        # 채널×ticker×1h 최대 hit


def date_trunc_hour(ts: datetime) -> datetime:
    return ts.replace(minute=0, second=0, microsecond=0, tzinfo=timezone.utc)


def is_spam_broadcast(n_channels: int) -> bool:
    """동일 text_hash가 1h 내 N개 이상 채널 → True (= skip)."""
    return n_channels >= SPAM_CHANNEL_THRESHOLD


def should_count_hit(current_hits: int) -> bool:
    """채널×ticker×1h 누적이 cap 미만이면 True."""
    return current_hits < HIT_CAP_PER_HOUR


def match_tickers(text: str, tickers: list[dict]) -> list[dict]:
    """
    text에서 keyword가 포함된 ticker 목록 반환.
    pretge_filter=None이면 전체, True면 pre-TGE만.
    """
    text_lower = text.lower()
    return [t for t in tickers if t["keyword"].lower() in text_lower]


# ── 콜 방향 감지 (W-A325) ────────────────────────────────────

BULL_KW = {"롱", "매수", "상승", "타겟", "돌파"}
BEAR_KW = {"숏", "매도", "하락", "손절", "이탈"}


def detect_call_direction(text: str) -> int:
    """
    +1 = bull, -1 = bear, 0 = neutral / 양방향 (적중 계산 제외).
    """
    t = text.lower()
    has_bull = any(kw in t for kw in BULL_KW)
    has_bear = any(kw in t for kw in BEAR_KW)
    if has_bull and not has_bear:
        return +1
    if has_bear and not has_bull:
        return -1
    return 0
