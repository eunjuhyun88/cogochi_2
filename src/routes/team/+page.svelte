<script lang="ts">
  import { onMount } from 'svelte';
  import type { AgentConfidenceStyle, AgentHorizon, OwnedAgent } from '$lib/aimon/types';
  import { EVAL_SCENARIO_TEMPLATES } from '$lib/aimon/data/evalScenarios';
  import { GROWTH_LANES, getDefaultGrowthLaneId, growthLaneById } from '$lib/aimon/data/growthLanes';
  import { summarizeTeamSynergy } from '$lib/aimon/data/synergies';
  import TeamBuilder from '../../components/aimon/TeamBuilder.svelte';
  import PokemonFrame from '../../components/shared/PokemonFrame.svelte';
  import { setScreen } from '$lib/aimon/stores/gameStore';
  import { applyGrowthLane, rosterStore, updateAgentConfiguration } from '$lib/aimon/stores/rosterStore';
  import { squadStore, setSquadTacticPreset, toggleSquadAgent } from '$lib/aimon/stores/squadStore';

  type BuildPreset = {
    id: 'PROBE' | 'CONVICTION' | 'DEFENSE';
    label: string;
    confidenceStyle: AgentConfidenceStyle;
    horizon: AgentHorizon;
    riskTolerance: number;
    behaviorNote: string;
    copy: string;
  };

  const BUILD_PRESETS: BuildPreset[] = [
    {
      id: 'PROBE',
      label: 'Probe',
      confidenceStyle: 'BALANCED',
      horizon: 'INTRADAY',
      riskTolerance: 0.42,
      behaviorNote: 'Scan early, stay flexible, and collect better evidence before committing size.',
      copy: '초기 신호를 빨리 훑고 다음 실험을 위한 데이터 확보에 집중합니다.'
    },
    {
      id: 'CONVICTION',
      label: 'Conviction',
      confidenceStyle: 'AGGRESSIVE',
      horizon: 'SCALP',
      riskTolerance: 0.66,
      behaviorNote: 'Commit when momentum confirms and let execution pressure do the work.',
      copy: '강한 신호에서 빠르게 승부를 걸고 breakout continuation을 노립니다.'
    },
    {
      id: 'DEFENSE',
      label: 'Defense',
      confidenceStyle: 'CONSERVATIVE',
      horizon: 'SWING',
      riskTolerance: 0.28,
      behaviorNote: 'Protect downside first, wait for cleaner invalidation, and preserve capital.',
      copy: '불확실한 장에서는 방어적으로 버티며 품질 낮은 진입을 잘라냅니다.'
    }
  ];

  let roster = $derived($rosterStore);
  let squad = $derived($squadStore);
  let selectedAgents = $derived(
    squad.activeSquad.memberAgentIds
      .map((id) => roster.agents.find((agent) => agent.id === id))
      .filter((agent): agent is OwnedAgent => Boolean(agent))
  );
  let selectedNames = $derived(selectedAgents.map((agent) => agent.name));
  let roleSlots = $derived([
    ['SCOUT', squad.activeSquad.roleMap.scout],
    ['ANALYST', squad.activeSquad.roleMap.analyst],
    ['RISK', squad.activeSquad.roleMap.risk],
    ['EXECUTOR', squad.activeSquad.roleMap.executor]
  ] as const);
  let synergy = $derived(summarizeTeamSynergy(selectedAgents.map((agent) => agent.speciesId)));
  let aggressiveCount = $derived(selectedAgents.filter((agent) => agent.loadout.confidenceStyle === 'AGGRESSIVE').length);
  let conservativeCount = $derived(selectedAgents.filter((agent) => agent.loadout.confidenceStyle === 'CONSERVATIVE').length);
  let recommendedScenario = $derived(resolveScenario());
  let teamDoctrine = $derived(resolveTeamDoctrine());

  onMount(() => {
    setScreen('team');
  });

  function laneIdFor(agent: OwnedAgent) {
    return agent.loadout.growthLaneId ?? getDefaultGrowthLaneId(agent.speciesId);
  }

  function laneFor(agent: OwnedAgent) {
    return growthLaneById[laneIdFor(agent)];
  }

  function activePresetFor(agent: OwnedAgent): BuildPreset['id'] {
    if (agent.loadout.confidenceStyle === 'AGGRESSIVE') return 'CONVICTION';
    if (agent.loadout.confidenceStyle === 'CONSERVATIVE') return 'DEFENSE';
    return 'PROBE';
  }

  function applyBuildPreset(agent: OwnedAgent, preset: BuildPreset): void {
    updateAgentConfiguration(agent.id, {
      loadout: {
        confidenceStyle: preset.confidenceStyle,
        horizon: preset.horizon,
        riskTolerance: preset.riskTolerance,
        behaviorNote: preset.behaviorNote
      }
    });
  }

  function resolveScenario() {
    const laneIds = selectedAgents.map((agent) => laneIdFor(agent));

    if (laneIds.includes('SIGNAL_HUNTER') && laneIds.includes('MOMENTUM_RIDER')) {
      return EVAL_SCENARIO_TEMPLATES.find((scenario) => scenario.id === 'btc-breakout-pulse') ?? EVAL_SCENARIO_TEMPLATES[0];
    }

    if (laneIds.includes('PATTERN_ORACLE') && laneIds.includes('RISK_GUARDIAN')) {
      return EVAL_SCENARIO_TEMPLATES.find((scenario) => scenario.id === 'eth-range-fade') ?? EVAL_SCENARIO_TEMPLATES[0];
    }

    if (laneIds.includes('BREAKER')) {
      return EVAL_SCENARIO_TEMPLATES.find((scenario) => scenario.id === 'sol-onchain-chase') ?? EVAL_SCENARIO_TEMPLATES[0];
    }

    return EVAL_SCENARIO_TEMPLATES.find((scenario) => scenario.id === 'btc-macro-defense') ?? EVAL_SCENARIO_TEMPLATES[0];
  }

  function resolveTeamDoctrine(): string {
    if (selectedAgents.length === 0) {
      return '먼저 Home에서 여러 에이전트를 집어 현재 squad를 구성하세요.';
    }

    if (aggressiveCount >= 2) {
      return '지금 스쿼드는 속도와 압력을 우선합니다. Lab에서는 breakout continuation과 short-horizon benchmark를 먼저 돌리는 편이 맞습니다.';
    }

    if (conservativeCount >= 2) {
      return '지금 스쿼드는 방어와 정합성을 우선합니다. Lab에서는 macro/range benchmark로 invalidation 품질을 먼저 확인해야 합니다.';
    }

    return '지금 스쿼드는 균형형입니다. 첫 백테스트에서 baseline을 잡고, 그 다음 delta가 가장 큰 agent부터 집중 튜닝하는 흐름이 맞습니다.';
  }
