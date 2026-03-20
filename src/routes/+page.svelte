<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { gameState } from '$lib/stores/gameState';
  import { livePrices } from '$lib/stores/priceStore';
  import HomeBackground from '../components/home/HomeBackground.svelte';
  import {
    agentJourneyStore,
    JOURNEY_SHELL_OPTIONS,
    starterRoster,
    type AgentShellId,
  } from '$lib/stores/agentJourneyStore';
  import {
    buildBattleLink,
    buildCreateLink,
    buildTerminalLink,
  } from '$lib/utils/deepLinks';

  const gs = $derived($gameState);
  const prices = $derived($livePrices);
  const journey = $derived($agentJourneyStore);
  const pinnedCrew = $derived($starterRoster);

  const selectedToken = $derived(gs.pair.split('/')[0] || 'BTC');
  const selectedPrice = $derived(prices[selectedToken] || 0);
  const selectedPriceText = $derived(
    selectedPrice > 0
      ? '$' + Number(selectedPrice).toLocaleString('en-US', {
          minimumFractionDigits: selectedPrice >= 1000 ? 2 : 4,
          maximumFractionDigits: selectedPrice >= 1000 ? 2 : 4,
        })
      : 'Loading...'
  );

  let featuredIndex = $state(0);
  const featuredShell = $derived(JOURNEY_SHELL_OPTIONS[featuredIndex % JOURNEY_SHELL_OPTIONS.length]);
  const starterCount = $derived(pinnedCrew.length);

  function nav(href: string) {
    goto(href);
  }

  function openCreate() {
    goto(buildCreateLink());
  }

  function openTerminal() {
    goto(buildTerminalLink());
  }

  function toggleStarter(shellId: AgentShellId) {
    agentJourneyStore.toggleStarterRoster(shellId);
    const nextIndex = JOURNEY_SHELL_OPTIONS.findIndex((option) => option.id === shellId);
    if (nextIndex >= 0) {
      featuredIndex = nextIndex;
    }
  }

  onMount(() => {
    const timer = window.setInterval(() => {
      featuredIndex = (featuredIndex + 1) % JOURNEY_SHELL_OPTIONS.length;
    }, 1600);

    return () => window.clearInterval(timer);
  });
</script>

<svelte:head>
  <title>Cogochi — Train, Prove, Grow</title>
</svelte:head>

<HomeBackground />

