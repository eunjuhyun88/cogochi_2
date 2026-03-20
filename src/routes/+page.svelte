<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import type { OwnedAgent } from '$lib/aimon/types';
  import { aimonDexById } from '$lib/aimon/data/aimonDex';
  import { getDefaultGrowthLaneId, growthLaneById } from '$lib/aimon/data/growthLanes';
  import { setScreen } from '$lib/aimon/stores/gameStore';
  import { labStore } from '$lib/aimon/stores/labStore';
  import { matchStore } from '$lib/aimon/stores/matchStore';
  import { rosterStore } from '$lib/aimon/stores/rosterStore';
  import { clearActiveSquad, squadStore, toggleSquadAgent } from '$lib/aimon/stores/squadStore';
  import MaxidogeBackground from '../components/shared/MaxidogeBackground.svelte';

  const POOL_ART = [
    '/blockparty/f5-doge-chart.png',
    '/blockparty/f5-doge-muscle.png',
    '/blockparty/f5-doge-fire.png',
    '/blockparty/f5-doge-excited.png',
    '/blockparty/f5-doge-bull.png'
  ] as const;

  let lab = $derived($labStore);
  let matches = $derived($matchStore);
  let roster = $derived($rosterStore);
  let squad = $derived($squadStore);
  let rotationTick = 0;
  let rotationTimer: ReturnType<typeof setInterval> | undefined;

  let rosterAgents = $derived(
    [...roster.agents].sort((left, right) => {
      const rightScore = right.level * 10 + right.bond + right.record.matches;
      const leftScore = left.level * 10 + left.bond + left.record.matches;
      return rightScore - leftScore;
    })
  );
  let squadAgentIds = $derived(squad.activeSquad.memberAgentIds);
  let squadAgents = $derived(
    squadAgentIds
      .map((id) => rosterAgents.find((agent) => agent.id === id))
      .filter((agent): agent is OwnedAgent => Boolean(agent))
  );
  let featuredAgent = $derived(squadAgents[0] ?? rosterAgents[0] ?? null);
  let candidateWall = $derived(
    rosterAgents.length === 0
      ? []
      : Array.from({ length: Math.min(6, rosterAgents.length) }, (_, index) => rosterAgents[(rotationTick + index) % rosterAgents.length])
  );
  let latestResult = $derived(matches.recentResults[0] ?? null);
  let selectedCount = $derived(squadAgents.length);
  let draftReady = $derived(selectedCount >= 3);
  let queuedRunCount = $derived(lab.trainingRuns.length);
  let modelVaultCount = $derived(lab.modelArtifacts.length + lab.promptVariants.length);
  let benchmarkCount = $derived(matches.recentBenchmarkRuns.length);
  let liveChips = $derived([
    `${rosterAgents.length} CANDIDATES`,
    `${selectedCount}/4 ACTIVE`,
    `${queuedRunCount} LAB RUNS`,
    latestResult ? `${latestResult.outcome} PROOF` : 'PROOF PENDING'
  ]);

  onMount(() => {
    setScreen('hub');
    rotationTimer = setInterval(() => {
      rotationTick = (rotationTick + 1) % Math.max(1, rosterAgents.length);
    }, 2200);
  });

  onDestroy(() => {
    if (rotationTimer) clearInterval(rotationTimer);
  });

  function laneFor(agent: OwnedAgent) {
    return growthLaneById[agent.loadout.growthLaneId ?? getDefaultGrowthLaneId(agent.speciesId)];
  }

  function poolArt(index: number): string {
    return POOL_ART[index % POOL_ART.length];
  }
</script>

<svelte:head>
  <title>MAXIDOGE Deck</title>
</svelte:head>

<MaxidogeBackground />

