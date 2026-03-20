<script lang="ts">
  import { onMount } from 'svelte';
  import PokemonFrame from '../../components/shared/PokemonFrame.svelte';
  import { aimonDexById } from '$lib/aimon/data/aimonDex';
  import { setScreen } from '$lib/aimon/stores/gameStore';
  import { matchStore } from '$lib/aimon/stores/matchStore';
  import { rosterStore } from '$lib/aimon/stores/rosterStore';
  import {
    getAgentDemandScore,
    getAgentGrowthLane,
    getAgentListingProgress,
    getAgentMonthlyFee,
    getAgentRentalStatus,
    getAgentTrustScore
  } from '$lib/aimon/utils/agentMarket';

  type MarketEntry = {
    agent: (typeof $rosterStore)['agents'][number];
    lane: ReturnType<typeof getAgentGrowthLane>;
    demandScore: number;
    monthlyFee: number;
    trustScore: number;
    rentalStatus: ReturnType<typeof getAgentRentalStatus>;
    proofMatches: number;
    proofWinRate: number;
    progress: ReturnType<typeof getAgentListingProgress>;
  };

  const unlockSteps = [
    {
      id: 'DECK',
      label: 'Deck',
      copy: '우측 rotating wall에서 후보를 고르고 squad를 만든다.'
    },
    {
      id: 'SETUP',
      label: 'Setup',
      copy: 'lane, build posture, squad tactic을 먼저 잠근다.'
    },
    {
      id: 'LAB',
      label: 'Lab',
      copy: '설정을 바꾸고 backtest/sim을 반복하면서 delta를 만든다.'
    },
    {
      id: 'ARENA',
      label: 'Arena',
      copy: 'proof match로 성능을 증명한 뒤에만 listing queue에 진입한다.'
    }
  ] as const;

  let roster = $derived($rosterStore);
  let matches = $derived($matchStore);
  let marketEntries = $derived(
    [...roster.agents]
      .map((agent) => {
        const proofResults = matches.recentResults.filter((result) =>
          result.agentResults.some((row) => row.agentId === agent.id)
        );
        const progress = getAgentListingProgress(agent, proofResults);
        const rentalStatus = getAgentRentalStatus(agent, proofResults);

        return {
          agent,
          lane: getAgentGrowthLane(agent),
          demandScore: getAgentDemandScore(agent),
          monthlyFee: getAgentMonthlyFee(agent),
          trustScore: getAgentTrustScore(agent, proofResults),
          rentalStatus,
          proofMatches: progress.currentMatches,
          proofWinRate: progress.currentWinRate,
          progress
        } satisfies MarketEntry;
      })
      .sort((left, right) => {
        const statusOrder = { LISTABLE: 0, 'NEAR READY': 1, 'TRAIN MORE': 2 } as const;
        const statusDelta = statusOrder[left.rentalStatus] - statusOrder[right.rentalStatus];
        if (statusDelta !== 0) return statusDelta;
        const progressDelta = right.progress.completion - left.progress.completion;
        if (progressDelta !== 0) return progressDelta;
        return right.demandScore - left.demandScore;
      })
  );
  let proofedEntries = $derived(marketEntries.filter((item) => item.rentalStatus === 'LISTABLE'));
  let incubatingEntries = $derived(marketEntries.filter((item) => item.rentalStatus !== 'LISTABLE'));
  let nearReadyEntries = $derived(incubatingEntries.filter((item) => item.rentalStatus === 'NEAR READY'));
  let nextUnlock = $derived(nearReadyEntries[0] ?? incubatingEntries[0] ?? null);
  let activeListingsTopline = $derived(proofedEntries.reduce((sum, item) => sum + item.monthlyFee, 0));
  let incubatingTopline = $derived(nearReadyEntries.slice(0, 3).reduce((sum, item) => sum + item.monthlyFee, 0));

  onMount(() => {
    setScreen('market');
  });

  function formatPercent(value: number): string {
    return `${Math.round(value * 100)}%`;
  }
</script>

<svelte:head>
  <title>MAXIDOGE Market</title>
</svelte:head>

