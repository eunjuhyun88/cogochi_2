import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as pubEnv } from '$env/dynamic/public';
import { createRateLimiter } from '$lib/server/rateLimit';
import { verifyTurnstile } from '$lib/server/turnstile';

/** Waitlist: 5 submissions per hour per IP */
const waitlistLimiter = createRateLimiter({ windowMs: 3_600_000, max: 5 });

/** Strip HTML tags and limit length for safe storage */
function sanitize(input: string, maxLen: number): string {
  return input.replace(/<[^>]*>/g, '').trim().slice(0, maxLen);
}

export const POST: RequestHandler = async ({ request, getClientAddress, url: reqUrl }) => {
  try {
    // ── CSRF: block cross-origin requests ──
    const origin = request.headers.get('origin');
    if (origin && origin !== reqUrl.origin) {
      return json({ ok: false, error: 'Cross-origin request blocked' }, { status: 403 });
    }

    // ── Rate limit (getClientAddress handles proxy via SvelteKit adapter) ──
    const ip = getClientAddress();
    if (!waitlistLimiter.check(ip)) {
      return json({ ok: false, error: 'Too many requests. Try again later.' }, { status: 429 });
    }

    const body = await request.json();
    const { email, name, message, turnstileToken } = body as {
      email?: string;
      name?: string;
      message?: string;
      turnstileToken?: string;
    };

    // ── Validate email ──
    if (!email || typeof email !== 'string' || !email.includes('@') || email.length > 320) {
      return json({ ok: false, error: 'Invalid email' }, { status: 400 });
    }

    // ── Validate name ──
    if (!name || typeof name !== 'string' || name.trim().length < 1) {
      return json({ ok: false, error: 'Name is required' }, { status: 400 });
    }

    // ── Turnstile bot check (non-blocking if not configured) ──
    const turnstile = await verifyTurnstile({ token: turnstileToken, remoteIp: ip });
    if (!turnstile.ok && !turnstile.skipped) {
      return json({ ok: false, error: 'Bot verification failed. Please try again.' }, { status: 403 });
    }

    // ── Sanitize inputs ──
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = sanitize(name, 100);
    const cleanMessage = message ? sanitize(String(message), 500) : '';

    const url = pubEnv.PUBLIC_SUPABASE_URL;
    const key = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      console.log('[waitlist] No Supabase config, logging:', cleanEmail, cleanName);
      return json({ ok: true });
    }

    const supabase = createClient(url, key);
    const { error } = await supabase
      .from('waitlist_emails')
      .upsert(
        { email: cleanEmail, name: cleanName, message: cleanMessage, source: 'home' },
        { onConflict: 'email' }
      );

    if (error) {
      console.warn('[waitlist] Supabase insert error:', error.message);
    }

    return json({ ok: true });
  } catch (err) {
    console.error('[waitlist] Error:', err);
    return json({ ok: true });
  }
};
