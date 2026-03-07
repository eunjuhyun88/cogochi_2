import { get } from 'svelte/store';
import { createEvalScenario } from '../data/evalScenarios';
import { splitDatasetBundle } from './datasetBuilder';
import { comparePromotionCandidates } from './evalService';
import {
  buildFineTuneBundle,
  evaluateArtifactAgainstBenchmark,
  promoteArtifact,
  registerArtifact,
  runLoraJob,
  runSftJob
} from './fineTuneService';
import {
  appendArtifactLineageRecord,
  compactMemoryBank,
  labStore,
  registerModelArtifact,
  savePromptVariantFromAgent,
  updateTrainingRunRecord,
  upsertTrainingRun
} from '../stores/labStore';
import { matchStore } from '../stores/matchStore';
import { rosterStore, updateAgentConfiguration } from '../stores/rosterStore';
import type {
  EvalMetrics,
  FineTuneArtifactManifest,
  ModelArtifact,
  PromotionCandidateComparison,
  TrainingDatasetBundle,
  TrainingJob,
  TrainingJobId,
  TrainingJobResult,
  TrainingJobState,
  TrainingJobType,
  TrainingRun
} from '../types';

export interface QueueTrainingJobInput {
  agentId: string;
  type: TrainingJobType;
  requestedBy: 'PLAYER' | 'SYSTEM';
  hypothesis: string;
  benchmarkPackId: string;
  payload: Record<string, unknown>;
  changes?: string[];
}

const VALID_TRANSITIONS: Record<TrainingJobState, TrainingJobState[]> = {
  DRAFT: ['QUEUED'],
  QUEUED: ['VALIDATING', 'CANCELED'],
  VALIDATING: ['READY', 'FAILED', 'CANCELED'],
  READY: ['RUNNING', 'CANCELED'],
  RUNNING: ['EVALUATING', 'FAILED', 'CANCELED'],
  EVALUATING: ['PROMOTABLE', 'REJECTED', 'FAILED'],
  PROMOTABLE: ['PROMOTED', 'REJECTED'],
  PROMOTED: [],
  REJECTED: [],
  FAILED: [],
  CANCELED: []
};

