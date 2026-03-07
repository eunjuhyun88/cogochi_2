import { get, writable } from 'svelte/store';
import { BASE_MODELS } from '../data/baseModels';
import { createStarterAgents, createStarterMemoryBanks } from '../data/agentSeeds';
import { DEFAULT_DATA_SOURCES, DEFAULT_TOOLS } from '../data/labCatalog';
import { rosterStore } from './rosterStore';
import type {
  ArtifactLineageRecord,
  LabState,
  MemoryBank,
  MemoryRecord,
  ModelArtifact,
  PromptVariant,
  TrainingDatasetBundle,
  TrainingRun,
  TrainingRunType
} from '../types';

const STORAGE_KEY = 'cogochi.lab.v2';

function defaultState(): LabState {
  const starterAgents = createStarterAgents();
  return {
    baseModels: BASE_MODELS,
    dataSources: DEFAULT_DATA_SOURCES,
    tools: DEFAULT_TOOLS,
    memoryBanks: createStarterMemoryBanks(starterAgents),
    trainingRuns: [],
    promptVariants: [],
    datasetBundles: [],
    modelArtifacts: [],
    artifactLineage: []
  };
}

function normalizeMemoryBanks(rawBanks: unknown): MemoryBank[] {
  if (!Array.isArray(rawBanks)) return defaultState().memoryBanks;
  return rawBanks.filter((bank): bank is MemoryBank => Boolean(bank && typeof bank === 'object'));
}

function normalizeTrainingRuns(rawRuns: unknown): TrainingRun[] {
  if (!Array.isArray(rawRuns)) return [];

  return rawRuns
    .filter((run): run is Partial<TrainingRun> => Boolean(run && typeof run === 'object'))
    .map((run) => {
      const now = typeof run.updatedAt === 'number' ? run.updatedAt : Date.now();
      const legacyStatus = (run as Record<string, unknown>).status;
      const state =
        typeof run.state === 'string'
          ? run.state
          : legacyStatus === 'DONE'
            ? 'PROMOTED'
            : legacyStatus === 'FAILED'
              ? 'FAILED'
              : legacyStatus === 'RUNNING'
                ? 'RUNNING'
                : 'QUEUED';

      return {
        id: typeof run.id === 'string' ? run.id : `training-run-${now}`,
        agentId: typeof run.agentId === 'string' ? run.agentId : '',
        type: run.type ?? 'PROMPT_TUNE',
        state,
        status: state,
        requestedBy: run.requestedBy ?? 'PLAYER',
        hypothesis: typeof run.hypothesis === 'string' ? run.hypothesis : 'Queued training job.',
        benchmarkPackId: typeof run.benchmarkPackId === 'string' ? run.benchmarkPackId : 'benchmark-ad-hoc',
        changes: Array.isArray(run.changes) ? run.changes : [],
        payload: run.payload && typeof run.payload === 'object' ? run.payload : {},
        validationErrors: Array.isArray(run.validationErrors) ? run.validationErrors.filter((item): item is string => typeof item === 'string') : [],
        beforeVersion: typeof run.beforeVersion === 'string' ? run.beforeVersion : 'current',
        afterVersion: typeof run.afterVersion === 'string' ? run.afterVersion : `pending-${now}`,
        metricsBefore: run.metricsBefore,
        metricsAfter: run.metricsAfter,
        resultArtifactId: typeof run.resultArtifactId === 'string' ? run.resultArtifactId : undefined,
        resultMetrics: run.resultMetrics,
        promotion: run.promotion,
        createdAt: typeof run.createdAt === 'number' ? run.createdAt : now,
        updatedAt: now,
        startedAt: typeof run.startedAt === 'number' ? run.startedAt : undefined,
        finishedAt: typeof run.finishedAt === 'number' ? run.finishedAt : undefined
      };
    });
}

function normalizeArtifacts(rawArtifacts: unknown): ModelArtifact[] {
  if (!Array.isArray(rawArtifacts)) return [];
  return rawArtifacts.filter((artifact): artifact is ModelArtifact => Boolean(artifact && typeof artifact === 'object'));
}