<main class="home">
  <section class="hero-grid">
    <div class="hero-copy">
      <p class="eyebrow">Draft. Raise. Train. Prove. Rent.</p>
      <h1>Draft the crew. Raise the lead.</h1>
      <p class="subtitle">
        Pin three starters, choose the lead, train it in Terminal, and prove the build in Arena.
      </p>

      <div class="live-line" aria-label="Current market context">
        <span class="live-chip">{gs.pair}</span>
        <span class="live-chip">{selectedPriceText}</span>
        <span class="live-chip">{starterCount}/3 pinned</span>
      </div>

      <div class="cta-row">
        <button class="cta-primary" type="button" onclick={openCreate}>
          {journey.minted ? 'Continue Mission' : 'Start Mission'}
        </button>
        <button class="cta-secondary" type="button" onclick={openTerminal}>Resume Training</button>
        <button class="cta-tertiary" type="button" onclick={() => nav(buildBattleLink())}>Enter Arena</button>
      </div>
    </div>

    <aside class="companion-bay">
      <div class="bay-header">
        <div>
          <p class="bay-kicker">Starter roster</p>
          <h2>{featuredShell.label} // on rotation</h2>
        </div>
        <span class="bay-stage">{starterCount}/3 pinned</span>
      </div>

      <p class="bay-helper">
        Pin three starters here. The lead gets chosen in Create and trained in Terminal.
      </p>

      <div class="bay-visual">
        <img class="bay-portrait" src={featuredShell.sheet} alt={`${featuredShell.label} starter sprite`} />
        <div class="bay-visual-caption">
          <span>Rotating candidate</span>
          <strong>{featuredShell.title}</strong>
        </div>
      </div>

      <div class="roster-grid" aria-label="Starter roster selection">
        {#each JOURNEY_SHELL_OPTIONS as option}
          <button
            class="roster-card"
            class:selected={journey.starterRosterIds.includes(option.id)}
            type="button"
            onclick={() => toggleStarter(option.id)}
          >
            <img src={option.sheet} alt={option.label} />
            <span>{option.label}</span>
          </button>
        {/each}
      </div>

      <div class="pinned-row">
        <span class="pinned-label">Pinned crew</span>
        <div class="pinned-list">
          {#each pinnedCrew as crew}
            <span class="pinned-chip">{crew.label}</span>
          {/each}
        </div>
      </div>
    </aside>
  </section>
</main>

<style>
  .home {
    position: relative;
    z-index: 1;
    min-height: 100%;
    padding: 20px 16px 40px;
    display: flex;
    flex-direction: column;
    gap: var(--sc-sp-3);
    overflow: auto;
  }

  .hero-grid {
    display: grid;
    width: min(1016px, 100%);
    margin: 8px auto 0;
    min-height: calc(100dvh - var(--sc-header-h) - 56px);
    grid-template-columns: minmax(0, 1fr) minmax(300px, 360px);
    gap: clamp(16px, 2vw, 24px);
    align-items: start;
  }

  .companion-bay {
    border: 1px solid rgba(173, 202, 124, 0.18);
    background:
      linear-gradient(180deg, rgba(10, 16, 28, 0.92), rgba(8, 12, 20, 0.94)),
      radial-gradient(circle at top right, rgba(173, 202, 124, 0.12), transparent 38%),
      radial-gradient(circle at bottom left, rgba(242, 209, 147, 0.08), transparent 40%);
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(18px);
  }

  .hero-copy {
    position: relative;
    isolation: isolate;
    overflow: visible;
    max-width: 540px;
    padding: 4px 0;
    display: flex;
    flex-direction: column;
    gap: 14px;
    justify-content: center;
  }

  .hero-copy::before {
    content: '';
    position: absolute;
    inset: -32px -56px -48px -28px;
    z-index: -1;
    background:
      radial-gradient(circle at 4% 18%, rgba(173, 202, 124, 0.22), transparent 28%),
      radial-gradient(circle at 36% 80%, rgba(242, 209, 147, 0.12), transparent 24%),
      linear-gradient(120deg, rgba(173, 202, 124, 0.05), transparent 46%);
    filter: blur(12px);
    pointer-events: none;
  }

  .hero-copy::after {
    content: none;
  }

  .eyebrow {
    margin: 0;
    font-family: var(--sc-font-mono);
    font-size: 13px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--sc-accent-2);
  }

  h1 {
    margin: 0;
    font-family: var(--sc-font-display);
    font-size: clamp(1.82rem, 3.1vw, 3rem);
    line-height: 0.96;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: var(--sc-text-0);
    max-width: 9ch;
    text-shadow:
      0 3px 0 rgba(0, 0, 0, 0.34),
      0 0 18px rgba(173, 202, 124, 0.14);
  }

  .subtitle {
    margin: 0;
    max-width: 32ch;
    font-family: var(--sc-font-body);
    font-size: clamp(0.95rem, 1vw, 1.04rem);
    line-height: 1.5;
    color: var(--sc-text-1);
    letter-spacing: 0.01em;
  }

  .live-line,
  .cta-row {
    display: grid;
    gap: var(--sc-sp-2);
  }

  .live-line {
    grid-template-columns: repeat(auto-fit, minmax(118px, max-content));
  }

  .live-chip,
  .bay-stage {
    font-family: var(--sc-font-mono);
    font-size: var(--sc-fs-xs);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .live-chip {
    min-height: 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 12px;
    border-radius: 999px;
    border: 1px solid rgba(173, 202, 124, 0.14);
    background:
      linear-gradient(180deg, rgba(14, 22, 33, 0.92), rgba(10, 16, 24, 0.92));
    color: #f3f1e7;
    box-shadow: inset 0 0 0 1px rgba(173, 202, 124, 0.05);
  }

  .cta-row {
    grid-template-columns: repeat(3, minmax(0, max-content));
    align-items: center;
    width: fit-content;
  }

  .cta-primary,
  .cta-secondary,
  .cta-tertiary {
    transition:
      transform var(--sc-duration-fast) var(--sc-ease),
      border-color var(--sc-duration-fast) var(--sc-ease),
      background var(--sc-duration-fast) var(--sc-ease),
      box-shadow var(--sc-duration-fast) var(--sc-ease);
  }

  .cta-primary,
  .cta-secondary,
  .cta-tertiary {
    min-height: 44px;
    padding: 0 14px;
    border-radius: 14px;
    cursor: pointer;
    white-space: nowrap;
    font-family: var(--sc-font-body);
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.01em;
  }

  .cta-primary {
    border: 1px solid rgba(173, 202, 124, 0.34);
    background:
      linear-gradient(135deg, #adca7c, #f2d193 42%, #f7f2ea 100%);
    color: #0f1520;
    box-shadow:
      0 10px 18px rgba(0, 0, 0, 0.22),
      0 0 24px rgba(173, 202, 124, 0.14);
  }

  .cta-secondary {
    border: 1px solid rgba(173, 202, 124, 0.16);
    background:
      linear-gradient(180deg, rgba(13, 21, 31, 0.86), rgba(9, 15, 23, 0.88));
    color: var(--sc-text-0);
  }

  .cta-tertiary {
    border: none;
    background: transparent;
    color: var(--sc-text-1);
    padding-inline: 0;
    min-height: auto;
    justify-self: start;
  }

  .cta-primary:hover,
  .cta-secondary:hover,
  .cta-tertiary:hover {
    transform: translateY(-2px);
    border-color: rgba(173, 202, 124, 0.3);
    box-shadow: 0 0 18px rgba(173, 202, 124, 0.12);
  }

  .cta-tertiary:hover {
    border-color: transparent;
    box-shadow: none;
    color: var(--sc-text-0);
  }

  .companion-bay {
    width: 100%;
    max-width: 360px;
    justify-self: end;
    align-self: center;
    border-radius: 22px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 9px;
    position: relative;
    overflow: hidden;
  }

  .companion-bay::before {
    content: '';
    position: absolute;
    inset: 12px;
    border-radius: 20px;
    border: 1px solid rgba(173, 202, 124, 0.08);
    pointer-events: none;
  }

  .bay-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--sc-sp-3);
  }

  .bay-kicker {
    margin: 0 0 6px;
    font-family: var(--sc-font-mono);
    font-size: 12px;
    color: var(--sc-text-3);
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .bay-header h2 {
    margin: 0;
    font-family: var(--sc-font-display);
    color: var(--sc-text-0);
    letter-spacing: 0.04em;
    text-shadow: 0 0 14px rgba(173, 202, 124, 0.08);
  }

  .bay-header h2 {
    font-size: clamp(1.14rem, 1.4vw, 1.44rem);
  }

  .bay-stage {
    padding: 4px 9px;
    border-radius: 999px;
    background: rgba(173, 202, 124, 0.08);
    color: #edf4df;
    border: 1px solid rgba(173, 202, 124, 0.16);
  }

  .bay-helper {
    margin: 0;
    font-family: var(--sc-font-body);
    font-size: 0.9rem;
    line-height: 1.45;
    color: var(--sc-text-1);
    max-width: 27ch;
  }

  .bay-visual {
    position: relative;
    min-height: 126px;
    border-radius: 18px;
    overflow: hidden;
    background:
      linear-gradient(180deg, rgba(14, 21, 33, 0.9), rgba(8, 14, 22, 0.97)),
      radial-gradient(circle at 20% 20%, rgba(173, 202, 124, 0.1), transparent 38%),
      radial-gradient(circle at 80% 14%, rgba(242, 209, 147, 0.08), transparent 32%);
    border: 1px solid rgba(173, 202, 124, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px 10px 28px;
  }

  .bay-visual::before {
    content: '';
    position: absolute;
    inset: auto 50% 26px auto;
    width: 160px;
    height: 160px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(173, 202, 124, 0.16), rgba(242, 209, 147, 0.08), transparent 68%);
    transform: translateX(50%);
    filter: blur(10px);
  }

  .bay-portrait {
    width: min(100%, 108px);
    image-rendering: pixelated;
    filter: drop-shadow(0 20px 32px rgba(0, 0, 0, 0.42));
    position: relative;
    z-index: 1;
  }

  .bay-visual-caption {
    position: absolute;
    left: 14px;
    right: 14px;
    bottom: 10px;
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 10px;
    z-index: 1;
  }

  .bay-visual-caption span,
  .bay-visual-caption strong {
    text-transform: uppercase;
  }

  .bay-visual-caption span {
    color: var(--sc-text-3);
    font-family: var(--sc-font-mono);
    font-size: var(--sc-fs-xs);
    letter-spacing: 0.08em;
  }

  .bay-visual-caption strong {
    color: #fff1d8;
    font-family: var(--sc-font-body);
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.02em;
    text-align: right;
  }

  .roster-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 6px;
  }

  .roster-card {
    border-radius: 16px;
    border: 1px solid rgba(173, 202, 124, 0.1);
    background: rgba(12, 19, 28, 0.74);
    min-height: 68px;
    padding: 7px 6px;
    display: grid;
    place-items: center;
    gap: 6px;
    cursor: pointer;
    transition:
      transform var(--sc-duration-fast) var(--sc-ease),
      border-color var(--sc-duration-fast) var(--sc-ease),
      background var(--sc-duration-fast) var(--sc-ease);
  }

  .roster-card:hover {
    transform: translateY(-2px);
    border-color: rgba(173, 202, 124, 0.24);
    background: rgba(14, 23, 34, 0.92);
  }

  .roster-card.selected {
    border-color: rgba(173, 202, 124, 0.3);
    background:
      linear-gradient(180deg, rgba(173, 202, 124, 0.14), rgba(12, 19, 28, 0.86));
    box-shadow: inset 0 0 0 1px rgba(173, 202, 124, 0.08);
  }

  .roster-card img {
    width: 26px;
    height: 26px;
    object-fit: contain;
    image-rendering: pixelated;
    filter: drop-shadow(0 10px 18px rgba(0, 0, 0, 0.34));
  }

  .roster-card span {
    font-family: var(--sc-font-body);
    font-size: 10.5px;
    font-weight: 600;
    line-height: 1.3;
    letter-spacing: 0.01em;
    text-transform: uppercase;
    color: var(--sc-text-1);
    text-align: center;
  }

  .pinned-row {
    display: grid;
    gap: 6px;
  }

  .pinned-label {
    font-family: var(--sc-font-mono);
    font-size: 12px;
    color: var(--sc-text-3);
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .pinned-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .pinned-chip {
    min-height: 26px;
    padding: 0 8px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    border: 1px solid rgba(173, 202, 124, 0.14);
    background: rgba(9, 15, 23, 0.82);
    color: #edf4df;
    font-family: var(--sc-font-mono);
    font-size: 11px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  @media (max-width: 1100px) {
    .hero-grid {
      width: 100%;
      min-height: auto;
      margin-top: 0;
      grid-template-columns: 1fr;
      align-items: start;
    }

    h1 {
      max-width: 9ch;
    }

    .hero-copy {
      max-width: none;
      padding-inline: 0;
    }

    .companion-bay {
      max-width: none;
      justify-self: stretch;
    }
  }

  @media (max-width: 768px) {
    .home {
      padding: 16px 12px 32px;
    }

    .hero-copy::before {
      inset: -24px -20px -28px -16px;
    }

    .hero-copy,
    .companion-bay {
      padding: var(--sc-sp-3);
      border-radius: 22px;
    }

    h1 {
      font-size: clamp(2.1rem, 9vw, 3rem);
      max-width: none;
    }

    .cta-row {
      grid-template-columns: 1fr;
    }

    .bay-header,
    .pinned-row {
      grid-template-columns: 1fr;
      display: grid;
    }

    .roster-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .bay-visual-caption {
      flex-direction: column;
      align-items: flex-start;
    }

  }
</style>
