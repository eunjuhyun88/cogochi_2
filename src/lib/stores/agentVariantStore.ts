import { derived, get, writable } from 'svelte/store';
import type {
  AgentDoctrineId,
  AgentGrowthFocusId,
  AgentJourneyState,
  AgentModelSource,
} from '$lib/stores/agentJourneyStore';
import { agentJourneyStore } from '$lib/stores/agentJourneyStore';
import { STORAGE_KEYS } from '$lib/stores/storageKeys';
import { autoSave, loadFromStorage } from '$lib/utils/storage';

export type StrategyRiskProfile = 'guarded' | 'balanced' | 'bold';
export type StrategyTimeframeProfile = 'scalp' | 'swing' | 'position';
export type StrategySignalProfile = 'priceAction' | 'orderFlow' | 'fundingBias' | 'memoryRecall';
export type StrategyRunType = 'backtest' | 'simulation';

export interface StrategyRunResult {
  id: string;
  type: StrategyRunType;
  edgeScore: number;
  winRate: number;
  pnl: number;
  maxDrawdown: number;
  consistency: number;
  deltaVsAnchor: number;
  note: string;
  createdAt: number;
}

export interface StrategyVariant {
  id: string;
  label: string;
  name: string;
  doctrineId: AgentDoctrineId;
  modelSource: AgentModelSource;
  growthFocus: AgentGrowthFocusId;
  riskProfile: StrategyRiskProfile;
  timeframeProfile: StrategyTimeframeProfile;
  signalProfile: StrategySignalProfile;
  runCount: number;
  latestResult: StrategyRunResult | null;
  results: StrategyRunResult[];
  createdAt: number;
  updatedAt: number;
}

export interface StrategyVariantCollection {
  agentKey: string;
  activeVariantId: string | null;
  promotedVariantId: string | null;
  variants: StrategyVariant[];
}

interface StrategyVariantState {
  collections: Record<string, StrategyVariantCollection>;
}

const STORAGE_KEY = STORAGE_KEYS.agentVariants;

export const STRATEGY_RISK_OPTIONS: Array<{
  id: StrategyRiskProfile;
  label: string;
  detail: string;
}> = [
  { id: 'guarded', label: 'Guarded', detail: 'Lower drawdown and cleaner survival.' },
  { id: 'balanced', label: 'Balanced', detail: 'A steadier middle lane for repeat tests.' },
  { id: 'bold', label: 'Bold', detail: 'Higher upside with rougher downside.' },
];

export const STRATEGY_TIMEFRAME_OPTIONS: Array<{
  id: StrategyTimeframeProfile;
  label: string;
  detail: string;
}> = [
  { id: 'scalp', label: 'Scalp', detail: 'Fast entries and noisy short windows.' },
  { id: 'swing', label: 'Swing', detail: 'Middle-speed reads with cleaner confirmation.' },
  { id: 'position', label: 'Position', detail: 'Longer holds with calmer survival curves.' },
];

export const STRATEGY_SIGNAL_OPTIONS: Array<{
  id: StrategySignalProfile;
  label: string;
  detail: string;
}> = [
  { id: 'priceAction', label: 'Price Action', detail: 'Candle structure and break points first.' },
  { id: 'orderFlow', label: 'Order Flow', detail: 'Momentum, flow, and conviction first.' },
  { id: 'fundingBias', label: 'Funding Bias', detail: 'Risk context and crowd positioning first.' },
  { id: 'memoryRecall', label: 'Memory Recall', detail: 'Pattern carry-over and recall first.' },
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, digits = 1): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function safeRecord<T extends Record<string, unknown>>(value: unknown): value is T {
  return typeof value === 'object' && value !== null;
}

function buildJourneyKey(journey: AgentJourneyState): string {
  return journey.agentId ?? `draft:${journey.shellId}:${journey.growthFocus}:${journey.agentName || 'agent'}`;
}

