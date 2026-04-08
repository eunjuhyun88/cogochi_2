<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let mounted = $state(false);
  let now = $state(new Date());
  let tickerOffset = $state(0);
  let scrollY = $state(0);

  const coins = [
    { sym: 'BTC', price: 68342.1, chg: -2.19, alpha: 52 },
    { sym: 'ETH', price: 2083.4, chg: -3.66, alpha: 38 },
    { sym: 'SOL', price: 87.62, chg: +1.24, alpha: 61 },
    { sym: 'XRP', price: 1.37, chg: -0.82, alpha: 15 },
    { sym: 'DOGE', price: 0.0921, chg: +4.51, alpha: 44 },
    { sym: 'BNB', price: 581.3, chg: -1.05, alpha: 22 },
    { sym: 'ADA', price: 0.412, chg: +0.93, alpha: -8 },
    { sym: 'AVAX', price: 24.18, chg: -2.44, alpha: 31 },
  ];

  const layers = [
    { id: 'L1', name: 'WYCKOFF', desc: 'ACC/DIST structure detection' },
    { id: 'L2', name: 'FLOW', desc: 'FR + OI + L/S + Taker' },
    { id: 'L3', name: 'V-SURGE', desc: 'Volume spike detection' },
    { id: 'L4', name: 'ORDERBOOK', desc: 'Bid/Ask wall imbalance' },
    { id: 'L5', name: 'LIQUIDATION', desc: 'Cascade risk estimation' },
    { id: 'L6', name: 'ON-CHAIN', desc: 'Tx + Mempool + Whale' },
    { id: 'L7', name: 'FEAR/GREED', desc: 'Sentiment index' },
    { id: 'L8', name: 'KIMCHI', desc: 'KRW premium spread' },
    { id: 'L9', name: 'FORCE LIQ', desc: '1H real liquidations' },
    { id: 'L10', name: 'MTF', desc: 'Multi-TF confluence' },
    { id: 'L11', name: 'CVD', desc: 'Cumulative volume delta' },
    { id: 'L12', name: 'SECTOR', desc: 'Sector capital flow' },
    { id: 'L13', name: 'BREAKOUT', desc: '7D/30D range escape' },
    { id: 'L14', name: 'BB SQUEEZE', desc: 'Bollinger compression' },
    { id: 'L15', name: 'ATR VOL', desc: 'Volatility regime' },
  ];

  const apis = [
    'BINANCE FUTURES', 'BINANCE SPOT', 'UPBIT', 'BITHUMB',
    'ALTERNATIVE.ME', 'BLOCKCHAIN.INFO', 'MEMPOOL.SPACE',
    'COINGECKO', 'EXCHANGERATE'
  ];

  const features = [
    {
      key: 'terminal', route: '/terminal',
      title: 'TERMINAL', icon: '&#9608;',
      desc: 'Single-coin deep analysis. 15-layer signal engine with real-time chart, S/R levels, BB bands, CVD overlay, and AI commentary.',
      tag: 'DEEP DIVE'
    },
    {
      key: 'scanner', route: '/scanner',
      title: 'SCANNER', icon: '&#9783;',
      desc: 'Multi-coin market scan. Top 100 by volume, movers, breakout candidates. 8 filters, presets, watchlists.',
      tag: 'WIDE SCAN'
    },
    {
      key: 'lab', route: '/cogochi',
      title: 'LAB', icon: '&#9830;',
      desc: 'AI agent training ground. Teach doctrine, backtest on historical data, prove edge before real capital.',
      tag: 'AI AGENTS'
    }
  ];

  onMount(() => {
    requestAnimationFrame(() => { mounted = true; });
    const clockInterval = setInterval(() => { now = new Date(); }, 1000);
    const tickerInterval = setInterval(() => { tickerOffset -= 0.4; }, 30);
    return () => { clearInterval(clockInterval); clearInterval(tickerInterval); };
  });

  function formatPrice(p: number): string {
    return p >= 1 ? p.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
                   : p.toFixed(4);
  }
</script>

