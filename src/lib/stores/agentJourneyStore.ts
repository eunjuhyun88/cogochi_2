import { derived, writable } from 'svelte/store';
import { MAIN_CAST_SHEETS } from '$lib/data/mainCastAssets';
import { STORAGE_KEYS } from '$lib/stores/storageKeys';
import { autoSave, loadFromStorage } from '$lib/utils/storage';

export type AgentShellId = 'duckeeGreen' | 'dinoVita' | 'nutty';
export type ReadinessStepId = 'modelLinked' | 'doctrineSet' | 'firstValidationRun';
export type AgentModelSource = 'openai' | 'hootVerified' | 'custom';
export type AgentDoctrineId = 'balanced' | 'aggressive' | 'defensive';

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
  shellId: AgentShellId;
  shellLabel: string;
  agentName: string;
  agentId: string | null;
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
];

const DEFAULT_SHELL = JOURNEY_SHELL_OPTIONS[0];
const STORAGE_KEY = STORAGE_KEYS.agentJourney;

function createDefaultState(): AgentJourneyState {
  return {
    shellId: DEFAULT_SHELL.id,
    shellLabel: DEFAULT_SHELL.label,
    agentName: 'New Agent',
    agentId: null,
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
  const agentName = typeof input.agentName === 'string' && input.agentName.trim()
    ? input.agentName.trim().slice(0, 24)
    : base.agentName;

  return {
    shellId: shell.id,
    shellLabel: shell.label,
    agentName,
    agentId: typeof input.agentId === 'string' && input.agentId.trim() ? input.agentId : null,
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

  function setDraft(input: Partial<Pick<AgentJourneyState, 'shellId' | 'agentName' | 'modelSource' | 'doctrineId'>>) {
    store.update((state) => {
      const shell = getShellMeta((input.shellId as AgentShellId | undefined) ?? state.shellId);
      return {
        ...state,
        shellId: shell.id,
        shellLabel: shell.label,
        agentName: typeof input.agentName === 'string' && input.agentName.trim()
          ? input.agentName.trim().slice(0, 24)
          : state.agentName,
        modelSource: input.modelSource ?? state.modelSource,
        doctrineId: input.doctrineId ?? state.doctrineId,
      };
    });
  }

  function activateAgent(input: {
    shellId: AgentShellId;
    agentName: string;
    modelSource: AgentModelSource;
    doctrineId: AgentDoctrineId;
  }) {
    const shell = getShellMeta(input.shellId);
    const agentName = input.agentName.trim().slice(0, 24) || createDefaultState().agentName;

    store.set({
      shellId: shell.id,
      shellLabel: shell.label,
      agentName,
      agentId: buildAgentId(shell.id),
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
export const readinessProgress = derived(agentJourneyStore, ($journey) =>
  Number($journey.readiness.modelLinked) +
  Number($journey.readiness.doctrineSet) +
  Number($journey.readiness.firstValidationRun)
);
