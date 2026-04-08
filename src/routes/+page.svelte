<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let mounted = $state(false);
  let inputVal = $state('');

  onMount(() => { requestAnimationFrame(() => { mounted = true; }); });

  function go() {
    const v = inputVal.trim();
    goto(v ? `/terminal?q=${encodeURIComponent(v)}` : '/terminal');
  }
  function onKey(e: KeyboardEvent) { if (e.key === 'Enter') go(); }
</script>

<svelte:head><title>COGOTCHI — Signal Engine</title></svelte:head>

<div class="root" class:mounted>
<div class="page">

  <!-- ━━━ LIVE SIGNAL — 제품 그 자체 ━━━ -->
  <section class="section">
    <div class="sec-head">
      <span class="sh-line"></span>
      <span class="sh-title">BTC / 4H</span>
      <span class="sh-line grow"></span>
      <span class="sh-live"><span class="dot"></span>LIVE</span>
    </div>
    <div class="signal">
      <div class="sig-left">
        <div class="sig-score">+52</div>
        <div class="sig-verdict">BULLISH</div>
      </div>
      <div class="sig-right">
        <div class="sig-row"><span class="sig-k">WYCKOFF</span><span class="sig-v good">Markup — accumulation done</span></div>
        <div class="sig-row"><span class="sig-k">MTF</span><span class="sig-v good">1H 4H 1D aligned</span></div>
        <div class="sig-row"><span class="sig-k">CVD</span><span class="sig-v good">Buyers absorbing sells</span></div>
        <div class="sig-row"><span class="sig-k">FLOW</span><span class="sig-v bad">FR hot — squeeze risk</span></div>
        <div class="sig-metrics">
          <span>FR 0.0084%</span><span>OI 89K</span><span>L/S 1.51</span><span>F&G 11</span>
        </div>
      </div>
    </div>
    <p class="sig-caption">You check 5 tabs for this. We do it in one call.</p>
  </section>

  <!-- ━━━ TRY IT ━━━ -->
  <section class="section">
    <div class="sec-head">
      <span class="sh-line"></span>
      <span class="sh-title">TRY IT</span>
      <span class="sh-line grow"></span>
    </div>
    <div class="prompt-row">
      <span class="prompt-char">❯</span>
      <input class="prompt-input" type="text" bind:value={inputVal} onkeydown={onKey} placeholder="BTC 4H, ETH 1D, SOL 15M ..." />
      <button class="prompt-go" onclick={go}>Analyze →</button>
    </div>
    <p class="prompt-sub">No signup. No API key. Free.</p>
  </section>

  <!-- ━━━ 3 SURFACES ━━━ -->
  <section class="section">
    <div class="sec-head">
      <span class="sh-line"></span>
      <span class="sh-title">SURFACES</span>
      <span class="sh-line grow"></span>
    </div>
    <div class="surf-grid">
      <button class="surf" onclick={() => goto('/terminal')}>
        <span class="surf-name">TERMINAL</span>
        <span class="surf-desc">Type a symbol → full analysis with chart</span>
        <span class="surf-arrow">→</span>
      </button>
      <button class="surf" onclick={() => goto('/scanner')}>
        <span class="surf-name">SCANNER</span>
        <span class="surf-desc">What's moving right now across 200+ coins</span>
        <span class="surf-arrow">→</span>
      </button>
      <button class="surf" onclick={() => goto('/lab')}>
        <span class="surf-name">LAB</span>
        <span class="surf-desc">Build a strategy, backtest it, prove your edge</span>
        <span class="surf-arrow">→</span>
      </button>
    </div>
  </section>

  <footer class="foot">
    <span>COGOTCHI</span>
    <span>Binance data · Free · Always</span>
  </footer>

</div>
</div>

