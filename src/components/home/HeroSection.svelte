<!--
  HeroSection.svelte
  Full-viewport hero with staggered entrance animation,
  3D model-viewer, and scroll indicator.
-->
<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    mouseX?: number;
    mouseY?: number;
    scrollProgress?: number;
  }

  const { mouseX = 50, mouseY = 50, scrollProgress = 0 }: Props = $props();

  const mx = $derived((mouseX - 50) / 50);
  const my = $derived((mouseY - 50) / 50);
  const cameraOrbit = $derived(
    `${(mx * 25 + scrollProgress * 20).toFixed(1)}deg ${(75 + my * 15).toFixed(1)}deg 1.8m`
  );

  let mounted = $state(false);

  onMount(() => {
    // Stagger entrance — small delay so DOM paints first
    requestAnimationFrame(() => { mounted = true; });
  });
</script>

<section class="hero">
  <!-- 3D model background -->
  <div
    class="model-shell"
    aria-hidden="true"
    style:transform={`translate(-50%, -50%) translate3d(${mx * 20}px, ${my * 14}px, 0)`}
  >
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

  <!-- Hero content -->
  <div class="hero-content">
    <h1 class="hero-h1" class:visible={mounted}>
      <span class="dim">Turn Judgment</span>{' '}
      <span>Into Proof</span>
    </h1>
    <p class="hero-sub" class:visible={mounted}>
      Cogotchi turns market judgment into a living agent you can refine, revisit, and prove.
    </p>
  </div>

  <!-- Scroll indicator -->
  <div class="scroll-hint" class:visible={mounted} aria-hidden="true">
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 4v12m0 0l-4-4m4 4l4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </div>
</section>

<style>
  .hero {
    position: relative;
    z-index: 2;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0 clamp(24px, 5vw, 80px);
    overflow: hidden;
  }

  /* 3D Model */
  .model-shell {
    position: absolute;
    left: 50%;
    top: 48%;
    width: min(48vw, 36rem);
    height: min(48vw, 36rem);
    z-index: 0;
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.22;
    will-change: transform;
    transition: transform 400ms cubic-bezier(0.22, 0.61, 0.36, 1);
    overflow: visible;
  }

  .model-el {
    width: 100%;
    height: 100%;
    background: transparent !important;
    border: 0;
    outline: 0;
    box-shadow: none;
    --poster-color: transparent;
    animation: model-breathe 7s ease-in-out infinite;
  }

  @keyframes model-breathe {
    0%, 100% { translate: 0 0; }
    40% { translate: 2px -5px; }
    70% { translate: -1px -3px; }
  }

  /* Hero text */
  .hero-content {
    position: relative;
    z-index: 1;
    text-align: center;
    max-width: 700px;
  }

  .hero-h1 {
    font-size: clamp(3rem, 7vw, 5.5rem);
    font-weight: 700;
    line-height: 1.05;
    letter-spacing: -0.02em;
    color: rgba(247, 242, 234, 0.95);
    margin: 0;
    opacity: 0;
    transform: translateY(50px);
    transition: opacity 1s cubic-bezier(0.16, 1, 0.3, 1) 0.2s,
                transform 1s cubic-bezier(0.16, 1, 0.3, 1) 0.2s;
  }

  .hero-h1.visible {
    opacity: 1;
    transform: translateY(0);
  }

  .dim {
    color: rgba(247, 242, 234, 0.5);
  }

  .hero-sub {
    font-size: clamp(1rem, 1.8vw, 1.25rem);
    font-weight: 400;
    line-height: 1.6;
    color: rgba(247, 242, 234, 0.45);
    margin: clamp(16px, 2vh, 32px) auto 0;
    max-width: 520px;
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.5s,
                transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.5s;
  }

  .hero-sub.visible {
    opacity: 1;
    transform: translateY(0);
  }

  /* Scroll hint */
  .scroll-hint {
    position: absolute;
    bottom: clamp(24px, 4vh, 48px);
    color: rgba(247, 242, 234, 0.3);
    animation: scroll-pulse 2.5s ease-in-out infinite;
    opacity: 0;
    transition: opacity 0.6s ease 1.4s;
  }

  .scroll-hint.visible {
    opacity: 1;
  }

  @keyframes scroll-pulse {
    0%, 100% { transform: translateY(0); opacity: 0.3; }
    50% { transform: translateY(8px); opacity: 0.7; }
  }

  /* Responsive */
  @media (max-width: 1024px) {
    .model-shell {
      width: min(55vw, 32rem);
      height: min(55vw, 32rem);
      opacity: 0.18;
    }
  }

  @media (max-width: 768px) {
    .model-shell {
      display: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .hero-h1, .hero-sub {
      opacity: 1;
      transform: none;
      transition: none;
    }
    .scroll-hint {
      animation: none;
      opacity: 0.3;
    }
  }
</style>