function buildVariantId(): string {
  return `variant-${Math.random().toString(36).slice(2, 10)}`;
}

function variantNumber(label: string): number {
  const match = label.match(/^V(\d+)$/i);
  return match ? Number(match[1]) : 0;
}

function nextVariantLabel(collection: StrategyVariantCollection): string {
  const maxValue = collection.variants.reduce((highest, item) => Math.max(highest, variantNumber(item.label)), 0);
  return `V${maxValue + 1}`;
}

function defaultRiskForDoctrine(doctrineId: AgentDoctrineId): StrategyRiskProfile {
  if (doctrineId === 'aggressive') return 'bold';
  if (doctrineId === 'defensive') return 'guarded';
  return 'balanced';
}

function defaultTimeframeForFocus(growthFocus: AgentGrowthFocusId): StrategyTimeframeProfile {
  if (growthFocus === 'signalHunter') return 'scalp';
  if (growthFocus === 'riskKeeper') return 'position';
  return 'swing';
}

function defaultSignalForFocus(growthFocus: AgentGrowthFocusId): StrategySignalProfile {
  if (growthFocus === 'signalHunter') return 'orderFlow';
  if (growthFocus === 'riskKeeper') return 'fundingBias';
  return 'memoryRecall';
}

function createBaseVariant(journey: AgentJourneyState): StrategyVariant {
  const now = Date.now();
  return {
    id: buildVariantId(),
    label: 'V1',
    name: `${journey.agentName || journey.shellLabel} Core`,
    doctrineId: journey.doctrineId,
    modelSource: journey.modelSource,
    growthFocus: journey.growthFocus,
    riskProfile: defaultRiskForDoctrine(journey.doctrineId),
    timeframeProfile: defaultTimeframeForFocus(journey.growthFocus),
    signalProfile: defaultSignalForFocus(journey.growthFocus),
    runCount: 0,
    latestResult: null,
    results: [],
    createdAt: now,
    updatedAt: now,
  };
}

function normalizeResult(input: unknown): StrategyRunResult | null {
  if (!safeRecord<Record<string, unknown>>(input)) return null;
  if (input.type !== 'backtest' && input.type !== 'simulation') return null;

  return {
    id: typeof input.id === 'string' ? input.id : buildVariantId(),
    type: input.type,
    edgeScore: Number.isFinite(input.edgeScore) ? Number(input.edgeScore) : 0,
    winRate: Number.isFinite(input.winRate) ? Number(input.winRate) : 0,
    pnl: Number.isFinite(input.pnl) ? Number(input.pnl) : 0,
    maxDrawdown: Number.isFinite(input.maxDrawdown) ? Number(input.maxDrawdown) : 0,
    consistency: Number.isFinite(input.consistency) ? Number(input.consistency) : 0,
    deltaVsAnchor: Number.isFinite(input.deltaVsAnchor) ? Number(input.deltaVsAnchor) : 0,
    note: typeof input.note === 'string' ? input.note : '',
    createdAt: Number.isFinite(input.createdAt) ? Number(input.createdAt) : Date.now(),
  };
}

