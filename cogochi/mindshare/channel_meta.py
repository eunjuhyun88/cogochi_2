"""
channel_meta_daily — 매일 03:00 KST 실행.

1. MINDSHARE_CHANNELS_KR 목록에서 신규 채널 channel_influence / influence_components에 INSERT
2. 텔레그램 API로 participants_count 조회 → UPDATE

실행:
  python -m cogochi.mindshare.channel_meta
"""
from __future__ import annotations

import asyncio
import logging
import os

from telethon import TelegramClient
from telethon.sessions import StringSession

from . import db as mdb

logger = logging.getLogger(__name__)


def _get_client() -> TelegramClient:
    api_id   = int(os.environ["TELEGRAM_API_ID"])
    api_hash = os.environ["TELEGRAM_API_HASH"]
    session  = os.environ["TELEGRAM_SESSION"]
    return TelegramClient(StringSession(session), api_id, api_hash)


async def channel_meta_daily() -> None:
    channels_raw = os.environ.get("MINDSHARE_CHANNELS_KR", "")
    channels = [c.strip() for c in channels_raw.split(",") if c.strip()]
    if not channels:
        logger.warning("MINDSHARE_CHANNELS_KR 비어 있음")
        return

    async with _get_client() as client:
        for username in channels:
            # 신규 채널이면 기본값 행 생성
            mdb.init_channel(username)

            # 구독자 수 조회
            try:
                entity = await client.get_entity(username)
                participants = getattr(entity, "participants_count", None) or 0
            except Exception:
                logger.warning("get_entity 실패: %s — participants=0 유지", username)
                participants = 0

            mdb.update_channel_participants(username, participants)
            logger.info("channel=%s participants=%d", username, participants)

    logger.info("channel_meta_daily 완료 (%d개 채널)", len(channels))


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    asyncio.run(channel_meta_daily())
