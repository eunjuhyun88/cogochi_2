import { derived, writable } from 'svelte/store';
import { MAIN_CAST_SHEETS } from '$lib/data/mainCastAssets';
import { STORAGE_KEYS } from '$lib/stores/storageKeys';
import { autoSave, loadFromStorage } from '$lib/utils/storage';

export type AgentShellId =
  | 'duckeeAqua'
  | 'ducky'
  | 'redot'
  | 'nutty'
  | 'catchimonGhost'
  | 'dinoDoux'
  | 'duckeeGreen'
  | 'dinoVita';
export type ReadinessStepId = 'modelLinked' | 'doctrineSet' | 'firstValidationRun';
export type AgentModelSource = 'openai' | 'hootVerified' | 'custom';
export type AgentDoctrineId = 'balanced' | 'aggressive' | 'defensive';
export type AgentGrowthFocusId = 'signalHunter' | 'riskKeeper' | 'memoryGardener';

export interface AgentJourneyReadiness {
  modelLinked: boolean;
  doctrineSet: boolean;
  firstValidationRun: boolean;
}

export interface JourneyShellOption {
  id: AgentShellId;
  label: string;
  title: string;
  detail: string;
  sheet: string;
}

export interface AgentJourneyState {
  starterRosterIds: AgentShellId[];
  shellId: AgentShellId;
  shellLabel: string;
  agentName: string;
  agentId: string | null;
  growthFocus: AgentGrowthFocusId;
  modelSource: AgentModelSource;
  doctrineId: AgentDoctrineId;
  minted: boolean;
  terminalReady: boolean;
  readiness: AgentJourneyReadiness;
  mintedAt: number | null;
  terminalReadyAt: number | null;
}

export const JOURNEY_SHELL_OPTIONS: JourneyShellOption[] = [
  {
    id: 'duckeeAqua',
    label: 'Duckee Aqua',
    title: 'Calm wave mapper',
    detail: 'Steady opener built for players who want a smooth first read on the board.',
    sheet: MAIN_CAST_SHEETS.duckeeAqua,
  },
  {
    id: 'ducky',
    label: 'Ducky',
    title: 'Lucky tempo scout',
    detail: 'Quick-reacting starter that fits faster, more playful openings.',
    sheet: MAIN_CAST_SHEETS.ducky,
  },
  {
    id: 'redot',
    label: 'Redot',
    title: 'Hot signal chaser',
    detail: 'Momentum-first starter for players who want bolder reads and sharper swings.',
    sheet: MAIN_CAST_SHEETS.redot,
  },
  {
    id: 'duckeeGreen',
    label: 'Duckee Green',
    title: 'Patient trend keeper',
    detail: 'Balanced starter shell built for the first BTC-history run.',
    sheet: MAIN_CAST_SHEETS.duckeeGreen,
  },
  {
    id: 'dinoVita',
    label: 'Dino Vita',
    title: 'Aggressive recovery scout',
    detail: 'Faster battle instincts with a stronger risk appetite.',
    sheet: MAIN_CAST_SHEETS.dinoVita,
  },
  {
    id: 'nutty',
    label: 'Nutty',
    title: 'Curious memory gardener',
    detail: 'More reflective starter for trainer-led iteration and learning.',
    sheet: MAIN_CAST_SHEETS.nutty,
  },
  {
    id: 'catchimonGhost',
    label: 'Catchimon Ghost',
    title: 'Quiet edge hunter',
    detail: 'Sneaky specialist with a bias toward surprise entries and strange recall patterns.',
    sheet: MAIN_CAST_SHEETS.catchimonGhost,
  },
  {
    id: 'dinoDoux',
    label: 'Dino Doux',
    title: 'Soft tank mentor',
    detail: 'Defensive starter that survives rough openings and protects fragile runs.',
    sheet: MAIN_CAST_SHEETS.dinoDoux,
  },
];

const DEFAULT_STARTER_ROSTER: AgentShellId[] = ['duckeeGreen', 'dinoVita', 'nutty'];
const DEFAULT_SHELL = getShellMeta(DEFAULT_STARTER_ROSTER[0]);
const STORAGE_KEY = STORAGE_KEYS.agentJourney;

