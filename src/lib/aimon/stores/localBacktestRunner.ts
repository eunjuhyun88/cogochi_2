import { get } from 'svelte/store';
import { createEvalScenario } from '../data/evalScenarios';
import { getDefaultGrowthLaneId } from '../data/growthLanes';
import type {
  ArtifactLineageRecord,
  BenchmarkRunManifest,
  EvalMetrics,
  GrowthLaneId,
  ModelArtifact,
  OwnedAgent,
  PreferenceTrainingExample,
  PromotionCandidateComparison,
  SftTrainingExample,
  TrainingDatasetBundle,
  TrainingRun,
  TrainingRunType
} from '../types';
import {
  appendArtifactLineageRecord,
  appendDatasetBundle,
  labStore,
  registerModelArtifact,
  savePromptVariantFromAgent,
  setModelArtifactStatus,
  updateTrainingRunRecord,
  upsertTrainingRun
} from './labStore';
import { recordBenchmarkRunManifest } from './matchStore';
import { rosterStore, updateAgentConfiguration } from './rosterStore';
import { squadStore } from './squadStore';

const LANE_REGIME_FIT: Record<'TREND' | 'RANGE', Record<GrowthLaneId, number>> = {
  TREND: {
    SIGNAL_HUNTER: 0.08,
    RISK_GUARDIAN: 0.04,
    PATTERN_ORACLE: 0.06,
    MOMENTUM_RIDER: 0.16,
    BREAKER: 0.14,
    STABILITY_CORE: 0.07
  },
  RANGE: {
    SIGNAL_HUNTER: 0.07,
    RISK_GUARDIAN: 0.16,
    PATTERN_ORACLE: 0.13,
    MOMENTUM_RIDER: 0.04,
    BREAKER: 0.06,
    STABILITY_CORE: 0.12
  }
};

export interface LocalBacktestSummary {
  runId: string;
  artifactId: string;
  datasetBundleId: string;
  manifestId: string;
  focusAgentId: string;
  focusAgentName: string;
  scenarioLabel: string;
  benchmarkPackId: string;
  profile: string;
  headline: string;
  reasons: string[];
  sampleCount: number;
  beforeMetrics: EvalMetrics;
  afterMetrics: EvalMetrics;
  latencyMs: number;
  traceValidityRate: number;
}