function normalizeVariant(input: unknown, fallback: StrategyVariant): StrategyVariant {
  if (!safeRecord<Record<string, unknown>>(input)) return fallback;

  const results = Array.isArray(input.results)
    ? input.results.map((entry) => normalizeResult(entry)).filter((entry): entry is StrategyRunResult => Boolean(entry)).slice(-6)
    : [];
  const latestResult = normalizeResult(input.latestResult) ?? results[results.length - 1] ?? null;

  return {
    id: typeof input.id === 'string' ? input.id : fallback.id,
    label: typeof input.label === 'string' && input.label.trim() ? input.label : fallback.label,
    name: typeof input.name === 'string' && input.name.trim() ? input.name.trim().slice(0, 32) : fallback.name,
    doctrineId:
      input.doctrineId === 'aggressive' || input.doctrineId === 'defensive'
        ? input.doctrineId
        : 'balanced',
    modelSource:
      input.modelSource === 'hootVerified' || input.modelSource === 'custom'
        ? input.modelSource
        : 'openai',
    growthFocus:
      input.growthFocus === 'riskKeeper' || input.growthFocus === 'memoryGardener'
        ? input.growthFocus
        : 'signalHunter',
    riskProfile: input.riskProfile === 'guarded' || input.riskProfile === 'bold' ? input.riskProfile : 'balanced',
    timeframeProfile:
      input.timeframeProfile === 'scalp' || input.timeframeProfile === 'position' ? input.timeframeProfile : 'swing',
    signalProfile:
      input.signalProfile === 'priceAction' ||
      input.signalProfile === 'orderFlow' ||
      input.signalProfile === 'fundingBias' ||
      input.signalProfile === 'memoryRecall'
        ? input.signalProfile
        : fallback.signalProfile,
    runCount: Number.isFinite(input.runCount) ? Number(input.runCount) : results.length,
    latestResult,
    results,
    createdAt: Number.isFinite(input.createdAt) ? Number(input.createdAt) : fallback.createdAt,
    updatedAt: Number.isFinite(input.updatedAt) ? Number(input.updatedAt) : fallback.updatedAt,
  };
}

function normalizeCollection(input: unknown, journey: AgentJourneyState): StrategyVariantCollection {
  const baseVariant = createBaseVariant(journey);
  if (!safeRecord<Record<string, unknown>>(input)) {
    return {
      agentKey: buildJourneyKey(journey),
      activeVariantId: baseVariant.id,
      promotedVariantId: null,
      variants: [baseVariant],
    };
  }

  const rawVariants = Array.isArray(input.variants) ? input.variants : [];
  const variants = rawVariants.length > 0
    ? rawVariants.map((entry, index) =>
        normalizeVariant(entry, index === 0 ? baseVariant : { ...baseVariant, id: buildVariantId(), label: `V${index + 1}` })
      )
    : [baseVariant];
  const activeVariantId =
    typeof input.activeVariantId === 'string' && variants.some((item) => item.id === input.activeVariantId)
      ? input.activeVariantId
      : variants[0].id;
  const promotedVariantId =
    typeof input.promotedVariantId === 'string' && variants.some((item) => item.id === input.promotedVariantId)
      ? input.promotedVariantId
      : null;

  return {
    agentKey: buildJourneyKey(journey),
    activeVariantId,
    promotedVariantId,
    variants,
  };
}

function normalizeState(input: unknown): StrategyVariantState {
  if (!safeRecord<Record<string, unknown>>(input)) {
    return { collections: {} };
  }

  const collections = safeRecord<Record<string, unknown>>(input.collections) ? input.collections : {};
  const journey = get(agentJourneyStore);
  const normalizedCollections: Record<string, StrategyVariantCollection> = {};

  for (const [key, value] of Object.entries(collections)) {
    const draftJourney: AgentJourneyState = {
      ...journey,
      agentId: key.startsWith('draft:') ? null : key,
    };
    normalizedCollections[key] = normalizeCollection(value, draftJourney);
  }

  return {
    collections: normalizedCollections,
  };
}

function ensureCollection(state: StrategyVariantState, journey: AgentJourneyState): StrategyVariantCollection {
  const key = buildJourneyKey(journey);
  return state.collections[key] ?? normalizeCollection(null, journey);
}

function upsertCollection(state: StrategyVariantState, journey: AgentJourneyState, nextCollection: StrategyVariantCollection): StrategyVariantState {
  const key = buildJourneyKey(journey);
  return {
    ...state,
    collections: {
      ...state.collections,
      [key]: {
        ...nextCollection,
        agentKey: key,
      },
    },
  };
}

