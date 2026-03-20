<script lang="ts">
  import { onMount } from 'svelte';
  import type { AgentConfidenceStyle, AgentDecisionTrace, AgentHorizon, AgentEvalResult, EvalMatchResult, OwnedAgent, RuntimeInferenceMode, TrainingRunType } from '$lib/aimon/types';
  import { aimonDexById } from '$lib/aimon/data/aimonDex';
  import { createEvalScenario } from '$lib/aimon/data/evalScenarios';
  import { getEvolutionPreview } from '$lib/aimon/engine/evolutionSystem';
  import { buildAgentDecisionContext } from '$lib/aimon/services/contextAssembler';
  import { retrieveRelevantMemories } from '$lib/aimon/services/memoryService';
  import { promoteTrainingJob, queueTrainingJob, startTrainingJob } from '$lib/aimon/services/trainingOrchestrator';
  import { setScreen } from '$lib/aimon/stores/gameStore';
  import { addUserNoteMemory, compactMemoryBank, labStore, savePromptVariantFromAgent } from '$lib/aimon/stores/labStore';
  import { matchStore } from '$lib/aimon/stores/matchStore';
  import { rosterStore, selectRosterAgent, updateAgentConfiguration } from '$lib/aimon/stores/rosterStore';
  import { runtimeStore, setRuntimeStatus, updateRuntimeConfig } from '$lib/aimon/stores/runtimeStore';
  import { squadStore } from '$lib/aimon/stores/squadStore';
  import {
    getAgentDemandScore,
    getAgentFeeBand,
    getAgentGrowthLane,
    getAgentListingProgress,
    getAgentMonthlyFee,
    getAgentRentalStatus,
    getAgentTrustScore,
    isAgentListable,
    summarizeAgentPerformance
  } from '$lib/aimon/utils/agentMarket';
  import PokemonFrame from '../../../components/shared/PokemonFrame.svelte';

  let { data } = $props<{
    data: {
      agentId: string;
    };
  }>();

  let roster = $derived($rosterStore);
  let squad = $derived($squadStore);
  let lab = $derived($labStore);
  let matches = $derived($matchStore);
  let runtime = $derived($runtimeStore);

  let agent = $derived(roster.agents.find((item) => item.id === data.agentId) ?? null);
  let entry = $derived(agent ? aimonDexById[agent.speciesId] ?? null : null);
  let evolution = $derived(agent && entry ? getEvolutionPreview(entry.id, agent.xp) : null);
  let baseModel = $derived(agent ? lab.baseModels.find((item) => item.id === agent.baseModelId) ?? null : null);
  let memoryBank = $derived(
    agent ? lab.memoryBanks.find((bank) => bank.agentId === agent.id || bank.id === agent.memoryBankId) ?? null : null
  );
  let enabledDataSources = $derived(
    agent ? lab.dataSources.filter((source) => agent.loadout.enabledDataSourceIds.includes(source.id)) : []
  );
  let enabledTools = $derived(agent ? lab.tools.filter((tool) => agent.loadout.enabledToolIds.includes(tool.id)) : []);
  let trainingRuns = $derived(agent ? lab.trainingRuns.filter((run) => run.agentId === agent.id).slice(0, 4) : []);
  let modelArtifacts = $derived(agent ? lab.modelArtifacts.filter((artifact) => artifact.agentId === agent.id).slice(0, 4) : []);
  let promptVariants = $derived(agent ? lab.promptVariants.filter((variant) => variant.agentId === agent.id).slice(0, 4) : []);
  let recentMatches = $derived(
    agent ? matches.recentResults.filter((result) => result.agentResults.some((row) => row.agentId === agent.id)).slice(0, 5) : []
  );
  let selectedScenario = $derived(matches.activeScenario ?? createEvalScenario(matches.selectedScenarioId));
  let recentAgentResults = $derived(
    agent
      ? recentMatches
          .map((result) => ({
            result,
            agentResult: result.agentResults.find((row) => row.agentId === agent.id) ?? null
          }))
          .filter((row): row is { result: EvalMatchResult; agentResult: AgentEvalResult } => Boolean(row.agentResult))
      : []
  );
  let growthLane = $derived(agent ? getAgentGrowthLane(agent) : null);
  let performance = $derived(agent ? summarizeAgentPerformance(agent.id, recentMatches) : summarizeAgentPerformance('', []));
  let demandScore = $derived(agent ? getAgentDemandScore(agent) : 0);
  let monthlyFee = $derived(agent ? getAgentMonthlyFee(agent) : 0);
  let feeBand = $derived(agent ? getAgentFeeBand(agent) : { floor: 0, ceiling: 0 });
  let rentalStatus = $derived(agent ? getAgentRentalStatus(agent, recentMatches) : 'TRAIN MORE');
  let trustScore = $derived(agent ? getAgentTrustScore(agent, recentMatches) : 0);
  let listingProgress = $derived(
    agent
      ? getAgentListingProgress(agent, recentMatches)
      : {
          ready: false,
          completion: 0,
          currentWinRate: 0,
          currentMatches: 0,
          needs: []
        }
  );
  let listable = $derived(agent ? isAgentListable(agent, recentMatches) : false);
  let memoryRecords = $derived(memoryBank?.records.slice(0, 6) ?? []);
  let inSquad = $derived(agent ? squad.activeSquad.memberAgentIds.includes(agent.id) : false);
  let assignedRoleSlot = $derived(
    agent
      ? (() => {
          const assignment = Object.entries(squad.activeSquad.roleMap).find(([, agentId]) => agentId === agent.id);
          return assignment ? assignment[0].toUpperCase() : null;
        })()
      : null
  );
  let nextLevelXp = $derived(agent ? agent.level * 60 : 60);
  let currentLevelFloorXp = $derived(agent ? (agent.level - 1) * 60 : 0);
  let levelProgress = $derived(
    agent ? Math.max(0, Math.min(100, ((agent.xp - currentLevelFloorXp) / Math.max(1, nextLevelXp - currentLevelFloorXp)) * 100)) : 0
  );
  let successMemoryCount = $derived(memoryBank?.records.filter((record) => record.kind === 'SUCCESS_CASE').length ?? 0);
  let failureMemoryCount = $derived(memoryBank?.records.filter((record) => record.kind === 'FAILURE_CASE').length ?? 0);
  let retrievalPreview = $derived(
    agent && memoryBank
      ? retrieveRelevantMemories(memoryBank, agent.loadout.retrievalPolicy, {
          role: agent.role,
          symbol: selectedScenario.symbol,
          timeframe: selectedScenario.timeframe,
          regime: selectedScenario.targetRegime,
          tags: [selectedScenario.id, selectedScenario.symbol, agent.speciesId, agent.role, ...agent.loadout.indicators, ...agent.specializationTags],
          scenarioStartAt: matches.activeScenario?.scenarioStartAt ?? Date.now()
        })
      : []
  );
  let recommendedNextStep = $derived(
    !agent
      ? ''
      : listingProgress.needs[0]
        ? `다음 unlock은 ${listingProgress.needs[0]}입니다. 이 조건을 먼저 채운 뒤 다시 proof를 확인하세요.`
        : failureMemoryCount > successMemoryCount
        ? '최근 실패 기억이 더 많습니다. 리스크를 낮추고 noisy memory부터 압축한 뒤 다시 테스트하세요.'
        : !inSquad
          ? '이 개체를 스쿼드에 넣어 실제 배틀에서 memory와 policy를 검증하세요.'
          : '다음 벤치마크를 돌리고 가장 잘 나온 결과를 artifact로 승격하세요.'
  );
  let rentalNarrative = $derived(
    !agent || !growthLane
      ? ''
      : listable
        ? `${growthLane.label} lane으로 포지셔닝된 ${agent.name}은 ${monthlyFee}달러대 월 임대가 가능한 상태입니다. 최근 성과와 Bond를 근거로 바로 마켓에 올릴 수 있습니다.`
        : `${growthLane.label} lane은 이미 선명하지만 아직 증거가 부족합니다. 실전 배틀과 Bond를 조금 더 쌓아 ${rentalStatus === 'NEAR READY' ? '다음 임대 후보' : '임대 가능 자산'}로 끌어올려야 합니다.`
  );
  let proofHeadline = $derived(
    listingProgress.ready
      ? '모든 market gate를 통과했습니다. 이제 listing을 열거나 더 비싼 fee band를 위해 proof quality를 더 쌓는 단계입니다.'
      : listingProgress.currentMatches === 0
        ? '실전 증거가 아직 없습니다. 첫 3~5회 배틀 로그가 붙어야 빌릴 이유가 생깁니다.'
      : performance.winRate >= 0.6
        ? '최근 배틀 성과가 안정적입니다. 이제 이 개체는 “키운 결과가 보이는 자산”으로 읽힙니다.'
        : '아직 결과가 흔들립니다. 성장 방향은 유지하되 retrieval과 리스크 제어를 더 다듬어야 합니다.'
  );

  let loadedAgentId = $state('');
  let baseModelDraft = $state('');
  let systemPromptDraft = $state('');
  let rolePromptDraft = $state('');
  let policyPromptDraft = $state('');
  let readoutDraft = $state('');
  let behaviorNoteDraft = $state('');
  let retrainingPathDraft = $state('');
  let focusSkillDraft = $state('');
  let indicatorDraft = $state('');
  let riskToleranceDraft = $state(0.5);
  let confidenceStyleDraft = $state<AgentConfidenceStyle>('BALANCED');
  let horizonDraft = $state<AgentHorizon>('INTRADAY');
  let topKDraft = $state(3);
  let recencyWeightDraft = $state(0.15);
  let similarityWeightDraft = $state(0.45);
  let successWeightDraft = $state(0.15);
  let importanceWeightDraft = $state(0.1);
  let roleMatchWeightDraft = $state(0.1);
  let regimeMatchWeightDraft = $state(0.05);
  let dataSourceDraft = $state<string[]>([]);
  let toolDraft = $state<string[]>([]);
  let variantLabelDraft = $state('');
  let trainingTypeDraft = $state<TrainingRunType>('PROMPT_TUNE');
  let trainingHypothesisDraft = $state('');
  let noteTitleDraft = $state('');
  let noteLessonDraft = $state('');
  let noteTagsDraft = $state('');
  let saveMessage = $state('Saved configuration sync is idle.');
  let decisionTest = $state<AgentDecisionTrace | null>(null);
  let decisionTestMessage = $state('Runtime decision test is idle.');
  let testingRuntime = $state(false);
  let runningTraining = $state(false);

  $effect(() => {
    if (!agent || loadedAgentId === agent.id) return;

    loadedAgentId = agent.id;
    baseModelDraft = agent.baseModelId;
    systemPromptDraft = agent.loadout.systemPrompt;
    rolePromptDraft = agent.loadout.rolePrompt;
    policyPromptDraft = agent.loadout.policyPrompt;
    readoutDraft = agent.loadout.readout;
    behaviorNoteDraft = agent.loadout.behaviorNote;
    retrainingPathDraft = agent.loadout.retrainingPath;
    focusSkillDraft = agent.loadout.focusSkill;
    indicatorDraft = agent.loadout.indicators.join(', ');
    riskToleranceDraft = agent.loadout.riskTolerance;
    confidenceStyleDraft = agent.loadout.confidenceStyle;
    horizonDraft = agent.loadout.horizon;
    topKDraft = agent.loadout.retrievalPolicy.topK;
    recencyWeightDraft = agent.loadout.retrievalPolicy.recencyWeight;
    similarityWeightDraft = agent.loadout.retrievalPolicy.similarityWeight;
    successWeightDraft = agent.loadout.retrievalPolicy.successWeight;
    importanceWeightDraft = agent.loadout.retrievalPolicy.importanceWeight;
    roleMatchWeightDraft = agent.loadout.retrievalPolicy.roleMatchWeight;
    regimeMatchWeightDraft = agent.loadout.retrievalPolicy.regimeMatchWeight;
    dataSourceDraft = [...agent.loadout.enabledDataSourceIds];
    toolDraft = [...agent.loadout.enabledToolIds];
    variantLabelDraft = `${agent.name} snapshot`;
    trainingTypeDraft = 'PROMPT_TUNE';
    trainingHypothesisDraft = '';
    noteTitleDraft = '';
    noteLessonDraft = '';
    noteTagsDraft = `${agent.speciesId}, ${agent.role.toLowerCase()}`;
    saveMessage = 'Loaded current agent configuration.';
  });

  $effect(() => {
    const nextSelectedId = agent?.id ?? null;
    if (nextSelectedId !== roster.selectedAgentId) {
      selectRosterAgent(nextSelectedId);
    }
  });

  onMount(() => {
    setScreen('roster');
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

  function formatPercent(value: number): string {
    return `${Math.round(value * 100)}%`;
  }

  function formatUsd(value: number): string {
    return `$${Math.round(value)}`;
  }

  function formatConfig(config: Record<string, string | number | boolean>): string {
    const entries = Object.entries(config);
    if (entries.length === 0) return 'default';
    return entries.map(([key, value]) => `${key}:${String(value)}`).join(' · ');
  }

  function parseIndicators(value: string): string[] {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function toggleSelection(target: 'data' | 'tool', id: string): void {
    const current = target === 'data' ? dataSourceDraft : toolDraft;
    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];

    if (target === 'data') {
      dataSourceDraft = next;
      return;
    }

    toolDraft = next;
  }

  function buildChangeList(): string[] {
    if (!agent) return [];

    const changes: string[] = [];
    if (agent.baseModelId !== baseModelDraft) changes.push('base model');
    if (agent.loadout.systemPrompt !== systemPromptDraft) changes.push('system prompt');
    if (agent.loadout.rolePrompt !== rolePromptDraft) changes.push('role prompt');
    if (agent.loadout.policyPrompt !== policyPromptDraft) changes.push('policy prompt');
    if (agent.loadout.readout !== readoutDraft) changes.push('readout');
    if (agent.loadout.behaviorNote !== behaviorNoteDraft) changes.push('behavior note');
    if (agent.loadout.retrainingPath !== retrainingPathDraft) changes.push('retraining path');
    if (agent.loadout.focusSkill !== focusSkillDraft) changes.push('focus skill');
    if (agent.loadout.indicators.join('|') !== parseIndicators(indicatorDraft).join('|')) changes.push('indicators');
    if (agent.loadout.enabledDataSourceIds.join('|') !== dataSourceDraft.join('|')) changes.push('data bindings');
    if (agent.loadout.enabledToolIds.join('|') !== toolDraft.join('|')) changes.push('tool bindings');
    if (agent.loadout.riskTolerance !== riskToleranceDraft) changes.push('risk tolerance');
    if (agent.loadout.confidenceStyle !== confidenceStyleDraft) changes.push('confidence style');
    if (agent.loadout.horizon !== horizonDraft) changes.push('horizon');
    if (agent.loadout.retrievalPolicy.topK !== topKDraft) changes.push('retrieval topK');
    if (agent.loadout.retrievalPolicy.recencyWeight !== recencyWeightDraft) changes.push('recency weight');
    if (agent.loadout.retrievalPolicy.similarityWeight !== similarityWeightDraft) changes.push('similarity weight');
    if (agent.loadout.retrievalPolicy.successWeight !== successWeightDraft) changes.push('success weight');
    if (agent.loadout.retrievalPolicy.importanceWeight !== importanceWeightDraft) changes.push('importance weight');
    if (agent.loadout.retrievalPolicy.roleMatchWeight !== roleMatchWeightDraft) changes.push('role match weight');
    if (agent.loadout.retrievalPolicy.regimeMatchWeight !== regimeMatchWeightDraft) changes.push('regime match weight');
    return changes;
  }

  function saveConfiguration(): string[] {
    if (!agent) return [];
    const changes = buildChangeList();

    updateAgentConfiguration(agent.id, {
      baseModelId: baseModelDraft,
      loadout: {
        systemPrompt: systemPromptDraft,
        rolePrompt: rolePromptDraft,
        policyPrompt: policyPromptDraft,
        readout: readoutDraft,
        behaviorNote: behaviorNoteDraft,
        retrainingPath: retrainingPathDraft,
        focusSkill: focusSkillDraft,
        indicators: parseIndicators(indicatorDraft),
        enabledDataSourceIds: dataSourceDraft,
        enabledToolIds: toolDraft,
        riskTolerance: riskToleranceDraft,
        confidenceStyle: confidenceStyleDraft,
        horizon: horizonDraft
      },
      retrievalPolicy: {
        topK: topKDraft,
        recencyWeight: recencyWeightDraft,
        similarityWeight: similarityWeightDraft,
        successWeight: successWeightDraft,
        importanceWeight: importanceWeightDraft,
        roleMatchWeight: roleMatchWeightDraft,
        regimeMatchWeight: regimeMatchWeightDraft
      }
    });

    saveMessage = changes.length > 0 ? `Saved: ${changes.join(', ')}` : 'Saved without configuration delta.';
    return changes;
  }

  function snapshotPromptVariant(): void {
    if (!agent) return;
    saveConfiguration();
    savePromptVariantFromAgent(agent.id, variantLabelDraft.trim() || `${agent.name} snapshot`);
    saveMessage = 'Saved prompt snapshot to lab variants.';
  }

  async function enqueueTrainingRun(): Promise<void> {
    if (!agent) return;
    const changes = saveConfiguration();
    const benchmarkPackId = `benchmark-${selectedScenario.id}`;
    const datasetBundleIds = lab.datasetBundles
      .filter((bundle) => bundle.agentIds.includes(agent.id) && bundle.benchmarkPackId === benchmarkPackId)
      .map((bundle) => bundle.id);
    const jobId = queueTrainingJob({
      agentId: agent.id,
      type: trainingTypeDraft,
      requestedBy: 'PLAYER',
      hypothesis: trainingHypothesisDraft.trim() || 'Evaluate whether the current prompt and retrieval settings improve consistency.',
      benchmarkPackId,
      payload: {
        scenarioId: selectedScenario.id,
        datasetBundleIds,
        activeArtifactId: agent.activeArtifactId ?? null
      },
      changes: changes.length > 0 ? changes : ['configuration sync']
    });

    runningTraining = true;
    const result = await startTrainingJob(jobId);
    runningTraining = false;
    saveMessage = result.validationErrors?.length
      ? `${result.message} · ${result.validationErrors.join(', ')}`
      : result.message;
    trainingHypothesisDraft = '';
  }

  async function promoteRun(jobId: string): Promise<void> {
    const result = await promoteTrainingJob(jobId);
    saveMessage = result.message;
  }

  function compactMemory(): void {
    if (!agent) return;
    compactMemoryBank(agent.id);
    saveMessage = 'Compacted memory bank and raised compaction level.';
  }

  function addDoctrineNote(): void {
    if (!agent || noteTitleDraft.trim().length === 0 || noteLessonDraft.trim().length === 0) return;
    addUserNoteMemory(
      agent.id,
      noteTitleDraft.trim(),
      noteLessonDraft.trim(),
      noteTagsDraft
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    );
    noteTitleDraft = '';
    noteLessonDraft = '';
    saveMessage = 'Added user doctrine note to the memory bank.';
  }

  function buildDraftAgent(): OwnedAgent | null {
    if (!agent) return null;

    return {
      ...agent,
      baseModelId: baseModelDraft,
      loadout: {
        ...agent.loadout,
        systemPrompt: systemPromptDraft,
        rolePrompt: rolePromptDraft,
        policyPrompt: policyPromptDraft,
        readout: readoutDraft,
        behaviorNote: behaviorNoteDraft,
        retrainingPath: retrainingPathDraft,
        focusSkill: focusSkillDraft,
        indicators: parseIndicators(indicatorDraft),
        enabledDataSourceIds: dataSourceDraft,
        enabledToolIds: toolDraft,
        riskTolerance: riskToleranceDraft,
        confidenceStyle: confidenceStyleDraft,
        horizon: horizonDraft,
        retrievalPolicy: {
          ...agent.loadout.retrievalPolicy,
          topK: topKDraft,
          recencyWeight: recencyWeightDraft,
          similarityWeight: similarityWeightDraft,
          successWeight: successWeightDraft,
          importanceWeight: importanceWeightDraft,
          roleMatchWeight: roleMatchWeightDraft,
          regimeMatchWeight: regimeMatchWeightDraft
        }
      }
    };
  }

  function applyBattlePreset(preset: 'SAFE' | 'BALANCED' | 'AGGRESSIVE'): void {
    if (preset === 'SAFE') {
      confidenceStyleDraft = 'CONSERVATIVE';
      horizonDraft = 'SWING';
      riskToleranceDraft = 0.26;
      behaviorNoteDraft = 'Wait for confirmation, protect downside first, and avoid noisy entries.';
      return;
    }

    if (preset === 'AGGRESSIVE') {
      confidenceStyleDraft = 'AGGRESSIVE';
      horizonDraft = 'SCALP';
      riskToleranceDraft = 0.72;
      behaviorNoteDraft = 'Attack early momentum shifts, accept higher heat, and keep pressure on execution.';
      return;
    }

    confidenceStyleDraft = 'BALANCED';
    horizonDraft = 'INTRADAY';
    riskToleranceDraft = 0.5;
    behaviorNoteDraft = 'Balance confirmation with initiative and let the squad validate conviction.';
  }

  function applyMemoryPreset(preset: 'TIGHT' | 'BALANCED' | 'WIDE'): void {
    if (preset === 'TIGHT') {
      topKDraft = 2;
      recencyWeightDraft = 0.25;
      similarityWeightDraft = 0.45;
      successWeightDraft = 0.15;
      importanceWeightDraft = 0.08;
      roleMatchWeightDraft = 0.05;
      regimeMatchWeightDraft = 0.02;
      return;
    }

    if (preset === 'WIDE') {
      topKDraft = 5;
      recencyWeightDraft = 0.12;
      similarityWeightDraft = 0.35;
      successWeightDraft = 0.16;
      importanceWeightDraft = 0.12;
      roleMatchWeightDraft = 0.14;
      regimeMatchWeightDraft = 0.11;
      return;
    }

    topKDraft = 3;
    recencyWeightDraft = 0.15;
    similarityWeightDraft = 0.45;
    successWeightDraft = 0.15;
    importanceWeightDraft = 0.1;
    roleMatchWeightDraft = 0.1;
    regimeMatchWeightDraft = 0.05;
  }

  function updateRuntimeField<K extends keyof typeof runtime.config>(key: K, value: (typeof runtime.config)[K]): void {
    updateRuntimeConfig({ [key]: value });
  }

  async function testRuntimeConnection(): Promise<void> {
    testingRuntime = true;
    setRuntimeStatus('IDLE', 'Testing runtime connection...');

    try {
      const response = await fetch('/api/aimon/runtime', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          config: runtime.config
        })
      });

      const payload = (await response.json()) as { ok?: boolean; message?: string };
      setRuntimeStatus(payload.ok ? 'OK' : 'ERROR', payload.message ?? 'Unknown runtime response');
      decisionTestMessage = payload.message ?? 'Runtime connection check completed.';
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown runtime error';
      setRuntimeStatus('ERROR', message);
      decisionTestMessage = message;
    } finally {
      testingRuntime = false;
    }
  }

  async function runDecisionTest(): Promise<void> {
    const draftAgent = buildDraftAgent();
    if (!draftAgent) return;

    testingRuntime = true;
    decisionTest = null;
    decisionTestMessage = 'Running decision test...';

    try {
      const memoryHits = retrieveRelevantMemories(memoryBank, draftAgent.loadout.retrievalPolicy, {
        role: draftAgent.role,
        symbol: selectedScenario.symbol,
        timeframe: selectedScenario.timeframe,
        regime: selectedScenario.targetRegime,
        tags: [selectedScenario.id, selectedScenario.symbol, draftAgent.speciesId, draftAgent.role, ...draftAgent.loadout.indicators, ...draftAgent.specializationTags],
        scenarioStartAt: Date.now()
      }).map((candidate) => ({
        id: candidate.record.id,
        title: candidate.record.title,
        lesson: candidate.record.lesson,
        kind: candidate.record.kind,
        score: candidate.totalScore
      }));
      const activeDataSourceKinds = draftAgent.loadout.enabledDataSourceIds
        .map((id) => lab.dataSources.find((source) => source.id === id)?.kind)
        .filter((kind): kind is (typeof lab.dataSources)[number]['kind'] => Boolean(kind));
      const squadNotes = squad.activeSquad.memberAgentIds
        .map((id) => roster.agents.find((item) => item.id === id))
        .filter((item): item is OwnedAgent => Boolean(item))
        .filter((item) => item.id !== draftAgent.id)
        .map((item) => `${item.role}:${item.name}`);

      const context = buildAgentDecisionContext(
        draftAgent,
        {
          tick: 0,
          timestamp: Date.now(),
          price: selectedScenario.startingPrice,
          priceChange5m: selectedScenario.baselinePriceChange5m,
          volatility: selectedScenario.baselineVolatility,
          fearGreed: selectedScenario.baselineFearGreed,
          fundingRate: selectedScenario.baselineFundingRate,
          openInterestChange: selectedScenario.baselineOpenInterestChange,
          regime: selectedScenario.targetRegime,
          regimeStrength: 0.66
        },
        memoryHits,
        squadNotes,
        squad.activeSquad.tacticPreset,
        selectedScenario,
        activeDataSourceKinds
      );

      const response = await fetch('/api/aimon/decide', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          context,
          config: runtime.config
        })
      });

      const payload = (await response.json()) as { trace?: AgentDecisionTrace };
      if (!payload.trace) {
        throw new Error('Decision trace was not returned.');
      }

      decisionTest = payload.trace;
      decisionTestMessage = `${payload.trace.providerLabel ?? payload.trace.providerId ?? 'runtime'} produced ${payload.trace.action}.`;
    } catch (error) {
      decisionTestMessage = error instanceof Error ? error.message : 'Unknown decision test error';
    } finally {
      testingRuntime = false;
    }
  }
