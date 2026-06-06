import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { dev } from '$app/environment';
import { query } from '$lib/server/db';
import { getAuthUserFromCookies } from '$lib/server/authGuard';
import { toBoundedInt } from '$lib/server/apiValidation';

const MOCK_KOL = [
  { channel_id:'@namu_invest',   channel_name:'나는 무직이다',  influence:87.2, tier:'최상', participants:124000, mentions_count:1203 },
  { channel_id:'@value_crypto',  channel_name:'가치투자클럽',   influence:76.5, tier:'높음', participants:88500,  mentions_count:894  },
  { channel_id:'@korea_defi',    channel_name:'코리아 디파이',   influence:71.3, tier:'높음', participants:72000,  mentions_count:743  },
  { channel_id:'@onchain_kr',    channel_name:'온체인 리서치',   influence:68.9, tier:'높음', participants:65000,  mentions_count:621  },
  { channel_id:'@btc_signal',    channel_name:'비트코인 시그널', influence:64.1, tier:'높음', participants:58000,  mentions_count:582  },
  { channel_id:'@sol_community', channel_name:'솔라나 커뮤니티', influence:58.4, tier:'보통', participants:45000,  mentions_count:498  },
  { channel_id:'@crypto_news_kr',channel_name:'크립토 뉴스',    influence:54.2, tier:'보통', participants:41000,  mentions_count:432  },
  { channel_id:'@alpha_leaks',   channel_name:'알파 리크스',     influence:49.7, tier:'보통', participants:34000,  mentions_count:381  },
  { channel_id:'@whale_tracker', channel_name:'웨일 트래커',     influence:45.1, tier:'보통', participants:29000,  mentions_count:312  },
  { channel_id:'@layer2_kr',     channel_name:'레이어2 코리아',  influence:42.3, tier:'보통', participants:26000,  mentions_count:287  },
  { channel_id:'@defi_alpha',    channel_name:'디파이 알파',     influence:38.9, tier:'보통', participants:23000,  mentions_count:254  },
  { channel_id:'@nft_daily',     channel_name:'NFT 데일리',      influence:35.4, tier:'보통', participants:19000,  mentions_count:198  },
  { channel_id:'@macro_kr',      channel_name:'매크로 한국',     influence:31.2, tier:'보통', participants:15000,  mentions_count:167  },
  { channel_id:'@trade_desk',    channel_name:'트레이드 데스크', influence:27.8, tier:'낮음', participants:12000,  mentions_count:143  },
  { channel_id:'@altcoin_hunt',  channel_name:'알트코인 헌터',   influence:24.5, tier:'낮음', participants:9800,   mentions_count:121  },
];

export const GET: RequestHandler = async ({ url, cookies }) => {
  if (!dev) {
    const user = await getAuthUserFromCookies(cookies);
    if (!user) return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limit = toBoundedInt(url.searchParams.get('limit'), 20, 1, 100);
  const intervalDays = toBoundedInt(url.searchParams.get('intervalDays'), 7, 7, 90);

  try {
    const res = await query<Record<string, unknown>>(
      `SELECT ci.channel_id, ci.channel_name, ci.influence, ci.tier, ci.participants,
              COALESCE(SUM(h.hit_count), 0)::int AS mentions_count
       FROM channel_influence ci
       LEFT JOIN mindshare_hits h
         ON h.channel = ci.channel_id
         AND h.ts_bucket >= NOW() - ($1 || ' days')::interval
       GROUP BY ci.channel_id, ci.channel_name, ci.influence, ci.tier, ci.participants
       ORDER BY ci.influence DESC
       LIMIT $2`,
      [intervalDays.toString(), limit]
    );
    if (res.rows.length > 0) {
      return json({ items: res.rows, _mock: false });
    }
  } catch { /* 폴백 */ }

  return json({ items: MOCK_KOL.slice(0, limit), _mock: true });
};
