"""
influence_hit_update — 6시간마다 실행.

1. 24h 경과 + reward=NULL인 콜의 가격 조회 → reward 계산 → DB 갱신
2. reward가 채워진 채널의 EMA hit 재계산

가격 소스: Binance REST klines (30분봉).
  - ticker → USDT 페어로 변환 (예: BTC → BTCUSDT)
  - 가격 = msg_ts 직후 30분봉 close

실행:
  python -m cogochi.mindshare.influence_hit_update
"""
from __future__ import annotations

import logging
import time
from datetime import datetime, timezone

import httpx

from . import db as mdb
from .influence import compute_hit_ema, compute_reward

logger = logging.getLogger(__name__)

BINANCE_KLINES = "https://api.binance.com/api/v3/klines"

# ticker → Binance symbol 매핑 (없으면 {TICKER}USDT 자동 생성)
SYMBOL_OVERRIDES: dict[str, str] = {
    "BTC": "BTCUSDT",
    "ETH": "ETHUSDT",
    "SOL": "SOLUSDT",
    "XRP": "XRPUSDT",
    "BNB": "BNBUSDT",
}


def _ticker_to_symbol(ticker: str) -> str:
    return SYMBOL_OVERRIDES.get(ticker.upper(), f"{ticker.upper()}USDT")


def _get_close_price(symbol: str, ts: datetime) -> float | None:
    """
    ts 직후 30분봉 close 가격 반환.
    실패 시 None.
    """
    # 30분봉 startTime = ts의 30분 버킷 시작
    ts_ms = int(ts.timestamp() * 1000)
    try:
        resp = httpx.get(
            BINANCE_KLINES,
            params={
                "symbol":    symbol,
                "interval":  "30m",
                "startTime": ts_ms,
                "limit":     1,
            },
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        if not data:
            return None
        # kline: [open_time, open, high, low, close, ...]
        return float(data[0][4])
    except Exception:
        logger.warning("가격 조회 실패: symbol=%s ts=%s", symbol, ts)
        return None


def influence_hit_update() -> None:
    t0 = time.time()
    pending = mdb.get_pending_hit_logs()
    logger.info("pending reward 콜 %d개 처리 시작", len(pending))

    updated_channels: set[str] = set()

    for log in pending:
        ticker = log["ticker"]
        symbol = _ticker_to_symbol(ticker)
        msg_ts = log["msg_ts"]
        if msg_ts.tzinfo is None:
            msg_ts = msg_ts.replace(tzinfo=timezone.utc)

        from datetime import timedelta
        ts_24h = msg_ts + timedelta(hours=24)

        price_t    = _get_close_price(symbol, msg_ts)
        price_t24h = _get_close_price(symbol, ts_24h)

        if price_t is None or price_t24h is None or price_t == 0:
            logger.debug("가격 없음 skip: %s %s", ticker, msg_ts)
            continue

        price_return = (price_t24h - price_t) / price_t
        reward = compute_reward(int(log["call_direction"]), price_return)

        mdb.update_hit_log_reward(
            channel_id=log["channel_id"],
            msg_id=log["msg_id"],
            ticker=ticker,
            price_return=price_return,
            reward=reward,
        )
        updated_channels.add(log["channel_id"])

    # EMA 재계산
    for row in mdb.get_channels_with_rewards():
        cid = row["channel_id"]
        rewards_rows = mdb.get_channel_rewards(cid)
        rewards = [float(r["reward"]) for r in rewards_rows]
        hit = compute_hit_ema(rewards)
        mdb.update_hit_score(cid, hit)
        logger.debug("channel=%s hit=%.1f (콜 %d개)", cid, hit, len(rewards))

    elapsed = time.time() - t0
    logger.info(
        "influence_hit_update 완료 — %.1f초, 처리=%d개, EMA갱신=%d채널",
        elapsed, len(pending), len(mdb.get_channels_with_rewards()),
    )


if __name__ == "__main__":
    import logging as _logging
    _logging.basicConfig(
        level=_logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    influence_hit_update()
