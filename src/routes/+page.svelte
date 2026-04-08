<script lang="ts">
  import { onMount } from 'svelte';

  let mounted = $state(false);
  let email = $state('');
  let submitted = $state(false);
  let submitting = $state(false);
  let errorMsg = $state('');

  async function handleSubmit() {
    if (!email.includes('@') || submitting) return;
    submitting = true;
    errorMsg = '';
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        submitted = true;
      } else {
        errorMsg = data.error || 'Something went wrong';
      }
    } catch {
      errorMsg = 'Network error. Try again.';
    }
    submitting = false;
  }

  function onKey(e: KeyboardEvent) { if (e.key === 'Enter') handleSubmit(); }
  onMount(() => { requestAnimationFrame(() => { mounted = true; }); });
</script>

<svelte:head>
  <title>COGOTCHI — Train Your Trading Edge</title>
</svelte:head>

<div class="lp" class:mounted>
  <section class="hero">

    <h1 class="brand">COGOTCHI</h1>

    <div class="tagline">
      <p class="tl">The market has patterns.</p>
      <p class="tl">Now you can <span class="accent">train on them.</span></p>
    </div>

    <p class="sub">
      Your AI agent learns your trading edge — and scans
      the entire market 24/7 to find it.
    </p>

    <div class="tags">
      <span class="pill">Active futures traders</span>
      <span class="pill">Pattern-based traders</span>
      <span class="pill">Copy trading followers</span>
    </div>

    <div class="cta">
      {#if submitted}
        <div class="cta-ok">
          <span class="ok-icon">✓</span>
          You're on the list. We'll reach out soon.
        </div>
      {:else}
        <div class="cta-row">
          <input
            class="cta-in"
            type="email"
            bind:value={email}
            onkeydown={onKey}
            placeholder="your@email.com"
            autocomplete="email"
          />
          <button class="cta-btn" onclick={handleSubmit} disabled={submitting || !email.includes('@')}>
            {submitting ? 'Joining...' : 'Join Alpha Waitlist →'}
          </button>
        </div>
        {#if errorMsg}
          <p class="cta-err">{errorMsg}</p>
        {/if}
      {/if}
    </div>

    <p class="fine">Free · No credit card · Early access priority</p>

  </section>
</div>

<style>
  .lp {
    position: relative; z-index: 2;
    height: 100%;
    display: flex; align-items: center; justify-content: center;
    color: #F0EDE4;
    opacity: 0; transition: opacity .6s ease;
    padding: 0 24px;
  }
  .lp.mounted { opacity: 1; }

  .hero {
    width: 100%; max-width: 800px;
    display: flex; flex-direction: column;
    align-items: center; text-align: center;
  }

  .brand {
    font-family: 'Orbitron', var(--sc-font-display, 'Bebas Neue'), sans-serif;
    font-size: clamp(44px, 10vw, 120px);
    font-weight: 900;
    letter-spacing: 4px;
    line-height: .92;
    margin: 0 0 clamp(16px, 3vw, 32px);
    color: #F0EDE4;
    text-transform: uppercase;
    animation: rise .9s cubic-bezier(.16,1,.3,1) both;
  }

  .tagline { margin-bottom: clamp(10px, 1.5vw, 16px); }
  .tl {
    font-family: var(--sc-font-body, 'Space Grotesk', sans-serif);
    font-size: clamp(18px, 2.8vw, 32px);
    font-weight: 500;
    line-height: 1.35;
    margin: 0;
    color: rgba(240,237,228,.75);
    animation: rise .8s cubic-bezier(.16,1,.3,1) .15s both;
  }
  .accent { color: #E8967D; }

  .sub {
    font-family: var(--sc-font-body, 'Space Grotesk', sans-serif);
    font-size: clamp(13px, 1.5vw, 16px);
    line-height: 1.6;
    color: rgba(240,237,228,.38);
    max-width: 480px;
    margin: 0 0 clamp(14px, 2vw, 24px);
    animation: rise .8s cubic-bezier(.16,1,.3,1) .3s both;
  }

  .tags {
    display: flex; flex-wrap: wrap; gap: 8px;
    justify-content: center;
    margin-bottom: clamp(16px, 2.5vw, 28px);
    animation: rise .8s cubic-bezier(.16,1,.3,1) .45s both;
  }
  .pill {
    font-family: var(--sc-font-mono, monospace);
    font-size: 10px;
    letter-spacing: .5px;
    color: rgba(240,237,228,.4);
    padding: 5px 12px;
    border: 1px solid rgba(232,150,125,.1);
    border-radius: 999px;
  }

  .cta { animation: rise .8s cubic-bezier(.16,1,.3,1) .6s both; width: 100%; max-width: 460px; }
  .cta-row {
    display: flex;
    border: 1px solid rgba(232,150,125,.16);
    border-radius: 10px;
    overflow: hidden;
    transition: border-color .2s, box-shadow .2s;
    background: rgba(11,18,32,.35);
  }
  .cta-row:focus-within {
    border-color: rgba(232,150,125,.35);
    box-shadow: 0 0 0 3px rgba(232,150,125,.05);
  }
  .cta-in {
    flex: 1; padding: 14px 16px;
    background: transparent; border: none; outline: none;
    font-family: var(--sc-font-body, 'Space Grotesk', sans-serif);
    font-size: 14px; color: #F0EDE4; caret-color: #E8967D;
    min-width: 0;
  }
  .cta-in::placeholder { color: rgba(240,237,228,.18); }
  .cta-btn {
    padding: 14px 24px; background: #E8967D; border: none;
    color: #0a0a0f;
    font-family: var(--sc-font-body, 'Space Grotesk', sans-serif);
    font-size: 13px; font-weight: 600;
    cursor: pointer; transition: filter .15s;
    white-space: nowrap; flex-shrink: 0;
  }
  .cta-btn:hover:not(:disabled) { filter: brightness(1.1); }
  .cta-btn:disabled { opacity: .3; cursor: not-allowed; }

  .cta-ok {
    display: flex; align-items: center; justify-content: center; gap: 10px;
    padding: 14px 20px;
    border: 1px solid rgba(173,202,124,.16);
    border-radius: 10px;
    background: rgba(173,202,124,.05);
    color: #adca7c;
    font-family: var(--sc-font-body, 'Space Grotesk', sans-serif);
    font-size: 14px;
  }
  .ok-icon {
    width: 20px; height: 20px; border-radius: 50%;
    background: #adca7c; color: #0a0a0f;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; flex-shrink: 0;
  }
  .cta-err {
    font-family: var(--sc-font-mono, monospace);
    font-size: 11px; color: #cf7f8f; margin: 8px 0 0;
  }

  .fine {
    font-family: var(--sc-font-mono, monospace);
    font-size: 10px; letter-spacing: .5px;
    color: rgba(240,237,228,.18);
    margin: 12px 0 0;
    animation: rise .8s cubic-bezier(.16,1,.3,1) .75s both;
  }

  @keyframes rise {
    from { opacity: 0; transform: translateY(40px); filter: blur(4px); }
    to { opacity: 1; transform: none; filter: blur(0); }
  }

  @media (max-width: 768px) {
    .lp { padding: 0 20px; }
    .brand { letter-spacing: 2px; }
    .cta-row { flex-direction: column; }
    .cta-btn { width: 100%; text-align: center; }
  }

  @media (max-width: 480px) {
    .brand { font-size: clamp(32px, 12vw, 52px); letter-spacing: 1px; }
    .tl { font-size: clamp(16px, 4.5vw, 22px); }
    .sub { font-size: 12px; }
    .pill { font-size: 9px; padding: 4px 9px; }
  }
</style>
