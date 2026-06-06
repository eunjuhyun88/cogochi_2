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

type SummaryRow = {
  rank: number;
  ticker: string;
  keyword: string;
  logo_url: string | null;
  pretge: boolean;
  mentions: string;
  prev_count: string;
  trend_score: string;
  mention_share: string;
  total_reactions: string;
  total_forwards: string;
  total_comments: string;
};

type TimeseriesRow = {
  ticker: string;
  stats_date: string;
  mention_count: string;
};

function toItem(row: SummaryRow) {
  return {
    rank:            Number(row.rank),
    ticker:          row.ticker,
    keyword:         row.keyword,
    logo:            row.logo_url,
    tge:             !row.pretge,
    mentions:        Number(row.mentions),
    prev_count:      Number(row.prev_count),
    trend_score:     Number(row.trend_score),
    mention_share:   Number(row.mention_share),
    total_reactions: Number(row.total_reactions),
    total_forwards:  Number(row.total_forwards),
    total_comments:  Number(row.total_comments),
  };
}

async function getTimeseries(
  tickers: string[],
  intervalDays: number,
  pretge: boolean
): Promise<Record<string, { daily: { stats_date: string; mention_count: number }[] }>> {
  if (tickers.length === 0) return {};

  const pretgeClause = pretge ? 'AND pretge = TRUE' : '';
  const res = await query<TimeseriesRow>(
    `SELECT
       ticker,
       TO_CHAR(DATE(ts_bucket AT TIME ZONE 'Asia/Seoul'), 'YYYY-MM-DD') AS stats_date,
       SUM(hit_count)::int AS mention_count
     FROM mindshare_hits
     WHERE ts_bucket >= NOW() - ($1 || ' days')::interval
       AND ticker = ANY($2::text[])
       ${pretgeClause}
     GROUP BY ticker, stats_date
     ORDER BY ticker, stats_date`,
    [intervalDays.toString(), tickers]
  );

  const result: Record<string, { daily: { stats_date: string; mention_count: number }[] }> = {};
  for (const row of res.rows) {
    if (!result[row.ticker]) result[row.ticker] = { daily: [] };
    result[row.ticker].daily.push({
      stats_date:    row.stats_date,
      mention_count: Number(row.mention_count),
    });
  }
  return result;
}

// ── 모크 데이터 (DB 비어있을 때 폴백) ────────────────────────
const MOCK_ITEMS = [
  { rank:1,  ticker:'BTC',      keyword:'비트코인',    logo:null, tge:true,  mentions:4992, prev_count:3150, trend_score:0.585,  mention_share:0.3997, total_reactions:8420, total_forwards:1203, total_comments:562 },
  { rank:2,  ticker:'ETH',      keyword:'이더리움',    logo:null, tge:true,  mentions:3140, prev_count:2800, trend_score:0.121,  mention_share:0.2514, total_reactions:5210, total_forwards:890,  total_comments:334 },
  { rank:3,  ticker:'SOL',      keyword:'솔라나',      logo:null, tge:true,  mentions:1820, prev_count:1600, trend_score:0.1375, mention_share:0.1458, total_reactions:3140, total_forwards:520,  total_comments:210 },
  { rank:4,  ticker:'HYPE',     keyword:'하이프',      logo:null, tge:true,  mentions:980,  prev_count:1200, trend_score:-0.183, mention_share:0.0785, total_reactions:1860, total_forwards:290,  total_comments:155 },
  { rank:5,  ticker:'METAMASK', keyword:'메타마스크',  logo:null, tge:false, mentions:234,  prev_count:24,   trend_score:8.75,   mention_share:0.0187, total_reactions:480,  total_forwards:95,   total_comments:62  },
  { rank:6,  ticker:'ABSTRACT', keyword:'어브스트랙트',logo:null, tge:false, mentions:188,  prev_count:51,   trend_score:2.686,  mention_share:0.0151, total_reactions:320,  total_forwards:67,   total_comments:41  },
  { rank:7,  ticker:'MONAD',    keyword:'모나드',      logo:null, tge:false, mentions:145,  prev_count:210,  trend_score:-0.31,  mention_share:0.0116, total_reactions:280,  total_forwards:44,   total_comments:33  },
  { rank:8,  ticker:'BERACHAIN',keyword:'베라체인',    logo:null, tge:false, mentions:98,   prev_count:310,  trend_score:-0.684, mention_share:0.0078, total_reactions:190,  total_forwards:28,   total_comments:19  },
  { rank:9,  ticker:'ARB',      keyword:'아비트럼',    logo:null, tge:true,  mentions:87,   prev_count:92,   trend_score:-0.054, mention_share:0.007,  total_reactions:160,  total_forwards:22,   total_comments:14  },
  { rank:10, ticker:'JTO',      keyword:'지토',        logo:null, tge:true,  mentions:45,   prev_count:720,  trend_score:-0.9375,mention_share:0.0036, total_reactions:88,   total_forwards:11,   total_comments:8   },
];

function makeMockTimeseries(tickers: string[], days: number) {
  const result: Record<string, { daily: { stats_date: string; mention_count: number }[] }> = {};
  const now = new Date();
  for (const ticker of tickers) {
    const daily = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      // 시드 기반 일관된 난수 (ticker + i)
      const seed = ticker.charCodeAt(0) + i;
      daily.push({ stats_date: d.toISOString().slice(0, 10), mention_count: 30 + (seed * 37) % 120 });
    }
    result[ticker] = { daily };
  }
  return result;
}