function hashString(input: string): number {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function collectBonuses(variant: StrategyVariant, runType: StrategyRunType) {
  let edge = 0;
  let pnl = 0;
  let consistency = 0;
  let drawdown = 0;
  const positives: string[] = [];
  const risks: string[] = [];

  if (variant.growthFocus === 'signalHunter') {
    edge += 4;
    pnl += 3;
    positives.push('direction calls');
    if (variant.timeframeProfile === 'scalp') {
      edge += 5;
      pnl += 3;
      positives.push('fast windows');
    }
    if (variant.riskProfile === 'bold') {
      edge += 2;
      pnl += 4;
      risks.push('wide swings');
    }
  } else if (variant.growthFocus === 'riskKeeper') {
    edge += 2;
    consistency += 6;
    drawdown -= 5;
    positives.push('downside control');
    if (variant.riskProfile === 'guarded') {
      consistency += 4;
      drawdown -= 4;
      positives.push('survival bias');
    }
    if (variant.timeframeProfile === 'position') {
      consistency += 3;
      positives.push('longer holds');
    }
  } else {
    edge += 3;
    consistency += 4;
    positives.push('pattern recall');
    if (variant.signalProfile === 'memoryRecall') {
      edge += 4;
      consistency += 3;
      positives.push('memory reuse');
    }
    if (variant.timeframeProfile === 'swing') {
      edge += 2;
      consistency += 2;
      positives.push('cleaner confirmation');
    }
  }

  if (variant.doctrineId === 'aggressive') {
    pnl += 6;
    drawdown += 6;
    consistency -= 4;
    positives.push('aggressive entries');
    risks.push('drawdown');
  } else if (variant.doctrineId === 'defensive') {
    pnl -= 1;
    drawdown -= 6;
    consistency += 5;
    positives.push('defensive timing');
  } else {
    edge += 2;
    consistency += 2;
    positives.push('balanced posture');
  }

  if (variant.riskProfile === 'guarded') {
    consistency += 4;
    drawdown -= 5;
  } else if (variant.riskProfile === 'bold') {
    pnl += 5;
    drawdown += 5;
  } else {
    edge += 1;
    consistency += 1;
  }

  if (variant.timeframeProfile === 'scalp') {
    pnl += 3;
    consistency -= 3;
  } else if (variant.timeframeProfile === 'position') {
    pnl += 1;
    consistency += 4;
  } else {
    edge += 2;
    consistency += 2;
  }

  if (variant.signalProfile === 'priceAction') {
    edge += 4;
    positives.push('clean structure');
  } else if (variant.signalProfile === 'orderFlow') {
    edge += 5;
    pnl += 2;
    positives.push('flow conviction');
  } else if (variant.signalProfile === 'fundingBias') {
    consistency += 3;
    drawdown -= 2;
    positives.push('context filters');
  } else {
    edge += 2;
    consistency += 4;
    positives.push('memory anchors');
  }

  if (variant.modelSource === 'hootVerified') {
    edge += 3;
    consistency += 4;
    positives.push('verified brain');
  } else if (variant.modelSource === 'custom') {
    edge += 4;
    pnl += 2;
    consistency -= 2;
    positives.push('custom tuning');
    risks.push('variance');
  } else {
    consistency += 1;
  }

  if (runType === 'backtest') {
    edge += 2;
    pnl += 2;
  } else {
    consistency += 4;
    drawdown -= 1;
  }

  return { edge, pnl, consistency, drawdown, positives, risks };
}

function buildRunNote(positives: string[], risks: string[], runType: StrategyRunType): string {
  const positiveLabel = positives.slice(0, 2).join(' + ') || 'balanced setup';
  const riskLabel = risks[0];
  if (!riskLabel) {
    return runType === 'backtest'
      ? `Backtest liked ${positiveLabel}.`
      : `Simulation stayed stable around ${positiveLabel}.`;
  }
  return runType === 'backtest'
    ? `Backtest improved ${positiveLabel}, but ${riskLabel} still leaks.`
    : `Simulation held on ${positiveLabel}, but ${riskLabel} still needs work.`;
}

function buildRunResult(
  variant: StrategyVariant,
  anchorVariant: StrategyVariant | null,
  runType: StrategyRunType
): StrategyRunResult {
  const runIndex = variant.runCount + 1;
  const seed = `${variant.id}:${variant.doctrineId}:${variant.riskProfile}:${variant.timeframeProfile}:${variant.signalProfile}:${runType}:${runIndex}`;
  const hash = hashString(seed);
  const noise = ((hash % 11) - 5) * 0.6;
  const secondNoise = (((hash >> 3) % 9) - 4) * 0.5;
  const { edge, pnl, consistency, drawdown, positives, risks } = collectBonuses(variant, runType);
  const experienceBonus = Math.min(variant.runCount * 0.7, 4);
  const edgeScore = clamp(round(50 + edge + experienceBonus + noise, 1), 32, 94);
  const winRate = clamp(round(42 + edge * 1.1 + consistency * 0.55 + secondNoise, 1), 30, 88);
  const pnlResult = round((edgeScore - 50) * 0.92 + pnl + secondNoise, 1);
  const maxDrawdown = -round(clamp(9 + (70 - edgeScore) * 0.18 + drawdown - consistency * 0.1, 3, 26), 1);
  const consistencyScore = clamp(round(46 + consistency + experienceBonus * 0.5 - noise, 1), 28, 95);
  const anchorScore = anchorVariant?.latestResult?.edgeScore ?? edgeScore;
  const deltaVsAnchor = round(edgeScore - anchorScore, 1);

  return {
    id: buildVariantId(),
    type: runType,
    edgeScore,
    winRate,
    pnl: pnlResult,
    maxDrawdown,
    consistency: consistencyScore,
    deltaVsAnchor,
    note: buildRunNote(positives, risks, runType),
    createdAt: Date.now(),
  };
}

function withVariantUpdated(
  collection: StrategyVariantCollection,
  variantId: string,
  updater: (variant: StrategyVariant) => StrategyVariant
): StrategyVariantCollection {
  return {
    ...collection,
    variants: collection.variants.map((variant) => (variant.id === variantId ? updater(variant) : variant)),
  };
}

const initialState = normalizeState(loadFromStorage<StrategyVariantState | null>(STORAGE_KEY, null));

function createAgentVariantStore() {
  const store = writable<StrategyVariantState>(initialState);

  function syncToJourney(journey: AgentJourneyState) {
    store.update((state) => {
      const key = buildJourneyKey(journey);
      if (state.collections[key]) {
        return state;
      }
      return upsertCollection(state, journey, normalizeCollection(null, journey));
    });
  }

  function updateActiveVariant(
    patch: Partial<
      Pick<StrategyVariant, 'doctrineId' | 'modelSource' | 'riskProfile' | 'timeframeProfile' | 'signalProfile' | 'name'>
    >
  ) {
    const journey = get(agentJourneyStore);
    store.update((state) => {
      const collection = ensureCollection(state, journey);
      if (!collection.activeVariantId) return state;

      const nextCollection = withVariantUpdated(collection, collection.activeVariantId, (variant) => ({
        ...variant,
        doctrineId: patch.doctrineId ?? variant.doctrineId,
        modelSource: patch.modelSource ?? variant.modelSource,
        riskProfile: patch.riskProfile ?? variant.riskProfile,
        timeframeProfile: patch.timeframeProfile ?? variant.timeframeProfile,
        signalProfile: patch.signalProfile ?? variant.signalProfile,
        name: typeof patch.name === 'string' && patch.name.trim() ? patch.name.trim().slice(0, 32) : variant.name,
        updatedAt: Date.now(),
      }));

      return upsertCollection(state, journey, nextCollection);
    });
  }

  function selectVariant(variantId: string) {
    const journey = get(agentJourneyStore);
    store.update((state) => {
      const collection = ensureCollection(state, journey);
      if (!collection.variants.some((variant) => variant.id === variantId)) return state;
      return upsertCollection(state, journey, {
        ...collection,
        activeVariantId: variantId,
      });
    });
  }

  function createVariantFromActive() {
    const journey = get(agentJourneyStore);
    store.update((state) => {
      const collection = ensureCollection(state, journey);
      const active = collection.variants.find((variant) => variant.id === collection.activeVariantId) ?? collection.variants[0];
      const now = Date.now();
      const nextVariant: StrategyVariant = {
        ...active,
        id: buildVariantId(),
        label: nextVariantLabel(collection),
        name: `${journey.agentName || journey.shellLabel} ${nextVariantLabel(collection)}`,
        runCount: 0,
        latestResult: null,
        results: [],
        createdAt: now,
        updatedAt: now,
      };

      return upsertCollection(state, journey, {
        ...collection,
        activeVariantId: nextVariant.id,
        variants: [...collection.variants, nextVariant],
      });
    });
  }

  function runVariant(runType: StrategyRunType) {
    const journey = get(agentJourneyStore);
    store.update((state) => {
      const collection = ensureCollection(state, journey);
      const active = collection.variants.find((variant) => variant.id === collection.activeVariantId) ?? collection.variants[0];
      const anchorId = collection.promotedVariantId ?? collection.variants[0]?.id ?? null;
      const anchorVariant = collection.variants.find((variant) => variant.id === anchorId) ?? null;
      const result = buildRunResult(active, anchorVariant, runType);

      const nextCollection = withVariantUpdated(collection, active.id, (variant) => ({
        ...variant,
        runCount: variant.runCount + 1,
        latestResult: result,
        results: [...variant.results, result].slice(-6),
        updatedAt: Date.now(),
      }));

      return upsertCollection(state, journey, nextCollection);
    });

    const readiness = get(agentJourneyStore).readiness;
    if (!readiness.firstValidationRun) {
      agentJourneyStore.markReadinessStep('firstValidationRun');
    }
  }

  function promoteVariant(variantId?: string) {
    const journey = get(agentJourneyStore);
    store.update((state) => {
      const collection = ensureCollection(state, journey);
      const nextId = variantId ?? collection.activeVariantId ?? collection.variants[0]?.id ?? null;
      if (!nextId || !collection.variants.some((variant) => variant.id === nextId)) return state;
      return upsertCollection(state, journey, {
        ...collection,
        promotedVariantId: nextId,
        activeVariantId: nextId,
      });
    });
  }

  function resetCurrentCollection() {
    const journey = get(agentJourneyStore);
    store.update((state) => upsertCollection(state, journey, normalizeCollection(null, journey)));
  }

  agentJourneyStore.subscribe(syncToJourney);

  return {
    subscribe: store.subscribe,
    updateActiveVariant,
    selectVariant,
    createVariantFromActive,
    runVariant,
    promoteVariant,
    resetCurrentCollection,
  };
}

export const agentVariantStore = createAgentVariantStore();

autoSave(agentVariantStore, STORAGE_KEY, (value) => value, 250);

export const currentJourneyVariantCollection = derived([agentVariantStore, agentJourneyStore], ([$variantState, $journey]) => {
  const key = buildJourneyKey($journey);
  return $variantState.collections[key] ?? normalizeCollection(null, $journey);
});

export const journeyStrategyVariants = derived(currentJourneyVariantCollection, ($collection) => $collection.variants);

export const activeJourneyVariant = derived(currentJourneyVariantCollection, ($collection) =>
  $collection.variants.find((variant) => variant.id === $collection.activeVariantId) ?? $collection.variants[0] ?? null
);

export const liveJourneyVariant = derived(currentJourneyVariantCollection, ($collection) =>
  $collection.variants.find((variant) => variant.id === ($collection.promotedVariantId ?? $collection.variants[0]?.id)) ??
  $collection.variants[0] ??
  null
);

export const anchorJourneyVariant = liveJourneyVariant;