</script>

<svelte:head>
  <title>MAXIDOGE Setup</title>
</svelte:head>

<div class="page">
  <header class="header">
    <div>
      <p class="eyebrow">SETUP / GROWTH DRAFT</p>
      <h1>여기서 build를 잠근다.</h1>
      <p class="lede">
        lane, posture, squad tactic을 먼저 잠그고 바로 Lab으로 넘깁니다. 여기서의 결정이 다음 delta를 만듭니다.
      </p>
    </div>
    <div class="header-actions">
      <a href="/">Home</a>
      <a href="/lab">Lab</a>
      <a href="/battle">Arena</a>
      <select value={squad.activeSquad.tacticPreset} onchange={(event) => setSquadTacticPreset((event.currentTarget as HTMLSelectElement).value as typeof squad.activeSquad.tacticPreset)}>
        <option value="BALANCED">BALANCED</option>
        <option value="TREND">TREND</option>
        <option value="DEFENSIVE">DEFENSIVE</option>
        <option value="EXPERIMENTAL">EXPERIMENTAL</option>
      </select>
    </div>
  </header>

  <section class="flow-strip">
    <article class="flow-card">
      <span>01</span>
      <strong>Home</strong>
      <small>{selectedAgents.length}/4 pinned</small>
    </article>
    <article class="flow-card active">
      <span>02</span>
      <strong>Setup</strong>
      <small>lane and tactic locked</small>
    </article>
    <article class="flow-card">
      <span>03</span>
      <strong>Lab</strong>
      <small>{recommendedScenario.label}</small>
    </article>
    <article class="flow-card">
      <span>04</span>
      <strong>Arena</strong>
      <small>prove after delta</small>
    </article>
  </section>

  <section class="decision-top">
    <PokemonFrame variant="accent" padding="16px">
      <section class="summary-panel">
        <div>
          <p class="eyebrow">CURRENT SETUP</p>
          <h2>{selectedNames.join(', ') || 'No agents selected'}</h2>
        </div>
        <div class="summary-copy">
          <strong>{selectedAgents.length}/4 locked for setup</strong>
          <p>{teamDoctrine}</p>
        </div>
      </section>
    </PokemonFrame>

    <section class="summary-grid">
      <PokemonFrame variant="dark" padding="14px">
        <div class="summary-card">
          <span>Squad Synergy</span>
          <strong>{synergy.score}</strong>
          <small>{synergy.notes[0]}</small>
        </div>
      </PokemonFrame>

      <PokemonFrame variant="dark" padding="14px">
        <div class="summary-card">
          <span>Recommended Lab Pack</span>
          <strong>{recommendedScenario.label}</strong>
          <small>{recommendedScenario.symbol} · {recommendedScenario.timeframe}</small>
        </div>
      </PokemonFrame>

      <PokemonFrame variant="accent" padding="14px">
        <div class="summary-card">
          <span>Squad Tactic</span>
          <strong>{squad.activeSquad.tacticPreset}</strong>
          <small>{aggressiveCount} aggr · {conservativeCount} def</small>
        </div>
      </PokemonFrame>
    </section>
  </section>

  <section class="slot-grid">
    {#each roleSlots as [label, agentId]}
      {@const assigned = agentId ? roster.agents.find((agent) => agent.id === agentId) ?? null : null}
      <PokemonFrame variant={assigned ? 'accent' : 'dark'} padding="14px">
        <article class="slot-card">
          <span>{label}</span>
          <strong>{assigned?.name ?? 'Empty Slot'}</strong>
          <small>{assigned ? `${assigned.loadout.readout} · ${laneFor(assigned).shortLabel}` : 'Select an owned agent with this role.'}</small>
          {#if assigned}
            <a href={`/agent/${assigned.id}`}>Open HQ</a>
          {/if}
        </article>
      </PokemonFrame>
    {/each}
  </section>

  {#if selectedAgents.length > 0}
    <section class="growth-board">
      {#each selectedAgents as agent (agent.id)}
        {@const activeLaneId = laneIdFor(agent)}
        {@const activePreset = activePresetFor(agent)}
        <PokemonFrame variant="dark" padding="16px">
          <article class="growth-card">
            <div class="growth-head">
              <div>
                <p class="eyebrow">{agent.role}</p>
                <h2>{agent.name}</h2>
              </div>
              <span class="lane-pill" style:color={laneFor(agent).accent}>{laneFor(agent).label}</span>
            </div>

            <p class="support-copy">{laneFor(agent).summary}</p>

            <div class="preset-grid">
              {#each BUILD_PRESETS as preset (preset.id)}
                <button
                  class:selected={preset.id === activePreset}
                  class="preset-card"
                  type="button"
                  onclick={() => applyBuildPreset(agent, preset)}
                >
                  <div class="preset-head">
                    <strong>{preset.label}</strong>
                    <span>{preset.confidenceStyle} · {preset.horizon}</span>
                  </div>
                  <p>{preset.copy}</p>
                </button>
              {/each}
            </div>

            <div class="lane-grid">
              {#each GROWTH_LANES as lane (lane.id)}
                <button
                  class:selected={lane.id === activeLaneId}
                  class="lane-option"
                  type="button"
                  onclick={() => applyGrowthLane(agent.id, lane.id)}
                >
                  <div class="lane-label">
                    <strong>{lane.label}</strong>
                    <span>{lane.focusSkill}</span>
                  </div>
                  <p>{lane.summary}</p>
                </button>
              {/each}
            </div>
          </article>
        </PokemonFrame>
      {/each}
    </section>
  {/if}

  <PokemonFrame variant="dark" padding="18px">
    <section class="builder-wrap">
      <div class="section-head">
        <div>
          <p class="eyebrow">SQUAD SELECTION</p>
          <h2>후보 교체</h2>
        </div>
        <a class="launch-link" href="/lab">Open Lab With This Setup</a>
      </div>
      <TeamBuilder agents={roster.agents} selectedIds={squad.activeSquad.memberAgentIds} onToggle={toggleSquadAgent} />
    </section>
  </PokemonFrame>
</div>

<style>
  .page,
  .summary-panel,
  .growth-card,
  .slot-card,
  .builder-wrap {
    display: grid;
    gap: 18px;
  }

  .page {
    gap: 20px;
  }

  .header,
  .header-actions,
  .growth-head,
  .section-head,
  .preset-head {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: end;
  }

  .summary-grid,
  .slot-grid,
  .growth-board,
  .lane-grid,
  .preset-grid,
  .flow-strip,
  .decision-top {
    display: grid;
    gap: 14px;
  }

  .decision-top {
    grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
    align-items: stretch;
  }

  .flow-strip {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .slot-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .growth-board {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .lane-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .preset-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .eyebrow,
  .slot-card span,
  .slot-card small,
  .lane-pill,
  .lane-label span,
  .preset-head span,
  .summary-card span {
    margin: 0;
    color: var(--text-2);
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  h1,
  h2,
  .flow-card strong {
    margin: 0;
    font-family: 'Orbitron', sans-serif;
  }

  h1 {
    font-size: clamp(36px, 5vw, 58px);
    line-height: 0.92;
  }

  h2 {
    font-size: 28px;
  }

  .lede,
  .support-copy,
  .summary-copy p,
  .lane-option p,
  .preset-card p,
  .flow-card small {
    margin: 0;
    color: var(--text-1);
    font-size: 16px;
    line-height: 1.5;
  }

  .summary-copy,
  .lane-label,
  .summary-card {
    display: grid;
    gap: 8px;
  }

  .summary-copy strong,
  .summary-card strong {
    font-size: 22px;
  }

  .flow-card {
    display: grid;
    gap: 4px;
    padding: 10px 12px;
    border-radius: 18px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.03);
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

  .header-actions {
    flex-wrap: wrap;
  }

  .header-actions a,
  .header-actions select,
  .slot-card a,
  .launch-link {
    display: inline-flex;
    align-items: center;
    min-height: 46px;
    padding: 0 14px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.04);
    color: var(--text-0);
    text-decoration: none;
  }

  .slot-card {
    min-height: 104px;
  }

  .preset-card,
  .lane-option {
    display: grid;
    gap: 10px;
    padding: 14px;
    border-radius: 18px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.03);
    color: var(--text-0);
    text-align: left;
    transition: border-color 160ms ease, background 160ms ease, transform 160ms ease;
  }

  .preset-card:hover,
  .preset-card.selected,
  .lane-option:hover,
  .lane-option.selected {
    transform: translateY(-1px);
    border-color: rgba(223, 161, 129, 0.32);
    background: linear-gradient(180deg, rgba(223, 161, 129, 0.12), rgba(255,255,255,0.02));
  }

  @media (max-width: 1080px) {
    .growth-board,
    .summary-grid,
    .flow-strip,
    .decision-top {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 960px) {
    .slot-grid,
    .preset-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 720px) {
    .header,
    .section-head,
    .preset-head {
      flex-direction: column;
      align-items: stretch;
    }

    .slot-grid,
    .lane-grid,
    .preset-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