<div class="page">
  <section class="hero-grid">
    <div class="hero-copy">
      <p class="eyebrow">MAXIDOGE / SIGNAL OPS</p>
      <h1>후보를 집고, 팩을 잠그고, 랩에서 키운다.</h1>
      <p class="subtitle">
        이 홈은 command deck입니다. 오른쪽에서 후보를 집고, 현재 pack을 잠근 뒤, 곧바로 Setup과 Lab으로 넘깁니다.
      </p>

      <div class="live-line">
        {#each liveChips as chip (chip)}
          <span class="live-chip">{chip}</span>
        {/each}
      </div>

      <div class="cta-row">
        <a class:disabled={!draftReady} class="cta-primary" href="/team">OPEN TEAM SETUP</a>
        <a class:disabled={!draftReady} class="cta-secondary" href="/lab">RUN TRAINING LAB</a>
        <a class:disabled={!draftReady} class="cta-tertiary" href="/battle">ENTER BATTLE</a>
      </div>

      <div class="flow-strip">
        <div class:complete={selectedCount > 0} class="flow-step">
          <span class="flow-index">01</span>
          <strong>CATCH</strong>
          <small>후보를 집는다.</small>
        </div>
        <div class:complete={draftReady} class="flow-step">
          <span class="flow-index">02</span>
          <strong>DRAFT</strong>
          <small>lane을 잠근다.</small>
        </div>
        <div class:complete={queuedRunCount > 0} class="flow-step">
          <span class="flow-index">03</span>
          <strong>TRAIN</strong>
          <small>Lab을 돌린다.</small>
        </div>
        <div class:complete={Boolean(latestResult)} class="flow-step">
          <span class="flow-index">04</span>
          <strong>PROVE</strong>
          <small>proof를 쌓는다.</small>
        </div>
      </div>

    </div>

    <aside class="pool-bay">
      <div class="bay-header">
        <div>
          <p class="bay-kicker">ROTATING POOL / RIGHT WALL</p>
          <h2>{featuredAgent ? `${featuredAgent.name} // ACTIVE PACK LEAD` : 'NO LEAD // PICK FIRST'}</h2>
        </div>
        <span class="bay-stage">{draftReady ? 'TEAM READY' : 'PICK 3+'}</span>
      </div>

      <div class="bay-meta">
        <span class="bay-meta-pill">RIGHT WALL</span>
        <span class="bay-meta-pill">{selectedCount}/4 ACTIVE</span>
        <span class="bay-meta-pill">{benchmarkCount} BENCH</span>
        <span class="bay-meta-pill">{modelVaultCount} SAVED</span>
      </div>

      <div class="bay-visual">
        <img class="bay-banner" src="/blockparty/banner-main.png" alt="Maxidoge banner" />
        <div class="bay-visual-caption">
          <span>{featuredAgent ? featuredAgent.role : 'WAITING FOR DRAFT'}</span>
          <strong>{featuredAgent ? laneFor(featuredAgent).label : 'Pick candidates from the wall'}</strong>
        </div>
      </div>

      <div class="pool-grid">
        {#each candidateWall as agent, index (agent.id)}
          {@const entry = aimonDexById[agent.speciesId]}
          {@const lane = laneFor(agent)}
          {#if entry}
            <button
              class:selected={squadAgentIds.includes(agent.id)}
              class="pool-card"
              type="button"
              onclick={() => toggleSquadAgent(agent.id)}
            >
              <div class="pool-art">
                <img src={poolArt(index)} alt={agent.name} />
              </div>
              <div class="pool-head">
                <span>{entry.dexNo}</span>
                {#if squadAgentIds.includes(agent.id)}
                  <strong>IN PACK</strong>
                {/if}
              </div>
              <div class="pool-copy">
                <strong>{agent.name}</strong>
                <small>{agent.role} / {lane.shortLabel}</small>
                <p>{agent.loadout.readout}</p>
              </div>
            </button>
          {/if}
        {/each}
      </div>
    </aside>
  </section>

  <section class="pack-board">
      <div class="section-head">
        <div>
          <p class="eyebrow">CURRENT PACK</p>
          <h3>지금 데려갈 팩</h3>
        </div>
        {#if selectedCount > 0}
          <button class="ghost-button" type="button" onclick={() => clearActiveSquad()}>RESET PACK</button>
        {/if}
      </div>

      {#if squadAgents.length > 0}
        <div class="pack-grid">
          {#each squadAgents as agent, index (agent.id)}
            {@const entry = aimonDexById[agent.speciesId]}
            {@const lane = laneFor(agent)}
            {#if entry}
              <article class="pack-card" style={`--agent-color:${entry.color};`}>
                <div class="pack-art">
                  <img src={poolArt(index)} alt={agent.name} />
                </div>
                <div class="pack-copy">
                  <span>{entry.dexNo} / {agent.role}</span>
                  <strong>{agent.name}</strong>
                  <small>{lane.label} · {agent.loadout.focusSkill}</small>
                </div>
              </article>
            {/if}
          {/each}
        </div>
      {:else}
        <div class="empty-pack">
          <strong>아직 pack이 비어 있습니다.</strong>
          <p>오른쪽 rotating pool에서 마음에 드는 후보를 집으면 여기에 고정됩니다.</p>
        </div>
      {/if}
      <div class="pack-actions">
        <a class:disabled={!draftReady} class="cta-secondary" href="/team">LOCK TEAM</a>
        <a class:disabled={!draftReady} class="cta-secondary" href="/lab">OPEN LAB</a>
        <a class:disabled={!draftReady} class="cta-secondary" href="/battle">RUN PROOF</a>
      </div>
  </section>
</div>

<style>
  .page {
    position: relative;
    z-index: 1;
    display: grid;
    gap: 18px;
    padding: 14px 0 28px;
  }

  .hero-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(380px, 440px);
    gap: clamp(24px, 3vw, 38px);
    align-items: start;
  }

  .hero-copy {
    position: relative;
    display: grid;
    gap: 12px;
    max-width: 700px;
    padding: 4px 0 0;
  }

  .hero-copy::before {
    content: '';
    position: absolute;
    inset: -34px -56px -54px -28px;
    z-index: -1;
    background:
      radial-gradient(circle at 4% 18%, rgba(173, 202, 124, 0.22), transparent 28%),
      radial-gradient(circle at 36% 80%, rgba(242, 209, 147, 0.12), transparent 24%),
      linear-gradient(120deg, rgba(173, 202, 124, 0.05), transparent 46%);
    filter: blur(12px);
    pointer-events: none;
  }

  .eyebrow,
  .bay-kicker,
  .bay-stage,
  .live-chip,
  .flow-index,
  .flow-step small,
  .bay-meta-pill,
  .pool-head span,
  .pool-head strong,
  .pool-copy small,
  .pack-copy span,
  .pack-copy small {
    margin: 0;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #adc67c;
  }

  h1,
  h2,
  h3 {
    margin: 0;
    font-family: 'Orbitron', sans-serif;
    color: var(--text-0);
  }

  h1 {
    max-width: 10ch;
    font-size: clamp(50px, 7vw, 92px);
    line-height: 0.92;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    text-shadow:
      0 3px 0 rgba(0, 0, 0, 0.34),
      0 0 18px rgba(173, 202, 124, 0.14);
  }

  h2 {
    font-size: clamp(26px, 2.1vw, 34px);
    line-height: 1;
  }

  h3 {
    font-size: 28px;
  }

  .subtitle,
  .flow-step strong,
  .pool-copy p,
  .empty-pack p {
    margin: 0;
    line-height: 1.5;
  }

  .subtitle {
    max-width: 47ch;
    color: #d6dce0;
    font-size: clamp(16px, 1.2vw, 19px);
  }

  .pool-copy p,
  .empty-pack p {
    color: #9db0b6;
    font-size: 15px;
  }

  .live-line,
  .cta-row,
  .flow-strip,
  .bay-meta,
  .pool-grid,
  .pack-grid,
  .pack-actions {
    display: grid;
    gap: 10px;
  }

  .live-line {
    grid-template-columns: repeat(auto-fit, minmax(126px, max-content));
  }

  .live-chip,
  .bay-stage,
  .bay-meta-pill {
    min-height: 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 12px;
    border-radius: 999px;
    border: 1px solid rgba(173, 202, 124, 0.14);
    background:
      linear-gradient(180deg, rgba(14, 22, 33, 0.92), rgba(10, 16, 24, 0.92));
    box-shadow: inset 0 0 0 1px rgba(173, 202, 124, 0.05);
  }

  .cta-row {
    grid-template-columns: repeat(3, minmax(0, max-content));
    width: fit-content;
  }

  .cta-primary,
  .cta-secondary,
  .cta-tertiary,
  .ghost-button {
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 16px;
    border-radius: 999px;
    border: 1px solid rgba(173, 202, 124, 0.16);
    text-decoration: none;
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #f3f1e7;
    background:
      linear-gradient(180deg, rgba(14, 22, 33, 0.94), rgba(10, 16, 24, 0.94));
  }

  .cta-primary {
    border-color: rgba(173, 202, 124, 0.28);
    background:
      linear-gradient(180deg, rgba(173, 202, 124, 0.18), rgba(10, 16, 24, 0.9)),
      rgba(14, 22, 33, 0.94);
  }

  .cta-secondary {
    border-color: rgba(255, 118, 181, 0.18);
  }

  .cta-tertiary {
    border-color: rgba(242, 209, 147, 0.18);
  }

  .cta-primary.disabled,
  .cta-secondary.disabled,
  .cta-tertiary.disabled {
    pointer-events: none;
    opacity: 0.42;
  }

  .ghost-button {
    cursor: pointer;
  }

  .flow-strip {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    width: min(100%, 820px);
  }

  .flow-step,
  .pack-board,
  .pool-bay {
    border: 1px solid rgba(173, 202, 124, 0.16);
    background:
      linear-gradient(180deg, rgba(10, 16, 28, 0.92), rgba(8, 12, 20, 0.94)),
      radial-gradient(circle at top right, rgba(173, 202, 124, 0.12), transparent 38%),
      radial-gradient(circle at bottom left, rgba(242, 209, 147, 0.08), transparent 40%);
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(18px);
  }

  .flow-step {
    border-radius: 16px;
    padding: 10px 12px;
    display: grid;
    gap: 2px;
  }

  .flow-step.complete {
    border-color: rgba(173, 202, 124, 0.3);
    box-shadow:
      0 20px 32px rgba(0, 0, 0, 0.26),
      inset 0 0 0 1px rgba(173, 202, 124, 0.08);
  }

  .flow-step strong {
    color: #edf7f7;
    font-size: 18px;
    font-family: 'Orbitron', sans-serif;
    letter-spacing: 0.04em;
  }

  .pool-bay {
    padding: 14px;
    border-radius: 30px;
    display: grid;
    gap: 12px;
  }

  .bay-header,
  .section-head,
  .pool-head {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: end;
  }

  .bay-visual {
    position: relative;
    overflow: hidden;
    border-radius: 24px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background:
      linear-gradient(180deg, rgba(15, 22, 33, 0.94), rgba(10, 16, 24, 0.94));
  }

  .bay-banner {
    width: 100%;
    height: 112px;
    object-fit: cover;
    display: block;
    opacity: 0.92;
  }

  .bay-visual-caption {
    position: absolute;
    left: 16px;
    right: 16px;
    bottom: 16px;
    display: grid;
    gap: 4px;
    padding: 14px;
    border-radius: 18px;
    background: rgba(5, 10, 18, 0.7);
    backdrop-filter: blur(12px);
  }

  .bay-visual-caption span {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #adc67c;
  }

  .bay-visual-caption strong {
    font-size: 20px;
    color: #edf7f7;
  }

  .pool-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .pool-card,
  .pack-card {
    display: grid;
    gap: 8px;
    padding: 10px;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(7, 11, 18, 0.72);
    color: inherit;
    text-decoration: none;
  }

  .pool-card {
    cursor: pointer;
    text-align: left;
  }

  .pool-card.selected {
    border-color: rgba(255, 118, 181, 0.34);
    box-shadow:
      0 18px 34px rgba(0, 0, 0, 0.24),
      inset 0 0 0 1px rgba(255, 118, 181, 0.12);
  }

  .pool-art,
  .pack-art {
    overflow: hidden;
    border-radius: 16px;
    background:
      linear-gradient(180deg, rgba(20, 30, 45, 0.9), rgba(10, 16, 24, 0.94));
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .pool-art img,
  .pack-art img {
    width: 100%;
    height: 64px;
    object-fit: cover;
    display: block;
  }

  .pool-head strong {
    color: #ff76b5;
  }

  .pool-copy,
  .pack-copy {
    display: grid;
    gap: 6px;
  }

  .pool-copy strong,
  .pack-copy strong {
    font-size: 18px;
    color: #edf7f7;
  }

  .pack-board {
    padding: 14px;
    border-radius: 24px;
    display: grid;
    gap: 12px;
  }

  .pack-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }

  .pack-card {
    grid-template-columns: 72px minmax(0, 1fr);
    align-items: center;
    background:
      radial-gradient(circle at 18% 16%, color-mix(in srgb, var(--agent-color) 30%, transparent), transparent 38%),
      rgba(7, 11, 18, 0.76);
  }

  .pack-art img {
    height: 64px;
  }

  .empty-pack {
    padding: 14px;
    border-radius: 22px;
    border: 1px dashed rgba(173, 202, 124, 0.22);
    background: rgba(8, 12, 20, 0.62);
    display: grid;
    gap: 8px;
  }

  .empty-pack strong {
    font-size: 24px;
    color: #edf7f7;
  }

  .pack-actions {
    grid-template-columns: repeat(3, minmax(0, max-content));
    width: fit-content;
  }

  @media (max-width: 1260px) {
    .hero-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 900px) {
    .flow-strip,
    .pool-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .pack-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .cta-row,
    .pack-actions {
      grid-template-columns: 1fr;
      width: 100%;
    }

    .cta-primary,
    .cta-secondary,
    .cta-tertiary,
    .pack-actions .cta-secondary {
      width: 100%;
    }
  }

  @media (max-width: 640px) {
    .flow-strip,
    .pack-grid,
    .pool-grid {
      grid-template-columns: 1fr;
    }

    h1 {
      font-size: clamp(42px, 16vw, 64px);
    }
  }
</style>
