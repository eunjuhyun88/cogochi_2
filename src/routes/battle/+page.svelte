<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { EVAL_SCENARIO_TEMPLATES, createEvalScenario } from '$lib/aimon/data/evalScenarios';
  import type { OwnedAgent } from '$lib/aimon/types';
  import { getAgentGrowthLane, isAgentListable } from '$lib/aimon/utils/agentMarket';
  import BattleArena from '../../components/aimon/BattleArena.svelte';
  import PhaseBar from '../../components/aimon/PhaseBar.svelte';
  import PokemonFrame from '../../components/shared/PokemonFrame.svelte';
  import {
    battleStore,
    focusTap,
    restartBattle,
    startBattle,
    stopBattle,
    useIntervention
  } from '$lib/aimon/stores/battleStore';
  import { setScreen } from '$lib/aimon/stores/gameStore';
  import { matchStore, selectEvalScenario } from '$lib/aimon/stores/matchStore';
  import { playerStore } from '$lib/aimon/stores/playerStore';
  import { rosterStore } from '$lib/aimon/stores/rosterStore';
  import { runtimeStore } from '$lib/aimon/stores/runtimeStore';
  import { squadStore } from '$lib/aimon/stores/squadStore';

  let battle = $derived($battleStore);
  let player = $derived($playerStore);
  let matches = $derived($matchStore);
  let roster = $derived($rosterStore);
  let runtime = $derived($runtimeStore);
  let squad = $derived($squadStore);
  let selectedScenario = $derived(matches.activeScenario ?? createEvalScenario(matches.selectedScenarioId));
  let totalXp = $derived(roster.agents.reduce((sum, agent) => sum + agent.xp, 0));
  let primaryObjective = $derived(battle.scene?.objectives[0] ?? null);
  let objectiveProgress = $derived(Math.round(primaryObjective?.progress ?? battle.consensus));
  let activeSquadAgents = $derived(
    squad.activeSquad.memberAgentIds
      .map((id) => roster.agents.find((agent) => agent.id === id) ?? null)
      .filter((agent): agent is OwnedAgent => Boolean(agent))
  );
  let missionLaneCards = $derived(
    activeSquadAgents.map((agent) => {
      const lane = getAgentGrowthLane(agent);
      return {
        agent,
        lane,
        slotLabel: getSquadSlotLabel(agent.id),
        fitNote: describeLaneFit(agent),
        coordinationNote: describeCoordination(agent)
      };
    })
  );
  let rentReadyCount = $derived(activeSquadAgents.filter((agent) => isAgentListable(agent)).length);
  let aggressiveCount = $derived(activeSquadAgents.filter((agent) => agent.loadout.confidenceStyle === 'AGGRESSIVE').length);
  let missionBrief = $derived(
    missionLaneCards.length > 0
      ? `${selectedScenario.targetRegime === 'TREND' ? '추세 공략' : '레인지 방어'} 시나리오에 맞춰 ${squad.activeSquad.tacticPreset} preset을 적용했습니다. ${missionLaneCards
          .map((card) => `${card.agent.name}(${card.lane.shortLabel})`)
          .join(' · ')} 조합으로 탐지, 해석, 리스크, 집행을 나눠 맡습니다.`
      : '스쿼드를 구성하면 각 성장 방향이 이번 시나리오에서 맡는 역할과 임대 가치까지 함께 읽을 수 있습니다.'
  );

  onMount(() => {
    setScreen('battle');
    startBattle();
  });

  onDestroy(() => {
    stopBattle();
  });

  function launchScenario(scenarioId: string): void {
    selectEvalScenario(scenarioId);
    restartBattle();
  }

  function getSquadSlotLabel(agentId: string): string {
    const assignment = Object.entries(squad.activeSquad.roleMap).find(([, assignedId]) => assignedId === agentId);
    return assignment ? assignment[0].toUpperCase() : 'FLEX';
  }

  function describeCoordination(agent: OwnedAgent): string {
    switch (agent.role) {
      case 'SCOUT':
        return 'Opens the board and tags first signal drift.';
      case 'ANALYST':
        return 'Turns memory hits into a usable thesis.';
      case 'RISK':
        return 'Blocks low-quality pushes before damage lands.';
      case 'EXECUTOR':
        return 'Converts conviction into actual arena pressure.';
      default:
        return 'Keeps the squad aligned around the mission plan.';
    }
  }

  function describeLaneFit(agent: OwnedAgent): string {
    const lane = getAgentGrowthLane(agent);
    const isTrend = selectedScenario.targetRegime === 'TREND';

    switch (lane.id) {
      case 'MOMENTUM_RIDER':
        return isTrend
          ? '추세가 붙는 순간 속도를 실어 breakout continuation을 증명합니다.'
          : '횡보장에서는 과열 추격을 짧게 압축해 손실을 제한합니다.';
      case 'BREAKER':
        return isTrend
          ? '저항과 청산 구간을 노려 강한 압력 전환을 만들어 냅니다.'
          : '답답한 레인지에서 벽을 깨는 순간만 노리고 진입합니다.';
      case 'RISK_GUARDIAN':
        return isTrend
          ? '과열 구간에서 무리한 추격을 막고 손실 바닥을 지켜줍니다.'
          : '레인지 시나리오에서 가장 먼저 무효화 조건을 세워 방어합니다.';
      case 'PATTERN_ORACLE':
        return isTrend
          ? '반복 패턴을 빠르게 회수해 false breakout을 걸러냅니다.'
          : '레인지 안의 반복 구조를 읽어 재진입 타이밍을 정교하게 잡습니다.';
      case 'STABILITY_CORE':
        return isTrend
          ? '강한 신호만 남겨 팀 전체 confidence curve를 매끈하게 만듭니다.'
          : '변동성이 낮은 구간에서 가장 안정적인 기준선 역할을 맡습니다.';
      case 'SIGNAL_HUNTER':
      default:
        return isTrend
          ? '초기 신호를 가장 먼저 감지해 첫 진입 타이밍을 열어 줍니다.'
          : '레인지가 깨지기 전 미세한 열 변화를 포착해 대응 여지를 만듭니다.';
    }
  }
