<script lang="ts">
  import { onMount } from 'svelte';
  import type { OwnedAgent, TrainingRunType } from '$lib/aimon/types';
  import PokemonFrame from '../../components/shared/PokemonFrame.svelte';
  import { aimonDexById } from '$lib/aimon/data/aimonDex';
  import { EVAL_SCENARIO_TEMPLATES, createEvalScenario } from '$lib/aimon/data/evalScenarios';
  import { getDefaultGrowthLaneId, growthLaneById } from '$lib/aimon/data/growthLanes';
  import { getEvolutionPreview } from '$lib/aimon/engine/evolutionSystem';
  import {
    getAgentListingProgress,
    getAgentMonthlyFee,
    getAgentTrustScore
  } from '$lib/aimon/utils/agentMarket';
  import {
    type LocalBacktestSummary,
    runLocalBacktestSimulation
  } from '$lib/aimon/stores/localBacktestRunner';
  import { setScreen } from '$lib/aimon/stores/gameStore';
  import { labStore, queueTrainingRun } from '$lib/aimon/stores/labStore';
  import { matchStore, selectEvalScenario } from '$lib/aimon/stores/matchStore';
  import { playerStore } from '$lib/aimon/stores/playerStore';
  import { rosterStore } from '$lib/aimon/stores/rosterStore';
  import { squadStore } from '$lib/aimon/stores/squadStore';

  const modeOptions: Array<{ id: TrainingRunType; label: string; copy: string }> = [
    { id: 'PROMPT_TUNE', label: 'Prompt Tune', copy: '교리와 시스템 프롬프트를 조정합니다.' },
    { id: 'RETRIEVAL_TUNE', label: 'Retrieval Tune', copy: '기억 회수와 evidence fit을 다듬습니다.' },
    { id: 'LORA', label: 'LoRA Trial', copy: '로컬 proof artifact를 생성해 비교합니다.' }
  ];

  let backtestMode = $state<TrainingRunType>('PROMPT_TUNE');
  let backtestBusy = $state(false);
  let backtestError = $state('');
  let latestSummary = $state<LocalBacktestSummary | null>(null);

  let player = $derived($playerStore);
  let roster = $derived($rosterStore);
  let squad = $derived($squadStore);
  let lab = $derived($labStore);
  let matches = $derived($matchStore);
  let selectedScenario = $derived(matches.activeScenario ?? createEvalScenario(matches.selectedScenarioId));

  let selectedTeam = $derived(
    squad.activeSquad.memberAgentIds
      .map((id) => roster.agents.find((agent) => agent.id === id))
      .filter((agent): agent is OwnedAgent => Boolean(agent))
  );
  let queuedRuns = $derived(lab.trainingRuns.slice(0, 6));
  let recentDatasetBundles = $derived(lab.datasetBundles.slice(0, 4));
  let recentArtifacts = $derived(lab.modelArtifacts.slice(0, 4));
  let recentBenchmarkRuns = $derived(matches.recentBenchmarkRuns.slice(0, 4));
  let recentLessons = $derived(matches.recentResults.slice(0, 4));
  let latestRun = $derived(lab.trainingRuns[0] ?? null);
  let latestArtifact = $derived(lab.modelArtifacts[0] ?? null);
  let latestManifest = $derived(matches.recentBenchmarkRuns[0] ?? null);
  let memoryCardCount = $derived(lab.memoryBanks.reduce((sum, bank) => sum + bank.records.length, 0));
  let activeArtifactCount = $derived(lab.modelArtifacts.filter((artifact) => artifact.status === 'ACTIVE').length);
  let growthPrograms = $derived(
    selectedTeam.map((agent) => ({
      agent,
      lane: growthLaneById[agent.loadout.growthLaneId ?? getDefaultGrowthLaneId(agent.speciesId)]
    }))
  );
  let memoryOverview = $derived(
    selectedTeam.map((agent) => ({
      agent,
      entry: aimonDexById[agent.speciesId] ?? null,
      memoryBank: lab.memoryBanks.find((bank) => bank.agentId === agent.id || bank.id === agent.memoryBankId) ?? null,
      evolution: getEvolutionPreview(agent.speciesId, agent.xp)
    }))
  );
  let latestDeltaScore = $derived(
    latestRun?.metricsBefore && latestRun.metricsAfter
      ? Number((latestRun.metricsAfter.totalScore - latestRun.metricsBefore.totalScore).toFixed(2))
      : null
  );
  let latestReasonList = $derived(latestSummary?.reasons ?? []);
  let visibleReasonList = $derived(latestReasonList.slice(0, 2));
  let latestSummaryFocusAgentId = $derived(latestSummary?.focusAgentId ?? null);
  let focusAgent = $derived(
    latestSummaryFocusAgentId
      ? roster.agents.find((agent) => agent.id === latestSummaryFocusAgentId) ?? selectedTeam[0] ?? null
      : latestRun
        ? roster.agents.find((agent) => agent.id === latestRun.agentId) ?? selectedTeam[0] ?? null
        : selectedTeam[0] ?? null
  );
  let focusAgentMatches = $derived(
    focusAgent
      ? matches.recentResults.filter((result) => result.agentResults.some((row) => row.agentId === focusAgent.id))
      : []
  );
  let focusAgentListing = $derived(
    focusAgent
      ? getAgentListingProgress(focusAgent, focusAgentMatches)
      : {
          ready: false,
          completion: 0,
          currentWinRate: 0,
          currentMatches: 0,
          needs: []
        }
  );
  let focusAgentTrust = $derived(focusAgent ? getAgentTrustScore(focusAgent, focusAgentMatches) : 0);
  let focusAgentMonthlyFee = $derived(focusAgent ? getAgentMonthlyFee(focusAgent) : 0);
  let marketProjection = $derived(
    latestSummary && focusAgent
      ? (() => {
          const qualityDelta = Math.max(0, latestSummary.afterMetrics.totalScore - latestSummary.beforeMetrics.totalScore);
          const projectedTrust = Math.min(
            99,
            focusAgentTrust +
              Math.max(
                2,
                Math.round(
                  qualityDelta * 28 +
                    Math.max(0, latestSummary.afterMetrics.reasoningScore - latestSummary.beforeMetrics.reasoningScore) * 18 +
                    Math.max(0, latestSummary.afterMetrics.accuracyScore - latestSummary.beforeMetrics.accuracyScore) * 16
                )
              )
          );
          const projectedFee = Math.max(
            focusAgentMonthlyFee,
            focusAgentMonthlyFee + Math.max(4, Math.round(qualityDelta * 72))
          );

          return {
            qualityLift: Math.round(qualityDelta * 100),
            projectedTrust,
            projectedFee,
            gateHeadline: focusAgentListing.ready
              ? '하드 gate는 이미 열려 있습니다. 이제 fee band와 trust premium을 더 키우는 단계입니다.'
              : `하드 gate는 ${focusAgentListing.completion}% 상태입니다. ${focusAgentListing.needs[0] ?? 'arena proof'}를 먼저 채워야 실제 listing으로 이어집니다.`
          };
        })()
      : null
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

  function formatMetric(value?: number): string {
    if (typeof value !== 'number') return '--';
    return `${Math.round(value * 100)}`;
  }

  function queueGrowthDrill(agent: OwnedAgent): void {
    const lane = growthLaneById[agent.loadout.growthLaneId ?? getDefaultGrowthLaneId(agent.speciesId)];
    queueTrainingRun(
      agent.id,
      'PROMPT_TUNE',
      `${lane.label} growth drill for ${agent.name}`,
      [lane.retrainingPath, lane.focusSkill, `risk:${agent.loadout.riskTolerance}`]
    );
  }

  async function runBacktest(): Promise<void> {
    if (selectedTeam.length === 0 || backtestBusy) return;

    backtestBusy = true;
    backtestError = '';

    try {
      latestSummary = await runLocalBacktestSimulation({
        scenarioId: selectedScenario.id,
        agentIds: selectedTeam.map((agent) => agent.id),
        focusAgentId: selectedTeam[0]?.id,
        type: backtestMode
      });
    } catch (error) {
      backtestError = error instanceof Error ? error.message : 'Local backtest failed.';
    } finally {
      backtestBusy = false;
    }
  }
</script>

<svelte:head>
  <title>MAXIDOGE Backtest Lab</title>
</svelte:head>

<div class="page">
  <header class="header">
    <div>
      <p class="eyebrow">BACKTEST LAB</p>
      <h1>여기서는 실제로 돌리고, 바로 비교한다.</h1>
      <p class="lede">
        선택한 스쿼드를 바로 돌리고, 결과가 다음 proof와 market effect로 어떻게 이어지는지 즉시 확인합니다.
      </p>
    </div>
    <div class="header-actions">
      <a href="/">Deck</a>
      <a href="/team">Growth Draft</a>
      <a href="/battle">Battle Proof</a>
    </div>
  </header>

  <section class="flow-strip">
    <article class="flow-card">
      <span>01</span>
      <strong>Team Ready</strong>
      <small>{selectedTeam.length}/4 loaded</small>
    </article>
    <article class="flow-card active">
      <span>02</span>
      <strong>Run Backtest</strong>
      <small>{selectedScenario.label} · {backtestMode}</small>
    </article>
    <article class="flow-card">
      <span>03</span>
      <strong>Battle Proof</strong>
      <small>verify under live pressure</small>
    </article>
  </section>

  <PokemonFrame variant="accent" padding="18px">
    <section class="command-board">
      <div class="command-copy">
        <div class="section-head">
          <div>
            <p class="eyebrow">RUN LOCAL BACKTEST</p>
            <h2>선택한 스쿼드를 지금 테스트한다.</h2>
          </div>
          <span class="section-pill">{selectedScenario.symbol} · {selectedScenario.timeframe}</span>
        </div>

        <p class="support-copy">
          시나리오와 튜닝 모드를 고르면 바로 실행됩니다. 결과는 proof artifact와 market effect forecast로 바로 연결됩니다.
        </p>

        <div class="scenario-picker">
          {#each EVAL_SCENARIO_TEMPLATES as scenario (scenario.id)}
            <button
              type="button"
              class:selected={scenario.id === selectedScenario.id}
              onclick={() => selectEvalScenario(scenario.id)}
            >
              <strong>{scenario.label}</strong>
              <small>{scenario.symbol} · {scenario.timeframe} · {scenario.targetRegime}</small>
            </button>
          {/each}
        </div>

        <div class="mode-row">
          {#each modeOptions as option (option.id)}
            <button
              type="button"
              class:selected={option.id === backtestMode}
              onclick={() => (backtestMode = option.id)}
            >
              <strong>{option.label}</strong>
              <small>{option.copy}</small>
            </button>
          {/each}
        </div>

        <div class="team-strip">
          {#if selectedTeam.length > 0}
            {#each selectedTeam as agent (agent.id)}
              {@const lane = growthLaneById[agent.loadout.growthLaneId ?? getDefaultGrowthLaneId(agent.speciesId)]}
              <article class="team-pill" style={`--lane-accent:${lane.accent};`}>
                <strong>{agent.name}</strong>
                <small>{agent.role} · {lane.shortLabel} · {agent.loadout.focusSkill}</small>
              </article>
            {/each}
          {:else}
            <div class="empty-state inline-empty">
              <p>스쿼드가 비어 있습니다. 먼저 team에서 성장 방향을 고른 뒤 돌아오세요.</p>
              <a href="/team">Open Growth Draft</a>
            </div>
          {/if}
        </div>

        <div class="command-actions">
          <button type="button" class="run-button" disabled={selectedTeam.length === 0 || backtestBusy} onclick={runBacktest}>
            {backtestBusy ? 'Running Local Backtest…' : 'Run Local Backtest'}
          </button>
          <a href="/battle">Open Battle Proof</a>
        </div>

        {#if backtestError}
          <p class="error-copy">{backtestError}</p>
        {/if}
      </div>

      <div class="result-pane">
        <div class="section-head">
          <div>
            <p class="eyebrow">LATEST RESULT</p>
            <h2>{latestSummary?.scenarioLabel ?? latestRun?.benchmarkPackId ?? 'No run yet'}</h2>
          </div>
          <span class="section-pill">{latestSummary?.profile ?? latestManifest?.profile ?? 'READY'}</span>
        </div>

        {#if latestSummary}
          <p class="support-copy">{latestSummary.headline}</p>
          <div class="metric-grid">
            <div>
              <span>Before</span>
              <strong>{formatMetric(latestSummary.beforeMetrics.totalScore)}</strong>
            </div>
            <div>
              <span>After</span>
              <strong>{formatMetric(latestSummary.afterMetrics.totalScore)}</strong>
            </div>
            <div>
              <span>Samples</span>
              <strong>{latestSummary.sampleCount}</strong>
            </div>
            <div>
              <span>Latency</span>
              <strong>{latestSummary.latencyMs}ms</strong>
            </div>
          </div>

          <div class="reason-list">
            {#each visibleReasonList as reason (reason)}
              <article class="reason-card">{reason}</article>
            {/each}
          </div>

          <div class="result-links">
            <span>artifact {latestSummary.artifactId}</span>
            <span>manifest {latestSummary.manifestId}</span>
          </div>

          {#if marketProjection && focusAgent}
            <div class="forecast-panel">
              <div class="section-head">
                <div>
                  <p class="eyebrow">MARKET EFFECT</p>
                  <h3>{focusAgent.name} asset projection</h3>
                </div>
                <span class="section-pill">{focusAgentListing.completion}% HARD GATE</span>
              </div>

              <p class="support-copy">{marketProjection.gateHeadline}</p>

              <div class="metric-grid forecast-grid">
                <div>
                  <span>Quality Lift</span>
                  <strong>+{marketProjection.qualityLift}</strong>
                </div>
                <div>
                  <span>Trust</span>
                  <strong>{focusAgentTrust} → {marketProjection.projectedTrust}</strong>
                </div>
                <div>
                  <span>Fee Forecast</span>
                  <strong>${focusAgentMonthlyFee} → ${marketProjection.projectedFee}</strong>
                </div>
                <div>
                  <span>Proof Gate</span>
                  <strong>{focusAgentListing.currentMatches}/5</strong>
                </div>
              </div>

              {#if focusAgentListing.needs.length > 0}
                <div class="result-links">
                  {#each focusAgentListing.needs as need (need)}
                    <span>{need}</span>
                  {/each}
                </div>
              {/if}
            </div>
          {/if}
        {:else if latestRun?.metricsAfter}
          <p class="support-copy">최근 실행 기록이 있습니다. 새 backtest를 돌리면 이 패널에 즉시 diff가 표시됩니다.</p>
          <div class="metric-grid">
            <div>
              <span>Type</span>
              <strong>{latestRun.type}</strong>
            </div>
            <div>
              <span>State</span>
              <strong>{latestRun.state}</strong>
            </div>
            <div>
              <span>Delta</span>
              <strong>{latestDeltaScore !== null ? `${latestDeltaScore >= 0 ? '+' : ''}${latestDeltaScore}` : '--'}</strong>
            </div>
            <div>
              <span>Artifact</span>
              <strong>{latestRun.resultArtifactId ? 'READY' : 'PENDING'}</strong>
            </div>
          </div>
        {:else}
          <div class="empty-state result-empty">
            <p>아직 돌린 백테스트가 없습니다. 위에서 시나리오를 고른 뒤 바로 실행하세요.</p>
          </div>
        {/if}
      </div>
    </section>
  </PokemonFrame>

  <section class="summary-grid">
    <PokemonFrame variant="dark" padding="14px">
      <div class="summary-card">
        <span>Selected Scenario</span>
        <strong>{selectedScenario.label}</strong>
        <small>{selectedScenario.objective}</small>
      </div>
    </PokemonFrame>

    <PokemonFrame variant="dark" padding="14px">
      <div class="summary-card">
        <span>Queue</span>
        <strong>{lab.trainingRuns.length}</strong>
        <small>{queuedRuns[0]?.state ?? 'READY'} · {queuedRuns[0]?.type ?? 'No pending run'}</small>
      </div>
    </PokemonFrame>

    <PokemonFrame variant="dark" padding="14px">
      <div class="summary-card">
        <span>Proof Artifact</span>
        <strong>{activeArtifactCount}</strong>
        <small>{latestArtifact?.label ?? 'No active artifact'}</small>
      </div>
    </PokemonFrame>

    <PokemonFrame variant="accent" padding="14px">
      <div class="summary-card">
        <span>Trainer State</span>
        <strong>Lv.{player.trainerLevel}</strong>
        <small>{player.battleCount} battles · {memoryCardCount} memory cards</small>
      </div>
    </PokemonFrame>
  </section>

  <section class="grid two-up">
    <PokemonFrame variant="dark" padding="16px">
      <section class="panel">
        <div class="section-head">
          <div>
            <p class="eyebrow">TRAINING QUEUE</p>
            <h2>지금 돌아간 실행 기록</h2>
          </div>
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
                <small>
                  {agent?.name ?? 'Unknown agent'} · {run.benchmarkPackId} · {run.changes.join(' / ') || 'No delta recorded'}
                </small>
              </article>
            {/each}
          {:else}
            <p class="empty-copy">아직 queue가 비어 있습니다.</p>
          {/if}
        </div>
      </section>
    </PokemonFrame>

    <PokemonFrame variant="dark" padding="16px">
      <section class="panel">
        <div class="section-head">
          <div>
            <p class="eyebrow">BENCHMARK PROOF</p>
            <h2>manifest와 artifact</h2>
          </div>
          <span>{recentBenchmarkRuns.length} runs</span>
        </div>

        <div class="list">
          {#if recentBenchmarkRuns.length > 0}
            {#each recentBenchmarkRuns as run (run.runId)}
              <article class="list-card">
                <div class="list-head">
                  <strong>{run.profile}</strong>
                  <span>{run.authoritative ? 'AUTHORITATIVE' : 'LOCAL'}</span>
                </div>
                <p>{run.benchmarkPackId} · avg {run.averageLatencyMs}ms · trace {Math.round(run.traceValidityRate * 100)}%</p>
                <small>{run.runId}</small>
              </article>
            {/each}
          {:else}
            <p class="empty-copy">아직 benchmark proof가 없습니다.</p>
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
      </section>
    </PokemonFrame>
  </section>

  <section class="panel-section">
    <div class="section-head">
      <div>
        <p class="eyebrow">ACTIVE SQUAD PROGRAM</p>
        <h2>성장 방향별 훈련 드릴</h2>
      </div>
      <span>{growthPrograms.length} active agents</span>
    </div>

    <div class="cards">
      {#each growthPrograms as item (item.agent.id)}
        <article class="program-card" style={`--lane-accent:${item.lane.accent};`}>
          <div>
            <span class="dex-no">{item.agent.role}</span>
            <h2>{item.agent.name}</h2>
            <p>{item.lane.summary}</p>
          </div>
          <div class="chip-row">
            <span>{item.lane.label}</span>
            <span>{item.lane.focusSkill}</span>
            <span>{item.lane.retrainingPath}</span>
          </div>
          <button type="button" class="queue-button" onclick={() => queueGrowthDrill(item.agent)}>
            Queue Drill
          </button>
        </article>
      {/each}
    </div>
  </section>

  <section class="grid two-up">
    <PokemonFrame variant="dark" padding="16px">
      <section class="panel">
        <div class="section-head">
          <div>
            <p class="eyebrow">SQUAD MEMORY</p>
            <h2>retrieval health</h2>
          </div>
          <span>{memoryOverview.length} banks</span>
        </div>

        <div class="cards stack">
          {#each memoryOverview as item (item.agent.id)}
            {#if item.entry}
              <article class="memory-card">
                <div>
                  <span class="dex-no">{item.entry.dexNo} · {item.agent.role}</span>
                  <h3 style:color={item.entry.color}>{item.agent.name}</h3>
                  <p>{item.agent.loadout.readout}</p>
                </div>
                <div class="stats-grid">
                  <span>Growth lane</span><strong>{growthLaneById[item.agent.loadout.growthLaneId ?? getDefaultGrowthLaneId(item.agent.speciesId)].label}</strong>
                  <span>XP</span><strong>{item.agent.xp}</strong>
                  <span>Evolution</span><strong>{item.evolution.canEvolve ? 'READY' : item.evolution.evolvesTo ?? 'FINAL'}</strong>
                  <span>Memory bank</span><strong>{item.memoryBank?.records.length ?? 0}/{item.memoryBank?.capacity ?? 0}</strong>
                </div>
              </article>
            {/if}
          {/each}
        </div>
      </section>
    </PokemonFrame>

    <PokemonFrame variant="dark" padding="16px">
      <section class="panel">
        <div class="section-head">
          <div>
            <p class="eyebrow">RECENT LESSONS</p>
            <h2>최근 배틀에서 가져온 학습</h2>
          </div>
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
                <small>{createEvalScenario(match.scenarioId, match.createdAt).label} · dataset {match.datasetBundleId ?? 'pending'}</small>
              </article>
            {/each}
          {:else}
            <p class="empty-copy">아직 배틀 lesson이 없습니다.</p>
          {/if}
        </div>

        <div class="list compact-list">
          {#if recentDatasetBundles.length > 0}
            {#each recentDatasetBundles as bundle (bundle.id)}
              <article class="list-card compact">
                <div class="list-head">
                  <strong>{bundle.benchmarkPackId}</strong>
                  <span>{formatDate(bundle.createdAt)}</span>
                </div>
                <p>{bundle.sftExamples.length} SFT · {bundle.preferenceExamples.length} preference</p>
                <small>{bundle.sourceMatchId}</small>
              </article>
            {/each}
          {/if}
        </div>
      </section>
    </PokemonFrame>
  </section>
</div>

<style>
  .page,
  .panel,
  .command-copy,
  .result-pane,
  .memory-card,
  .summary-card,
  .program-card {
    display: grid;
    gap: 14px;
  }

  .page {
    gap: 16px;
    padding: 14px 18px 24px;
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
  .dex-no,
  .section-pill,
  .result-links span {
    margin: 0;
    color: var(--text-2);
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  h1,
  h2,
  h3 {
    margin: 0;
    font-family: 'Orbitron', sans-serif;
  }

  h1 {
    margin-top: 6px;
    font-size: clamp(34px, 5vw, 56px);
    line-height: 0.96;
  }

  h2 {
    font-size: clamp(22px, 3vw, 30px);
  }

  h3 {
    font-size: 20px;
  }

  .lede,
  .support-copy,
  .memory-card p,
  .list-card p,
  .program-card p,
  .reason-card,
  .empty-state p {
    margin: 0;
    color: var(--text-1);
    font-size: 16px;
    line-height: 1.5;
  }

  .header-actions,
  .chip-row,
  .command-actions,
  .result-links {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .header-actions a,
  .command-actions a,
  .empty-state a,
  .chip-row span,
  .result-links span {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0 12px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.04);
    color: var(--text-0);
    text-decoration: none;
  }

  .flow-strip,
  .summary-grid,
  .two-up,
  .scenario-picker,
  .mode-row,
  .metric-grid,
  .reason-list,
  .cards,
  .stats-grid {
    display: grid;
    gap: 14px;
  }

  .flow-strip {
    grid-template-columns: repeat(3, minmax(0, 1fr));
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

  .flow-card strong {
    font-family: 'Orbitron', sans-serif;
    font-size: 16px;
  }

  .command-board {
    display: grid;
    grid-template-columns: minmax(0, 1.18fr) minmax(320px, 0.82fr);
    gap: 14px;
    align-items: start;
  }

  .scenario-picker {
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  }

  .scenario-picker button,
  .mode-row button {
    display: grid;
    gap: 4px;
    align-items: start;
    padding: 12px;
    border-radius: 16px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.03);
    color: var(--text-0);
    text-align: left;
  }

  .scenario-picker button.selected,
  .mode-row button.selected {
    border-color: rgba(98, 215, 218, 0.32);
    background: rgba(98, 215, 218, 0.1);
  }

  .scenario-picker strong,
  .mode-row strong,
  .summary-card strong,
  .metric-grid strong {
    font-family: 'Orbitron', sans-serif;
  }

  .mode-row {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .team-strip {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
  }

  .team-pill,
  .memory-card,
  .program-card,
  .list-card,
  .reason-card {
    display: grid;
    gap: 8px;
    padding: 12px;
    border-radius: 18px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.03);
  }

  .team-pill,
  .program-card {
    border-color: color-mix(in srgb, var(--lane-accent, #62d7da) 26%, rgba(255,255,255,0.08));
    background:
      linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02)),
      color-mix(in srgb, var(--lane-accent, #62d7da) 10%, rgba(9, 18, 29, 0.92));
  }

  .run-button,
  .queue-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 46px;
    padding: 0 16px;
    border-radius: 999px;
    border: 1px solid rgba(98, 215, 218, 0.3);
    background: linear-gradient(180deg, rgba(98, 215, 218, 0.22), rgba(98, 215, 218, 0.08));
    color: var(--text-0);
  }

  .run-button:disabled {
    opacity: 0.45;
  }

  .queue-button {
    border-color: rgba(223, 161, 129, 0.28);
    background: linear-gradient(180deg, rgba(223, 161, 129, 0.16), rgba(223, 161, 129, 0.06));
  }

  .result-pane {
    padding: 16px;
    border-radius: 20px;
    border: 1px solid rgba(98, 215, 218, 0.18);
    background:
      linear-gradient(180deg, rgba(98, 215, 218, 0.08), rgba(255,255,255,0.02)),
      rgba(255,255,255,0.03);
  }

  .metric-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .metric-grid div {
    display: grid;
    gap: 6px;
    padding: 12px 14px;
    border-radius: 16px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(5, 16, 26, 0.42);
  }

  .metric-grid strong {
    font-size: 24px;
  }

  .reason-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .forecast-panel {
    display: grid;
    gap: 14px;
    padding-top: 14px;
    border-top: 1px solid rgba(255,255,255,0.08);
  }

  .forecast-grid strong {
    font-size: 24px;
  }

  .summary-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .summary-card strong {
    font-size: 26px;
  }

  .summary-card small,
  .list-card small,
  .empty-copy,
  .flow-card small,
  .scenario-picker small,
  .mode-row small {
    color: var(--text-2);
    line-height: 1.45;
  }

  .two-up {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .cards {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }

  .cards.stack {
    grid-template-columns: 1fr;
  }

  .list {
    display: grid;
    gap: 12px;
  }

  .compact-list .list-card.compact {
    gap: 6px;
  }

  .stats-grid {
    grid-template-columns: 1fr auto;
    gap: 10px 14px;
  }

  .section-pill {
    display: inline-flex;
    align-items: center;
    min-height: 30px;
    padding: 0 10px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.03);
  }

  .error-copy {
    margin: 0;
    color: #ff9d9d;
    font-size: 15px;
  }

  .empty-state {
    display: grid;
    gap: 10px;
    padding: 14px;
    border-radius: 18px;
    border: 1px dashed rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.02);
  }

  .inline-empty {
    grid-column: 1 / -1;
  }

  @media (max-width: 960px) {
    .command-board,
    .two-up,
    .summary-grid,
    .flow-strip,
    .mode-row {
      grid-template-columns: 1fr;
    }

    .metric-grid,
    .reason-list {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 640px) {
    .metric-grid,
    .reason-list {
      grid-template-columns: 1fr;
    }
  }
</style>