<svelte:head><title>COGOTCHI — Signal Engine</title></svelte:head>
<svelte:window bind:scrollY />

<div class="root" class:mounted>
  <!-- Ambient glow -->
  <div class="ambient-orb orb-1" style="transform:translateY({scrollY * -0.08}px)"></div>
  <div class="ambient-orb orb-2" style="transform:translateY({scrollY * -0.05}px)"></div>

  <!-- ═══ TICKER ═══ -->
  <div class="ticker-strip">
    <div class="ticker-fade ticker-fade-l"></div>
    <div class="ticker-track" style="transform:translateX({tickerOffset}px)">
      {#each [...coins, ...coins, ...coins, ...coins] as coin}
        <span class="ticker-item">
          <span class="ti-sym">{coin.sym}</span>
          <span class="ti-price">${formatPrice(coin.price)}</span>
          <span class="ti-chg" class:up={coin.chg >= 0} class:dn={coin.chg < 0}>
            {coin.chg >= 0 ? '+' : ''}{coin.chg.toFixed(2)}%
          </span>
          <span class="ti-alpha" class:pos={coin.alpha > 0} class:neg={coin.alpha < 0}>
            {coin.alpha > 0 ? '+' : ''}{coin.alpha}
          </span>
        </span>
      {/each}
    </div>
    <div class="ticker-fade ticker-fade-r"></div>
  </div>

  <!-- ═══ HERO ═══ -->
  <main class="hero">
    <div class="hero-left">
      <div class="hero-eyebrow" style="animation-delay:0.1s">
        <span class="eyebrow-dot"></span>
        15-LAYER SIGNAL ENGINE
      </div>
      <h1 class="hero-title">
        <span class="ht-line" style="animation-delay:0.15s">REAL DATA.</span>
        <span class="ht-line" style="animation-delay:0.25s">REAL SIGNALS.</span>
        <span class="ht-line ht-glow" style="animation-delay:0.35s">NO GUESSING.</span>
      </h1>
      <p class="hero-sub" style="animation-delay:0.45s">
        15 layers of market analysis. 9 free data sources. Wyckoff, CVD, on-chain, orderbook, liquidations — all computed server-side from Binance raw data.
      </p>
      <div class="hero-actions" style="animation-delay:0.55s">
        <button class="btn-primary" onclick={() => goto('/terminal')}>
          <span class="btn-label">OPEN TERMINAL</span>
          <span class="btn-arrow">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
        </button>
        <button class="btn-ghost" onclick={() => goto('/scanner')}>
          <span class="btn-label">SCANNER</span>
          <span class="btn-arrow">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
        </button>
      </div>
    </div>

    <div class="hero-right">
      <div class="alpha-card">
        <div class="ac-scanline"></div>
        <div class="ac-top">
          <span class="ac-label">ALPHA PREVIEW</span>
          <span class="ac-live"><span class="live-pip"></span>LIVE</span>
        </div>
        <div class="ac-main">
          <div class="ac-pair">
            <span class="ac-sym">BTC</span>
            <span class="ac-tf">4H</span>
          </div>
          <div class="ac-score-wrap">
            <span class="ac-score">+52</span>
            <span class="ac-verdict">BULL</span>
          </div>
        </div>
        <div class="ac-layers">
          <div class="acl" style="--bar:71%;--clr:var(--sc-good,#adca7c)">
            <span class="acl-name">L1 WYCKOFF</span>
            <span class="acl-val">MARKUP +20</span>
            <div class="acl-bar"></div>
          </div>
          <div class="acl" style="--bar:71%;--clr:var(--sc-good,#adca7c)">
            <span class="acl-name">L10 MTF</span>
            <span class="acl-val">ALIGNED +20</span>
            <div class="acl-bar"></div>
          </div>
          <div class="acl" style="--bar:53%;--clr:var(--sc-good,#adca7c)">
            <span class="acl-name">L11 CVD</span>
            <span class="acl-val">BULLISH +15</span>
            <div class="acl-bar"></div>
          </div>
          <div class="acl" style="--bar:14%;--clr:var(--sc-bad,#cf7f8f)">
            <span class="acl-name">L2 FLOW</span>
            <span class="acl-val bad">FR HOT -4</span>
            <div class="acl-bar"></div>
          </div>
        </div>
        <div class="ac-metrics">
          <div class="acm"><span class="acm-k">FR</span><span class="acm-v">0.0084%</span></div>
          <div class="acm"><span class="acm-k">OI</span><span class="acm-v">89K</span></div>
          <div class="acm"><span class="acm-k">L/S</span><span class="acm-v">1.51</span></div>
          <div class="acm"><span class="acm-k">F&G</span><span class="acm-v">11</span></div>
        </div>
      </div>
    </div>
  </main>

  <!-- ═══ STATS RIBBON ═══ -->
  <div class="stats-ribbon">
    <div class="ribbon-inner">
      {#each [
        { val: '15', label: 'ANALYSIS LAYERS' },
        { val: '9', label: 'DATA SOURCES' },
        { val: '200+', label: 'SUPPORTED COINS' },
        { val: 'RT', label: 'REAL-TIME' },
        { val: '$0', label: 'ALL FREE' },
      ] as stat, i}
        <div class="ribbon-stat" style="animation-delay:{0.6 + i * 0.08}s">
          <span class="rs-val">{stat.val}</span>
          <span class="rs-label">{stat.label}</span>
        </div>
      {/each}
    </div>
  </div>

  <!-- ═══ FEATURES ═══ -->
  <section class="features">
    <div class="section-label">
      <span class="sl-line"></span>
      <span class="sl-text">CORE SURFACES</span>
      <span class="sl-line"></span>
    </div>
    <div class="feat-grid">
      {#each features as feat, i}
        <button class="feat-card" onclick={() => goto(feat.route)} style="animation-delay:{0.7 + i * 0.1}s">
          <div class="fc-top">
            <span class="fc-tag">{feat.tag}</span>
            <span class="fc-arrow-icon">&#8599;</span>
          </div>
          <div class="fc-icon-wrap">
            <span class="fc-icon">{@html feat.icon}</span>
          </div>
          <h3 class="fc-title">{feat.title}</h3>
          <p class="fc-desc">{feat.desc}</p>
          <div class="fc-bottom">
            <span class="fc-go">ENTER<span class="fc-go-arrow">&#8594;</span></span>
          </div>
        </button>
      {/each}
    </div>
  </section>

  <!-- ═══ LAYER ENGINE ═══ -->
  <section class="engine-section">
    <div class="section-label">
      <span class="sl-line"></span>
      <span class="sl-text">15-LAYER SIGNAL ENGINE</span>
      <span class="sl-line"></span>
    </div>
    <div class="engine-grid">
      {#each layers as layer, i}
        <div class="engine-cell" style="animation-delay:{i * 35}ms">
          <div class="ec-index">{layer.id}</div>
          <div class="ec-body">
            <span class="ec-name">{layer.name}</span>
            <span class="ec-desc">{layer.desc}</span>
          </div>
          <div class="ec-pulse"></div>
        </div>
      {/each}
    </div>
  </section>

  <!-- ═══ DATA SOURCES ═══ -->
  <section class="sources-section">
    <div class="section-label">
      <span class="sl-line"></span>
      <span class="sl-text">9 DATA SOURCES — ALL FREE</span>
      <span class="sl-line"></span>
    </div>
    <div class="source-tags">
      {#each apis as api, i}
        <span class="source-tag" style="animation-delay:{i * 50}ms">{api}</span>
      {/each}
    </div>
  </section>

  <!-- ═══ FOOTER ═══ -->
  <footer class="foot">
    <div class="foot-inner">
      <span class="foot-brand">COGOTCHI SIGNAL ENGINE</span>
      <span class="foot-meta">DATA: BINANCE &middot; NO API KEY &middot; {now.getFullYear()}</span>
    </div>
  </footer>
</div>

<style>
  /* ═══ DESIGN TOKENS ═══ */
  .root {
    --bg-deep: #030711;
    --bg-surface: #0a1020;
    --bg-elevated: #101828;
    --border-subtle: rgba(148, 163, 184, 0.06);
    --border-mid: rgba(148, 163, 184, 0.12);
    --border-accent: rgba(251, 191, 36, 0.2);
    --text-primary: #f1f5f9;
    --text-secondary: rgba(241, 245, 249, 0.55);
    --text-tertiary: rgba(241, 245, 249, 0.3);
    --amber: #fbbf24;
    --amber-dim: rgba(251, 191, 36, 0.15);
    --amber-glow: rgba(251, 191, 36, 0.08);
    --green: var(--sc-good, #4ade80);
    --red: var(--sc-bad, #f87171);
    min-height: 100vh;
    background: var(--bg-deep);
    color: var(--text-primary);
    font-family: 'Space Grotesk', 'Helvetica Neue', sans-serif;
    overflow-x: hidden;
    position: relative;
    opacity: 0;
    transition: opacity 0.5s ease;
  }
  .root.mounted { opacity: 1; }

  /* ═══ AMBIENT ═══ */
  .ambient-orb {
    position: fixed;
    border-radius: 50%;
    filter: blur(120px);
    pointer-events: none;
    z-index: 0;
    will-change: transform;
  }
  .orb-1 {
    width: 600px; height: 600px;
    top: -200px; left: -100px;
    background: radial-gradient(circle, rgba(251,191,36,0.06) 0%, transparent 70%);
  }
  .orb-2 {
    width: 500px; height: 500px;
    top: 200px; right: -150px;
    background: radial-gradient(circle, rgba(74,222,128,0.04) 0%, transparent 70%);
  }

  /* ═══ TICKER ═══ */
  .ticker-strip {
    position: relative;
    height: 36px;
    overflow: hidden;
    background: var(--bg-surface);
    border-bottom: 1px solid var(--border-subtle);
    z-index: 2;
  }
  .ticker-fade {
    position: absolute;
    top: 0; bottom: 0; width: 60px;
    z-index: 2;
    pointer-events: none;
  }
  .ticker-fade-l { left: 0; background: linear-gradient(90deg, var(--bg-surface), transparent); }
  .ticker-fade-r { right: 0; background: linear-gradient(270deg, var(--bg-surface), transparent); }
  .ticker-track {
    display: flex;
    align-items: center;
    height: 100%;
    white-space: nowrap;
    will-change: transform;
  }
  .ticker-item {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 0 20px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10.5px;
    letter-spacing: 0.3px;
  }
  .ti-sym { color: var(--text-primary); font-weight: 700; }
  .ti-price { color: var(--text-secondary); }
  .ti-chg { font-weight: 700; }
  .ti-chg.up { color: var(--green); }
  .ti-chg.dn { color: var(--red); }
  .ti-alpha { font-size: 9px; color: var(--text-tertiary); }
  .ti-alpha.pos { color: rgba(74,222,128,0.5); }
  .ti-alpha.neg { color: rgba(248,113,113,0.5); }

  /* ═══ HERO ═══ */
  .hero {
    position: relative;
    display: flex;
    align-items: center;
    gap: 56px;
    max-width: 1240px;
    margin: 0 auto;
    padding: 72px 40px 56px;
    z-index: 1;
  }
  .hero-left { flex: 1; min-width: 0; }
  .hero-right { flex: 0 0 400px; }

  .hero-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 2.5px;
    color: var(--amber);
    margin-bottom: 28px;
    animation: fade-up 0.6s ease backwards;
  }
  .eyebrow-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--amber);
    box-shadow: 0 0 12px var(--amber);
    animation: pulse-glow 2.5s ease-in-out infinite;
  }
  @keyframes pulse-glow {
    0%,100% { opacity: 1; box-shadow: 0 0 12px var(--amber); }
    50% { opacity: 0.4; box-shadow: 0 0 4px var(--amber); }
  }

  .hero-title { margin: 0; line-height: 0.95; }
  .ht-line {
    display: block;
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(52px, 7.5vw, 88px);
    letter-spacing: 3px;
    color: var(--text-primary);
    animation: fade-up 0.6s ease backwards;
  }
  .ht-glow {
    background: linear-gradient(135deg, var(--amber) 0%, #f59e0b 50%, #fcd34d 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    filter: drop-shadow(0 0 30px rgba(251,191,36,0.3));
  }

  .hero-sub {
    margin: 24px 0 36px;
    font-size: 14.5px;
    line-height: 1.75;
    color: var(--text-secondary);
    max-width: 480px;
    animation: fade-up 0.6s ease backwards;
  }

  .hero-actions {
    display: flex;
    gap: 14px;
    animation: fade-up 0.6s ease backwards;
  }

  /* Buttons */
  .btn-primary, .btn-ghost {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11.5px;
    font-weight: 700;
    letter-spacing: 2px;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 4px;
  }
  .btn-primary {
    padding: 14px 30px;
    background: linear-gradient(135deg, var(--amber) 0%, #f59e0b 100%);
    color: #030711;
    border: none;
    box-shadow: 0 0 0 1px rgba(251,191,36,0.3), 0 4px 24px rgba(251,191,36,0.15);
  }
  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 0 1px rgba(251,191,36,0.5), 0 8px 32px rgba(251,191,36,0.25);
  }
  .btn-ghost {
    padding: 14px 24px;
    background: transparent;
    color: var(--text-secondary);
    border: 1px solid var(--border-mid);
  }
  .btn-ghost:hover {
    border-color: var(--amber);
    color: var(--amber);
    background: var(--amber-glow);
  }
  .btn-arrow {
    display: flex;
    transition: transform 0.25s;
  }
  .btn-primary:hover .btn-arrow,
  .btn-ghost:hover .btn-arrow { transform: translateX(3px); }

  /* ═══ ALPHA CARD ═══ */
  .alpha-card {
    position: relative;
    background: var(--bg-elevated);
    border: 1px solid var(--border-mid);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03);
  }
  .ac-scanline {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(255,255,255,0.008) 2px,
      rgba(255,255,255,0.008) 4px
    );
    z-index: 5;
  }
  .ac-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 16px;
    border-bottom: 1px solid var(--border-subtle);
    background: rgba(3,7,17,0.5);
  }
  .ac-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    letter-spacing: 2.5px;
    color: var(--text-tertiary);
  }
  .ac-live {
    display: flex;
    align-items: center;
    gap: 5px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 8.5px;
    letter-spacing: 1.5px;
    color: var(--green);
    font-weight: 700;
  }
  .live-pip {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: var(--green);
    box-shadow: 0 0 8px var(--green);
    animation: pulse-glow-g 2s ease-in-out infinite;
  }
  @keyframes pulse-glow-g {
    0%,100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  .ac-main {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 16px 16px;
  }
  .ac-pair { display: flex; align-items: baseline; gap: 10px; }
  .ac-sym {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 36px;
    letter-spacing: 2px;
    color: var(--text-primary);
  }
  .ac-tf {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: var(--text-tertiary);
    padding: 2px 8px;
    border: 1px solid var(--border-subtle);
    border-radius: 3px;
    background: rgba(255,255,255,0.02);
  }
  .ac-score-wrap { display: flex; align-items: baseline; gap: 8px; }
  .ac-score {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 40px;
    letter-spacing: 1px;
    color: var(--green);
    text-shadow: 0 0 24px rgba(74,222,128,0.3);
  }
  .ac-verdict {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 2px;
    color: var(--green);
  }

  .ac-layers { padding: 0 16px 16px; display: flex; flex-direction: column; gap: 6px; }
  .acl {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: var(--text-secondary);
    background: rgba(255,255,255,0.015);
    border-radius: 4px;
    overflow: hidden;
    border-left: 2px solid var(--clr);
  }
  .acl-bar {
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: var(--bar);
    background: linear-gradient(90deg, rgba(74,222,128,0.06), transparent);
    pointer-events: none;
  }
  .acl-name { position: relative; z-index: 1; font-weight: 600; }
  .acl-val { position: relative; z-index: 1; color: var(--green); font-weight: 700; }
  .acl-val.bad { color: var(--red); }

  .ac-metrics {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    border-top: 1px solid var(--border-subtle);
  }
  .acm {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 10px 8px;
    border-right: 1px solid var(--border-subtle);
  }
  .acm:last-child { border-right: none; }
  .acm-k {
    font-family: 'JetBrains Mono', monospace;
    font-size: 8px;
    letter-spacing: 1.5px;
    color: var(--text-tertiary);
  }
  .acm-v {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    font-weight: 700;
    color: var(--text-primary);
  }

  /* ═══ STATS RIBBON ═══ */
  .stats-ribbon {
    position: relative;
    z-index: 1;
    border-top: 1px solid var(--border-subtle);
    border-bottom: 1px solid var(--border-subtle);
    background: var(--bg-surface);
  }
  .ribbon-inner {
    display: flex;
    align-items: center;
    justify-content: center;
    max-width: 1240px;
    margin: 0 auto;
    padding: 0 40px;
  }
  .ribbon-stat {
    display: flex;
    align-items: baseline;
    gap: 10px;
    padding: 18px 36px;
    position: relative;
    animation: fade-up 0.5s ease backwards;
  }
  .ribbon-stat:not(:last-child)::after {
    content: '';
    position: absolute;
    right: 0; top: 50%;
    transform: translateY(-50%);
    width: 1px;
    height: 20px;
    background: var(--border-mid);
  }
  .rs-val {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 28px;
    letter-spacing: 1px;
    color: var(--amber);
  }
  .rs-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 8px;
    letter-spacing: 2px;
    color: var(--text-tertiary);
  }

  /* ═══ SECTION LABEL ═══ */
  .section-label {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 32px;
  }
  .sl-line {
    flex: 1;
    height: 1px;
    background: var(--border-subtle);
  }
  .sl-text {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    letter-spacing: 3px;
    color: var(--text-tertiary);
    white-space: nowrap;
  }

  /* ═══ FEATURES ═══ */
  .features {
    max-width: 1240px;
    margin: 0 auto;
    padding: 64px 40px;
    position: relative;
    z-index: 1;
  }
  .feat-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
  .feat-card {
    display: flex;
    flex-direction: column;
    padding: 28px 24px 20px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    text-align: left;
    font-family: inherit;
    color: inherit;
    animation: fade-up 0.5s ease backwards;
    position: relative;
    overflow: hidden;
  }
  .feat-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, var(--amber-glow) 0%, transparent 50%);
    opacity: 0;
    transition: opacity 0.3s;
  }
  .feat-card:hover {
    border-color: var(--border-accent);
    transform: translateY(-4px);
    box-shadow: 0 8px 40px rgba(0,0,0,0.3), 0 0 0 1px var(--border-accent);
  }
  .feat-card:hover::before { opacity: 1; }

  .fc-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    position: relative;
    z-index: 1;
  }
  .fc-tag {
    font-family: 'JetBrains Mono', monospace;
    font-size: 8px;
    letter-spacing: 2px;
    color: var(--amber);
    padding: 3px 8px;
    background: var(--amber-dim);
    border-radius: 2px;
  }
  .fc-arrow-icon {
    font-size: 16px;
    color: var(--text-tertiary);
    transition: all 0.3s;
  }
  .feat-card:hover .fc-arrow-icon {
    color: var(--amber);
    transform: translate(2px, -2px);
  }

  .fc-icon-wrap {
    margin-bottom: 16px;
    position: relative;
    z-index: 1;
  }
  .fc-icon {
    font-size: 28px;
    color: var(--text-tertiary);
    opacity: 0.5;
  }

  .fc-title {
    margin: 0 0 8px;
    font-family: 'Bebas Neue', sans-serif;
    font-size: 28px;
    letter-spacing: 3px;
    color: var(--text-primary);
    position: relative;
    z-index: 1;
  }
  .fc-desc {
    margin: 0 0 20px;
    font-size: 12px;
    line-height: 1.65;
    color: var(--text-secondary);
    position: relative;
    z-index: 1;
  }
  .fc-bottom {
    margin-top: auto;
    position: relative;
    z-index: 1;
  }
  .fc-go {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 2px;
    color: var(--text-tertiary);
    transition: color 0.2s;
  }
  .fc-go-arrow {
    display: inline-block;
    margin-left: 6px;
    transition: transform 0.2s;
  }
  .feat-card:hover .fc-go { color: var(--amber); }
  .feat-card:hover .fc-go-arrow { transform: translateX(4px); }

  /* ═══ ENGINE GRID ═══ */
  .engine-section {
    max-width: 1240px;
    margin: 0 auto;
    padding: 0 40px 64px;
    position: relative;
    z-index: 1;
  }
  .engine-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 8px;
  }
  .engine-cell {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 14px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-subtle);
    border-radius: 6px;
    transition: all 0.2s;
    animation: fade-up 0.4s ease backwards;
    position: relative;
    overflow: hidden;
  }
  .engine-cell:hover {
    border-color: var(--border-accent);
    background: rgba(251,191,36,0.02);
  }
  .ec-index {
    font-family: 'JetBrains Mono', monospace;
    font-size: 8px;
    font-weight: 800;
    color: var(--amber);
    letter-spacing: 0.5px;
    min-width: 24px;
  }
  .ec-body { flex: 1; min-width: 0; }
  .ec-name {
    display: block;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10.5px;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: 0.5px;
  }
  .ec-desc {
    display: block;
    font-size: 9px;
    color: var(--text-tertiary);
    line-height: 1.4;
    margin-top: 1px;
  }
  .ec-pulse {
    width: 4px; height: 4px;
    border-radius: 50%;
    background: var(--amber);
    opacity: 0;
    transition: opacity 0.2s;
  }
  .engine-cell:hover .ec-pulse { opacity: 1; }

  /* ═══ SOURCE TAGS ═══ */
  .sources-section {
    max-width: 1240px;
    margin: 0 auto;
    padding: 0 40px 72px;
    position: relative;
    z-index: 1;
  }
  .source-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .source-tag {
    padding: 8px 18px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-subtle);
    border-radius: 4px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 9.5px;
    letter-spacing: 1.5px;
    color: var(--text-secondary);
    animation: fade-up 0.4s ease backwards;
    transition: all 0.2s;
  }
  .source-tag:hover {
    border-color: var(--amber);
    color: var(--amber);
    background: var(--amber-glow);
  }

  /* ═══ FOOTER ═══ */
  .foot {
    border-top: 1px solid var(--border-subtle);
    background: var(--bg-surface);
    position: relative;
    z-index: 1;
  }
  .foot-inner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 1240px;
    margin: 0 auto;
    padding: 20px 40px;
  }
  .foot-brand {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    letter-spacing: 3px;
    color: var(--text-tertiary);
  }
  .foot-meta {
    font-family: 'JetBrains Mono', monospace;
    font-size: 8px;
    letter-spacing: 2px;
    color: var(--text-tertiary);
  }

  /* ═══ ANIMATIONS ═══ */
  @keyframes fade-up {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* ═══ RESPONSIVE ═══ */
  @media (max-width: 1024px) {
    .hero { flex-direction: column; padding: 48px 24px; gap: 40px; }
    .hero-right { flex: none; width: 100%; max-width: 480px; }
    .feat-grid { grid-template-columns: 1fr; }
    .engine-grid { grid-template-columns: repeat(3, 1fr); }
    .ribbon-inner { flex-wrap: wrap; justify-content: center; }
    .ribbon-stat { padding: 14px 24px; }
  }
  @media (max-width: 640px) {
    .hero { padding: 32px 16px; }
    .ht-line { font-size: 44px !important; }
    .engine-grid { grid-template-columns: repeat(2, 1fr); }
    .hero-actions { flex-direction: column; }
    .btn-primary, .btn-ghost { width: 100%; justify-content: center; }
    .ribbon-stat::after { display: none; }
    .foot-inner { flex-direction: column; gap: 8px; text-align: center; }
    .features, .engine-section, .sources-section { padding-left: 16px; padding-right: 16px; }
  }
</style>