export interface RunLocalBacktestInput {
  scenarioId: string;
  agentIds: string[];
  focusAgentId?: string;
  type?: TrainingRunType;
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function roundMetric(value: number): number {
  return Number(clamp(value, 0.18, 0.96).toFixed(2));
}

function withScenarioWeights(metrics: Omit<EvalMetrics, 'totalScore'>, scenarioId: string): EvalMetrics {
  const scenario = createEvalScenario(scenarioId);
  const weights = scenario.scoringWeights;
  const totalScore =
    metrics.returnScore * weights.returnWeight +
    metrics.riskScore * weights.riskWeight +
    metrics.accuracyScore * weights.accuracyWeight +
    metrics.calibrationScore * weights.calibrationWeight +
    metrics.reasoningScore * weights.reasoningWeight +
    metrics.coordinationScore * weights.coordinationWeight;

  return {
    ...metrics,
    totalScore: Number(clamp(totalScore).toFixed(2))
  };
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getLaneId(agent: OwnedAgent): GrowthLaneId {
  return agent.loadout.growthLaneId ?? getDefaultGrowthLaneId(agent.speciesId);
}

function buildMetrics(agents: OwnedAgent[], scenarioId: string, stage: 'before' | 'after'): EvalMetrics {
  const scenario = createEvalScenario(scenarioId);
  const regimeFit = average(agents.map((agent) => LANE_REGIME_FIT[scenario.targetRegime][getLaneId(agent)] ?? 0.05));
  const avgXp = average(agents.map((agent) => agent.xp));
  const avgBond = average(agents.map((agent) => agent.bond));
  const aggressiveShare = agents.filter((agent) => agent.loadout.confidenceStyle === 'AGGRESSIVE').length / Math.max(1, agents.length);
  const defensiveShare = agents.filter((agent) => agent.loadout.confidenceStyle === 'CONSERVATIVE').length / Math.max(1, agents.length);
  const squadDepth = Math.min(0.14, agents.length * 0.03);
  const xpFactor = Math.min(0.16, avgXp / 1300);
  const bondFactor = Math.min(0.09, avgBond / 260);
  const refinement = stage === 'after' ? 0.07 + regimeFit * 0.28 + squadDepth * 0.24 : 0;
  const trendBias = scenario.targetRegime === 'TREND' ? aggressiveShare * 0.06 : defensiveShare * 0.05;
  const disciplineBias = scenario.targetRegime === 'RANGE' ? defensiveShare * 0.05 : aggressiveShare * 0.04;

  return withScenarioWeights(
    {
      returnScore: roundMetric(0.4 + regimeFit * 0.45 + xpFactor * 0.8 + trendBias + refinement),
      riskScore: roundMetric(0.43 + defensiveShare * 0.18 + bondFactor * 0.7 + refinement * 0.5),
      accuracyScore: roundMetric(0.41 + regimeFit * 0.35 + xpFactor * 0.55 + refinement * 0.75),
      calibrationScore: roundMetric(0.39 + bondFactor * 0.8 + disciplineBias + refinement * 0.5),
      reasoningScore: roundMetric(0.44 + regimeFit * 0.28 + bondFactor * 0.6 + refinement * 0.7),
      coordinationScore: roundMetric(0.4 + squadDepth + bondFactor * 0.55 + refinement * 0.6)
    },
    scenarioId
  );
}

function buildSftExamples(
  agents: OwnedAgent[],
  scenarioId: string,
  benchmarkPackId: string,
  sampleCount: number
): SftTrainingExample[] {
  const scenario = createEvalScenario(scenarioId);
  const now = Date.now();

  return Array.from({ length: sampleCount }, (_, index) => {
    const agent = agents[index % agents.length];
    return {
      id: `sft-local-${agent.id}-${now}-${index}`,
      agentId: agent.id,
      scenarioId,
      benchmarkPackId,
      messages: [
        {
          role: 'system',
          content: `${agent.name} follows ${agent.loadout.retrainingPath} and must stay aligned with ${scenario.label}.`
        },
        {
          role: 'user',
          content: `${scenario.symbol} ${scenario.timeframe} ${scenario.targetRegime} benchmark. Keep ${agent.loadout.focusSkill} stable.`
        },
        {
          role: 'assistant',
          content: `Use ${agent.loadout.indicators.join(', ')} and prioritize ${agent.loadout.behaviorNote}`
        }
      ],
      qualityScore: roundMetric(0.56 + (index % 5) * 0.04),
      createdAt: now + index
    };
  });
}

function buildPreferenceExamples(
  agents: OwnedAgent[],
  scenarioId: string,
  benchmarkPackId: string,
  sampleCount: number
): PreferenceTrainingExample[] {
  const scenario = createEvalScenario(scenarioId);
  const now = Date.now();

  return Array.from({ length: sampleCount }, (_, index) => {
    const agent = agents[index % agents.length];
    const lane = getLaneId(agent);
    return {
      id: `pref-local-${agent.id}-${now}-${index}`,
      agentId: agent.id,
      scenarioId,
      benchmarkPackId,
      prompt: `${scenario.label} / ${lane} / ${agent.loadout.focusSkill}`,
      chosen: `Lean into ${agent.loadout.behaviorNote}`,
      rejected: `Ignore ${agent.loadout.indicators[0] ?? 'core signal'} and overtrade the noise.`,
      failureMode: index % 2 === 0 ? 'REGIME_MISMATCH' : 'OVERCONFIDENCE',
      qualityScore: roundMetric(0.52 + (index % 4) * 0.05),
      createdAt: now + index
    };
  });
}

function buildDatasetBundle(
  agents: OwnedAgent[],
  scenarioId: string,
  benchmarkPackId: string,
  sourceMatchId: string,
  bundleId: string
): TrainingDatasetBundle {
  const sftExamples = buildSftExamples(agents, scenarioId, benchmarkPackId, 12 + agents.length * 5);
  const preferenceExamples = buildPreferenceExamples(agents, scenarioId, benchmarkPackId, 8 + agents.length * 4);
  const combinedIds = [...sftExamples.map((item) => item.id), ...preferenceExamples.map((item) => item.id)];

  return {
    id: bundleId,
    agentIds: agents.map((agent) => agent.id),
    benchmarkPackId,
    sourceMatchId,
    sftExamples,
    preferenceExamples,
    trainIds: combinedIds.slice(0, Math.max(10, Math.floor(combinedIds.length * 0.7))),
    validIds: combinedIds.slice(Math.max(10, Math.floor(combinedIds.length * 0.7)), Math.max(14, Math.floor(combinedIds.length * 0.85))),
    testIds: combinedIds.slice(Math.max(14, Math.floor(combinedIds.length * 0.85))),
    createdAt: Date.now()
  };
}

function buildManifest(
  scenarioId: string,
  benchmarkPackId: string,
  runId: string,
  artifactId: string,
  latencyMs: number
): BenchmarkRunManifest {
  const scenario = createEvalScenario(scenarioId);

  return {
    runId,
    profile: 'LOCAL BACKTEST',
    benchmarkPackId,
    scenarioId,
    squadId: get(squadStore).activeSquad.id,
    primaryArtifactId: artifactId,
    artifactIds: [artifactId],
    runtime: {
      mode: 'HEURISTIC',
      baseUrl: 'local://backtest-sim',
      modelId: 'simulated-local-proof',
      temperature: 0.24,
      timeoutMs: 1200
    },
    system: {
      cpuLoadPct: 26,
      memoryUsedGb: 1.4,
      warmCache: true
    },
    fallbackCount: 0,
    invalidJsonCount: 0,
    averageLatencyMs: latencyMs,
    p95LatencyMs: latencyMs + 46,
    traceValidityRate: 0.94,
    scenarioSeedVersion: `${scenario.marketWindowId}-v1`,
    authoritative: false,
    startedAt: Date.now() - latencyMs,
    finishedAt: Date.now()
  };
}

function buildArtifact(
  primaryAgent: OwnedAgent,
  benchmarkPackId: string,
  runId: string,
  artifactId: string,
  metrics: EvalMetrics
): ModelArtifact {
  return {
    id: artifactId,
    agentId: primaryAgent.id,
    baseModelId: primaryAgent.baseModelId,
    benchmarkPackId,
    trainingJobId: runId,
    kind: 'PROMPT_VARIANT',
    label: `${primaryAgent.name} local proof ${Math.round(metrics.totalScore * 100)}`,
    storageUri: `local://artifacts/${artifactId}`,
    status: 'ACTIVE',
    metrics,
    createdAt: Date.now(),
    promotedAt: Date.now()
  };
}

function buildPromotion(previousArtifactId: string | undefined, artifactId: string, benchmarkPackId: string, before: EvalMetrics, after: EvalMetrics): PromotionCandidateComparison {
  return {
    benchmarkPackId,
    baselineArtifactId: previousArtifactId,
    candidateArtifactId: artifactId,
    passed: true,
    reasons: ['local-backtest-score-up', 'scenario-fit-confirmed', 'proof-ready'],
    deltas: {
      total: Number((after.totalScore - before.totalScore).toFixed(2)),
      returnScore: Number((after.returnScore - before.returnScore).toFixed(2)),
      riskScore: Number((after.riskScore - before.riskScore).toFixed(2)),
      accuracyScore: Number((after.accuracyScore - before.accuracyScore).toFixed(2)),
      calibrationScore: Number((after.calibrationScore - before.calibrationScore).toFixed(2)),
      reasoningScore: Number((after.reasoningScore - before.reasoningScore).toFixed(2)),
      coordinationScore: Number((after.coordinationScore - before.coordinationScore).toFixed(2))
    }
  };
}

function buildLineageRecord(
  primaryAgent: OwnedAgent,
  artifactId: string,
  runId: string,
  benchmarkPackId: string,
  bundleId: string
): ArtifactLineageRecord {
  return {
    id: `lineage-local-${primaryAgent.id}-${Date.now()}`,
    artifactId,
    agentId: primaryAgent.id,
    event: 'PROMOTED',
    trainingJobId: runId,
    benchmarkPackId,
    sourceDatasetBundleIds: [bundleId],
    basePromptVariantId: `prompt-${primaryAgent.id}`,
    retrievalPolicyVersion: `topK-${primaryAgent.loadout.retrievalPolicy.topK}`,
    memoryCompactionLevel: 0,
    note: 'Local backtest confirmed the updated doctrine and promoted the proof artifact.',
    createdAt: Date.now()
  };
}

function summarizeReasons(agents: OwnedAgent[], scenarioId: string): string[] {
  const scenario = createEvalScenario(scenarioId);
  const laneLeads = agents
    .map((agent) => ({
      name: agent.name,
      fit: LANE_REGIME_FIT[scenario.targetRegime][getLaneId(agent)] ?? 0.05
    }))
    .sort((left, right) => right.fit - left.fit)
    .slice(0, 2);

  return [
    `${laneLeads[0]?.name ?? 'Lead'} is the best ${scenario.targetRegime.toLowerCase()} fit for this pack.`,
    `${agents.length}/4 squad agents contributed doctrine and memory coverage.`,
    `The run stayed inside ${scenario.allowedDataSourceKinds.join(', ')} data scope.`
  ];
}

export async function runLocalBacktestSimulation(input: RunLocalBacktestInput): Promise<LocalBacktestSummary> {
  const roster = get(rosterStore).agents;
  const agents = input.agentIds
    .map((agentId) => roster.find((agent) => agent.id === agentId) ?? null)
    .filter((agent): agent is OwnedAgent => Boolean(agent));

  if (agents.length === 0) {
    throw new Error('No squad agents available for the local backtest.');
  }

  const primaryAgent = agents.find((agent) => agent.id === input.focusAgentId) ?? agents[0];
  const scenario = createEvalScenario(input.scenarioId);
  const benchmarkPackId = `benchmark-${scenario.id}`;
  const now = Date.now();
  const runId = `training-run-local-${primaryAgent.id}-${now}`;
  const artifactId = `artifact-local-${primaryAgent.id}-${now}`;
  const datasetBundleId = `dataset-local-${primaryAgent.id}-${now}`;
  const manifestId = `manifest-local-${primaryAgent.id}-${now}`;
  const beforeMetrics = buildMetrics(agents, input.scenarioId, 'before');
  const afterMetrics = buildMetrics(agents, input.scenarioId, 'after');
  const latencyMs = 430 + agents.length * 38;
  const previousArtifactId =
    get(labStore).modelArtifacts.find((artifact) => artifact.agentId === primaryAgent.id && artifact.status === 'ACTIVE')?.id ??
    primaryAgent.activeArtifactId;

  const run: TrainingRun = {
    id: runId,
    agentId: primaryAgent.id,
    type: input.type ?? 'PROMPT_TUNE',
    state: 'QUEUED',
    status: 'QUEUED',
    hypothesis: `${scenario.label} local backtest for ${primaryAgent.name}`,
    requestedBy: 'PLAYER',
    benchmarkPackId,
    changes: [scenario.targetRegime, primaryAgent.loadout.focusSkill, primaryAgent.loadout.retrainingPath],
    payload: {
      local: true,
      squadSize: agents.length,
      focusAgentId: primaryAgent.id
    },
    validationErrors: [],
    beforeVersion: previousArtifactId ?? 'base-model',
    afterVersion: `local-proof-${now}`,
    metricsBefore: beforeMetrics,
    createdAt: now,
    updatedAt: now
  };

  upsertTrainingRun(run);
  agents.forEach((agent) => updateAgentConfiguration(agent.id, { status: 'TRAINING' }));

  try {
    savePromptVariantFromAgent(primaryAgent.id, `local-${scenario.id}-${now}`);

    await wait(180);
    updateTrainingRunRecord(runId, (record) => ({
      ...record,
      state: 'RUNNING',
      startedAt: Date.now(),
      updatedAt: Date.now()
    }));

    await wait(260);
    const bundle = buildDatasetBundle(agents, input.scenarioId, benchmarkPackId, manifestId, datasetBundleId);
    appendDatasetBundle(bundle);
    updateTrainingRunRecord(runId, (record) => ({
      ...record,
      state: 'EVALUATING',
      updatedAt: Date.now()
    }));

    await wait(280);
    if (previousArtifactId && previousArtifactId !== artifactId) {
      setModelArtifactStatus(previousArtifactId, 'ROLLED_BACK');
    }

    const artifact = buildArtifact(primaryAgent, benchmarkPackId, runId, artifactId, afterMetrics);
    const manifest = buildManifest(input.scenarioId, benchmarkPackId, manifestId, artifactId, latencyMs);
    const promotion = buildPromotion(previousArtifactId, artifactId, benchmarkPackId, beforeMetrics, afterMetrics);
    const lineage = buildLineageRecord(primaryAgent, artifactId, runId, benchmarkPackId, datasetBundleId);

    registerModelArtifact(artifact);
    recordBenchmarkRunManifest(manifest);
    appendArtifactLineageRecord(lineage);

    updateTrainingRunRecord(runId, (record) => ({
      ...record,
      state: 'PROMOTED',
      status: 'PROMOTED',
      metricsAfter: afterMetrics,
      resultMetrics: afterMetrics,
      resultArtifactId: artifactId,
      promotion,
      finishedAt: Date.now(),
      updatedAt: Date.now()
    }));

    updateAgentConfiguration(primaryAgent.id, { activeArtifactId: artifactId, status: 'READY' });
    agents
      .filter((agent) => agent.id !== primaryAgent.id)
      .forEach((agent) => updateAgentConfiguration(agent.id, { status: 'READY' }));

    return {
      runId,
      artifactId,
      datasetBundleId,
      manifestId,
      focusAgentId: primaryAgent.id,
      focusAgentName: primaryAgent.name,
      scenarioLabel: scenario.label,
      benchmarkPackId,
      profile: manifest.profile,
      headline: `${primaryAgent.name} improved from ${Math.round(beforeMetrics.totalScore * 100)} to ${Math.round(afterMetrics.totalScore * 100)} on ${scenario.label}.`,
      reasons: summarizeReasons(agents, input.scenarioId),
      sampleCount: bundle.sftExamples.length + bundle.preferenceExamples.length,
      beforeMetrics,
      afterMetrics,
      latencyMs,
      traceValidityRate: manifest.traceValidityRate
    };
  } catch (error) {
    updateTrainingRunRecord(runId, (record) => ({
      ...record,
      state: 'FAILED',
      status: 'FAILED',
      validationErrors: [error instanceof Error ? error.message : 'local-backtest-failed'],
      finishedAt: Date.now(),
      updatedAt: Date.now()
    }));
    agents.forEach((agent) => updateAgentConfiguration(agent.id, { status: 'READY' }));
    throw error;
  }
}
