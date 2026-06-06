"""
진입점 — 크롤러 + 집계 + 영향력 배치 스케줄러.

사용법:
  python -m cogochi.mindshare.runner               # 데몬 모드
  python -m cogochi.mindshare.runner --once        # 수집+집계 1회
  python -m cogochi.mindshare.runner --meta        # channel_meta_daily 1회
  python -m cogochi.mindshare.runner --influence   # influence_batch_daily 1회
  python -m cogochi.mindshare.runner --hit-update  # influence_hit_update 1회
  python -m cogochi.mindshare.runner --init-session

데몬 스케줄:
  - 30분마다  : 수집(crawler) + 집계(aggregator)
  - 6시간마다 : influence_hit_update
  - 매일 03:00 KST: channel_meta_daily → influence_batch_daily
"""
from __future__ import annotations

import argparse
import asyncio
import logging
import os
from datetime import datetime, timezone, timedelta

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger("mindshare.runner")

CRAWL_INTERVAL      = 30 * 60   # 30분
HIT_UPDATE_INTERVAL = 6 * 3600  # 6시간
KST = timezone(timedelta(hours=9))


def _init_session() -> None:
    from telethon.sync import TelegramClient
    from telethon.sessions import StringSession

    api_id   = int(os.environ["TELEGRAM_API_ID"])
    api_hash = os.environ["TELEGRAM_API_HASH"]
    with TelegramClient(StringSession(), api_id, api_hash) as client:
        session_str = client.session.save()
    print("\n=== TELEGRAM_SESSION ===")
    print(session_str)
    print("========================\n")
    print("위 문자열을 TELEGRAM_SESSION 환경변수에 저장하세요.")


async def _run_once() -> None:
    from .crawler import collect_once
    from .aggregator import aggregate_once

    logger.info("수집 시작")
    await collect_once()
    logger.info("집계 시작")
    aggregate_once()
    logger.info("완료")


def _is_meta_time(now_kst: datetime, last_meta_date) -> bool:
    """KST 03:00 이후이고, 오늘 아직 실행 안 했으면 True."""
    if now_kst.hour < 3:
        return False
    today = now_kst.date()
    return last_meta_date != today


async def _daemon() -> None:
    from .channel_meta import channel_meta_daily
    from .influence_batch import influence_batch_daily
    from .influence_hit_update import influence_hit_update

    last_meta_date = None
    last_hit_update = 0.0

    while True:
        now_kst = datetime.now(KST)

        # 매일 03:00 KST: channel_meta → influence_batch
        if _is_meta_time(now_kst, last_meta_date):
            try:
                await channel_meta_daily()
                influence_batch_daily()
                last_meta_date = now_kst.date()
            except Exception:
                logger.exception("daily 배치 실패 — 건너뜀")

        # 6시간마다 hit update
        import time as _time
        if _time.time() - last_hit_update >= HIT_UPDATE_INTERVAL:
            try:
                influence_hit_update()
                last_hit_update = _time.time()
            except Exception:
                logger.exception("influence_hit_update 실패 — 건너뜀")

        try:
            await _run_once()
        except Exception:
            logger.exception("크롤 루프 오류 — %d초 후 재시도", CRAWL_INTERVAL)

        logger.info("다음 실행까지 %d초 대기", CRAWL_INTERVAL)
        await asyncio.sleep(CRAWL_INTERVAL)


def main() -> None:
    parser = argparse.ArgumentParser(description="Mindshare crawler + aggregator")
    parser.add_argument("--once",         action="store_true", help="수집+집계 1회 실행")
    parser.add_argument("--meta",         action="store_true", help="channel_meta_daily 1회 실행")
    parser.add_argument("--influence",    action="store_true", help="influence_batch_daily 1회 실행")
    parser.add_argument("--hit-update",   action="store_true", help="influence_hit_update 1회 실행")
    parser.add_argument("--init-session", action="store_true", help="Telegram StringSession 초기화")
    args = parser.parse_args()

    if args.init_session:
        _init_session()
        return

    if args.meta:
        from .channel_meta import channel_meta_daily
        asyncio.run(channel_meta_daily())
        return

    if args.influence:
        from .influence_batch import influence_batch_daily
        influence_batch_daily()
        return

    if args.hit_update:
        from .influence_hit_update import influence_hit_update
        influence_hit_update()
        return

    if args.once:
        asyncio.run(_run_once())
    else:
        asyncio.run(_daemon())


if __name__ == "__main__":
    main()