export const AGENT_GROWTH_FOCUS_OPTIONS: Array<{
  id: AgentGrowthFocusId;
  label: string;
  title: string;
  detail: string;
}> = [
  {
    id: 'signalHunter',
    label: 'Signal Hunter',
    title: 'Sharpen direction calls',
    detail: 'Prioritize momentum reads, faster convictions, and more decisive entries.',
  },
  {
    id: 'riskKeeper',
    label: 'Risk Keeper',
    title: 'Protect the run',
    detail: 'Build a safer companion that survives bad spots and loses less when wrong.',
  },
  {
    id: 'memoryGardener',
    label: 'Memory Gardener',
    title: 'Grow recall and adaptation',
    detail: 'Lean into pattern memory, reflection, and long-term learning quality.',
  },
];

function createDefaultState(): AgentJourneyState {
  return {
    starterRosterIds: DEFAULT_STARTER_ROSTER,
    shellId: DEFAULT_SHELL.id,
    shellLabel: DEFAULT_SHELL.label,
    agentName: 'New Agent',
    agentId: null,
    growthFocus: 'signalHunter',
    modelSource: 'openai',
    doctrineId: 'balanced',
    minted: false,
    terminalReady: false,
    readiness: {
      modelLinked: false,
      doctrineSet: false,
      firstValidationRun: false,
    },
    mintedAt: null,
    terminalReadyAt: null,
  };
}

function getShellMeta(shellId: AgentShellId | null | undefined): JourneyShellOption {
  return JOURNEY_SHELL_OPTIONS.find((option) => option.id === shellId) ?? DEFAULT_SHELL;
}

function normalizeState(input: Partial<AgentJourneyState> | null | undefined): AgentJourneyState {
  const base = createDefaultState();
  if (!input) return base;

  const shell = getShellMeta(input.shellId as AgentShellId | undefined);
  const starterRosterIds = Array.isArray(input.starterRosterIds)
    ? Array.from(
        new Set(
          input.starterRosterIds
            .map((item) => getShellMeta(item as AgentShellId | undefined).id)
            .filter(Boolean)
        )
      ).slice(0, 3)
    : [];
  const normalizedRoster = starterRosterIds.length > 0 ? starterRosterIds : DEFAULT_STARTER_ROSTER;
  const agentName = typeof input.agentName === 'string' && input.agentName.trim()
    ? input.agentName.trim().slice(0, 24)
    : base.agentName;
  const growthFocus =
    input.growthFocus === 'riskKeeper' || input.growthFocus === 'memoryGardener'
      ? input.growthFocus
      : 'signalHunter';
  const leadShell = normalizedRoster.includes(shell.id) ? shell : getShellMeta(normalizedRoster[0]);

  return {
    starterRosterIds: normalizedRoster,
    shellId: leadShell.id,
    shellLabel: leadShell.label,
    agentName,
    agentId: typeof input.agentId === 'string' && input.agentId.trim() ? input.agentId : null,
    growthFocus,
    modelSource: input.modelSource === 'hootVerified' || input.modelSource === 'custom' ? input.modelSource : 'openai',
    doctrineId: input.doctrineId === 'aggressive' || input.doctrineId === 'defensive' ? input.doctrineId : 'balanced',
    minted: Boolean(input.minted),
    terminalReady: Boolean(input.terminalReady),
    readiness: {
      modelLinked: Boolean(input.readiness?.modelLinked),
      doctrineSet: Boolean(input.readiness?.doctrineSet),
      firstValidationRun: Boolean(input.readiness?.firstValidationRun),
    },
    mintedAt: Number.isFinite(input.mintedAt) ? Number(input.mintedAt) : null,
    terminalReadyAt: Number.isFinite(input.terminalReadyAt) ? Number(input.terminalReadyAt) : null,
  };
}