</script>

<svelte:head>
  <title>MAXIDOGE Battle Proof</title>
</svelte:head>

<div class="page">
  <header class="hero">
    <div class="hero-copy">
      <p class="eyebrow">BATTLE PROOF</p>
      <h1>필드에서 증명한다.</h1>
      <p class="lede">이 페이지는 설명보다 실행이 먼저 보여야 합니다. 시나리오를 확인하고 바로 아레나에서 squad 반응을 읽습니다.</p>

      <div class="hero-strip">
        <span class="section-pill">{selectedScenario.label}</span>
        <span class="hero-chip">{selectedScenario.symbol} · {selectedScenario.timeframe}</span>
        <span class="hero-chip">{runtime.config.mode} · {squad.activeSquad.tacticPreset}</span>
        <span class="hero-chip">Squad {activeSquadAgents.length}/4</span>
        <span class="hero-chip">Objective {objectiveProgress}%</span>
      </div>
    </div>

    <div class="hero-actions">
      <a href="/team">Growth Draft</a>
      <a href="/roster">Roster</a>
      <button type="button" onclick={() => restartBattle()}>Restart Proof</button>
    </div>
  </header>

  <section class="flow-strip">
    <article class="flow-card">
      <span>01</span>
      <strong>Growth Draft</strong>
      <small>{activeSquadAgents.length}/4 squad agents prepared</small>
    </article>
    <article class="flow-card active">
      <span>02</span>
      <strong>Battle Proof</strong>
      <small>{selectedScenario.label} · {selectedScenario.targetRegime}</small>
    </article>
    <article class="flow-card">
      <span>03</span>
      <strong>Market Ready</strong>
      <small>{rentReadyCount} agents near listing state</small>
    </article>
  </section>

  <PhaseBar phase={battle.phase} remainingMs={battle.phaseRemainingMs} />

  <BattleArena battle={battle} onFocusTap={focusTap} onIntervention={useIntervention} />

  <section class="support-grid">
    <PokemonFrame variant="accent" padding="16px">
    <section class="mission-brief">
      <div class="section-head">
        <div>
          <p class="eyebrow">MISSION BRIEF</p>
          <h3>이번 배틀에서 증명할 성장 방향</h3>
        </div>
        <span class="section-pill">{selectedScenario.targetRegime} · {squad.activeSquad.tacticPreset}</span>
      </div>

      <p class="support-copy">{missionBrief}</p>

      <div class="mission-stats">
        <div>
          <span>Squad depth</span>
          <strong>{activeSquadAgents.length}/4 agents</strong>
        </div>
        <div>
          <span>Rent ready</span>
          <strong>{rentReadyCount}</strong>
        </div>
        <div>
          <span>Aggressive lanes</span>
          <strong>{aggressiveCount}</strong>
        </div>
        <div>
          <span>Objective bias</span>
          <strong>{selectedScenario.objective}</strong>
        </div>
      </div>

      {#if missionLaneCards.length > 0}
        <div class="mission-grid">
          {#each missionLaneCards as card (card.agent.id)}
            <article class="mission-card" style={`--lane-accent:${card.lane.accent};`}>
              <div class="mission-card-head">
                <div>
                  <strong>{card.agent.name}</strong>
                  <small>{card.slotLabel} · {card.agent.role}</small>
                </div>
                <span class="section-pill">{card.lane.shortLabel}</span>
              </div>

              <p class="mission-card-title">{card.lane.label} · {card.agent.loadout.focusSkill}</p>
              <p>{card.fitNote}</p>
              <small>{card.coordinationNote}</small>

              <div class="mission-chip-row">
                <span>{card.agent.loadout.readout}</span>
                <span>{card.agent.loadout.horizon}</span>
                <span>{card.agent.loadout.confidenceStyle}</span>
                <span>{card.agent.loadout.indicators[0] ?? 'No indicator'}</span>
              </div>
            </article>
          {/each}
        </div>
      {:else}
        <div class="mission-empty">
          <p class="support-copy">선택된 스쿼드가 없습니다. 먼저 성장 방향을 정한 팀을 구성하면 여기서 전투 목적과 역할 분담을 읽을 수 있습니다.</p>
          <a href="/team">Go To Growth Draft</a>
        </div>
      {/if}

      {#if battle.result}
        <section class="result-callout">
          <div class="section-head">
            <div>
              <p class="eyebrow">MATCH RESULT</p>
              <h3>{battle.result.outcome}</h3>
            </div>
            <span class="section-pill">
              Δ {battle.result.priceDeltaPct >= 0 ? '+' : ''}{battle.result.priceDeltaPct.toFixed(2)}%
            </span>
          </div>
          <p class="support-copy">{battle.result.note}</p>
          <div class="scope-grid">
            <span>XP Gain</span><strong>{battle.result.xpGain}</strong>
            <span>Research Gain</span><strong>{battle.result.researchGain}</strong>
            <span>Risk Veto</span><strong>{battle.riskVetoCharges}</strong>
            <span>Retarget</span><strong>{battle.retargetCharges}</strong>
          </div>
        </section>
      {/if}
    </section>
    </PokemonFrame>

    <PokemonFrame variant="dark" padding="16px">
      <section class="panel">
        <div class="section-head">
          <div>
            <p class="eyebrow">BATTLE STATUS</p>
            <h3>운영 상태</h3>
          </div>
          <span class="section-pill">{battle.market.regime}</span>
        </div>

        <div class="scope-grid">
          <span>Scenario</span><strong>{selectedScenario.label}</strong>
          <span>Progress</span><strong>{objectiveProgress}%</strong>
          <span>Runtime</span><strong>{runtime.config.mode}</strong>
          <span>Tactic</span><strong>{squad.activeSquad.tacticPreset}</strong>
          <span>Volatility</span><strong>{battle.market.volatility.toFixed(2)}</strong>
          <span>Research</span><strong>{player.researchPoints}</strong>
          <span>Total XP</span><strong>{totalXp}</strong>
          <span>Wins</span><strong>{player.wins}</strong>
          <span>Focus Tap</span><strong>{battle.focusTapCharges}</strong>
          <span>Memory Pulse</span><strong>{battle.memoryPulseCharges}</strong>
        </div>
      </section>
    </PokemonFrame>
  </section>

  <PokemonFrame variant="dark" padding="16px">
    <section class="panel">
      <div class="section-head">
        <div>
          <p class="eyebrow">COMBAT FEED</p>
          <h3>기억과 판단</h3>
        </div>
        <span class="section-pill">{battle.retrievalFeed.length + battle.decisionFeed.length}</span>
      </div>

      <div class="feed-columns">
        <section class="feed-section">
          <div class="feed-head">
            <strong>RAG Recall</strong>
            <span class="section-pill">{battle.retrievalFeed.length}</span>
          </div>

          <div class="retrieval-list">
            {#if battle.retrievalFeed.length > 0}
              {#each battle.retrievalFeed.slice(0, 3) as item (item.ownedAgentId)}
                <article class="retrieval-card">
                  <div class="retrieval-head">
                    <strong>{item.agentName}</strong>
                    <span>{Math.round(item.memoryScore * 100)}%</span>
                  </div>
                  <small>{item.role} · {item.readout}</small>
                  <p>{item.retrievedMemories[0]?.title ?? 'No memory hit'}</p>
                </article>
              {/each}
            {:else}
              <p class="retrieval-empty">No retrieval context loaded yet.</p>
            {/if}
          </div>
        </section>

        <section class="feed-section">
          <div class="feed-head">
            <strong>Decision Trace</strong>
            <span class="section-pill">{battle.decisionFeed.length}</span>
          </div>

          <div class="retrieval-list">
            {#if battle.decisionFeed.length > 0}
              {#each battle.decisionFeed.slice(0, 3) as trace (trace.ownedAgentId)}
                <article class="retrieval-card">
                  <div class="retrieval-head">
                    <strong>{trace.agentName}</strong>
                    <span>{trace.action} · {Math.round(trace.confidence * 100)}%</span>
                  </div>
                  <p>{trace.thesis}</p>
                </article>
              {/each}
            {:else}
              <p class="retrieval-empty">No decision traces yet.</p>
            {/if}
          </div>
        </section>
      </div>
    </section>
  </PokemonFrame>

  <PokemonFrame variant="dark" padding="12px">
    <details class="scenario-foldout">
      <summary class="scenario-summary">
        <div class="scenario-summary-copy">
          <span class="eyebrow">EVAL SCENARIO</span>
          <strong>{selectedScenario.label}</strong>
          <small>{selectedScenario.symbol} · {selectedScenario.timeframe} · {selectedScenario.targetRegime}</small>
        </div>
        <span class="section-pill">Change Scenario</span>
      </summary>

      <section class="scenario-panel">
        <p class="support-copy">{selectedScenario.brief}</p>

        <div class="scenario-grid">
          <div>
            <span>Objective</span>
            <strong>{selectedScenario.objective}</strong>
          </div>
          <div>
            <span>Allowed data</span>
            <strong>{selectedScenario.allowedDataSourceKinds.join(' / ')}</strong>
          </div>
          <div>
            <span>Weights</span>
            <strong>
              R {Math.round(selectedScenario.scoringWeights.returnWeight * 100)} /
              Risk {Math.round(selectedScenario.scoringWeights.riskWeight * 100)} /
              Acc {Math.round(selectedScenario.scoringWeights.accuracyWeight * 100)}
            </strong>
          </div>
          <div>
            <span>Context seed</span>
            <strong>
              Price {selectedScenario.startingPrice} · FG {selectedScenario.baselineFearGreed} · Vol {selectedScenario.baselineVolatility.toFixed(2)}
            </strong>
          </div>
        </div>

        <div class="scenario-picker">
          {#each EVAL_SCENARIO_TEMPLATES as scenario (scenario.id)}
            <button
              type="button"
              class:selected={scenario.id === selectedScenario.id}
              onclick={() => launchScenario(scenario.id)}
            >
              <strong>{scenario.label}</strong>
              <small>{scenario.symbol} · {scenario.timeframe} · {scenario.targetRegime}</small>
            </button>
          {/each}
        </div>
      </section>
    </details>
  </PokemonFrame>
</div>

<style>
  .page,
  .scenario-panel,
  .panel,
  .mission-brief,
  .hero-copy,
  .scenario-summary-copy,
  .feed-section {
    display: grid;
    gap: 14px;
  }

  .page {
    gap: 18px;
  }

  .hero,
  .section-head,
  .scenario-summary,
  .feed-head,
  .retrieval-head {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: end;
  }

  .hero-actions,
  .hero-strip {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
  }

  .support-grid,
  .flow-strip,
  .scenario-picker,
  .scenario-grid,
  .feed-columns,
  .mission-grid,
  .mission-stats {
    display: grid;
    gap: 12px;
  }

  .support-grid {
    grid-template-columns: minmax(280px, 0.82fr) minmax(0, 1.18fr);
    gap: 16px;
  }

  .flow-strip {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .scenario-picker {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }

  .scenario-grid {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }

  .mission-grid {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }

  .mission-stats {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  }

  .feed-columns {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .eyebrow,
  .hero-chip,
  .scenario-grid span,
  .scope-grid span,
  .section-pill,
  .scenario-summary-copy small,
  .retrieval-card small,
  .retrieval-empty {
    color: var(--text-2);
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  h1,
  h3,
  .scenario-summary-copy strong,
  .feed-head strong {
    margin: 0;
    font-family: 'Orbitron', sans-serif;
  }

  h1 {
    font-size: clamp(34px, 5.8vw, 64px);
    line-height: 0.92;
    letter-spacing: 0.02em;
  }

  h3 {
    font-size: 22px;
  }

  .scenario-summary-copy strong {
    font-size: 22px;
  }

  .feed-head strong {
    font-size: 18px;
  }

  .lede,
  .support-copy,
  .retrieval-card p,
  .mission-card p,
  .mission-card-title {
    margin: 0;
    color: var(--text-1);
    line-height: 1.5;
  }

  .mission-card-title {
    font-family: 'Orbitron', sans-serif;
    font-size: 16px;
  }

  .hero-actions a,
  .mission-empty a,
  .hero-actions button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 46px;
    padding: 0 14px;
    border-radius: 999px;
    border: 1px solid var(--line);
    background: rgba(255, 255, 255, 0.03);
    color: var(--text-0);
    text-decoration: none;
  }

  .hero-chip,
  .section-pill {
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    padding: 0 10px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.03);
  }

  .scenario-foldout {
    display: grid;
    gap: 12px;
  }

  .scenario-summary {
    cursor: pointer;
    list-style: none;
  }

  .scenario-summary::-webkit-details-marker {
    display: none;
  }

  .scenario-picker button {
    display: grid;
    gap: 4px;
    align-items: start;
    padding: 12px 14px;
    border-radius: 16px;
    border: 1px solid rgba(98, 215, 218, 0.16);
    background: rgba(10, 22, 34, 0.72);
    color: var(--text-0);
    text-align: left;
  }

  .scenario-picker button.selected {
    border-color: rgba(98, 215, 218, 0.4);
    background: rgba(14, 30, 45, 0.92);
  }

  .scenario-grid div,
  .flow-card,
  .feed-section,
  .retrieval-card,
  .mission-stats div,
  .result-callout {
    display: grid;
    gap: 6px;
    padding: 12px 14px;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    background: rgba(255, 255, 255, 0.03);
  }

  .flow-card.active {
    border-color: rgba(98, 215, 218, 0.28);
    background: linear-gradient(180deg, rgba(98, 215, 218, 0.08), rgba(255,255,255,0.03));
  }

  .flow-card span {
    color: var(--text-2);
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
  }

  .flow-card strong {
    font-family: 'Orbitron', sans-serif;
    font-size: 18px;
  }

  .mission-card,
  .mission-empty {
    display: grid;
    gap: 10px;
    padding: 14px;
    border-radius: 18px;
    border: 1px solid color-mix(in srgb, var(--lane-accent, #62d7da) 26%, rgba(255, 255, 255, 0.08));
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.02)),
      color-mix(in srgb, var(--lane-accent, #62d7da) 10%, rgba(9, 18, 29, 0.92));
  }

  .result-callout {
    margin-top: 4px;
    border-color: rgba(98, 215, 218, 0.18);
    background:
      linear-gradient(180deg, rgba(98, 215, 218, 0.08), rgba(255,255,255,0.03)),
      rgba(255,255,255,0.03);
  }

  .mission-card-head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: start;
  }

  .mission-card-head strong {
    font-family: 'Orbitron', sans-serif;
    font-size: 18px;
  }

  .mission-chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .mission-chip-row span {
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    padding: 0 10px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.04);
    color: var(--text-0);
    font-size: 16px;
  }

  .scope-grid {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 10px 14px;
  }

  .retrieval-list {
    display: grid;
    gap: 10px;
  }

  @media (max-width: 980px) {
    .hero,
    .support-grid,
    .feed-columns,
    .flow-strip {
      grid-template-columns: 1fr;
      flex-direction: column;
      align-items: stretch;
    }
  }

  @media (max-width: 720px) {
    .section-head,
    .scenario-summary,
    .feed-head,
    .retrieval-head,
    .mission-card-head {
      flex-direction: column;
      align-items: stretch;
    }
  }
</style>
