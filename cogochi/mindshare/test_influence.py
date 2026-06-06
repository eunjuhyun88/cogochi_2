"""
영향력 점수 단위 테스트 — W-A325 PR2 AC.

실행: python -m pytest cogochi/mindshare/test_influence.py -v
"""
import pytest
from .influence import (
    HIT_EMA_ALPHA,
    W_ENGAGEMENT, W_CONTENT, W_REACH, W_SPREAD, W_HIT,
    caller_prior_from_hit,
    clip,
    compute_content,
    compute_engagement,
    compute_engagement_raw,
    compute_global_scale,
    compute_hit_ema,
    compute_influence,
    compute_reach,
    compute_reward,
    compute_spread,
    influence_tier,
)


# ── 콜드스타트 (메인 AC) ──────────────────────────────────

def test_coldstart_influence():
    """
    신규 채널: 구독자 0, 메시지 0 → 영향력 = 15 ± 1
    engagement=0, content=0, reach=0, spread=50, hit=50
    influence = 0.30×0 + 0.20×0 + 0.20×0 + 0.15×50 + 0.15×50 = 15
    """
    engagement = compute_engagement(compute_engagement_raw([], 1.0), 1000.0)
    content    = compute_content([])
    reach      = compute_reach(0)
    spread     = compute_spread()
    hit        = compute_hit_ema([])   # 콜 없음 → 50

    influence  = compute_influence(engagement, content, reach, spread, hit)
    assert abs(influence - 15.0) <= 1.0, f"콜드스타트 영향력 = {influence:.2f}, 기대값 15±1"


def test_coldstart_components():
    assert compute_engagement_raw([], 1.0) == 0.0
    assert compute_content([]) == 0.0
    assert compute_reach(0) == 0.0
    assert compute_spread() == 50.0
    assert compute_hit_ema([]) == 50.0   # seed=0 → 50 (중립)


# ── compute_reach ─────────────────────────────────────────

def test_reach_1k():
    # log10(1001)/6 ≈ 0.500 → 50.0
    assert abs(compute_reach(1000) - 50.0) < 1.0

def test_reach_100k():
    # log10(100001)/6 ≈ 0.833 → 83.3
    assert abs(compute_reach(100_000) - 83.3) < 1.0

def test_reach_1m():
    # log10(1_000_001)/6 ≈ 1.0 → 100
    assert abs(compute_reach(1_000_000) - 100.0) < 0.5

def test_reach_clamp():
    assert compute_reach(10_000_000) <= 100.0


# ── compute_hit_ema ───────────────────────────────────────

def test_hit_neutral_no_calls():
    assert compute_hit_ema([]) == 50.0

def test_hit_always_correct():
    # 30콜 모두 reward=1.0 → ema≈1.0 → hit≈100
    rewards = [1.0] * 30
    hit = compute_hit_ema(rewards)
    assert hit > 90.0

def test_hit_always_wrong():
    # 30콜 모두 reward=-1.0 → ema≈-1.0 → hit≈0
    rewards = [-1.0] * 30
    hit = compute_hit_ema(rewards)
    assert hit < 10.0

def test_hit_bounds():
    for rewards in [[], [1.0] * 100, [-1.0] * 100]:
        h = compute_hit_ema(rewards)
        assert 0.0 <= h <= 100.0


# ── compute_reward ────────────────────────────────────────

def test_reward_bull_win():
    # bull 콜 + 24h +15% → +1 * 0.15/0.3 = +0.5
    assert abs(compute_reward(+1, 0.15) - 0.5) < 1e-9

def test_reward_bear_win():
    # bear 콜 + 24h -8% → -1 * (-0.08/0.3) = +0.267
    assert abs(compute_reward(-1, -0.08) - (0.08 / 0.3)) < 1e-6

def test_reward_bull_lose():
    r = compute_reward(+1, -0.05)
    assert r < 0

def test_reward_clip():
    # +50% 변동도 clip(0.5, -0.3, 0.3)/0.3 = 1.0
    assert compute_reward(+1, 0.5) == 1.0
    assert compute_reward(-1, -0.5) == 1.0


# ── compute_global_scale ──────────────────────────────────

def test_scale_fallback_few_channels():
    assert compute_global_scale([100.0, 200.0]) == 1000.0

def test_scale_median():
    vals = list(range(10, 30))   # 20개, 중앙값 = vals[10] = 20
    scale = compute_global_scale(vals)
    assert scale == sorted(vals)[len(vals) // 2]


# ── caller_prior_from_hit ─────────────────────────────────

def test_caller_prior_neutral():
    assert caller_prior_from_hit(50.0) == 1.0

def test_caller_prior_max():
    assert caller_prior_from_hit(100.0) == 2.0

def test_caller_prior_min():
    assert caller_prior_from_hit(0.0) == 0.5

def test_caller_prior_clamp_below():
    assert caller_prior_from_hit(-10.0) == 0.5

def test_caller_prior_clamp_above():
    assert caller_prior_from_hit(200.0) == 2.0


# ── influence_tier ────────────────────────────────────────

@pytest.mark.parametrize("score,expected", [
    (0,   "낮음"),
    (29,  "낮음"),
    (30,  "보통"),
    (59,  "보통"),
    (60,  "높음"),
    (79,  "높음"),
    (80,  "최상"),
    (100, "최상"),
])
def test_influence_tier(score, expected):
    assert influence_tier(score) == expected


# ── compute_content ───────────────────────────────────────

def test_content_empty():
    assert compute_content([]) == 0.0

def test_content_short_text_no_media():
    msgs = [{"text": "짧은 글", "has_media": False}]
    score = compute_content(msgs)
    assert 0.0 <= score <= 100.0

def test_content_long_with_chart():
    long_text = "차트 분석 " + "a" * 300
    msgs = [{"text": long_text, "has_media": True}]
    score_rich = compute_content(msgs)
    msgs_plain = [{"text": "ㅎㅇ", "has_media": False}]
    score_plain = compute_content(msgs_plain)
    assert score_rich > score_plain
