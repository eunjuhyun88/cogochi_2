import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { dev } from '$app/environment';
import { query } from '$lib/server/db';
import { getAuthUserFromCookies } from '$lib/server/authGuard';

const MOCK_COMPONENTS: Record<string, unknown> = {
  engagement: 82.4, content: 58.1, reach: 84.7, spread: 50.0, hit: 76.3,
  influence: 73.5, tier: '높음',
};

const MOCK_CALLS = [
  { ticker:'BTC',  call_direction:1,  price_return_24h:0.021,  reward:0.07,  msg_ts:'2026-06-02T14:30:00Z' },
  { ticker:'HYPE', call_direction:1,  price_return_24h:-0.008, reward:-0.03, msg_ts:'2026-06-02T11:00:00Z' },
  { ticker:'ETH',  call_direction:1,  price_return_24h:0.034,  reward:0.11,  msg_ts:'2026-06-01T21:00:00Z' },
  { ticker:'SOL',  call_direction:-1, price_return_24h:-0.015, reward:0.05,  msg_ts:'2026-06-01T16:00:00Z' },
  { ticker:'BTC',  call_direction:1,  price_return_24h:0.052,  reward:0.17,  msg_ts:'2026-06-01T09:00:00Z' },
];

export const GET: RequestHandler = async ({ params, cookies }) => {
  if (!dev) {
    const user = await getAuthUserFromCookies(cookies);
    if (!user) return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const channelId = params.id;

  try {
    const compRes = await query<Record<string, unknown>>(
      `SELECT ic.engagement, ic.content, ic.reach, ic.spread, ic.hit,
              ci.influence, ci.tier
       FROM influence_components ic
       JOIN channel_influence ci USING (channel_id)
       WHERE ic.channel_id = $1`,
      [channelId]
    );
    const callRes = await query<Record<string, unknown>>(
      `SELECT ticker, call_direction, price_return AS price_return_24h, reward, msg_ts
       FROM influence_hit_log
       WHERE channel_id = $1 AND reward IS NOT NULL
       ORDER BY msg_ts DESC
       LIMIT 20`,
      [channelId]
    );
    if (compRes.rows.length > 0) {
      return json({ ...compRes.rows[0], recent_calls: callRes.rows, _mock: false });
    }
  } catch { /* 폴백 */ }

  return json({ ...MOCK_COMPONENTS, recent_calls: MOCK_CALLS, _mock: true });
};
