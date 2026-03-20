import { get, writable } from 'svelte/store';
import { createStarterAgents, createStarterSquad, buildSquadRoleMap } from '../data/agentSeeds';
import { rosterStore } from './rosterStore';
import type { SquadState, SquadTacticPreset } from '../types';

const STORAGE_KEY = 'cogochi.squad.v2';

function defaultState(): SquadState {
  const starterAgents = createStarterAgents();
  return {
    activeSquad: createStarterSquad(starterAgents),
    savedSquads: []
  };
}

function normalizeState(raw: Partial<SquadState> | null | undefined): SquadState {
  const rosterAgents = get(rosterStore).agents;
  const fallback = defaultState();
  const parsedIds = Array.isArray(raw?.activeSquad?.memberAgentIds)
    ? raw.activeSquad.memberAgentIds.filter((id): id is string => typeof id === 'string')
    : fallback.activeSquad.memberAgentIds;
  const memberAgentIds = parsedIds.filter((id) => rosterAgents.some((agent) => agent.id === id)).slice(0, 4);

  return {
    activeSquad: {
      id: raw?.activeSquad?.id ?? fallback.activeSquad.id,
      name: raw?.activeSquad?.name ?? fallback.activeSquad.name,
      memberAgentIds,
      roleMap: buildSquadRoleMap(memberAgentIds, rosterAgents),
      tacticPreset: raw?.activeSquad?.tacticPreset ?? fallback.activeSquad.tacticPreset
    },
    savedSquads: Array.isArray(raw?.savedSquads) ? raw.savedSquads : fallback.savedSquads
  };
}

function loadState(): SquadState {
  if (typeof window === 'undefined') return defaultState();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return normalizeState(JSON.parse(raw));
  } catch {
    return defaultState();
  }
}

export const squadStore = writable<SquadState>(loadState());

if (typeof window !== 'undefined') {
  squadStore.subscribe((state) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  });
}

export function toggleSquadAgent(agentId: string): void {
  squadStore.update((state) => {
    const rosterAgents = get(rosterStore).agents;
    const exists = state.activeSquad.memberAgentIds.includes(agentId);
    const nextIds = exists
      ? state.activeSquad.memberAgentIds.filter((id) => id !== agentId)
      : [...state.activeSquad.memberAgentIds.slice(-3), agentId];

    return {
      ...state,
      activeSquad: {
        ...state.activeSquad,
        memberAgentIds: nextIds,
        roleMap: buildSquadRoleMap(nextIds, rosterAgents)
      }
    };
  });
}

export function setSquadTacticPreset(tacticPreset: SquadTacticPreset): void {
  squadStore.update((state) => ({
    ...state,
    activeSquad: {
      ...state.activeSquad,
      tacticPreset
    }
  }));
}

export function setActiveSquadMemberIds(agentIds: string[]): void {
  squadStore.update((state) => {
    const rosterAgents = get(rosterStore).agents;
    const nextIds = agentIds.filter((id) => rosterAgents.some((agent) => agent.id === id)).slice(0, 4);

    return {
      ...state,
      activeSquad: {
        ...state.activeSquad,
        memberAgentIds: nextIds,
        roleMap: buildSquadRoleMap(nextIds, rosterAgents)
      }
    };
  });
}

export function clearActiveSquad(): void {
  setActiveSquadMemberIds([]);
}
