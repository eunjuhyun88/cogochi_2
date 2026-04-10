<script lang="ts">
  import { onMount } from 'svelte';
  import WebGLAsciiBackground from '../components/home/WebGLAsciiBackground.svelte';
  import WaitlistSection from '../components/home/WaitlistSection.svelte';

  // Chart tool cards — arranged in orbital rings around center
  const orbitCards = [
    // Inner ring
    { src: '/cogochi/chart-tools/scanner-grid.svg', title: 'Scanner', angle: 20, dist: 300, size: 100 },
    { src: '/cogochi/chart-tools/breakout-arrow.svg', title: 'Breakout', angle: 80, dist: 315, size: 84 },
    { src: '/cogochi/chart-tools/trend-map.svg', title: 'Trend Map', angle: 140, dist: 290, size: 96 },
    { src: '/cogochi/chart-tools/vwap-band.svg', title: 'VWAP', angle: 200, dist: 310, size: 88 },
    { src: '/cogochi/chart-tools/risk-ratio.svg', title: 'Risk', angle: 260, dist: 300, size: 80 },
    { src: '/cogochi/chart-tools/support-zones.svg', title: 'Zones', angle: 320, dist: 312, size: 84 },
    // Outer ring
    { src: '/cogochi/chart-tools/volume-feed.svg', title: 'Volume', angle: 50, dist: 410, size: 84 },
    { src: '/cogochi/chart-tools/orderbook-ladder.svg', title: 'Orderbook', angle: 110, dist: 425, size: 80 },
    { src: '/cogochi/chart-tools/liquidity-heatmap.svg', title: 'Heatmap', angle: 170, dist: 420, size: 76 },
    { src: '/cogochi/chart-tools/divergence-oscillator.svg', title: 'Divergence', angle: 230, dist: 415, size: 76 },
    { src: '/cogochi/chart-tools/momentum-stack.svg', title: 'Momentum', angle: 290, dist: 425, size: 88 },
    { src: '/cogochi/chart-tools/session-clock.svg', title: 'Session', angle: 350, dist: 410, size: 74 },
    { src: '/cogochi/chart-tools/sweep-marker.svg', title: 'Sweep', angle: 0, dist: 435, size: 78 },
    { src: '/cogochi/chart-tools/alert-tag.svg', title: 'Alert', angle: 180, dist: 435, size: 68 },
  ];

  let mouseX = $state(50);
  let mouseY = $state(50);

  const mx = $derived((mouseX - 50) / 50);
  const my = $derived((mouseY - 50) / 50);
  const cameraOrbit = $derived(
    `${(mx * 25).toFixed(1)}deg ${(75 + my * 15).toFixed(1)}deg 1.8m`
  );

  function clamp01(v: number) { return Math.min(1, Math.max(0, v)); }

  let lastInputTime = 0;
  let driftRaf = 0;

  function setCursor(clientX: number, clientY: number) {
    if (typeof window === 'undefined') return;
    mouseX = Math.round(clamp01(clientX / window.innerWidth) * 100);
    mouseY = Math.round(clamp01(clientY / window.innerHeight) * 100);
    lastInputTime = performance.now();
  }

  function onPointer(e: PointerEvent) { setCursor(e.clientX, e.clientY); }
  function onTouch(e: TouchEvent) {
    const t = e.touches[0];
    if (t) setCursor(t.clientX, t.clientY);
  }

  // Idle auto-drift so the effect lives without input (esp. mobile)
  function driftLoop(time: number) {
    if (time - lastInputTime > 1500) {
      const t = time * 0.0004;
      mouseX = Math.round(50 + Math.sin(t) * 28 + Math.sin(t * 2.3) * 6);
      mouseY = Math.round(50 + Math.cos(t * 0.8) * 18 + Math.cos(t * 1.7) * 5);
    }
    driftRaf = requestAnimationFrame(driftLoop);
  }

  onMount(() => {
    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('touchmove', onTouch, { passive: true });
    window.addEventListener('touchstart', onTouch, { passive: true });
    driftRaf = requestAnimationFrame(driftLoop);
    return () => {
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('touchstart', onTouch);
      cancelAnimationFrame(driftRaf);
    };
  });
</script>

<svelte:head>
  <title>Cogotchi — Market Judgment That Leaves a Trace</title>
  <meta name="description" content="Cogotchi turns market judgment into a living agent you can refine, revisit, and prove." />
  <meta property="og:title" content="Cogotchi — Market Judgment That Leaves a Trace" />
  <meta property="og:description" content="Cogotchi turns market judgment into a living agent you can refine, revisit, and prove." />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="canonical" href="/" />
  <script type="module" src="https://unpkg.com/@google/model-viewer@4.0.0/dist/model-viewer.min.js"></script>
</svelte:head>

<WebGLAsciiBackground {mouseX} {mouseY} />