function buildAgentId(shellId: AgentShellId) {
  const prefix = shellId === 'dinoVita' ? 'DV' : shellId === 'nutty' ? 'NT' : 'DG';
  return `CG-${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

const initialState = normalizeState(loadFromStorage<Partial<AgentJourneyState> | null>(STORAGE_KEY, null));

function createAgentJourneyStore() {
  const store = writable<AgentJourneyState>(initialState);

  function setDraft(
    input: Partial<
      Pick<AgentJourneyState, 'shellId' | 'agentName' | 'modelSource' | 'doctrineId' | 'growthFocus'>
    >
  ) {
    store.update((state) => {
      const shell = getShellMeta((input.shellId as AgentShellId | undefined) ?? state.shellId);
      return {
        ...state,
        shellId: state.starterRosterIds.includes(shell.id) ? shell.id : state.shellId,
        shellLabel: state.starterRosterIds.includes(shell.id) ? shell.label : state.shellLabel,
        agentName: typeof input.agentName === 'string' && input.agentName.trim()
          ? input.agentName.trim().slice(0, 24)
          : state.agentName,
        growthFocus: input.growthFocus ?? state.growthFocus,
        modelSource: input.modelSource ?? state.modelSource,
        doctrineId: input.doctrineId ?? state.doctrineId,
      };
    });
  }

  function setStarterRoster(nextRoster: AgentShellId[]) {
    store.update((state) => {
      const roster = Array.from(
        new Set(nextRoster.map((item) => getShellMeta(item).id))
      ).slice(0, 3);
      const starterRosterIds = roster.length > 0 ? roster : state.starterRosterIds;
      const leadShell = starterRosterIds.includes(state.shellId)
        ? getShellMeta(state.shellId)
        : getShellMeta(starterRosterIds[0]);

      return {
        ...state,
        starterRosterIds,
        shellId: leadShell.id,
        shellLabel: leadShell.label,
      };
    });
  }

  function toggleStarterRoster(shellId: AgentShellId) {
    store.update((state) => {
      const alreadySelected = state.starterRosterIds.includes(shellId);
      const starterRosterIds = alreadySelected
        ? state.starterRosterIds.filter((item) => item !== shellId)
        : state.starterRosterIds.length >= 3
          ? [...state.starterRosterIds.slice(1), shellId]
          : [...state.starterRosterIds, shellId];
      const safeRoster = starterRosterIds.length > 0 ? starterRosterIds : [shellId];
      const leadShell = safeRoster.includes(state.shellId) ? getShellMeta(state.shellId) : getShellMeta(safeRoster[0]);

      return {
        ...state,
        starterRosterIds: safeRoster,
        shellId: leadShell.id,
        shellLabel: leadShell.label,
      };
    });
  }

  function activateAgent(input: {
    starterRosterIds: AgentShellId[];
    shellId: AgentShellId;
    agentName: string;
    growthFocus: AgentGrowthFocusId;
    modelSource: AgentModelSource;
    doctrineId: AgentDoctrineId;
  }) {
    const shell = getShellMeta(input.shellId);
    const agentName = input.agentName.trim().slice(0, 24) || createDefaultState().agentName;
    const starterRosterIds = Array.from(new Set(input.starterRosterIds.map((item) => getShellMeta(item).id))).slice(0, 3);
    const safeRoster = starterRosterIds.length > 0 ? starterRosterIds : DEFAULT_STARTER_ROSTER;

    store.set({
      starterRosterIds: safeRoster,
      shellId: shell.id,
      shellLabel: shell.label,
      agentName,
      agentId: buildAgentId(shell.id),
      growthFocus: input.growthFocus,
      modelSource: input.modelSource,
      doctrineId: input.doctrineId,
      minted: true,
      terminalReady: false,
      readiness: {
        modelLinked: true,
        doctrineSet: true,
        firstValidationRun: false,
      },
      mintedAt: Date.now(),
      terminalReadyAt: null,
    });
  }

  function markReadinessStep(step: ReadinessStepId) {
    store.update((state) => {
      const readiness = {
        ...state.readiness,
        [step]: true,
      };
      const terminalReady = readiness.modelLinked && readiness.doctrineSet && readiness.firstValidationRun;
      return {
        ...state,
        readiness,
        terminalReady,
        terminalReadyAt: terminalReady ? Date.now() : state.terminalReadyAt,
      };
    });
  }

  function reset() {
    store.set(createDefaultState());
  }

  return {
    subscribe: store.subscribe,
    setDraft,
    setStarterRoster,
    toggleStarterRoster,
    activateAgent,
    markReadinessStep,
    reset,
  };
}

export const agentJourneyStore = createAgentJourneyStore();

autoSave(agentJourneyStore, STORAGE_KEY, (value) => value, 250);

export const hasMintedAgent = derived(agentJourneyStore, ($journey) => $journey.minted);
export const terminalJourneyReady = derived(agentJourneyStore, ($journey) => $journey.minted && $journey.terminalReady);
export const currentJourneyShell = derived(agentJourneyStore, ($journey) => getShellMeta($journey.shellId));
export const starterRoster = derived(agentJourneyStore, ($journey) =>
  $journey.starterRosterIds.map((id) => getShellMeta(id))
);
export const currentJourneyGrowthFocus = derived(agentJourneyStore, ($journey) =>
  AGENT_GROWTH_FOCUS_OPTIONS.find((option) => option.id === $journey.growthFocus) ?? AGENT_GROWTH_FOCUS_OPTIONS[0]
);
export const readinessProgress = derived(agentJourneyStore, ($journey) =>
  Number($journey.readiness.modelLinked) +
  Number($journey.readiness.doctrineSet) +
  Number($journey.readiness.firstValidationRun)
);