function scenarioIdFromBenchmarkPack(benchmarkPackId: string): string {
  return benchmarkPackId.replace(/^benchmark-/, '') || 'btc-breakout';
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

function buildDefaultMetrics(benchmarkPackId: string): EvalMetrics {
  return applyScenarioWeights(
    {
      returnScore: 0.5,
      riskScore: 0.5,
      accuracyScore: 0.5,
      calibrationScore: 0.5,
      reasoningScore: 0.5,
      coordinationScore: 0.5,
      totalScore: 0.5
    },
    benchmarkPackId
  );
}

function applyScenarioWeights(metrics: EvalMetrics, benchmarkPackId: string): EvalMetrics {
  const scenario = createEvalScenario(scenarioIdFromBenchmarkPack(benchmarkPackId));
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

function averageMetrics(metrics: EvalMetrics[], benchmarkPackId: string): EvalMetrics {
  if (metrics.length === 0) return buildDefaultMetrics(benchmarkPackId);

  return applyScenarioWeights(
    {
      returnScore: Number(average(metrics.map((item) => item.returnScore)).toFixed(2)),
      riskScore: Number(average(metrics.map((item) => item.riskScore)).toFixed(2)),
      accuracyScore: Number(average(metrics.map((item) => item.accuracyScore)).toFixed(2)),
      calibrationScore: Number(average(metrics.map((item) => item.calibrationScore)).toFixed(2)),
      reasoningScore: Number(average(metrics.map((item) => item.reasoningScore)).toFixed(2)),
      coordinationScore: Number(average(metrics.map((item) => item.coordinationScore)).toFixed(2)),
      totalScore: 0.5
    },
    benchmarkPackId
  );
}

function getTrainingJob(jobId: string): TrainingRun | null {
  return get(labStore).trainingRuns.find((run) => run.id === jobId) ?? null;
}

function assertTransition(current: TrainingJobState, next: TrainingJobState): void {
  if (!VALID_TRANSITIONS[current].includes(next)) {
    throw new Error(`Invalid training job transition: ${current} -> ${next}`);
  }
}

function transitionJob(jobId: string, nextState: TrainingJobState, patch: Partial<TrainingRun> = {}): void {
  updateTrainingRunRecord(jobId, (run) => {
    assertTransition(run.state, nextState);
    return {
      ...run,
      ...patch,
      state: nextState,
      updatedAt: Date.now()
    };
  });
}

function getRecentResultsForAgent(agentId: string, benchmarkPackId: string) {
  return get(matchStore).recentResults.filter(
    (result) => `benchmark-${result.scenarioId}` === benchmarkPackId && result.agentResults.some((row) => row.agentId === agentId)
  );
}

function getFailureCounts(agentId: string, benchmarkPackId: string) {
  const results = getRecentResultsForAgent(agentId, benchmarkPackId);
  let retrievalMiss = 0;
  let retrievalNoise = 0;
  let weakReasoning = 0;
  let failureReflections = 0;
  let retrievalEvents = 0;

  for (const result of results) {
    const row = result.agentResults.find((item) => item.agentId === agentId);
    if (!row) continue;

    if (row.failureMode === 'RETRIEVAL_MISS') retrievalMiss += 1;
    if (row.failureMode === 'RETRIEVAL_NOISE') retrievalNoise += 1;
    if (row.reasoningScore <= 0.55) weakReasoning += 1;
    if (row.reflection?.verdict === 'BAD' || row.reflection?.verdict === 'MIXED') failureReflections += 1;
    retrievalEvents += result.contextPackets?.[agentId]?.retrievedMemories.length ?? 0;
  }

  return {
    recentEvalCount: results.length,
    retrievalMiss,
    retrievalNoise,
    weakReasoning,
    failureReflections,
    retrievalEvents
  };
}

function buildMergedDatasetBundle(agentId: string, benchmarkPackId: string): TrainingDatasetBundle | null {
  const matching = get(labStore).datasetBundles.filter(
    (bundle) => bundle.benchmarkPackId === benchmarkPackId && bundle.agentIds.includes(agentId)
  );
  if (matching.length === 0) return null;

  return splitDatasetBundle({
    id: `dataset-merged-${agentId}-${benchmarkPackId}`,
    agentIds: [agentId],
    benchmarkPackId,
    sourceMatchId: matching[0].sourceMatchId,
    sftExamples: matching.flatMap((bundle) => bundle.sftExamples.filter((example) => example.agentId === agentId)),
    preferenceExamples: matching.flatMap((bundle) =>
      bundle.preferenceExamples.filter((example) => example.agentId === agentId)
    ),
    trainIds: [],
    validIds: [],
    testIds: [],
    createdAt: Date.now()
  });
}

function getBaselineMetrics(agentId: string, benchmarkPackId: string): EvalMetrics {
  const recent = getRecentResultsForAgent(agentId, benchmarkPackId).map((result) => result.teamMetrics);
  return averageMetrics(recent, benchmarkPackId);
}

function buildRetrievalPolicyVersion(agentId: string): string | undefined {
  const agent = get(rosterStore).agents.find((item) => item.id === agentId);
  if (!agent) return undefined;
  const policy = agent.loadout.retrievalPolicy;
  return `topK-${policy.topK}-sim-${policy.similarityWeight.toFixed(2)}-succ-${policy.successWeight.toFixed(2)}`;
}

function buildBasePromptVariantId(agentId: string): string | undefined {
  return get(labStore).promptVariants.find((variant) => variant.agentId === agentId)?.id;
}

function adjustMetrics(base: EvalMetrics, benchmarkPackId: string, deltas: Partial<EvalMetrics>): EvalMetrics {
  return applyScenarioWeights(
    {
      returnScore: Number(clamp(base.returnScore + (deltas.returnScore ?? 0)).toFixed(2)),
      riskScore: Number(clamp(base.riskScore + (deltas.riskScore ?? 0)).toFixed(2)),
      accuracyScore: Number(clamp(base.accuracyScore + (deltas.accuracyScore ?? 0)).toFixed(2)),
      calibrationScore: Number(clamp(base.calibrationScore + (deltas.calibrationScore ?? 0)).toFixed(2)),
      reasoningScore: Number(clamp(base.reasoningScore + (deltas.reasoningScore ?? 0)).toFixed(2)),
      coordinationScore: Number(clamp(base.coordinationScore + (deltas.coordinationScore ?? 0)).toFixed(2)),
      totalScore: base.totalScore
    },
    benchmarkPackId
  );
}

function buildValidationResult(
  ok: boolean,
  state: TrainingJobState,
  message: string,
  validationErrors: string[] = []
): TrainingJobResult {
  return {
    ok,
    state,
    message,
    validationErrors
  };
}

export function queueTrainingJob(input: QueueTrainingJobInput): TrainingJobId {
  const now = Date.now();
  const job: TrainingRun = {
    id: `training-job-${input.agentId}-${now}`,
    agentId: input.agentId,
    type: input.type,
    state: 'QUEUED',
    status: 'QUEUED',
    requestedBy: input.requestedBy,
    hypothesis: input.hypothesis,
    benchmarkPackId: input.benchmarkPackId,
    changes: input.changes ?? [],
    payload: input.payload,
    validationErrors: [],
    beforeVersion: 'current',
    afterVersion: `${input.type.toLowerCase()}-${now}`,
    createdAt: now,
    updatedAt: now
  };

  upsertTrainingRun(job);
  updateAgentConfiguration(input.agentId, { status: 'TRAINING' });
  return job.id;
}

export function validateTrainingJob(job: TrainingJob): TrainingJobResult {
  const agent = get(rosterStore).agents.find((item) => item.id === job.agentId);
  if (!agent) {
    return buildValidationResult(false, 'FAILED', 'Agent not found for this training job.', ['missing-agent']);
  }

  const baseModel = get(labStore).baseModels.find((item) => item.id === agent.baseModelId);
  if (!baseModel) {
    return buildValidationResult(false, 'FAILED', 'Base model is not available in the lab catalog.', ['missing-base-model']);
  }

  if (job.type === 'CPT') {
    return buildValidationResult(false, 'FAILED', 'CPT is not allowed in the local MVP.', ['cpt-disabled']);
  }

  const memoryBank = get(labStore).memoryBanks.find((bank) => bank.agentId === job.agentId || bank.id === agent.memoryBankId) ?? null;
  const issueCounts = getFailureCounts(job.agentId, job.benchmarkPackId);
  const mergedBundle = buildMergedDatasetBundle(job.agentId, job.benchmarkPackId);
  const sftCount = mergedBundle?.sftExamples.length ?? 0;
  const preferenceCount = mergedBundle?.preferenceExamples.length ?? 0;
  const memoryUsage = memoryBank ? memoryBank.records.length / Math.max(1, memoryBank.capacity) : 0;
  const errors: string[] = [];

  switch (job.type) {
    case 'PROMPT_TUNE':
      if (issueCounts.recentEvalCount < 5) errors.push('prompt-tune-needs-5-evals');
      if (Math.max(issueCounts.failureReflections, issueCounts.weakReasoning) < 2) errors.push('prompt-tune-needs-failure-signal');
      break;
    case 'RETRIEVAL_TUNE':
      if (issueCounts.retrievalEvents < 10) errors.push('retrieval-tune-needs-10-events');
      if (issueCounts.retrievalMiss + issueCounts.retrievalNoise < 3) errors.push('retrieval-tune-needs-3-failures');
      break;
    case 'MEMORY_COMPACT':
      if (memoryUsage < 0.7) errors.push('memory-compact-needs-70pct-usage');
      break;
    case 'SFT':
      if (sftCount < 40) errors.push('sft-needs-40-examples');
      if (!mergedBundle || mergedBundle.validIds.length === 0) errors.push('sft-needs-validation-split');
      break;
    case 'LORA':
      if (sftCount < 30 && preferenceCount < 20) errors.push('lora-needs-30-sft-or-20-preference');
      break;
    default:
      break;
  }

  if (errors.length > 0) {
    return buildValidationResult(false, 'FAILED', 'Training job prerequisites were not met.', errors);
  }

  return buildValidationResult(true, 'READY', 'Training job passed validation.');
}

function runPromptTune(job: TrainingJob, baseline: EvalMetrics): EvalMetrics {
  savePromptVariantFromAgent(job.agentId, `auto-${job.type.toLowerCase()}-${Date.now()}`);
  return adjustMetrics(baseline, job.benchmarkPackId, {
    reasoningScore: 0.06,
    calibrationScore: 0.04,
    accuracyScore: 0.02
  });
}

function runRetrievalTune(job: TrainingJob, baseline: EvalMetrics): EvalMetrics {
  const agent = get(rosterStore).agents.find((item) => item.id === job.agentId);
  if (!agent) return baseline;

  const issueCounts = getFailureCounts(job.agentId, job.benchmarkPackId);
  const nextTopK =
    issueCounts.retrievalMiss >= issueCounts.retrievalNoise
      ? Math.min(6, agent.loadout.retrievalPolicy.topK + 1)
      : Math.max(1, agent.loadout.retrievalPolicy.topK - 1);

  updateAgentConfiguration(job.agentId, {
    retrievalPolicy: {
      topK: nextTopK,
      successWeight:
        issueCounts.retrievalMiss >= issueCounts.retrievalNoise
          ? Math.min(0.4, agent.loadout.retrievalPolicy.successWeight + 0.04)
          : agent.loadout.retrievalPolicy.successWeight,
      similarityWeight:
        issueCounts.retrievalNoise > issueCounts.retrievalMiss
          ? Math.min(0.7, agent.loadout.retrievalPolicy.similarityWeight + 0.05)
          : agent.loadout.retrievalPolicy.similarityWeight
    }
  });

  return adjustMetrics(baseline, job.benchmarkPackId, {
    accuracyScore: 0.05,
    reasoningScore: 0.03,
    coordinationScore: 0.02
  });
}

function runMemoryCompact(job: TrainingJob, baseline: EvalMetrics): EvalMetrics {
  compactMemoryBank(job.agentId);
  return adjustMetrics(baseline, job.benchmarkPackId, {
    riskScore: 0.05,
    reasoningScore: 0.02,
    coordinationScore: 0.02
  });
}

async function runFineTuneJob(job: TrainingJob, kind: 'SFT' | 'LORA'): Promise<{ manifest: FineTuneArtifactManifest; artifact: ModelArtifact }> {
  const agent = get(rosterStore).agents.find((item) => item.id === job.agentId);
  const bundle = buildMergedDatasetBundle(job.agentId, job.benchmarkPackId);
  if (!agent || !bundle) {
    throw new Error('Missing agent or dataset bundle for fine-tune job.');
  }

  const payload = buildFineTuneBundle(bundle, job.agentId, agent.baseModelId, job.id, kind);
  const manifest = kind === 'SFT' ? await runSftJob(payload) : await runLoraJob(payload);
  const artifact = registerArtifact(manifest);
  registerModelArtifact(artifact);
  appendArtifactLineageRecord({
    id: `lineage-created-${artifact.id}`,
    artifactId: artifact.id,
    agentId: job.agentId,
    event: 'CREATED',
    trainingJobId: job.id,
    benchmarkPackId: job.benchmarkPackId,
    sourceDatasetBundleIds: Array.isArray(job.payload.datasetBundleIds)
      ? job.payload.datasetBundleIds.filter((item): item is string => typeof item === 'string')
      : [],
    promotedFromArtifactId:
      typeof job.payload.activeArtifactId === 'string' && job.payload.activeArtifactId.length > 0
        ? job.payload.activeArtifactId
        : undefined,
    basePromptVariantId: buildBasePromptVariantId(job.agentId),
    retrievalPolicyVersion: buildRetrievalPolicyVersion(job.agentId),
    memoryCompactionLevel:
      get(labStore).memoryBanks.find((bank) => bank.agentId === job.agentId || bank.id === agent.memoryBankId)?.compactionLevel ?? 0,
    note: `${kind} candidate created from merged dataset bundle set.`,
    createdAt: manifest.createdAt
  });

  return {
    manifest,
    artifact
  };
}

function finalizeTerminalState(jobId: string, result: TrainingJobResult): void {
  updateTrainingRunRecord(jobId, (run) => ({
    ...run,
    state: result.state,
    status: result.state,
    validationErrors: result.validationErrors ?? run.validationErrors,
    resultArtifactId: result.artifactId ?? run.resultArtifactId,
    resultMetrics: result.metrics ?? run.resultMetrics,
    metricsAfter: result.metrics ?? run.metricsAfter,
    promotion: result.comparison ?? run.promotion,
    finishedAt: ['PROMOTABLE', 'PROMOTED', 'REJECTED', 'FAILED', 'CANCELED'].includes(result.state) ? Date.now() : run.finishedAt,
    updatedAt: Date.now()
  }));

  if (['PROMOTED', 'REJECTED', 'FAILED', 'CANCELED', 'PROMOTABLE'].includes(result.state)) {
    updateAgentConfiguration(getTrainingJob(jobId)?.agentId ?? '', {
      status: result.state === 'PROMOTABLE' ? 'TRAINING' : 'READY'
    });
  }
}

export async function startTrainingJob(jobId: TrainingJobId): Promise<TrainingJobResult> {
  const initial = getTrainingJob(jobId);
  if (!initial) {
    return buildValidationResult(false, 'FAILED', 'Training job not found.', ['job-not-found']);
  }

  if (initial.state !== 'QUEUED') {
    return buildValidationResult(false, initial.state, `Training job is already ${initial.state.toLowerCase()}.`);
  }

  transitionJob(jobId, 'VALIDATING');
  const validatingJob = getTrainingJob(jobId);
  if (!validatingJob) {
    return buildValidationResult(false, 'FAILED', 'Training job disappeared during validation.', ['job-missing']);
  }

  const validation = validateTrainingJob(validatingJob);
  if (!validation.ok) {
    finalizeTerminalState(jobId, validation);
    return validation;
  }

  transitionJob(jobId, 'READY');
  transitionJob(jobId, 'RUNNING', { startedAt: Date.now() });
  const runningJob = getTrainingJob(jobId);
  if (!runningJob) {
    return buildValidationResult(false, 'FAILED', 'Training job disappeared during execution.', ['job-missing']);
  }

  const baseline = getBaselineMetrics(runningJob.agentId, runningJob.benchmarkPackId);
  updateTrainingRunRecord(jobId, (run) => ({
    ...run,
    metricsBefore: baseline
  }));

  let comparison: PromotionCandidateComparison | undefined;
  let artifactId: string | undefined;
  let candidateMetrics: EvalMetrics | undefined;

  try {
    switch (runningJob.type) {
      case 'PROMPT_TUNE':
        candidateMetrics = runPromptTune(runningJob, baseline);
        break;
      case 'RETRIEVAL_TUNE':
        candidateMetrics = runRetrievalTune(runningJob, baseline);
        break;
      case 'MEMORY_COMPACT':
        candidateMetrics = runMemoryCompact(runningJob, baseline);
        break;
      case 'SFT': {
        const fineTune = await runFineTuneJob(runningJob, 'SFT');
        artifactId = fineTune.artifact.id;
        candidateMetrics = fineTune.manifest.metrics;
        break;
      }
      case 'LORA': {
        const fineTune = await runFineTuneJob(runningJob, 'LORA');
        artifactId = fineTune.artifact.id;
        candidateMetrics = fineTune.manifest.metrics;
        break;
      }
      default:
        throw new Error(`Unsupported training job type: ${runningJob.type}`);
    }
  } catch (error) {
    const result: TrainingJobResult = {
      ok: false,
      state: 'FAILED',
      message: error instanceof Error ? error.message : 'Training job execution failed.'
    };
    finalizeTerminalState(jobId, result);
    return result;
  }

  transitionJob(jobId, 'EVALUATING');

  if (artifactId) {
    comparison = await evaluateArtifactAgainstBenchmark(artifactId, runningJob.benchmarkPackId);
  } else if (candidateMetrics) {
    comparison = comparePromotionCandidates(
      baseline,
      candidateMetrics,
      runningJob.benchmarkPackId,
      undefined,
      artifactId
    );
  }

  const result: TrainingJobResult = {
    ok: Boolean(comparison?.passed),
    state: comparison?.passed ? 'PROMOTABLE' : 'REJECTED',
    message: comparison?.passed
      ? `${runningJob.type} candidate cleared promotion gates.`
      : `${runningJob.type} candidate did not clear promotion gates.`,
    artifactId,
    metrics: candidateMetrics,
    comparison
  };

  finalizeTerminalState(jobId, result);
  return result;
}

export function finalizeTrainingJob(jobId: TrainingJobId, result: TrainingJobResult): void {
  finalizeTerminalState(jobId, result);
}

export function cancelTrainingJob(jobId: TrainingJobId, reason: string): void {
  const job = getTrainingJob(jobId);
  if (!job || !['QUEUED', 'VALIDATING', 'READY', 'RUNNING'].includes(job.state)) return;

  const nextState = 'CANCELED';
  if (job.state !== nextState) {
    transitionJob(jobId, nextState, {
      validationErrors: [...job.validationErrors, reason]
    });
  }

  updateAgentConfiguration(job.agentId, { status: 'READY' });
}

export async function promoteTrainingJob(jobId: TrainingJobId): Promise<TrainingJobResult> {
  const job = getTrainingJob(jobId);
  if (!job) {
    return buildValidationResult(false, 'FAILED', 'Training job not found.', ['job-not-found']);
  }

  if (job.state !== 'PROMOTABLE') {
    return buildValidationResult(false, job.state, 'Training job is not promotable yet.');
  }

  if (job.resultArtifactId) {
    const previousArtifactId = get(rosterStore).agents.find((item) => item.id === job.agentId)?.activeArtifactId;
    await promoteArtifact(job.resultArtifactId, job.agentId);
    appendArtifactLineageRecord({
      id: `lineage-promoted-${job.resultArtifactId}-${Date.now()}`,
      artifactId: job.resultArtifactId,
      agentId: job.agentId,
      event: 'PROMOTED',
      trainingJobId: job.id,
      benchmarkPackId: job.benchmarkPackId,
      sourceDatasetBundleIds: Array.isArray(job.payload.datasetBundleIds)
        ? job.payload.datasetBundleIds.filter((item): item is string => typeof item === 'string')
        : [],
      promotedFromArtifactId: previousArtifactId,
      basePromptVariantId: buildBasePromptVariantId(job.agentId),
      retrievalPolicyVersion: buildRetrievalPolicyVersion(job.agentId),
      memoryCompactionLevel:
        get(labStore).memoryBanks.find((bank) => bank.agentId === job.agentId)?.compactionLevel ?? 0,
      note: 'Artifact cleared promotion gates and became active.',
      createdAt: Date.now()
    });
  } else {
    updateAgentConfiguration(job.agentId, { status: 'READY' });
  }

  transitionJob(jobId, 'PROMOTED', {
    finishedAt: Date.now()
  });

  return {
    ok: true,
    state: 'PROMOTED',
    message: 'Training job promoted successfully.',
    artifactId: job.resultArtifactId,
    metrics: job.resultMetrics ?? job.metricsAfter,
    comparison: job.promotion
  };
}
