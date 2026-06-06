"""
텔레그램 크롤러 — W-A324.
30분마다 MINDSHARE_CHANNELS_KR 채널의 신규 메시지를 수집한다.

필요 환경변수:
  TELEGRAM_API_ID      — my.telegram.org에서 발급
  TELEGRAM_API_HASH    — 동일
  TELEGRAM_SESSION     — StringSession 문자열 (최초 1회 session_init.py로 생성)
  MINDSHARE_CHANNELS_KR — 수집 채널 username 목록 (쉼표 구분)
  DATABASE_URL         — Supabase PostgreSQL 연결 문자열
"""
from __future__ import annotations

import asyncio
import logging
import os

from telethon import TelegramClient
from telethon.sessions import StringSession

from . import db as mdb
from .filters import (
    HIT_CAP_PER_HOUR,
    date_trunc_hour,
    detect_call_direction,
    is_spam_broadcast,
    match_tickers,
    should_count_hit,
)

logger = logging.getLogger(__name__)


def _get_client() -> TelegramClient:
    api_id   = int(os.environ["TELEGRAM_API_ID"])
    api_hash = os.environ["TELEGRAM_API_HASH"]
    session  = os.environ["TELEGRAM_SESSION"]
    return TelegramClient(StringSession(session), api_id, api_hash)


async def collect_once() -> None:
    """한 번 전체 채널 수집 + 키워드 매칭 실행."""
    channels_raw = os.environ.get("MINDSHARE_CHANNELS_KR", "")
    channels = [c.strip() for c in channels_raw.split(",") if c.strip()]
    if not channels:
        logger.warning("MINDSHARE_CHANNELS_KR 가 비어 있음. 수집 건너뜀.")
        return

    async with _get_client() as client:
        for channel in channels:
            await _collect_channel(client, channel)

    _run_keyword_matching()


async def _collect_channel(client: TelegramClient, channel: str) -> None:
    last_id = mdb.get_last_msg_id(channel)
    new_max  = last_id
    count    = 0

    try:
        async for msg in client.iter_messages(channel, min_id=last_id):
            text = msg.text or ""
            reactions = (
                sum(r.count for r in msg.reactions.results)
                if msg.reactions
                else 0
            )
            comments = msg.replies.replies if msg.replies else 0

            mdb.insert_raw_message(
                channel=channel,
                msg_id=msg.id,
                ts=msg.date,
                text=text,
                has_media=(msg.media is not None),
                views=msg.views or 0,
                reactions=reactions,
                forwards=msg.forwards or 0,
                comments=comments,
            )
            if msg.id > new_max:
                new_max = msg.id
            count += 1

        if new_max > last_id:
            mdb.update_last_msg_id(channel, new_max)

        logger.info("collected channel=%s new_msgs=%d", channel, count)
    except Exception:
        logger.exception("channel=%s 수집 실패 — 건너뜀", channel)


def _run_keyword_matching() -> None:
    """수집 직후 unprocessed 메시지에 대해 키워드 매칭 + 어뷰징 필터 실행."""
    msgs    = mdb.get_unprocessed_messages()
    tickers = mdb.get_all_tickers()

    for msg in msgs:
        hour_bucket = date_trunc_hour(msg["ts"])

        # 어뷰징 필터 1 — 복사 메시지 다채널 배포
        n_ch = mdb.count_distinct_channels_for_hash(msg["text_hash"], hour_bucket)
        if is_spam_broadcast(n_ch):
            mdb.mark_processed(msg["id"])
            continue

        matched = match_tickers(msg["text"], tickers)

        for ticker in matched:
            current = mdb.get_hit_count(
                ts_bucket=hour_bucket,
                ticker=ticker["ticker"],
                channel=msg["channel"],
                pretge=ticker["pretge"],
            )
            if not should_count_hit(current):
                continue

            mdb.upsert_hit(
                ts_bucket=hour_bucket,
                pretge=ticker["pretge"],
                ticker=ticker["ticker"],
                channel=msg["channel"],
                hit_count=current + 1,
            )

            # W-A325: 콜 방향 감지 → influence_hit_log 삽입
            direction = detect_call_direction(msg["text"])
            if direction != 0:
                mdb.insert_hit_log(
                    channel_id=msg["channel"],
                    msg_id=msg["msg_id"],
                    ticker=ticker["ticker"],
                    call_direction=direction,
                    msg_ts=msg["ts"],
                )

        mdb.mark_processed(msg["id"])