<style>
  .root {
    min-height: 100vh;
    background:
      radial-gradient(circle at 10% 0%, rgba(219,154,159,0.06), transparent 28%),
      radial-gradient(circle at 86% 0%, rgba(173,202,124,0.04), transparent 24%),
      linear-gradient(180deg, rgba(10,15,26,0.96), rgba(8,13,23,0.94));
    color: var(--sc-text-0, #f7f2ea);
    font-family: var(--sc-font-mono, 'JetBrains Mono', monospace);
    font-size: 12px;
    line-height: 1.5;
    opacity: 0; transition: opacity 0.3s;
  }
  .root.mounted { opacity: 1; }
  .page { max-width: 720px; margin: 0 auto; padding: 16px 16px 40px; }

  .good { color: var(--sc-good, #adca7c); }
  .bad { color: var(--sc-bad, #cf7f8f); }

  /* ── SECTION ── */
  .section { margin-bottom: 24px; }
  .sec-head {
    display: flex; align-items: center; gap: 8px;
    padding: 0 0 8px;
    font-size: 10px;
  }
  .sh-line { flex: 0 0 8px; height: 1px; background: rgba(219,154,159,0.2); }
  .sh-line.grow { flex: 1; }
  .sh-title {
    color: var(--sc-accent, #db9a9f);
    font-weight: 700; letter-spacing: 1.5px;
    white-space: nowrap;
  }
  .sh-live {
    display: flex; align-items: center; gap: 5px;
    font-size: 8px; font-weight: 700; letter-spacing: 1.5px;
    color: var(--sc-good, #adca7c);
  }
  .dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--sc-good, #adca7c);
    box-shadow: 0 0 8px var(--sc-good, #adca7c);
    animation: pulse 2s ease-in-out infinite;
  }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }

  /* ── SIGNAL ── */
  .signal {
    display: flex;
    border: 1px solid rgba(219,154,159,0.12);
    border-radius: 6px;
    background: rgba(10,15,26,0.6);
    overflow: hidden;
  }
  .sig-left {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 20px 28px;
    border-right: 1px solid rgba(219,154,159,0.08);
    min-width: 110px;
  }
  .sig-score {
    font-size: 48px; font-weight: 700; line-height: 1;
    color: var(--sc-good, #adca7c);
    text-shadow: 0 0 24px rgba(173,202,124,0.3);
  }
  .sig-verdict {
    font-size: 9px; font-weight: 800;
    letter-spacing: 3px; margin-top: 6px;
    color: var(--sc-good, #adca7c);
  }

  .sig-right { flex: 1; padding: 12px 16px; display: flex; flex-direction: column; justify-content: center; }
  .sig-row {
    display: flex; align-items: baseline; gap: 10px;
    padding: 4px 0; font-size: 11px;
  }
  .sig-k {
    min-width: 60px; font-size: 9px; font-weight: 700;
    color: rgba(247,242,234,0.5); letter-spacing: 0.5px;
  }
  .sig-v { font-size: 11px; color: rgba(247,242,234,0.65); }
  .sig-v.good { color: var(--sc-good, #adca7c); }
  .sig-v.bad { color: var(--sc-bad, #cf7f8f); }

  .sig-metrics {
    display: flex; gap: 14px; margin-top: 8px; padding-top: 8px;
    border-top: 1px solid rgba(219,154,159,0.06);
    font-size: 9px; color: rgba(247,242,234,0.3);
  }

  .sig-caption {
    margin: 10px 0 0;
    font-size: 11px; color: rgba(247,242,234,0.25);
    font-style: italic;
  }

  /* ── PROMPT ── */
  .prompt-row {
    display: flex; align-items: center;
    background: var(--sc-bg-1, #0b1220);
    border: 1px solid rgba(219,154,159,0.18);
    border-radius: 6px;
    overflow: hidden;
    transition: border-color 0.15s;
  }
  .prompt-row:focus-within { border-color: var(--sc-accent, #db9a9f); }
  .prompt-char {
    padding: 0 0 0 14px;
    color: var(--sc-accent, #db9a9f); font-size: 14px;
  }
  .prompt-input {
    flex: 1; padding: 12px 10px;
    background: transparent; border: none; outline: none;
    font-family: inherit; font-size: 12px;
    color: var(--sc-text-0);
    caret-color: var(--sc-accent, #db9a9f);
  }
  .prompt-input::placeholder { color: rgba(247,242,234,0.15); }
  .prompt-go {
    padding: 12px 18px;
    background: var(--sc-accent, #db9a9f);
    border: none;
    color: var(--sc-bg-0, #050914);
    font-family: inherit; font-size: 11px; font-weight: 700;
    letter-spacing: 0.5px;
    cursor: pointer;
    transition: filter 0.15s;
  }
  .prompt-go:hover { filter: brightness(1.15); }

  .prompt-sub {
    margin: 8px 0 0;
    font-size: 10px; color: rgba(247,242,234,0.2);
  }

  /* ── SURFACES ── */
  .surf-grid { display: flex; flex-direction: column; gap: 1px; }
  .surf {
    display: flex; align-items: center; gap: 12px;
    padding: 14px 12px;
    background: rgba(10,15,26,0.4);
    border: 1px solid rgba(219,154,159,0.06);
    border-radius: 4px;
    font-family: inherit; color: inherit;
    cursor: pointer; text-align: left;
    transition: all 0.15s;
  }
  .surf:hover {
    border-color: rgba(219,154,159,0.2);
    background: rgba(219,154,159,0.03);
  }
  .surf-name {
    min-width: 80px;
    font-size: 11px; font-weight: 700;
    letter-spacing: 1.5px;
    color: var(--sc-text-0);
  }
  .surf-desc {
    flex: 1;
    font-size: 11px;
    color: rgba(247,242,234,0.35);
  }
  .surf-arrow {
    font-size: 14px;
    color: rgba(247,242,234,0.1);
    transition: all 0.15s;
  }
  .surf:hover .surf-arrow {
    color: var(--sc-accent, #db9a9f);
    transform: translateX(3px);
  }

  /* ── FOOTER ── */
  .foot {
    display: flex; justify-content: space-between;
    padding: 16px 0 0;
    border-top: 1px solid rgba(219,154,159,0.04);
    font-size: 8px; letter-spacing: 1.5px;
    color: rgba(247,242,234,0.08);
  }

  /* ── RESPONSIVE ── */
  @media(max-width:640px) {
    .signal { flex-direction: column; }
    .sig-left {
      flex-direction: row; gap: 10px;
      padding: 12px 16px;
      border-right: none;
      border-bottom: 1px solid rgba(219,154,159,0.08);
      min-width: auto;
    }
    .surf-desc { display: none; }
  }
</style>
