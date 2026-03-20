<script lang="ts">
  import { onMount } from 'svelte';
  import { getEvolutionPreview } from '$lib/aimon/engine/evolutionSystem';
  import { setScreen } from '$lib/aimon/stores/gameStore';
  import { rosterStore, selectRosterAgent } from '$lib/aimon/stores/rosterStore';
  import { squadStore } from '$lib/aimon/stores/squadStore';
  import AgentDetailPanel from '../../components/aimon/AgentDetailPanel.svelte';
  import RosterGrid from '../../components/aimon/RosterGrid.svelte';
  import PokemonFrame from '../../components/shared/PokemonFrame.svelte';

  let roster = $derived($rosterStore);
  let squad = $derived($squadStore);
  let rosterAgents = $derived(roster.agents);
  let evolutionReadyCount = $derived(
    rosterAgents.filter((agent) => getEvolutionPreview(agent.speciesId, agent.xp).canEvolve).length
  );

  $effect(() => {
    if (!rosterAgents.length) {
      selectRosterAgent(null);
      return;
    }

    if (!roster.selectedAgentId || !rosterAgents.some((agent) => agent.id === roster.selectedAgentId)) {
      selectRosterAgent(squad.activeSquad.memberAgentIds[0] ?? rosterAgents[0].id);
    }
  });

  let selectedAgent = $derived(rosterAgents.find((agent) => agent.id === roster.selectedAgentId) ?? null);
  let selectedEvolution = $derived(
    selectedAgent ? getEvolutionPreview(selectedAgent.speciesId, selectedAgent.xp) : null
  );

  onMount(() => {
    setScreen('roster');
  });
</script>

<svelte:head>
  <title>AI MON Roster</title>
</svelte:head>

<div class="page">
  <header class="header">
    <div>
      <p class="eyebrow">ROSTER CENTER</p>
      <h1>Owned Agents</h1>
      <p class="lede">누굴 키울지 고르고, 오른쪽에서 바로 세부 상태를 읽는 화면입니다.</p>
    </div>
    <div class="header-actions">
      <a href={selectedAgent ? `/agent/${selectedAgent.id}` : '/roster'}>Agent Console</a>
      <a href="/battle">Battle</a>
    </div>
  </header>

  <PokemonFrame variant="accent" padding="18px">
    <section class="overview">
      <div class="overview-copy">
        <p class="eyebrow">COLLECTION OVERVIEW</p>
        <h2>선택과 교체 판단만 먼저 보세요.</h2>
        <p class="lede">
          개별 카드에서 후보를 고르고, 선택된 에이전트의 retraining path와 evolution 상태를 바로 비교합니다.
        </p>
      </div>

      <div class="overview-stats">
        <article class="fact-card">
          <span>Owned</span>
          <strong>{rosterAgents.length}</strong>
          <small>Total agents</small>
        </article>
        <article class="fact-card">
          <span>Active Squad</span>
          <strong>{squad.activeSquad.memberAgentIds.length}/4</strong>
          <small>{squad.activeSquad.tacticPreset}</small>
        </article>
        <article class="fact-card">
          <span>Selected</span>
          <strong>{selectedAgent?.name ?? 'None'}</strong>
          <small>{selectedAgent?.loadout.focusSkill ?? 'Pick an agent'}</small>
        </article>
        <article class="fact-card">
          <span>Evolution</span>
          <strong>{selectedEvolution?.canEvolve ? 'Ready' : evolutionReadyCount}</strong>
          <small>{selectedEvolution?.evolvesTo ?? `${evolutionReadyCount} ready`}</small>
        </article>
      </div>
    </section>
  </PokemonFrame>

  <section class="content-grid">
    <section class="left-column">
      <div class="section-head">
        <div>
          <p class="eyebrow">COLLECTION GRID</p>
          <h2>후보 선택</h2>
        </div>
      </div>

      <RosterGrid
        agents={rosterAgents}
        selectedId={roster.selectedAgentId ?? ''}
        squadIds={squad.activeSquad.memberAgentIds}
        onSelect={selectRosterAgent}
      />
    </section>

    <section class="right-column">
      <div class="section-head">
        <div>
          <p class="eyebrow">SELECTED DETAIL</p>
          <h2>선택된 개체</h2>
        </div>
      </div>

      <AgentDetailPanel
        agent={selectedAgent}
        inSquad={selectedAgent ? squad.activeSquad.memberAgentIds.includes(selectedAgent.id) : false}
      />
    </section>
  </section>
</div>

<style>
  .page,
  .overview,
  .overview-copy,
  .left-column,
  .right-column,
  .fact-card {
    display: grid;
    gap: 16px;
  }

  .page {
    gap: 20px;
  }

  .header,
  .section-head {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: end;
  }

  .overview,
  .content-grid,
  .overview-stats {
    display: grid;
    gap: 16px;
  }

  .overview {
    grid-template-columns: minmax(0, 1fr) minmax(420px, 0.9fr);
    align-items: end;
  }

  .overview-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .content-grid {
    grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.95fr);
    align-items: start;
  }

  .eyebrow,
  .fact-card span,
  .fact-card small {
    margin: 0;
    color: var(--text-2);
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  h1,
  h2 {
    margin: 0;
    font-family: 'Orbitron', sans-serif;
  }

  h1 {
    font-size: clamp(40px, 7vw, 72px);
    line-height: 0.9;
  }

  h2 {
    font-size: 28px;
  }

  .lede {
    margin: 0;
    max-width: 62ch;
    color: var(--text-1);
    font-size: 16px;
    line-height: 1.5;
  }

  .header-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .header-actions a {
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

  .fact-card {
    padding: 14px 16px;
    border-radius: 18px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    background: rgba(255, 255, 255, 0.03);
  }

  .fact-card strong {
    font-size: 24px;
  }

  @media (max-width: 1080px) {
    .overview,
    .content-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 720px) {
    .header,
    .section-head {
      flex-direction: column;
      align-items: stretch;
    }

    .overview-stats {
      grid-template-columns: 1fr;
    }
  }
</style>
