import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { dev } from '$app/environment';
import { query } from '$lib/server/db';
import { getAuthUserFromCookies } from '$lib/server/authGuard';
import { toBoundedInt } from '$lib/server/apiValidation';

const VALID_INTERVALS = [7, 14, 30, 90] as const;
type IntervalDays = (typeof VALID_INTERVALS)[number];
function isValidInterval(n: number): n is IntervalDays {
  return (VALID_INTERVALS as readonly number[]).includes(n);
}

const MOCK_WEIGHTED = [
  { rank:1, ticker:'BTC',      keyword:'비트코인',    logo:null, weighted_mentions:4124, trend_weighted:0.38,  raw_mentions:4992, trend_raw:0.585, divergence_flag:false, total_reactions:8420, total_forwards:1203, total_comments:562 },
  { rank:2, ticker:'ETH',      keyword:'이더리움',    logo:null, weighted_mentions:2890, trend_weighted:0.09,  raw_mentions:3140, trend_raw:0.121, divergence_flag:false, total_reactions:5210, total_forwards:890,  total_comments:334 },
  { rank:3, ticker:'SOL',      keyword:'솔라나',      logo:null, weighted_mentions:1540, trend_weighted:0.11,  raw_mentions:1820, trend_raw:0.1375,divergence_flag:false, total_reactions:3140, total_forwards:520,  total_comments:210 },
  { rank:4, ticker:'JTO',      keyword:'지토',        logo:null, weighted_mentions:980,  trend_weighted:-0.05, raw_mentions:2800, trend_raw:2.50,  divergence_flag:true,  total_reactions:88,   total_forwards:11,   total_comments:8   },
  { rank:5, ticker:'METAMASK', keyword:'메타마스크',  logo:null, weighted_mentions:210,  trend_weighted:7.20,  raw_mentions:234,  trend_raw:8.75,  divergence_flag:false, total_reactions:480,  total_forwards:95,   total_comments:62  },
  { rank:6, ticker:'ABSTRACT', keyword:'어브스트랙트',logo:null, weighted_mentions:170,  trend_weighted:2.40,  raw_mentions:188,  trend_raw:2.686, divergence_flag:false, total_reactions:320,  total_forwards:67,   total_comments:41  },
  { rank:7, ticker:'HYPE',     keyword:'하이프',      logo:null, weighted_mentions:145,  trend_weighted:-0.22, raw_mentions:980,  trend_raw:-0.183,divergence_flag:true,  total_reactions:1860, total_forwards:290,  total_comments:155 },
  { rank:8, ticker:'MONAD',    keyword:'모나드',      logo:null, weighted_mentions:130,  trend_weighted:-0.28, raw_mentions:145,  trend_raw:-0.31, divergence_flag:false, total_reactions:280,  total_forwards:44,   total_comments:33  },
  { rank:9, ticker:'ARB',      keyword:'아비트럼',    logo:null, weighted_mentions:80,   trend_weighted:-0.06, raw_mentions:87,   trend_raw:-0.054,divergence_flag:false, total_reactions:160,  total_forwards:22,   total_comments:14  },
  { rank:10,ticker:'BERACHAIN',keyword:'베라체인',    logo:null, weighted_mentions:60,   trend_weighted:-0.62, raw_mentions:98,   trend_raw:-0.684,divergence_flag:false, total_reactions:190,  total_forwards:28,   total_comments:19  },
];

export const GET: RequestHandler = async ({ url, cookies }) => {
  if (!dev) {
    const user = await getAuthUserFromCookies(cookies);
    if (!user) return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rawInterval = toBoundedInt(url.searchParams.get('intervalDays'), 7, 7, 90);
  const intervalDays: IntervalDays = isValidInterval(rawInterval) ? rawInterval : 7;
  const pretge = url.searchParams.get('pretge') === 'true';
  const offset = toBoundedInt(url.searchParams.get('offset'), 0, 0, 10000);
  const limit  = toBoundedInt(url.searchParams.get('limit'), 50, 1, 200);

  // DB 조회 시도
  try {
    const res = await query<Record<string, unknown>>(
      `SELECT rank, ticker, keyword, logo_url AS logo,
              weighted_cur AS weighted_mentions, trend_weighted,
              raw_cur AS raw_mentions, trend_raw,
              divergence_flag,
              total_reactions, total_forwards, total_comments
       FROM mindshare_weighted_summary
       WHERE period_days = $1 AND pretge = $2
       ORDER BY rank
       LIMIT $3 OFFSET $4`,
      [intervalDays, pretge, limit, offset]
    );
    if (res.rows.length > 0) {
      return json({ intervalDays, pretge, latestUpdatedAt: null, items: res.rows, _mock: false });
    }
  } catch { /* 폴백 */ }

  // 모크 폴백
  const items = (pretge ? MOCK_WEIGHTED.filter(i => ['METAMASK','ABSTRACT','MONAD','BERACHAIN'].includes(i.ticker)) : MOCK_WEIGHTED)
    .slice(offset, offset + limit);

  return json({ intervalDays, pretge, latestUpdatedAt: null, items, _mock: true });
};
