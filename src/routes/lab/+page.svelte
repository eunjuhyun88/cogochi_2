<script lang="ts">
  import { onMount } from 'svelte';
  import type { OwnedAgent } from '$lib/aimon/types';
  import PokemonFrame from '../../components/shared/PokemonFrame.svelte';
  import { aimonDexById } from '$lib/aimon/data/aimonDex';
  import { createEvalScenario } from '$lib/aimon/data/evalScenarios';
  import { getEvolutionPreview } from '$lib/aimon/engine/evolutionSystem';
  import { setScreen } from '$lib/aimon/stores/gameStore';
  import { labStore } from '$lib/aimon/stores/labStore';
  import { matchStore } from '$lib/aimon/stores/matchStore';
  import { playerStore } from '$lib/aimon/stores/playerStore';
  import { rosterStore } from '$lib/aimon/stores/rosterStore';
  import { squadStore } from '$lib/aimon/stores/squadStore';

  let player = $derived($playerStore);
  let roster = $derived($rosterStore);
  let squad = $derived($squadStore);
  let lab = $derived($labStore);
  let matches = $derived($matchStore);
  let selectedScenario = $derived(matches.activeScenario ?? createEvalScenario(matches.selectedScenarioId));

  let totalXp = $derived(roster.agents.reduce((sum, agent) => sum + agent.xp, 0));
  let selectedTeam = $derived(
    squad.activeSquad.memberAgentIds
      .map((id) => roster.agents.find((agent) => agent.id === id))
      .filter((agent): agent is OwnedAgent => Boolean(agent))
  );
  let queuedRuns = $derived(lab.trainingRuns.slice(0, 6));
  let promptVariants = $derived(lab.promptVariants.slice(0, 8));
  let recentDatasetBundles = $derived(lab.datasetBundles.slice(0, 5));
  let recentArtifacts = $derived(lab.modelArtifacts.slice(0, 4));
  let doctrineCount = $derived(
    lab.memoryBanks.reduce((sum, bank) => sum + bank.records.filter((record) => record.kind === 'USER_NOTE').length, 0)
  );
  let memoryCardCount = $derived(lab.memoryBanks.reduce((sum, bank) => sum + bank.records.length, 0));
  let recentLessons = $derived(matches.recentResults.slice(0, 4));
  let recentBenchmarkRuns = $derived(matches.recentBenchmarkRuns.slice(0, 4));
  let recentLineage = $derived(lab.artifactLineage.slice(0, 4));
  let memoryOverview = $derived(
    selectedTeam.map((agent) => ({
      agent,
      entry: aimonDexById[agent.speciesId] ?? null,
      memoryBank: lab.memoryBanks.find((bank) => bank.agentId === agent.id || bank.id === agent.memoryBankId) ?? null,
      evolution: getEvolutionPreview(agent.speciesId, agent.xp)
    }))
  );

  onMount(() => {
    setScreen('lab');
  });

  function formatDate(timestamp?: number): string {
    if (!timestamp) return 'No record';
    return new Date(timestamp).toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
</script>

<svelte:head>
  <title>AI MON Growth Lab</title>
</svelte:head>

<div class="page">
  <header class="header">
    <div>
      <p class="eyebrow">GROWTH LAB</p>
      <h1>Agent Training Ops</h1>
      <p class="lede">
        이 화면은 XP만 보는 곳이 아니라 prompt variant, training queue, doctrine memory, recent eval lessons를 같이 운영하는 랩 콘솔입니다.
      </p>
    </div>
    <div class="header-actions">
      <a href="/roster">Roster</a>
      <a href="/team">Team</a>
      <a href="/battle">Run Eval</a>
    </div>
  </header>

  <section class="summary-grid">
    <PokemonFrame variant="dark" padding="14px">
      <div class="summary-card">
        <span>Total XP</span>
        <strong>{totalXp}</strong>
        <small>{player.battleCount} battles · {player.wins} wins</small>
      </div>
    </PokemonFrame>

    <PokemonFrame variant="dark" padding="14px">
      <div class="summary-card">
        <span>Queued Runs</span>
        <strong>{lab.trainingRuns.length}</strong>
        <small>{lab.datasetBundles.length} dataset bundles · {lab.modelArtifacts.length} artifacts</small>
      </div>
    </PokemonFrame>

    <PokemonFrame variant="dark" padding="14px">
      <div class="summary-card">
        <span>Memory Cards</span>
        <strong>{memoryCardCount}</strong>
        <small>{doctrineCount} user doctrine notes</small>
      </div>
    </PokemonFrame>

    <PokemonFrame variant="accent" padding="14px">
      <div class="summary-card">
        <span>Eval Preset</span>
        <strong>{selectedScenario.label}</strong>
        <small>{selectedScenario.symbol} · {selectedScenario.timeframe} · {selectedTeam.length}/4 active squad agents tracked</small>
      </div>
    </PokemonFrame>
  </section>

  <section class="grid two-up">
    <PokemonFrame variant="dark" padding="16px">
      <section class="panel">
        <div class="section-head">
          <h2>Training Queue</h2>
          <span>{queuedRuns.length} recent</span>
        </div>
        <div class="list">
          {#if queuedRuns.length > 0}
            {#each queuedRuns as run (run.id)}
              {@const agent = roster.agents.find((item) => item.id === run.agentId)}
              <article class="list-card">
                <div class="list-head">
                  <strong>{run.type}</strong>
                  <span>{run.state}</span>
                </div>
                <p>{run.hypothesis}</p>
                <small>{agent?.name ?? 'Unknown agent'} · {run.benchmarkPackId} · {run.changes.join(' / ') || 'No delta recorded'}</small>
              </article>
            {/each}
          {:else}
            <p class="empty-copy">No training runs queued yet. Save a prompt snapshot or queue a tuning run from an agent console.</p>
          {/if}
        </div>
      </section>
    </PokemonFrame>

    <PokemonFrame variant="dark" padding="16px">
      <section class="panel">
        <div class="section-head">
          <h2>Prompt Variant Vault</h2>
          <span>{promptVariants.length} saved</span>
        </div>
        <div class="list">
          {#if promptVariants.length > 0}
            {#each promptVariants as variant (variant.id)}
              {@const agent = roster.agents.find((item) => item.id === variant.agentId)}
              <article class="list-card">
                <div class="list-head">
                  <strong>{variant.label}</strong>
                  <span>{formatDate(variant.createdAt)}</span>
                </div>
                <p>{agent?.name ?? 'Unknown agent'} · {variant.systemPrompt.slice(0, 120)}{variant.systemPrompt.length > 120 ? '…' : ''}</p>
                <small>{variant.rolePrompt.slice(0, 96)}{variant.rolePrompt.length > 96 ? '…' : ''}</small>
              </article>
            {/each}
          {:else}
            <p class="empty-copy">No prompt variants saved yet.</p>
          {/if}
        </div>
      </section>
    </PokemonFrame>
  </section>

  <section class="panel-section">
    <div class="section-head">
      <div>
        <p class="eyebrow">ACTIVE SQUAD MEMORY</p>
        <h2>Growth And Retrieval Health</h2>
      </div>
    </div>

    <div class="cards">
      {#each memoryOverview as item (item.agent.id)}
        {#if item.entry}
          <PokemonFrame variant={item.evolution.canEvolve ? 'accent' : 'dark'} padding="14px">
            <article class="lab-card">
              <div>
                <span class="dex-no">{item.entry.dexNo} · {item.agent.role}</span>
                <h2 style:color={item.entry.color}>{item.agent.name}</h2>
                <p>{item.agent.loadout.readout}</p>
              </div>
              <div class="stats-grid">
                <span>XP</span><strong>{item.agent.xp}</strong>
                <span>Evolution</span><strong>{item.evolution.canEvolve ? 'READY' : item.evolution.evolvesTo ?? 'FINAL'}</strong>
                <span>Memory bank</span><strong>{item.memoryBank?.records.length ?? 0}/{item.memoryBank?.capacity ?? 0}</strong>
                <span>Compaction</span><strong>L{item.memoryBank?.compactionLevel ?? 0}</strong>
                <span>Last match</span><strong>{formatDate(item.agent.record.lastMatchAt)}</strong>
                <span>Top lesson</span><strong>{item.memoryBank?.records[0]?.title ?? 'No lessons yet'}</strong>
              </div>
              <div class="card-actions">
                <a href={`/agent/${item.agent.id}`}>Open Agent Console</a>
              </div>
            </article>
          </PokemonFrame>
        {/if}
      {/each}
    </div>
  </section>

  <section class="grid two-up">
    <PokemonFrame variant="dark" padding="16px">
      <section class="panel">
        <div class="section-head">
          <h2>Recent Eval Lessons</h2>
          <span>{recentLessons.length} matches</span>
        </div>
        <div class="list">
          {#if recentLessons.length > 0}
            {#each recentLessons as match (match.id)}
              <article class="list-card">
                <div class="list-head">
                  <strong>{match.outcome}</strong>
                  <span>{formatDate(match.createdAt)}</span>
                </div>
                <p>{match.reflections?.[0]?.lesson ?? match.lessons[0] ?? 'No lesson recorded.'}</p>
                <small>
                  {createEvalScenario(match.scenarioId, match.createdAt).label} · dataset {match.datasetBundleId ?? 'pending'} · {match.agentResults.map((result) => `${roster.agents.find((agent) => agent.id === result.agentId)?.name ?? 'Agent'}:${result.action}`).join(' / ')}
                </small>
              </article>
            {/each}
          {:else}
            <p class="empty-copy">No evaluation lessons yet.</p>
          {/if}
        </div>
      </section>
    </PokemonFrame>

    <PokemonFrame variant="dark" padding="16px">
      <section class="panel">
        <div class="section-head">
          <h2>Lab Inventory</h2>
          <span>Bindings and models</span>
        </div>
        <div class="stats-grid">
          <span>Base Models</span><strong>{lab.baseModels.length}</strong>
          <span>Data Sources</span><strong>{lab.dataSources.length}</strong>
          <span>Tools</span><strong>{lab.tools.length}</strong>
          <span>Memory Banks</span><strong>{lab.memoryBanks.length}</strong>
          <span>Dataset Bundles</span><strong>{lab.datasetBundles.length}</strong>
          <span>Artifacts</span><strong>{lab.modelArtifacts.length}</strong>
          <span>Prompt Variants</span><strong>{lab.promptVariants.length}</strong>
          <span>Training Runs</span><strong>{lab.trainingRuns.length}</strong>
        </div>
        <div class="list compact-list">
          {#if recentDatasetBundles.length > 0}
            {#each recentDatasetBundles as bundle (bundle.id)}
              <article class="list-card compact">
                <div class="list-head">
                  <strong>{bundle.benchmarkPackId}</strong>
                  <span>{formatDate(bundle.createdAt)}</span>
                </div>
                <p>{bundle.sftExamples.length} SFT · {bundle.preferenceExamples.length} preference · {bundle.agentIds.length} agents</p>
                <small>{bundle.sourceMatchId}</small>
              </article>
            {/each}
          {:else}
            <p class="empty-copy">No dataset bundles captured yet.</p>
          {/if}
        </div>
        <div class="list compact-list">
          {#if recentArtifacts.length > 0}
            {#each recentArtifacts as artifact (artifact.id)}
              <article class="list-card compact">
                <div class="list-head">
                  <strong>{artifact.kind}</strong>
                  <span>{artifact.status}</span>
                </div>
                <p>{artifact.label}</p>
                <small>{artifact.id}</small>
              </article>
            {/each}
          {/if}
        </div>
        <div class="chip-row">
          {#each lab.dataSources as source (source.id)}
            <span>{source.name}</span>
          {/each}
        </div>
      </section>
    </PokemonFrame>
  </section>

  <section class="grid two-up">
    <PokemonFrame variant="dark" padding="16px">
      <section class="panel">
        <div class="section-head">
          <h2>Benchmark Runs</h2>
          <span>{recentBenchmarkRuns.length} recent</span>
        </div>
        <div class="list">
          {#if recentBenchmarkRuns.length > 0}
            {#each recentBenchmarkRuns as run (run.runId)}
              <article class="list-card">
                <div class="list-head">
                  <strong>{run.profile}</strong>
                  <span>{run.authoritative ? 'AUTHORITATIVE' : 'DEBUG ONLY'}</span>
                </div>
                <p>{run.benchmarkPackId} · fallback {run.fallbackCount} · invalid JSON {run.invalidJsonCount}</p>
                <small>avg {run.averageLatencyMs}ms · p95 {run.p95LatencyMs}ms · manifest {run.runId}</small>
              </article>
            {/each}
          {:else}
            <p class="empty-copy">No benchmark run manifests captured yet.</p>
          {/if}
        </div>
      </section>
    </PokemonFrame>

    <PokemonFrame variant="dark" padding="16px">
      <section class="panel">
        <div class="section-head">
          <h2>Artifact Lineage</h2>
          <span>{recentLineage.length} recent</span>
        </div>
        <div class="list">
          {#if recentLineage.length > 0}
            {#each recentLineage as entry (entry.id)}
              <article class="list-card">
                <div class="list-head">
                  <strong>{entry.event}</strong>
                  <span>{formatDate(entry.createdAt)}</span>
                </div>
                <p>{entry.note}</p>
                <small>{entry.artifactId} · {entry.benchmarkPackId}</small>
              </article>
            {/each}
          {:else}
            <p class="empty-copy">No artifact lineage recorded yet.</p>
          {/if}
        </div>
      </section>
    </PokemonFrame>
  </section>
</div>

<style>
  .page {
    display: grid;
    gap: 18px;
    padding: 18px;
  }

  .header,
  .section-head,
  .list-head {
    display: flex;
    justify-content: space-between;
    gap: 14px;
    align-items: end;
  }

  .eyebrow,
  .list-head span,
  .summary-card span,
  .stats-grid span,
  .dex-no {
    margin: 0;
    color: var(--text-2);
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.08em;
  }

  h1,
  h2 {
    margin: 0;
    font-family: 'Orbitron', sans-serif;
  }

  h1 {
    margin-top: 6px;
    font-size: clamp(34px, 5vw, 56px);
    line-height: 0.96;
  }

  .lede,
  .lab-card p,
  .list-card p {
    margin: 0;
    color: var(--text-1);
    line-height: 1.45;
  }

  .header-actions,
  .card-actions,
  .chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .header-actions a,
  .card-actions a,
  .chip-row span {
    display: inline-flex;
    align-items: center;
    min-height: 36px;
    padding: 0 12px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.04);
    color: var(--text-0);
    text-decoration: none;
  }

  .summary-grid,
  .two-up {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .summary-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .summary-card,
  .panel,
  .lab-card,
  .list {
    display: grid;
    gap: 12px;
  }

  .summary-card strong {
    font-size: 30px;
  }

  .summary-card small,
  .list-card small,
  .empty-copy {
    color: var(--text-2);
    line-height: 1.4;
  }

  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 14px;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 10px 14px;
  }

  .list-card {
    display: grid;
    gap: 8px;
    padding: 14px;
    border-radius: 18px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.03);
  }

  .compact-list {
    margin-top: 8px;
  }

  .list-card.compact {
    gap: 6px;
    padding: 12px;
  }

  .panel-section {
    display: grid;
    gap: 14px;
  }

  @media (max-width: 1080px) {
    .summary-grid,
    .two-up {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 720px) {
    .page {
      padding: 14px;
    }

    .header,
    .section-head,
    .list-head {
      flex-direction: column;
      align-items: stretch;
    }
  }
</style>