<div class="page">
  <div class="hero">
    <!-- 3D model background -->
    <div class="model-shell" aria-hidden="true" style:transform={`translate(-50%, -50%) translate3d(${mx * 16}px, ${my * 10}px, 0)`}>
      <model-viewer
        src="/cogochi/logo.glb"
        class="model-el"
        alt=""
        camera-orbit={cameraOrbit}
        min-camera-orbit="auto auto 0.5m"
        field-of-view="30deg"
        interaction-prompt="none"
        shadow-intensity="0"
        environment-image="neutral"
        loading="eager"
        interpolation-decay="120"
      ></model-viewer>
    </div>

    <!-- Orbital chart cards -->
    <div class="orbit-layer" aria-hidden="true">
      {#each orbitCards as card, i}
        {@const rad = (card.angle * Math.PI) / 180}
        {@const baseX = Math.cos(rad) * card.dist}
        {@const baseY = Math.sin(rad) * card.dist}
        {@const parallax = card.dist / 400}
        {@const px = mx * 12 * parallax}
        {@const py = my * 8 * parallax}
        <div
          class="orbit-card"
          style:--x={`${baseX}px`}
          style:--y={`${baseY}px`}
          style:--size={`${card.size}px`}
          style:--delay={`${-(i * 0.9)}s`}
          style:transform={`translate(calc(var(--x) + ${px.toFixed(1)}px - 50%), calc(var(--y) + ${py.toFixed(1)}px - 50%))`}
        >
          <img src={card.src} alt={card.title} class="orbit-img" loading="lazy" />
        </div>
      {/each}
    </div>

    <!-- Center: Waitlist card (the star) -->
    <div class="center-card" style:transform={`perspective(800px) rotateY(${mx * -1.5}deg) rotateX(${my * 1.5}deg)`}>
      <WaitlistSection />
    </div>

    <!-- Side feature labels (subtle, not competing) -->
    <div class="side-label left-top">
      <strong>Turn Judgment Into Proof</strong>
      <span>Your trading edge, remembered.</span>
    </div>
    <div class="side-label left-bottom">
      <strong>Capture Every Signal</strong>
      <span>Before the moment evaporates.</span>
    </div>
    <div class="side-label right-top">
      <strong>Build Memory</strong>
      <span>Patterns that make your edge repeatable.</span>
    </div>
    <div class="side-label right-bottom">
      <strong>Prove The Edge</strong>
      <span>Claims that hold up.</span>
    </div>
  </div>
</div>

<style>
  :global(html) { -webkit-text-size-adjust: 100%; height: 100%; }
  :global(body) { margin: 0; min-height: 100%; background: #000; color: #f7f2ea; font-family: Instrumentsans, 'Space Grotesk', Arial, sans-serif; }

  .page { position: relative; z-index: 1; }

  .hero {
    position: relative;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  /* ── 3D model ── */
  .model-shell {
    position: absolute;
    left: 50%; top: 48%;
    width: min(48vw, 36rem);
    height: min(48vw, 36rem);
    z-index: 0;
    pointer-events: none;
    opacity: 0.35;
    will-change: transform;
    transition: transform 400ms cubic-bezier(0.22, 0.61, 0.36, 1);
    overflow: visible;
  }

  .model-el {
    width: 100%; height: 100%;
    background: transparent !important;
    border: 0; outline: 0; box-shadow: none;
    --poster-color: transparent;
    animation: breathe 7s ease-in-out infinite;
  }

  @keyframes breathe {
    0%, 100% { translate: 0 0; }
    40% { translate: 2px -5px; }
    70% { translate: -1px -3px; }
  }

  /* ── Orbital chart cards ── */
  .orbit-layer {
    position: absolute;
    left: 50%;
    top: 50%;
    z-index: 1;
    pointer-events: none;
    width: 0;
    height: 0;
  }

  .orbit-card {
    position: absolute;
    left: 0; top: 0;
    width: var(--size);
    height: var(--size);
    opacity: 0.9;
    filter: drop-shadow(0 12px 28px rgba(0, 0, 0, 0.6));
    animation: orbit-float 10s ease-in-out infinite;
    animation-delay: var(--delay);
    will-change: transform;
    transition: transform 500ms ease-out, opacity 0.3s ease;
  }

  .orbit-card:hover {
    opacity: 1;
  }

  .orbit-img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
  }

  @keyframes orbit-float {
    0%, 100% { translate: 0 0; }
    25% { translate: 3px -5px; }
    50% { translate: -2px -3px; }
    75% { translate: 1px -6px; }
  }

  /* ── Center waitlist card ── */
  .center-card {
    position: relative;
    z-index: 3;
    will-change: transform;
    transition: transform 500ms cubic-bezier(0.25, 0.1, 0.25, 1);
  }

  /* ── Side feature labels (subtle) ── */
  .side-label {
    position: absolute;
    z-index: 2;
    max-width: 300px;
    pointer-events: none;
  }

  .side-label strong {
    display: block;
    font-size: clamp(1.8rem, 3.2vw, 2.8rem);
    font-weight: 800;
    letter-spacing: -0.02em;
    color: rgba(247, 242, 234, 0.92);
    margin-bottom: 8px;
    line-height: 1.08;
  }

  .side-label span {
    display: block;
    font-size: clamp(0.88rem, 1.4vw, 1.05rem);
    color: rgba(247, 242, 234, 0.42);
    line-height: 1.5;
  }

  .left-top { left: clamp(20px, 4vw, 60px); top: 22%; }
  .left-bottom { left: clamp(20px, 4vw, 60px); bottom: 18%; }
  .right-top { right: clamp(20px, 4vw, 60px); top: 22%; text-align: right; }
  .right-bottom { right: clamp(20px, 4vw, 60px); bottom: 18%; text-align: right; }

  /* ── Responsive ── */
  @media (max-width: 1024px) {
    .orbit-card { opacity: 0.55; }
    .model-shell { opacity: 0.1; }
    .side-label strong { font-size: 1.1rem; }
    .side-label { max-width: 180px; }
  }

  @media (max-width: 768px) {
    .orbit-layer { display: none; }
    .model-shell { display: none; }
    .hero {
      flex-direction: column;
      padding: 5rem 20px 3rem;
      gap: 2rem;
    }
    .side-label {
      position: static;
      max-width: 100%;
      text-align: center;
    }
    .side-label strong { font-size: 1.4rem; }
    .side-label span { font-size: 0.85rem; }
    .left-top, .left-bottom, .right-top, .right-bottom {
      left: auto; right: auto; top: auto; bottom: auto;
      text-align: center;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .orbit-card { animation: none; }
    .model-el { animation: none; }
  }
</style>