function normalizeArtifactLineage(rawLineage: unknown): ArtifactLineageRecord[] {
  if (!Array.isArray(rawLineage)) return [];
  return rawLineage.filter((entry): entry is ArtifactLineageRecord => Boolean(entry && typeof entry === 'object'));
}

function loadState(): LabState {
  if (typeof window === 'undefined') return defaultState();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);

    return {
      baseModels: Array.isArray(parsed?.baseModels) && parsed.baseModels.length > 0 ? parsed.baseModels : BASE_MODELS,
      dataSources: Array.isArray(parsed?.dataSources) ? parsed.dataSources : DEFAULT_DATA_SOURCES,
      tools: Array.isArray(parsed?.tools) ? parsed.tools : DEFAULT_TOOLS,
      memoryBanks: normalizeMemoryBanks(parsed?.memoryBanks),
      trainingRuns: normalizeTrainingRuns(parsed?.trainingRuns),
      promptVariants: Array.isArray(parsed?.promptVariants) ? parsed.promptVariants : [],
      datasetBundles: Array.isArray(parsed?.datasetBundles) ? parsed.datasetBundles : [],
      modelArtifacts: normalizeArtifacts(parsed?.modelArtifacts),
      artifactLineage: normalizeArtifactLineage(parsed?.artifactLineage)
    };
  } catch {
    return defaultState();
  }
}

export const labStore = writable<LabState>(loadState());

if (typeof window !== 'undefined') {
  labStore.subscribe((state) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  });
}

function ensureMemoryBank(state: LabState, agentId: string, memoryBankId: string): LabState {
  if (state.memoryBanks.some((bank) => bank.agentId === agentId || bank.id === memoryBankId)) return state;

  return {
    ...state,
    memoryBanks: [
      ...state.memoryBanks,
      {
        id: memoryBankId,
        agentId,
        capacity: 24,
        compactionLevel: 0,
        records: []
      }
    ]
  };
}

function createPromptVariant(agentId: string, label: string): PromptVariant | null {
  const agent = get(rosterStore).agents.find((item) => item.id === agentId);
  if (!agent) return null;

  return {
    id: `prompt-variant-${agentId}-${Date.now()}`,
    agentId,
    label,
    systemPrompt: agent.loadout.systemPrompt,
    rolePrompt: agent.loadout.rolePrompt,
    policyPrompt: agent.loadout.policyPrompt,
    createdAt: Date.now()
  };
}

function createTrainingRun(agentId: string, type: TrainingRunType, hypothesis: string, changes: string[]): TrainingRun {
  const now = Date.now();
  return {
    id: `training-run-${agentId}-${now}`,
    agentId,
    type,
    state: 'QUEUED',
    requestedBy: 'PLAYER',
    hypothesis,
    benchmarkPackId: 'benchmark-ad-hoc',
    changes,
    payload: {},
    validationErrors: [],
    beforeVersion: 'current',
    afterVersion: `${type.toLowerCase()}-${now}`,
    status: 'QUEUED',
    createdAt: now,
    updatedAt: now
  };
}

export function upsertTrainingRun(run: TrainingRun): void {
  labStore.update((state) => ({
    ...state,
    trainingRuns: [
      {
        ...run,
        status: run.state
      },
      ...state.trainingRuns.filter((item) => item.id !== run.id)
    ].slice(0, 32)
  }));
}

export function updateTrainingRunRecord(runId: string, updater: (run: TrainingRun) => TrainingRun): void {
  labStore.update((state) => ({
    ...state,
    trainingRuns: state.trainingRuns.map((run) => {
      if (run.id !== runId) return run;
      const next = updater(run);
      return {
        ...next,
        status: next.state
      };
    })
  }));
}

