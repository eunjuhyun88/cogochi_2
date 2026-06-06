"""
어뷰징 필터 + 콜 방향 감지 단위 테스트 — W-A324 PR2 / W-A325 PR1 AC.

실행: python -m pytest cogochi/mindshare/test_filters.py -v
"""
import pytest
from .filters import (
    HIT_CAP_PER_HOUR,
    SPAM_CHANNEL_THRESHOLD,
    detect_call_direction,
    is_spam_broadcast,
    match_tickers,
    should_count_hit,
)

TICKERS = [
    {"ticker": "BTC",  "keyword": "비트코인", "pretge": False},
    {"ticker": "ETH",  "keyword": "이더리움", "pretge": False},
    {"ticker": "MONAD","keyword": "모나드",   "pretge": True},
]


# ── is_spam_broadcast ──────────────────────────────────────

def test_spam_below_threshold():
    assert not is_spam_broadcast(SPAM_CHANNEL_THRESHOLD - 1)

def test_spam_at_threshold():
    assert is_spam_broadcast(SPAM_CHANNEL_THRESHOLD)

def test_spam_above_threshold():
    assert is_spam_broadcast(SPAM_CHANNEL_THRESHOLD + 5)


# ── should_count_hit ───────────────────────────────────────

def test_hit_allowed_when_zero():
    assert should_count_hit(0)

def test_hit_allowed_below_cap():
    assert should_count_hit(HIT_CAP_PER_HOUR - 1)

def test_hit_blocked_at_cap():
    assert not should_count_hit(HIT_CAP_PER_HOUR)

def test_hit_blocked_above_cap():
    # 채널이 ticker를 1h에 10번 → hit_count = 3 (cap)
    assert not should_count_hit(10)


# ── match_tickers ──────────────────────────────────────────

def test_match_single():
    result = match_tickers("오늘 비트코인 가격 어때?", TICKERS)
    assert len(result) == 1
    assert result[0]["ticker"] == "BTC"

def test_match_multiple():
    result = match_tickers("비트코인이랑 이더리움 둘 다 가자", TICKERS)
    tks = {r["ticker"] for r in result}
    assert tks == {"BTC", "ETH"}

def test_match_case_insensitive():
    result = match_tickers("MONAD 모나드 테스트", TICKERS)
    assert any(r["ticker"] == "MONAD" for r in result)

def test_no_match():
    result = match_tickers("오늘 날씨 맑음", TICKERS)
    assert result == []

def test_match_pretge_ticker():
    result = match_tickers("모나드 언제 TGE?", TICKERS)
    assert len(result) == 1
    assert result[0]["pretge"] is True


# ── detect_call_direction ──────────────────────────────────

def test_bull_call():
    assert detect_call_direction("BTC 롱 진입 추천") == +1

def test_bear_call():
    assert detect_call_direction("ETH 숏 타점 좋다") == -1

def test_neutral_no_keywords():
    assert detect_call_direction("오늘 비트코인 가격 분석") == 0

def test_both_directions_neutral():
    # 롱 + 숏 동시 → 0
    assert detect_call_direction("롱 잡고 숏도 고려중") == 0

def test_bull_keywords_various():
    for kw in ["매수", "상승", "타겟", "돌파"]:
        assert detect_call_direction(f"SOL {kw} 목표") == +1

def test_bear_keywords_various():
    for kw in ["매도", "하락", "손절", "이탈"]:
        assert detect_call_direction(f"XRP {kw} 주의") == -1