</script>

<svelte:head>
  <title>{agent ? `${agent.name} Agent HQ` : 'Agent HQ'}</title>
</svelte:head>

<div class="page">
  {#if agent && entry && evolution}
    {@const lane = growthLane}
    {@const recentProof = performance}
    <header class="header">
      <div>
        <p class="eyebrow">AGENT HQ</p>
        <h1>{agent.name}</h1>
        <p class="lede">market readiness를 먼저 읽고, 그 다음 build와 proof loop를 조정합니다.</p>
      </div>
      <div class="header-actions">
        <a href="/roster">로스터</a>
        <a href="/battle">배틀 실행</a>
        <a href="/lab">랩 열기</a>
        <a href="/market">마켓</a>
      </div>
    </header>

    <section class="profile-grid">
      <PokemonFrame variant={listable ? 'accent' : 'dark'} padding="16px">
        <article class="rent-card" style={`--lane-accent:${lane?.accent ?? entry.color};`}>
          <div class="section-head">
            <div>
              <p class="eyebrow">RENTAL PROFILE</p>
              <h3>빌릴 이유가 보이는 카드</h3>
            </div>
            <span class="section-pill">{rentalStatus}</span>
          </div>

          <div class="rent-topline">
            <div class="price-block">
              <span>Projected fee</span>
              <strong>{formatUsd(monthlyFee)}/mo</strong>
              <small>{formatUsd(feeBand.floor)} - {formatUsd(feeBand.ceiling)} band</small>
            </div>

            <div class="trust-orb">
              <span>Trust</span>
              <strong>{trustScore}</strong>
            </div>
          </div>

          <p class="lede">{rentalNarrative}</p>

          <div class="hero-badges">
            <span>{lane?.label ?? 'Growth Lane'}</span>
            <span>{agent.loadout.focusSkill}</span>
            <span>{recentProof.matches} proof matches</span>
            <span>{inSquad ? 'In Active Squad' : 'Bench Asset'}</span>
          </div>

          <div class="compact-kv">
            <span>Demand</span><strong>{demandScore}</strong>
            <span>Win rate</span><strong>{recentProof.matches > 0 ? formatPercent(recentProof.winRate) : 'NO DATA'}</strong>
            <span>Avg accuracy</span><strong>{recentProof.matches > 0 ? formatPercent(recentProof.avgAccuracy) : 'NO DATA'}</strong>
            <span>Bond</span><strong>{agent.bond}</strong>
          </div>
        </article>
      </PokemonFrame>

      <PokemonFrame variant="dark" padding="16px">
        <section class="panel">
          <div class="section-head">
            <div>
              <p class="eyebrow">LISTING READINESS</p>
              <h3>market까지 남은 조건</h3>
            </div>
            <span class="section-pill">{listingProgress.completion}% READY</span>
          </div>

          <p class="next-step">{proofHeadline}</p>

          <div class="progress-block">
            <div class="progress-meta">
              <span>Listing Readiness</span>
              <strong>{listingProgress.completion}%</strong>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style:width={`${listingProgress.completion}%`} style:background={lane?.accent ?? entry.accent}></div>
            </div>
          </div>

          <div class="proof-grid">
            <div>
              <span>Level Gate</span>
              <strong>{agent.level}/3</strong>
              <small>{agent.level >= 3 ? 'listing level cleared' : 'level 3까지 성장 필요'}</small>
            </div>
            <div>
              <span>Bond Gate</span>
              <strong>{agent.bond}/10</strong>
              <small>{agent.bond >= 10 ? 'bond gate cleared' : 'bond를 더 쌓아야 함'}</small>
            </div>
            <div>
              <span>Proof Gate</span>
              <strong>{listingProgress.currentMatches}/5</strong>
              <small>{listingProgress.currentMatches >= 5 ? 'proof volume cleared' : 'arena proof match가 더 필요'}</small>
            </div>
            <div>
              <span>Win Rate Gate</span>
              <strong>{formatPercent(listingProgress.currentWinRate)}</strong>
              <small>{listingProgress.currentWinRate >= 0.55 ? 'quality gate cleared' : 'proof quality를 더 올려야 함'}</small>
            </div>
          </div>

          <div class="subsection">
            <div class="subsection-head">
              <div>
                <p class="eyebrow">PROOF STACK</p>
                <h4>현재 성장 방향과 증거</h4>
              </div>
              <span class="section-pill">{lane?.shortLabel ?? 'Lane'}</span>
            </div>

            <div class="proof-grid">
              <div>
                <span>Lane</span>
                <strong>{lane?.label ?? agent.loadout.retrainingPath}</strong>
                <small>{lane?.summary ?? agent.loadout.readout}</small>
              </div>
              <div>
                <span>Confidence</span>
                <strong>{recentProof.matches > 0 ? formatPercent(recentProof.avgConfidence) : formatPercent(agent.loadout.riskTolerance)}</strong>
                <small>{agent.loadout.confidenceStyle} · {agent.loadout.horizon}</small>
              </div>
              <div>
                <span>Reasoning</span>
                <strong>{recentProof.matches > 0 ? formatPercent(recentProof.avgReasoning) : 'No Data'}</strong>
                <small>{agent.loadout.readout}</small>
              </div>
              <div>
                <span>Memory</span>
                <strong>{memoryBank?.records.length ?? 0}/{memoryBank?.capacity ?? 0}</strong>
                <small>{successMemoryCount} success / {failureMemoryCount} failure</small>
              </div>
            </div>
          </div>

          <div class="subsection">
            <div class="subsection-head">
              <div>
                <p class="eyebrow">NEXT UNLOCK STEPS</p>
                <h4>무엇이 아직 부족한가</h4>
              </div>
              <span class="section-pill">{listable ? 'ALL CLEAR' : rentalStatus}</span>
            </div>

            {#if listingProgress.needs.length > 0}
              <div class="chips">
                {#each listingProgress.needs as need (need)}
                  <span>{need}</span>
                {/each}
              </div>
            {:else}
              <p class="next-step">모든 listing gate가 열렸습니다. 이제 마켓에 올리거나 더 높은 fee band를 위해 proof quality를 계속 쌓으면 됩니다.</p>
            {/if}
          </div>
        </section>
      </PokemonFrame>
    </section>

    <section class="hero-grid">
      <PokemonFrame variant="accent" padding="18px">
        <article class="hero" style={`--agent-color:${entry.color}; --agent-accent:${entry.accent};`}>
          <div class="hero-art">
            <div class="hero-sprite">
              <span>{agent.name.slice(0, 2).toUpperCase()}</span>
            </div>
          </div>

          <div class="hero-copy">
            <p class="eyebrow">{entry.dexNo} · {entry.type} · {agent.role}</p>
            <div class="hero-title-row">
              <h2>{agent.name}</h2>
              <span class="status-pill">{agent.status}</span>
            </div>
            <p class="lede">{entry.description}</p>

            <div class="hero-badges">
              <span>{lane?.shortLabel ?? 'Lane'}</span>
              <span>{agent.loadout.retrainingPath}</span>
              <span>{agent.loadout.focusSkill}</span>
              <span>{baseModel ? `${baseModel.family} ${baseModel.variant}` : agent.baseModelId}</span>
              {#if inSquad}
                <span class="active">{assignedRoleSlot ?? 'ACTIVE'} SLOT</span>
              {/if}
            </div>

            <div class="progress-block">
              <div class="progress-meta">
                <span>Level Progress</span>
                <strong>LVL {agent.level} · {agent.xp}/{nextLevelXp} XP</strong>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" style:width={`${levelProgress}%`} style:background={entry.color}></div>
              </div>
            </div>
          </div>
        </article>
      </PokemonFrame>

      <PokemonFrame variant={evolution.canEvolve ? 'accent' : 'dark'} padding="18px">
        <section class="panel">
          <div class="section-head">
            <div>
              <p class="eyebrow">GROWTH LANE</p>
              <h3>현재 포지셔닝</h3>
            </div>
            <span class="section-pill">{lane?.label ?? (inSquad ? 'ACTIVE' : 'BENCH')}</span>
          </div>

          <p class="next-step">{lane?.summary ?? agent.loadout.behaviorNote}</p>

          <div class="kv-grid">
            <span>Lane focus</span><strong>{agent.loadout.focusSkill}</strong>
            <span>Readout</span><strong>{agent.loadout.readout}</strong>
            <span>Indicators</span><strong>{agent.loadout.indicators.join(' / ')}</strong>
            <span>Base model</span><strong>{baseModel ? `${baseModel.family} ${baseModel.variant}` : agent.baseModelId}</strong>
            <span>Bond</span><strong>{agent.bond}</strong>
            <span>Matches</span><strong>{agent.record.matches}</strong>
            <span>Last outcome</span><strong>{agent.record.lastOutcome ?? 'No record'}</strong>
            <span>Specialization</span><strong>T{agent.progression.specializationTier}</strong>
            <span>Last match</span><strong>{formatDate(agent.record.lastMatchAt)}</strong>
            <span>Evolution</span><strong>{evolution.canEvolve ? 'READY NOW' : evolution.evolvesTo ?? 'FINAL FORM'}</strong>
            <span>Memory bank</span><strong>{memoryBank?.records.length ?? 0}/{memoryBank?.capacity ?? 0}</strong>
          </div>
        </section>
      </PokemonFrame>
    </section>

    <section class="workspace-grid">
      <PokemonFrame variant="dark" padding="18px">
        <section class="panel">
          <div class="section-head">
            <div>
              <p class="eyebrow">CURRENT BUILD</p>
              <h3>지금 세팅</h3>
            </div>
            <button type="button" onclick={saveConfiguration}>Save Build</button>
          </div>

          <div class="preset-row">
            <button type="button" class:active={confidenceStyleDraft === 'CONSERVATIVE'} onclick={() => applyBattlePreset('SAFE')}>Safe</button>
            <button type="button" class:active={confidenceStyleDraft === 'BALANCED' && horizonDraft === 'INTRADAY'} onclick={() => applyBattlePreset('BALANCED')}>Balanced</button>
            <button type="button" class:active={confidenceStyleDraft === 'AGGRESSIVE'} onclick={() => applyBattlePreset('AGGRESSIVE')}>Aggressive</button>
          </div>

          <div class="form-grid">
            <label class="field">
              <span>Confidence</span>
              <select bind:value={confidenceStyleDraft}>
                <option value="CONSERVATIVE">CONSERVATIVE</option>
                <option value="BALANCED">BALANCED</option>
                <option value="AGGRESSIVE">AGGRESSIVE</option>
              </select>
            </label>
            <label class="field">
              <span>Horizon</span>
              <select bind:value={horizonDraft}>
                <option value="SCALP">SCALP</option>
                <option value="INTRADAY">INTRADAY</option>
                <option value="SWING">SWING</option>
              </select>
            </label>
            <label class="field full">
              <span>Risk Tolerance · {formatPercent(riskToleranceDraft)}</span>
              <input type="range" min="0" max="1" step="0.01" bind:value={riskToleranceDraft} />
            </label>
            <label class="field full">
              <span>Behavior Note</span>
              <textarea bind:value={behaviorNoteDraft} rows="3"></textarea>
            </label>
            <label class="field">
              <span>Base Model</span>
              <select bind:value={baseModelDraft}>
                {#each lab.baseModels as model (model.id)}
                  <option value={model.id}>{model.family} {model.variant}</option>
                {/each}
              </select>
            </label>
            <label class="field">
              <span>Readout</span>
              <input bind:value={readoutDraft} />
            </label>
            <label class="field">
              <span>Retraining Path</span>
              <input bind:value={retrainingPathDraft} />
            </label>
            <label class="field">
              <span>Focus Skill</span>
              <input bind:value={focusSkillDraft} />
            </label>
            <label class="field full">
              <span>Indicators</span>
              <input bind:value={indicatorDraft} />
            </label>
          </div>

          <div class="toggle-stack">
            <div>
              <span class="label">Data Sources</span>
              <div class="toggle-row">
                {#each lab.dataSources as source (source.id)}
                  <button
                    type="button"
                    class="toggle-chip"
                    class:active={dataSourceDraft.includes(source.id)}
                    onclick={() => toggleSelection('data', source.id)}
                  >
                    {source.name}
                  </button>
                {/each}
              </div>
            </div>

            <div>
              <span class="label">Tools</span>
              <div class="toggle-row">
                {#each lab.tools as tool (tool.id)}
                  <button
                    type="button"
                    class="toggle-chip"
                    class:active={toolDraft.includes(tool.id)}
                    onclick={() => toggleSelection('tool', tool.id)}
                  >
                    {tool.name}
                  </button>
                {/each}
              </div>
            </div>
          </div>

          <small class="status-text">{saveMessage}</small>
        </section>
      </PokemonFrame>

      <PokemonFrame variant="dark" padding="18px">
        <section class="panel">
          <div class="section-head">
            <div>
              <p class="eyebrow">NEXT ACTION</p>
              <h3>테스트와 학습</h3>
            </div>
            <span class="section-pill">{runtime.config.mode}</span>
          </div>

          <p class="next-step">{recommendedNextStep}</p>

          <div class="preset-row">
            <button type="button" class:active={topKDraft <= 2} onclick={() => applyMemoryPreset('TIGHT')}>Tight Memory</button>
            <button type="button" class:active={topKDraft === 3} onclick={() => applyMemoryPreset('BALANCED')}>Balanced Memory</button>
            <button type="button" class:active={topKDraft >= 5} onclick={() => applyMemoryPreset('WIDE')}>Wide Memory</button>
          </div>

          <div class="form-grid">
            <label class="field">
              <span>Training Type</span>
              <select bind:value={trainingTypeDraft}>
                <option value="PROMPT_TUNE">PROMPT_TUNE</option>
                <option value="RETRIEVAL_TUNE">RETRIEVAL_TUNE</option>
                <option value="MEMORY_COMPACT">MEMORY_COMPACT</option>
                <option value="SFT">SFT</option>
                <option value="LORA">LORA</option>
                <option value="CPT">CPT</option>
              </select>
            </label>
            <label class="field">
              <span>Snapshot Label</span>
              <input bind:value={variantLabelDraft} />
            </label>
            <label class="field full">
              <span>Training Hypothesis</span>
              <textarea bind:value={trainingHypothesisDraft} rows="3"></textarea>
            </label>
          </div>

          <div class="form-actions">
            <button type="button" class="secondary" onclick={snapshotPromptVariant}>Snapshot</button>
            <button type="button" class="secondary" onclick={runDecisionTest} disabled={testingRuntime}>Decision Test</button>
            <button type="button" onclick={enqueueTrainingRun} disabled={runningTraining}>
              {runningTraining ? 'Training…' : 'Queue Training'}
            </button>
          </div>

          <small class="status-text">{decisionTestMessage}</small>

          {#if decisionTest}
            <article class="decision-card">
              <div class="list-head">
                <strong>{decisionTest.action}</strong>
                <span>{Math.round(decisionTest.confidence * 100)}%</span>
              </div>
              <p>{decisionTest.thesis}</p>
              <small>{decisionTest.invalidation}</small>
              <div class="chips">
                <span>{decisionTest.providerLabel ?? decisionTest.providerId ?? 'runtime'}</span>
                {#if decisionTest.fallbackUsed}
                  <span>FALLBACK</span>
                {/if}
                {#each decisionTest.evidenceTitles as title}
                  <span>{title}</span>
                {/each}
              </div>
            </article>
          {/if}
        </section>
      </PokemonFrame>
    </section>

    <section class="support-grid">
      <PokemonFrame variant="dark" padding="18px">
        <section class="panel">
          <div class="section-head">
            <div>
              <p class="eyebrow">MEMORY BOARD</p>
              <h3>기억과 회수 상태</h3>
            </div>
            <button type="button" class="secondary" onclick={compactMemory}>Compact Memory</button>
          </div>

          <div class="memory-summary">
            <div>
              <span class="label">Success</span>
              <strong>{successMemoryCount}</strong>
            </div>
            <div>
              <span class="label">Failure</span>
              <strong>{failureMemoryCount}</strong>
            </div>
            <div>
              <span class="label">Compaction</span>
              <strong>L{memoryBank?.compactionLevel ?? 0}</strong>
            </div>
          </div>

          <div class="subsection">
            <div class="subsection-head">
              <h4>Retrieval Preview</h4>
              <span>{retrievalPreview.length} hits</span>
            </div>
            <div class="list">
              {#if retrievalPreview.length > 0}
                {#each retrievalPreview.slice(0, 3) as candidate (candidate.record.id)}
                  <article class="list-card">
                    <div class="list-head">
                      <strong>{candidate.record.title}</strong>
                      <span>{formatPercent(candidate.totalScore)}</span>
                    </div>
                    <p>{candidate.record.lesson}</p>
                    <small>Sim {formatPercent(candidate.breakdown.similarity)} · Rec {formatPercent(candidate.breakdown.recency)}</small>
                  </article>
                {/each}
              {:else}
                <p class="empty-copy">아직 꺼낼 기억 카드가 없습니다.</p>
              {/if}
            </div>
          </div>
        </section>
      </PokemonFrame>

      <PokemonFrame variant="dark" padding="18px">
        <section class="panel">
          <div class="section-head">
            <div>
              <p class="eyebrow">RECENT ACTIVITY</p>
              <h3>최근 기록</h3>
            </div>
            <span class="section-pill">{modelArtifacts.length} artifacts</span>
          </div>

          <div class="subsection">
            <div class="subsection-head">
              <h4>Training Queue</h4>
              <span>{trainingRuns.length} runs</span>
            </div>
            <div class="list">
              {#if trainingRuns.length > 0}
                {#each trainingRuns as run (run.id)}
                  <article class="list-card">
                    <div class="list-head">
                      <strong>{run.type}</strong>
                      <span>{run.state}</span>
                    </div>
                    <p>{run.hypothesis}</p>
                    <small>{run.benchmarkPackId}</small>
                    {#if run.state === 'PROMOTABLE'}
                      <button type="button" class="secondary" onclick={() => promoteRun(run.id)}>Promote Candidate</button>
                    {/if}
                  </article>
                {/each}
              {:else}
                <p class="empty-copy">아직 큐에 들어간 학습 작업이 없습니다.</p>
              {/if}
            </div>
          </div>

          <div class="subsection">
            <div class="subsection-head">
              <h4>Recent Evaluations</h4>
              <span>{recentAgentResults.length} matches</span>
            </div>
            <div class="list">
              {#if recentAgentResults.length > 0}
                {#each recentAgentResults.slice(0, 3) as row (row.result.id)}
                  <article class="list-card">
                    <div class="list-head">
                      <strong>{row.result.outcome}</strong>
                      <span>{formatDate(row.result.createdAt)}</span>
                    </div>
                    <p>{row.agentResult.reflection?.lesson ?? row.agentResult.reasoningSummary ?? 'No lesson recorded.'}</p>
                    <small>{row.agentResult.action} · XP +{row.agentResult.xpGain} · Bond +{row.agentResult.bondGain}</small>
                  </article>
                {/each}
              {:else}
                <p class="empty-copy">아직 이 에이전트의 평가 전적이 없습니다.</p>
              {/if}
            </div>
          </div>
        </section>
      </PokemonFrame>
    </section>

    <PokemonFrame variant="dark" padding="18px">
      <section class="panel foldout-panel">
        <div class="section-head">
          <div>
            <p class="eyebrow">ADVANCED CONTROLS</p>
            <h3>깊은 설정</h3>
          </div>
          <span class="section-pill">Deep edit</span>
        </div>

        <div class="foldout-grid">
          <details class="foldout">
            <summary>Prompt Lab</summary>
            <div class="form-grid">
              <label class="field full">
                <span>System Prompt</span>
                <textarea bind:value={systemPromptDraft} rows="4"></textarea>
              </label>
              <label class="field full">
                <span>Role Prompt</span>
                <textarea bind:value={rolePromptDraft} rows="4"></textarea>
              </label>
              <label class="field full">
                <span>Policy Prompt</span>
                <textarea bind:value={policyPromptDraft} rows="4"></textarea>
              </label>
            </div>
            <div class="stack-compact">
              <article>
                <span class="label">Current Prompt Stack</span>
                <p>{agent.loadout.systemPrompt}</p>
                <p>{agent.loadout.rolePrompt}</p>
                <p>{agent.loadout.policyPrompt}</p>
              </article>
            </div>
          </details>

          <details class="foldout">
            <summary>Memory Tuning</summary>
            <div class="form-grid">
              <label class="field">
                <span>Top K</span>
                <input type="number" min="1" max="8" step="1" bind:value={topKDraft} />
              </label>
              <label class="field">
                <span>Recency Weight</span>
                <input type="number" min="0" max="1" step="0.01" bind:value={recencyWeightDraft} />
              </label>
              <label class="field">
                <span>Similarity Weight</span>
                <input type="number" min="0" max="1" step="0.01" bind:value={similarityWeightDraft} />
              </label>
              <label class="field">
                <span>Success Weight</span>
                <input type="number" min="0" max="1" step="0.01" bind:value={successWeightDraft} />
              </label>
              <label class="field">
                <span>Importance Weight</span>
                <input type="number" min="0" max="1" step="0.01" bind:value={importanceWeightDraft} />
              </label>
              <label class="field">
                <span>Role Match Weight</span>
                <input type="number" min="0" max="1" step="0.01" bind:value={roleMatchWeightDraft} />
              </label>
              <label class="field">
                <span>Regime Match Weight</span>
                <input type="number" min="0" max="1" step="0.01" bind:value={regimeMatchWeightDraft} />
              </label>
            </div>

            <div class="form-grid">
              <label class="field">
                <span>Doctrine Note Title</span>
                <input bind:value={noteTitleDraft} />
              </label>
              <label class="field">
                <span>Tags</span>
                <input bind:value={noteTagsDraft} />
              </label>
              <label class="field full">
                <span>Doctrine Lesson</span>
                <textarea bind:value={noteLessonDraft} rows="4"></textarea>
              </label>
            </div>
            <div class="form-actions">
              <button type="button" onclick={addDoctrineNote}>Add Doctrine Memory</button>
            </div>
          </details>

          <details class="foldout">
            <summary>Runtime Connector</summary>
            <div class="form-grid">
              <label class="field">
                <span>Mode</span>
                <select value={runtime.config.mode} onchange={(event) => updateRuntimeField('mode', (event.currentTarget as HTMLSelectElement).value as RuntimeInferenceMode)}>
                  <option value="HEURISTIC">HEURISTIC</option>
                  <option value="OLLAMA">OLLAMA</option>
                  <option value="OPENAI_COMPAT">OPENAI_COMPAT</option>
                </select>
              </label>
              <label class="field">
                <span>Model Id</span>
                <input value={runtime.config.modelId} oninput={(event) => updateRuntimeField('modelId', (event.currentTarget as HTMLInputElement).value)} />
              </label>
              <label class="field full">
                <span>Base URL</span>
                <input value={runtime.config.baseUrl} oninput={(event) => updateRuntimeField('baseUrl', (event.currentTarget as HTMLInputElement).value)} />
              </label>
              <label class="field full">
                <span>API Key</span>
                <input type="password" value={runtime.config.apiKey} oninput={(event) => updateRuntimeField('apiKey', (event.currentTarget as HTMLInputElement).value)} />
              </label>
              <label class="field">
                <span>Temperature</span>
                <input type="number" min="0" max="2" step="0.05" value={runtime.config.temperature} onchange={(event) => updateRuntimeField('temperature', Number((event.currentTarget as HTMLInputElement).value))} />
              </label>
              <label class="field">
                <span>Timeout (ms)</span>
                <input type="number" min="1000" step="500" value={runtime.config.timeoutMs} onchange={(event) => updateRuntimeField('timeoutMs', Number((event.currentTarget as HTMLInputElement).value))} />
              </label>
            </div>
            <div class="form-actions">
              <button type="button" onclick={testRuntimeConnection} disabled={testingRuntime}>Test Runtime</button>
              <small class="status-text">{runtime.lastStatus} · {runtime.lastMessage}</small>
            </div>
          </details>

          <details class="foldout">
            <summary>Archive & History</summary>
            <div class="archive-group">
              <div>
                <span class="label">Prompt Variants</span>
                <div class="chips">
                  {#if promptVariants.length > 0}
                    {#each promptVariants as variant (variant.id)}
                      <span>{variant.label}</span>
                    {/each}
                  {:else}
                    <span class="muted">No prompt variants yet</span>
                  {/if}
                </div>
              </div>

              <div>
                <span class="label">Active Inputs</span>
                <div class="list two-col-list">
                  {#if enabledDataSources.length > 0}
                    {#each enabledDataSources as source (source.id)}
                      <article class="list-card">
                        <div class="list-head">
                          <strong>{source.name}</strong>
                          <span>{source.kind}</span>
                        </div>
                        <p>{formatConfig(source.config)}</p>
                        <small>Quality {Math.round(source.qualityScore * 100)}%</small>
                      </article>
                    {/each}
                  {/if}
                  {#if enabledTools.length > 0}
                    {#each enabledTools as tool (tool.id)}
                      <article class="list-card">
                        <div class="list-head">
                          <strong>{tool.name}</strong>
                          <span>{tool.kind}</span>
                        </div>
                        <p>{tool.description}</p>
                      </article>
                    {/each}
                  {/if}
                </div>
              </div>

              <div class="list two-col-list">
                {#each memoryRecords.slice(0, 4) as record (record.id)}
                  <article class="memory-card">
                    <div class="list-head">
                      <strong>{record.title}</strong>
                      <span>{record.kind}</span>
                    </div>
                    <p>{record.summary}</p>
                    <small>{record.lesson}</small>
                  </article>
                {/each}

                {#each modelArtifacts as artifact (artifact.id)}
                  <article class="list-card">
                    <div class="list-head">
                      <strong>{artifact.label}</strong>
                      <span>{artifact.status}</span>
                    </div>
                    <p>{artifact.kind} · {artifact.storageUri}</p>
                    <small>{formatPercent(artifact.metrics.totalScore)} total score</small>
                  </article>
                {/each}
              </div>
            </div>
          </details>
        </div>
      </section>
    </PokemonFrame>
  {:else}
    <PokemonFrame variant="dark" padding="18px">
      <section class="empty-state">
        <p class="eyebrow">AGENT CONSOLE</p>
        <h1>Owned agent not found</h1>
        <p class="next-step">This route needs a valid owned agent id from your roster.</p>
        <div class="header-actions">
          <a href="/roster">Back To Roster</a>
        </div>
      </section>
    </PokemonFrame>
  {/if}
</div>

<style>
  .page,
  .panel,
  .hero-copy,
  .hero,
  .empty-state,
  .archive-group,
  .list,
  .toggle-stack,
  .subsection,
  .stack-compact {
    display: grid;
    gap: 16px;
  }

  .page {
    gap: 20px;
  }

  .header,
  .section-head,
  .subsection-head,
  .list-head,
  .hero-title-row,
  .progress-meta {
    display: flex;
    justify-content: space-between;
    gap: 14px;
    align-items: end;
  }

  .rent-topline,
  .price-block,
  .trust-orb,
  .proof-grid,
  .compact-kv {
    display: grid;
    gap: 14px;
  }

  .hero-grid,
  .profile-grid,
  .workspace-grid,
  .support-grid,
  .hero,
  .memory-summary,
  .form-grid,
  .foldout-grid {
    display: grid;
    gap: 16px;
  }

  .hero-grid {
    grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
  }

  .profile-grid,
  .workspace-grid,
  .support-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
  }

  .hero {
    grid-template-columns: 220px minmax(0, 1fr);
    align-items: stretch;
  }

  .memory-summary {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .eyebrow,
  .label,
  .price-block span,
  .trust-orb span,
  .proof-grid span,
  .kv-grid span,
  .compact-kv span,
  .list-head span,
  .status-pill,
  .hero-badges span,
  .field span,
  .next-step,
  .empty-copy,
  .status-text,
  small,
  .section-pill {
    color: var(--text-2);
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  h1,
  h2,
  h3,
  h4 {
    margin: 0;
    font-family: 'Orbitron', sans-serif;
  }

  h1 {
    font-size: clamp(40px, 7vw, 72px);
    line-height: 0.9;
  }

  h2 {
    font-size: 34px;
  }

  h3 {
    font-size: 24px;
  }

  h4 {
    font-size: 18px;
  }

  .lede,
  .rent-card p,
  .list-card p,
  .memory-card p,
  .next-step,
  .decision-card p {
    margin: 0;
    color: var(--text-1);
    line-height: 1.5;
  }

  .header-actions,
  .hero-badges,
  .chips,
  .preset-row,
  .toggle-row,
  .form-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
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

  .rent-card {
    display: grid;
    gap: 12px;
    padding: 2px;
  }

  .rent-topline {
    grid-template-columns: minmax(0, 1fr) 108px;
    align-items: stretch;
  }

  .price-block,
  .trust-orb {
    padding: 16px;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.06);
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.02)),
      color-mix(in srgb, var(--lane-accent, rgba(98, 215, 218, 0.18)) 18%, rgba(7, 15, 23, 0.92));
  }

  .price-block strong,
  .trust-orb strong {
    font-family: 'Orbitron', sans-serif;
    font-size: clamp(30px, 5vw, 44px);
    line-height: 0.92;
  }

  .price-block small,
  .trust-orb span {
    color: var(--text-2);
  }

  .trust-orb {
    place-items: center;
    text-align: center;
  }

  .hero-art {
    min-height: 240px;
    display: grid;
    place-items: center;
    border-radius: 24px;
    background:
      radial-gradient(circle at 50% 28%, rgba(255, 255, 255, 0.08), transparent 40%),
      rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  .hero-sprite {
    display: grid;
    place-items: center;
    width: 164px;
    aspect-ratio: 1;
    border-radius: 34px;
    background:
      radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.16), transparent 34%),
      linear-gradient(145deg, color-mix(in srgb, var(--agent-color) 82%, black), var(--agent-accent));
  }

  .hero-sprite span {
    font-family: 'Orbitron', sans-serif;
    font-size: 48px;
    letter-spacing: 0.08em;
  }

  .status-pill,
  .hero-badges span,
  .section-pill {
    display: inline-flex;
    align-items: center;
    min-height: 30px;
    padding: 0 10px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.03);
  }

  .hero-badges .active,
  .toggle-chip.active,
  .preset-row button.active {
    border-color: rgba(98, 215, 218, 0.28);
    background: rgba(98, 215, 218, 0.1);
    color: var(--text-0);
  }

  .progress-block {
    display: grid;
    gap: 12px;
  }

  .progress-bar {
    height: 10px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    border-radius: 999px;
  }

  .proof-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .proof-grid div {
    padding: 14px;
    border-radius: 18px;
    border: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(255, 255, 255, 0.03);
  }

  .proof-grid div {
    display: grid;
    gap: 6px;
  }

  .proof-grid strong {
    font-size: 22px;
    line-height: 1.2;
  }

  .proof-grid small {
    color: var(--text-2);
  }

  .kv-grid {
    display: grid;
    grid-template-columns: minmax(120px, 0.85fr) minmax(0, 1.15fr);
    gap: 10px 14px;
  }

  .compact-kv {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px 14px;
  }

  .compact-kv strong {
    padding: 0;
    border: 0;
    background: none;
    font-size: 18px;
    line-height: 1.35;
  }

  .kv-grid strong,
  .memory-summary strong {
    font-size: 18px;
    line-height: 1.4;
  }

  .memory-summary div {
    display: grid;
    gap: 4px;
    padding: 12px;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  .form-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .field {
    display: grid;
    gap: 6px;
  }

  .field.full {
    grid-column: 1 / -1;
  }

  .field input,
  .field select,
  .field textarea {
    width: 100%;
    padding: 10px 12px;
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.03);
    color: var(--text-0);
    resize: vertical;
  }

  .field input[type='range'] {
    padding: 0;
  }

  .field textarea {
    min-height: 88px;
  }

  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    padding: 0 14px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(223, 161, 129, 0.12);
    color: var(--text-0);
    font: inherit;
  }

  button.secondary,
  .toggle-chip {
    background: rgba(255, 255, 255, 0.03);
  }

  .toggle-chip {
    min-height: 42px;
  }

  .decision-card,
  .list-card,
  .memory-card,
  .foldout {
    display: grid;
    gap: 10px;
    padding: 14px;
    border-radius: 18px;
    border: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(255, 255, 255, 0.03);
  }

  .foldout summary {
    cursor: pointer;
    list-style: none;
    font-family: 'Orbitron', sans-serif;
    font-size: 18px;
  }

  .foldout summary::-webkit-details-marker {
    display: none;
  }

  .foldout[open] {
    background: rgba(255, 255, 255, 0.04);
  }

  .foldout > * + * {
    margin-top: 12px;
  }

  .subsection {
    padding-top: 14px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }

  .stack-compact article {
    display: grid;
    gap: 10px;
  }

  .stack-compact p {
    margin: 0;
    padding: 12px;
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    background: rgba(8, 18, 27, 0.48);
    color: var(--text-1);
    line-height: 1.5;
  }

  .two-col-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .muted,
  .empty-copy {
    color: var(--text-2);
  }

  @media (max-width: 1180px) {
    .profile-grid,
    .hero-grid,
    .workspace-grid,
    .support-grid,
    .hero,
    .form-grid,
    .foldout-grid,
    .two-col-list {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 720px) {
    .header,
    .section-head,
    .subsection-head,
    .list-head,
    .hero-title-row,
    .progress-meta {
      flex-direction: column;
      align-items: stretch;
    }

    .rent-topline,
    .proof-grid,
    .memory-summary,
    .kv-grid,
    .compact-kv {
      grid-template-columns: 1fr;
    }
  }
</style>
