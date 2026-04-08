import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as pubEnv } from '$env/dynamic/public';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string' || !email.includes('@') || email.length > 320) {
      return json({ ok: false, error: 'Invalid email' }, { status: 400 });
    }

    const cleaned = email.trim().toLowerCase();
    const url = pubEnv.PUBLIC_SUPABASE_URL;
    const key = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      console.log('[waitlist] 📧 No Supabase config, logging:', cleaned);
      return json({ ok: true });
    }

    const supabase = createClient(url, key);
    const { error } = await supabase
      .from('waitlist_emails')
      .upsert({ email: cleaned, source: 'home' }, { onConflict: 'email' });

    if (error) {
      console.warn('[waitlist] Supabase insert error:', error.message);
      // Still return ok — don't block user experience
    }

    return json({ ok: true });
  } catch (err) {
    console.error('[waitlist] Error:', err);
    // Still return ok for UX
    return json({ ok: true });
  }
};
