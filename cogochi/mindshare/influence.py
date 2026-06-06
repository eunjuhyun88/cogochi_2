"""
영향력 점수 계산 헬퍼 — W-A325.
순수 함수로 구성 (DB 의존 없음) → 단위 테스트 가능.

최종 공식:
  영향력 = 0.30×참여 + 0.20×콘텐츠 + 0.20×도달 + 0.15×다중채널 + 0.15×적중
  범위: 0~100
"""
from __future__ import annotations

from math import exp, log10, sqrt, tanh
from typing import Any

# ── 가중치 ────────────────────────────────────────────────
W_ENGAGEMENT  = 0.30
W_CONTENT     = 0.20
W_REACH       = 0.20
W_SPREAD      = 0.15
W_HIT         = 0.15

# 적중 EMA span
HIT_EMA_SPAN  = 30
HIT_EMA_ALPHA = 2 / (HIT_EMA_SPAN + 1)   # ≈ 0.0645

CHART_KEYWORDS = {"차트", "line", "fvg", "imbalance", "bos"}


def clip(val: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, val))


# ── 참여 점수 (30%) ──────────────────────────────────────

def compute_engagement_raw(msgs: list[Any], caller_prior: float) -> float:
    """
    채널 30일 메시지 → engagement_raw (tanh 정규화 전 원시값).
    msg는 dict-like: views, reactions, forwards, comments, ts (datetime).
    """
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    total = 0.0
    for msg in msgs:
        score = (
            log10(1 + (msg["views"]     or 0))
            + 2 * log10(1 + (msg["reactions"] or 0))
            + 3 * log10(1 + (msg["forwards"]  or 0))
            + 2 * log10(1 + (msg["comments"]  or 0))
        )
        ts = msg["ts"]
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        age_hours = (now - ts).total_seconds() / 3600
        decay = exp(-0.0289 * age_hours)   # 24h → 0.5배
        total += score * decay * caller_prior
    return total


def compute_engagement(engagement_raw: float, scale: float) -> float:
    """engagement_raw → 0~100 점수."""
    return 100.0 * tanh(engagement_raw / max(scale, 1))


# ── 콘텐츠 점수 (20%) ────────────────────────────────────

def _msg_content_score(text: str, has_media: bool) -> float:
    text = text or ""
    text_score  = min(1.0, log10(1 + len(text) / 200))
    has_chart_kw = any(kw in text.lower() for kw in CHART_KEYWORDS)
    media_score  = 0.4 * has_media + 0.2 * has_chart_kw
    return clip(0.4 * text_score + 0.4 * media_score, 0.0, 1.0)


def compute_content(msgs: list[Any]) -> float:
    """채널 30일 메시지 평균 콘텐츠 점수 → 0~100."""
    if not msgs:
        return 0.0
    scores = [_msg_content_score(m["text"] or "", bool(m["has_media"])) for m in msgs]
    return 100.0 * (sum(scores) / len(scores))


# ── 도달 점수 (20%) ──────────────────────────────────────

def compute_reach(participants: int) -> float:
    """구독자 수 → 0~100. log10(1M)/6 = 1.0 → 100점."""
    return 100.0 * clip(log10(1 + participants) / 6.0, 0.0, 1.0)


# ── 다중채널 점수 (15%) ───────────────────────────────────

def compute_spread() -> float:
    """Phase 1: 텔레그램 단일 플랫폼 → 50 고정."""
    return 50.0


# ── 적중 점수 (15%) ──────────────────────────────────────

def compute_hit_ema(rewards: list[float]) -> float:
    """
    reward 시계열(시간순) → EMA → hit 점수 0~100.
    빈 리스트 or seed=0 → hit=50 (중립).
    """
    ema = 0.0
    for r in rewards:
        ema = HIT_EMA_ALPHA * r + (1 - HIT_EMA_ALPHA) * ema
    return clip(50.0 + 50.0 * ema, 0.0, 100.0)


def compute_reward(call_direction: int, price_return: float) -> float:
    """
    call_direction: +1 (bull) / -1 (bear)
    price_return: (p_t24h - p_t) / p_t
    reward: [-1, +1]
    """
    return call_direction * clip(price_return, -0.3, 0.3) / 0.3


# ── 최종 영향력 ──────────────────────────────────────────

def compute_influence(
    engagement: float,
    content: float,
    reach: float,
    spread: float,
    hit: float,
) -> float:
    return (
        W_ENGAGEMENT * engagement
        + W_CONTENT  * content
        + W_REACH    * reach
        + W_SPREAD   * spread
        + W_HIT      * hit
    )


def influence_tier(influence: float) -> str:
    if influence >= 80:
        return "최상"
    if influence >= 60:
        return "높음"
    if influence >= 30:
        return "보통"
    return "낮음"


def caller_prior_from_hit(hit: float) -> float:
    """hit → caller_prior. clip(hit/50, 0.5, 2.0)."""
    return clip(hit / 50.0, 0.5, 2.0)


# ── 전역 scale 계산 ───────────────────────────────────────

def compute_global_scale(raw_values: list[float]) -> float:
    """
    전체 채널 engagement_raw 중앙값.
    채널 10개 미만이면 fallback = 1000.
    """
    if len(raw_values) < 10:
        return 1000.0
    sorted_vals = sorted(raw_values)
    return max(sorted_vals[len(sorted_vals) // 2], 1.0)