<div class="page">
  <header class="header">
    <div>
      <p class="eyebrow">AGENT MARKET / LATE GAME</p>
      <h1>증명된 build만 시장 가치가 된다.</h1>
      <p class="lede">
        이 화면은 코어 루프의 시작점이 아닙니다. Deck에서 고르고, Setup에서 lane을 잠그고, Lab에서 delta를 만들고, Arena에서
        proof match를 쌓은 다음에야 listing fee가 붙습니다.
      </p>
    </div>
    <div class="header-actions">
      <a href="/">Deck</a>
      <a href="/team">Setup</a>
      <a href="/lab">Lab</a>
      <a href="/battle">Arena</a>
    </div>
  </header>

  <section class="flow-strip">
    {#each unlockSteps as step, index (step.id)}
      <article class="flow-card">
        <span>0{index + 1}</span>
        <strong>{step.label}</strong>
        <small>{step.copy}</small>
      </article>
    {/each}
    <article class="flow-card active">
      <span>05</span>
      <strong>Market</strong>
      <small>proof and trust score turn a trained agent into a rentable asset</small>
    </article>
  </section>

  <PokemonFrame variant="dark" padding="16px">
    <section class="gate-panel">
      <div class="section-head">
        <div>
          <p class="eyebrow">LISTING GATE</p>
          <h2>마켓 진입 규칙</h2>
        </div>
        <p class="gate-copy">Level 3+, Bond 10+, proof matches 5+, win rate 55%+를 통과해야 listing shelf에 진입합니다.</p>
      </div>

      <div class="summary-grid">
        <div class="summary-card">
          <span>Proofed Listings</span>
          <strong>{proofedEntries.length}</strong>
          <small>바로 임대 가능한 shelf 수량</small>
        </div>
        <div class="summary-card accent">
          <span>Active Topline</span>
          <strong>${activeListingsTopline}</strong>
          <small>현재 proofed shelf 월 합계</small>
        </div>
        <div class="summary-card">
          <span>Incubating Queue</span>
          <strong>{incubatingEntries.length}</strong>
          <small>Lab/Arena를 더 돌아야 하는 후보</small>
        </div>
        <div class="summary-card">
          <span>Near Ready Upside</span>
          <strong>${incubatingTopline}</strong>
          <small>다음 listing 후보 3기대 합계</small>
        </div>
      </div>
    </section>
  </PokemonFrame>

  <section class="section-stack">
    <div class="section-head">
      <div>
        <p class="eyebrow">PROOFED SHELF</p>
        <h2>지금 올릴 수 있는 에이전트</h2>
      </div>
      <a class="section-link" href="/battle">Run More Proof</a>
    </div>

    {#if proofedEntries.length > 0}
      <div class="listing-grid">
        {#each proofedEntries as item (item.agent.id)}
          {@const entry = aimonDexById[item.agent.speciesId]}
          {#if entry}
            <PokemonFrame variant="accent" padding="16px">
              <article class="listing-card">
                <div class="card-head">
                  <div>
                    <p class="eyebrow">{entry.dexNo} · {item.agent.role}</p>
                    <h3>{item.agent.name}</h3>
                  </div>
                  <span class="price">${item.monthlyFee}/mo</span>
                </div>

                <p class="support-copy">{item.lane.label} · {item.agent.loadout.focusSkill}</p>

                <div class="stats-grid">
                  <span>Trust</span><strong>{item.trustScore}</strong>
                  <span>Demand</span><strong>{item.demandScore}</strong>
                  <span>Proof</span><strong>{item.proofMatches}</strong>
                  <span>Win Rate</span><strong>{formatPercent(item.proofWinRate)}</strong>
                  <span>Level</span><strong>{item.agent.level}</strong>
                  <span>Bond</span><strong>{item.agent.bond}</strong>
                </div>

                <div class="chip-row">
                  <span>{item.lane.shortLabel}</span>
                  <span>{item.agent.loadout.retrainingPath}</span>
                  <span>LISTABLE</span>
                </div>

                <div class="card-actions">
                  <a href={`/agent/${item.agent.id}`}>Open HQ</a>
                  <a href="/battle">Keep Proving</a>
                </div>
              </article>
            </PokemonFrame>
          {/if}
        {/each}
      </div>
    {:else}
      <PokemonFrame variant="dark" padding="18px">
        <article class="empty-state">
          <p class="eyebrow">NO LIVE LISTINGS</p>
          <h3>아직 shelf에 올라온 에이전트가 없습니다.</h3>
          <p class="support-copy">
            이게 정상입니다. 지금 단계에서는 Lab에서 설정을 더 바꾸고 Arena proof를 쌓는 편이 맞습니다. market은 endgame reward layer여야 합니다.
          </p>
          <div class="card-actions">
            <a href="/lab">Open Lab</a>
            <a href="/battle">Run Proof Match</a>
          </div>
        </article>
      </PokemonFrame>
    {/if}
  </section>

  <section class="section-stack">
    <div class="section-head">
      <div>
        <p class="eyebrow">INCUBATION QUEUE</p>
        <h2>다음으로 market에 올릴 후보</h2>
      </div>
      {#if nextUnlock}
        <p class="gate-copy">{nextUnlock.agent.name}이 현재 가장 앞선 후보입니다. 준비도 {nextUnlock.progress.completion}%.</p>
      {/if}
    </div>

    <div class="listing-grid">
      {#each incubatingEntries.slice(0, 8) as item (item.agent.id)}
        {@const entry = aimonDexById[item.agent.speciesId]}
        {#if entry}
          <PokemonFrame variant="dark" padding="16px">
            <article class="listing-card">
              <div class="card-head">
                <div>
                  <p class="eyebrow">{entry.dexNo} · {item.agent.role}</p>
                  <h3>{item.agent.name}</h3>
                </div>
                <span class:near-ready={item.rentalStatus === 'NEAR READY'} class="status-pill">{item.rentalStatus}</span>
              </div>

              <p class="support-copy">{item.lane.label} · {item.agent.loadout.readout}</p>

              <div class="progress-stack">
                <div class="progress-meta">
                  <span>Market Readiness</span>
                  <strong>{item.progress.completion}%</strong>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" style:width={`${item.progress.completion}%`}></div>
                </div>
              </div>

              <div class="stats-grid">
                <span>Proof</span><strong>{item.proofMatches}</strong>
                <span>Win Rate</span><strong>{formatPercent(item.proofWinRate)}</strong>
                <span>Level</span><strong>{item.agent.level}</strong>
                <span>Bond</span><strong>{item.agent.bond}</strong>
                <span>Trust</span><strong>{item.trustScore}</strong>
                <span>Fee Target</span><strong>${item.monthlyFee}/mo</strong>
              </div>

              <div class="need-list">
                {#each item.progress.needs as need (need)}
                  <span>{need}</span>
                {/each}
              </div>

              <div class="card-actions">
                <a href={`/agent/${item.agent.id}`}>Open HQ</a>
                <a href="/lab">Train In Lab</a>
              </div>
            </article>
          </PokemonFrame>
        {/if}
      {/each}
    </div>
  </section>
</div>

<style>
  .page,
  .gate-panel,
  .listing-card,
  .summary-card,
  .empty-state,
  .progress-stack {
    display: grid;
    gap: 14px;
  }

  .page {
    gap: 22px;
  }

  .header,
  .header-actions,
  .card-head,
  .section-head,
  .progress-meta {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: end;
  }

  .header-actions,
  .card-actions,
  .chip-row,
  .need-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .flow-strip,
  .summary-grid,
  .listing-grid {
    display: grid;
    gap: 16px;
  }

  .flow-strip {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }

  .summary-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .listing-grid {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  }

  .section-stack {
    display: grid;
    gap: 16px;
  }

  .eyebrow,
  .summary-card span,
  .summary-card small,
  .flow-card span,
  .flow-card small,
  .stats-grid span,
  .chip-row span,
  .need-list span,
  .progress-meta span {
    margin: 0;
    color: var(--text-2);
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  h1,
  h2,
  h3,
  .flow-card strong {
    margin: 0;
    font-family: 'Orbitron', sans-serif;
  }

  h1 {
    font-size: clamp(38px, 5vw, 60px);
    line-height: 0.92;
  }

  h2 {
    font-size: 28px;
  }

  h3 {
    font-size: 24px;
  }

  .lede,
  .gate-copy,
  .support-copy {
    margin: 0;
    color: var(--text-1);
    font-size: 16px;
    line-height: 1.55;
  }

  .flow-card {
    display: grid;
    gap: 6px;
    padding: 14px 16px;
    border-radius: 18px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.03);
  }

  .flow-card.active {
    border-color: rgba(223, 161, 129, 0.28);
    background: linear-gradient(180deg, rgba(223, 161, 129, 0.12), rgba(255, 255, 255, 0.03));
  }

  .summary-card {
    padding: 14px;
    border-radius: 18px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.03);
  }

  .summary-card.accent {
    border-color: rgba(98, 215, 218, 0.28);
    background: linear-gradient(180deg, rgba(98, 215, 218, 0.12), rgba(255, 255, 255, 0.03));
  }

  .summary-card strong {
    font-size: 28px;
  }

  .price,
  .status-pill,
  .section-link {
    display: inline-flex;
    align-items: center;
    min-height: 42px;
    padding: 0 14px;
    border-radius: 999px;
    font-family: 'Orbitron', sans-serif;
    font-size: 15px;
    text-decoration: none;
  }

  .price {
    color: var(--amber);
    border: 1px solid rgba(223, 161, 129, 0.24);
    background: rgba(223, 161, 129, 0.08);
  }

  .status-pill,
  .section-link,
  .header-actions a,
  .card-actions a {
    color: var(--text-0);
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.04);
  }

  .status-pill.near-ready {
    border-color: rgba(98, 215, 218, 0.26);
    background: rgba(98, 215, 218, 0.08);
  }

  .header-actions a,
  .card-actions a {
    display: inline-flex;
    align-items: center;
    min-height: 46px;
    padding: 0 14px;
    border-radius: 999px;
    text-decoration: none;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 8px 14px;
    align-items: center;
  }

  .stats-grid strong,
  .progress-meta strong {
    font-size: 18px;
  }

  .chip-row span,
  .need-list span {
    padding: 7px 10px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.04);
    letter-spacing: 0.04em;
  }

  .need-list span {
    text-transform: none;
    font-size: 12px;
  }

  .progress-bar {
    height: 10px;
    border-radius: 999px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.06);
  }

  .progress-fill {
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, rgba(98, 215, 218, 0.9), rgba(223, 161, 129, 0.9));
  }

  @media (max-width: 1120px) {
    .summary-grid,
    .flow-strip {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 760px) {
    .header,
    .section-head,
    .card-head,
    .progress-meta {
      flex-direction: column;
      align-items: stretch;
    }

    .summary-grid,
    .flow-strip {
      grid-template-columns: 1fr;
    }
  }
</style>
