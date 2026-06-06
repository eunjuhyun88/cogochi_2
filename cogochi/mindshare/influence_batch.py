"""
influence_batch_daily — 매일 03:00 KST (channel_meta_daily 완료 후) 실행.

모든 채널의 5개 컴포넌트를 계산하고 channel_influence / influence_components를 갱신.

실행:
  python -m cogochi.mindshare.influence_batch
"""
from __future__ import annotations

import logging
import time

from . import db as mdb
from .influence import (
    caller_prior_from_hit,
    compute_content,
    compute_engagement,
    compute_engagement_raw,
    compute_global_scale,
    compute_influence,
    compute_reach,
    compute_spread,
    influence_tier,
)

logger = logging.getLogger(__name__)


def influence_batch_daily() -> None:
    t0 = time.time()
    channels = mdb.get_channels_for_batch()
    if not channels:
        logger.warning("channel_influence 테이블이 비어 있음. channel_meta_daily를 먼저 실행하세요.")
        return

    # 1단계: 모든 채널의 engagement_raw 계산 (scale 산출용)
    raw_map: dict[str, float] = {}
    msgs_map: dict[str, list] = {}

    for ch in channels:
        msgs = mdb.get_messages_30d(ch["channel_id"])
        msgs_map[ch["channel_id"]] = msgs
        raw = compute_engagement_raw(msgs, float(ch["caller_prior"]))
        raw_map[ch["channel_id"]] = raw

    # 2단계: 전역 scale (중앙값)
    scale = compute_global_scale(list(raw_map.values()))
    logger.info("전역 engagement_scale=%.2f (채널 %d개)", scale, len(channels))

    # 3단계: 채널별 5개 컴포넌트 계산 + 저장
    for ch in channels:
        cid      = ch["channel_id"]
        msgs     = msgs_map[cid]
        raw      = raw_map[cid]
        hit      = float(ch["hit"])

        engagement = compute_engagement(raw, scale)
        content    = compute_content(msgs)
        reach      = compute_reach(int(ch["participants"]))
        spread     = compute_spread()

        influence  = compute_influence(engagement, content, reach, spread, hit)
        tier       = influence_tier(influence)
        cp         = caller_prior_from_hit(hit)

        mdb.upsert_components(
            channel_id=cid,
            engagement=engagement,
            content=content,
            reach=reach,
            spread=spread,
            hit=hit,
            engagement_scale=scale,
        )
        mdb.upsert_influence(
            channel_id=cid,
            influence=influence,
            tier=tier,
            caller_prior=cp,
        )

    elapsed = time.time() - t0
    logger.info("influence_batch_daily 완료 — %.1f초 소요 (채널 %d개)", elapsed, len(channels))


if __name__ == "__main__":
    import logging as _logging
    _logging.basicConfig(
        level=_logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    influence_batch_daily()