export function appendMemoryRecords(records: MemoryRecord[]): MemoryRecord[] {
  if (records.length === 0) return [];

  labStore.update((state) => {
    const rosterAgents = get(rosterStore).agents;
    let next = state;

    for (const record of records) {
      const agent = rosterAgents.find((item) => item.id === record.agentId);
      if (!agent) continue;
      next = ensureMemoryBank(next, agent.id, agent.memoryBankId);
    }

    const grouped = records.reduce<Record<string, MemoryRecord[]>>((acc, record) => {
      acc[record.agentId] = [...(acc[record.agentId] ?? []), record];
      return acc;
    }, {});

    return {
      ...next,
      memoryBanks: next.memoryBanks.map((bank) =>
        grouped[bank.agentId]
          ? {
              ...bank,
              records: [...grouped[bank.agentId], ...bank.records].slice(0, bank.capacity)
            }
          : bank
      )
    };
  });

  return records;
}

export function savePromptVariantFromAgent(agentId: string, label: string): void {
  const variant = createPromptVariant(agentId, label);
  if (!variant) return;

  labStore.update((state) => ({
    ...state,
    promptVariants: [variant, ...state.promptVariants].slice(0, 16)
  }));
}

export function queueTrainingRun(agentId: string, type: TrainingRunType, hypothesis: string, changes: string[]): void {
  const run = createTrainingRun(agentId, type, hypothesis, changes);
  upsertTrainingRun(run);
}

export function compactMemoryBank(agentId: string): void {
  labStore.update((state) => ({
    ...state,
    memoryBanks: state.memoryBanks.map((bank) => {
      if (bank.agentId !== agentId) return bank;

      const keepCount = Math.max(8, Math.floor(bank.capacity / 2));
      const records = [...bank.records]
        .sort((left, right) => (right.importance + right.successScore * 0.15) - (left.importance + left.successScore * 0.15))
        .slice(0, keepCount);

      return {
        ...bank,
        compactionLevel: bank.compactionLevel + 1,
        records
      };
    })
  }));
}

export function addUserNoteMemory(agentId: string, title: string, lesson: string, tags: string[]): void {
  const agent = get(rosterStore).agents.find((item) => item.id === agentId);
  if (!agent) return;

  const now = Date.now();
  const record: MemoryRecord = {
    id: `memory-note-${agentId}-${now}`,
    agentId,
    kind: 'USER_NOTE',
    title,
    summary: lesson,
    lesson,
    tags,
    role: agent.role,
    regime: 'RANGE',
    symbol: 'BTCUSDT',
    timeframe: '15m',
    sourceIds: ['ds-user-doctrine'],
    successScore: 0,
    importance: 0.8,
    retrievalCount: 0,
    createdAt: now
  };

  labStore.update((state) => {
    const next = ensureMemoryBank(state, agent.id, agent.memoryBankId);
    return {
      ...next,
      memoryBanks: next.memoryBanks.map((bank) =>
        bank.agentId !== agent.id
          ? bank
          : {
              ...bank,
              records: [record, ...bank.records].slice(0, bank.capacity)
            }
      )
    };
  });
}

export function appendDatasetBundle(bundle: TrainingDatasetBundle): void {
  labStore.update((state) => ({
    ...state,
    datasetBundles: [bundle, ...state.datasetBundles.filter((item) => item.id !== bundle.id)].slice(0, 48)
  }));
}

export function registerModelArtifact(artifact: ModelArtifact): void {
  labStore.update((state) => ({
    ...state,
    modelArtifacts: [artifact, ...state.modelArtifacts.filter((item) => item.id !== artifact.id)].slice(0, 32)
  }));
}

export function setModelArtifactStatus(artifactId: string, status: ModelArtifact['status']): void {
  labStore.update((state) => ({
    ...state,
    modelArtifacts: state.modelArtifacts.map((artifact) =>
      artifact.id !== artifactId
        ? artifact
        : {
            ...artifact,
            status,
            promotedAt: status === 'ACTIVE' ? Date.now() : artifact.promotedAt
          }
    )
  }));
}

export function appendArtifactLineageRecord(record: ArtifactLineageRecord): void {
  labStore.update((state) => ({
    ...state,
    artifactLineage: [record, ...state.artifactLineage.filter((item) => item.id !== record.id)].slice(0, 64)
  }));
}