function buildMockResponse(intervalDays: number, pretge: boolean, offset: number, limit: number) {
  let all = pretge ? MOCK_ITEMS.filter(i => !i.tge) : MOCK_ITEMS;
  const total_keywords = all.length;
  const total_mentions = all.reduce((s, i) => s + i.mentions, 0);
  const sorted = [...all].sort((a, b) => b.trend_score - a.trend_score);
  const top_gainer = sorted[0] ? { ticker: sorted[0].ticker, keyword: sorted[0].keyword, trend_score: sorted[0].trend_score } : null;
  const top_gainers = sorted.slice(0, 5).map(({ rank, ticker, keyword, logo, trend_score, mentions }) => ({ rank, ticker, keyword, logo, trend_score, mentions }));
  const top_losers  = [...all].sort((a, b) => a.trend_score - b.trend_score).slice(0, 5).map(({ rank, ticker, keyword, logo, trend_score, mentions }) => ({ rank, ticker, keyword, logo, trend_score, mentions }));
  const items = all.slice(offset, offset + limit);
  return { total_keywords, total_mentions, top_gainer, top_gainers, top_losers, items, timeseries: makeMockTimeseries(items.map(i => i.ticker), intervalDays), _mock: true };
}

export const GET: RequestHandler = async ({ url, cookies }) => {
  // dev 모드에서는 인증 스킵
  if (!dev) {
    const user = await getAuthUserFromCookies(cookies);
    if (!user) return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rawInterval = toBoundedInt(url.searchParams.get('intervalDays'), 7, 7, 90);
  const intervalDays: IntervalDays = isValidInterval(rawInterval) ? rawInterval : 7;
  const pretge  = url.searchParams.get('pretge') === 'true';
  const offset  = toBoundedInt(url.searchParams.get('offset'), 0, 0, 10000);
  const limit   = toBoundedInt(url.searchParams.get('limit'), 50, 1, 200);

  // DB 연결 실패 또는 테이블 미생성 시 모크 폴백
  let dbAvailable = true;
  try {
    await query('SELECT 1 FROM mindshare_summary LIMIT 1', []);
  } catch {
    dbAvailable = false;
  }

  if (!dbAvailable) {
    const mock = buildMockResponse(intervalDays, pretge, offset, limit);
    return json({ tab: 'community', intervalDays, pretge, latestUpdatedAt: null, ...mock });
  }

  const [pageRes, allRes, tsRes] = await Promise.all([
    query<SummaryRow>(
      `SELECT rank, ticker, keyword, logo_url, pretge,
              mentions, prev_count, trend_score, mention_share,
              total_reactions, total_forwards, total_comments
       FROM mindshare_summary
       WHERE period_days = $1 AND pretge = $2
       ORDER BY rank
       LIMIT $3 OFFSET $4`,
      [intervalDays, pretge, limit, offset]
    ),
    query<{ rank: number; ticker: string; keyword: string; trend_score: string; mentions: string; logo_url: string | null; }>(
      `SELECT rank, ticker, keyword, trend_score, mentions, logo_url
       FROM mindshare_summary
       WHERE period_days = $1 AND pretge = $2
       ORDER BY rank`,
      [intervalDays, pretge]
    ),
    query<{ max: string | null }>(
      `SELECT MAX(updated_at) AS max
       FROM mindshare_summary
       WHERE period_days = $1 AND pretge = $2`,
      [intervalDays, pretge]
    ),
  ]);

  const items = pageRes.rows.map(toItem);
  type AllRow = { rank: number; ticker: string; keyword: string; trend_score: string; mentions: string; logo_url: string | null };
  const allRows: AllRow[] = allRes.rows;

  // DB에 데이터 없으면 모크 폴백
  if (items.length === 0 && allRows.length === 0) {
    const mock = buildMockResponse(intervalDays, pretge, offset, limit);
    return json({ tab: 'community', intervalDays, pretge, latestUpdatedAt: null, ...mock });
  }

  const total_keywords = allRows.length;
  const total_mentions = allRows.reduce((s: number, r) => s + Number(r.mentions), 0);
  const latestUpdatedAt = tsRes.rows[0]?.max ?? null;

  const sortedByTrend = [...allRows].sort((a, b) => Number(b.trend_score) - Number(a.trend_score));

  const top_gainer = sortedByTrend[0]
    ? {
        ticker:      sortedByTrend[0].ticker,
        keyword:     sortedByTrend[0].keyword,
        trend_score: Number(sortedByTrend[0].trend_score),
      }
    : null;

  const top_gainers = sortedByTrend.slice(0, 5).map(r => ({
    rank:        Number(r.rank),
    ticker:      r.ticker,
    keyword:     r.keyword,
    logo:        r.logo_url,
    trend_score: Number(r.trend_score),
    mentions:    Number(r.mentions),
  }));

  const top_losers = [...allRows]
    .sort((a, b) => Number(a.trend_score) - Number(b.trend_score))
    .slice(0, 5)
    .map(r => ({
      rank:        Number(r.rank),
      ticker:      r.ticker,
      keyword:     r.keyword,
      logo:        r.logo_url,
      trend_score: Number(r.trend_score),
      mentions:    Number(r.mentions),
    }));

  const timeseries = await getTimeseries(items.map((i: ReturnType<typeof toItem>) => i.ticker), intervalDays, pretge);

  return json({
    tab:             'community',
    intervalDays,
    pretge,
    latestUpdatedAt,
    total_keywords,
    total_mentions,
    top_gainer,
    items,
    timeseries,
    top_gainers,
    top_losers,
  });
};
