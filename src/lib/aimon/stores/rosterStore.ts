import { writable } from 'svelte/store';
import { AIMON_DEX } from '../data/aimonDex';
import { applyGrowthLaneToLoadout } from '../data/growthLanes';
import { createStarterAgents } from '../data/agentSeeds';
import type {
  BattleResult,
  GrowthLaneId,
  OwnedAgent,
  RetrievalPolicy,
  RosterState,
  TrainingLoadout
} from '../types';

const STORAGE_KEY = 'cogochi.roster.v2';
const LEGACY_STORAGE_KEY = 'aimon.player.progress.v1';

function calculateLevel(xp: number): number {
  return 1 + Math.floor(Math.max(0, xp) / 60);
}

function defaultState(): RosterState {
  const agents = createStarterAgents();
  return {
    agents,
    selectedAgentId: agents[0]?.id ?? null
  };
}

function normalizeAgent(agent: Partial<OwnedAgent> | null | undefined, fallbackIndex: number): OwnedAgent {
  const speciesId =
    typeof agent?.speciesId === 'string' && agent.speciesId.length > 0
      ? agent.speciesId
      : typeof agent?.archetypeId === 'string' && agent.archetypeId.length > 0
        ? agent.archetypeId
        : AIMON_DEX[fallbackIndex % AIMON_DEX.length]?.id;
  const template = createStarterAgents([speciesId], { [speciesId]: typeof agent?.xp === 'number' ? agent.xp : 0 })[0];

  return {
    ...template,
    ...agent,
    id: typeof agent?.id === 'string' && agent.id.length > 0 ? agent.id : template.id,
    speciesId: template.speciesId,
    name: typeof agent?.name === 'string' && agent.name.length > 0 ? agent.name : template.name,
    xp: typeof agent?.xp === 'number' && Number.isFinite(agent.xp) ? agent.xp : template.xp,
    bond: typeof agent?.bond === 'number' && Number.isFinite(agent.bond) ? agent.bond : template.bond,
    level: calculateLevel(typeof agent?.xp === 'number' && Number.isFinite(agent.xp) ? agent.xp : template.xp),
    updatedAt: Date.now()
  };
}

function migrateLegacyState(): RosterState {
  if (typeof window === 'undefined') return defaultState();

  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    const unlockedDexIds = Array.isArray(parsed?.unlockedDexIds)
      ? parsed.unlockedDexIds.filter((id: unknown): id is string => typeof id === 'string')
      : AIMON_DEX.map((entry) => entry.id);
    const teamDexIds = Array.isArray(parsed?.teamDexIds)
      ? parsed.teamDexIds.filter((id: unknown): id is string => typeof id === 'string')
      : [];
    const legacyXp = typeof parsed?.xp === 'number' ? parsed.xp : 0;
    const teamXpShare = teamDexIds.length > 0 ? Math.floor(legacyXp / teamDexIds.length) : 0;
    const xpBySpecies = Object.fromEntries(teamDexIds.map((id: string) => [id, teamXpShare]));
    const agents = createStarterAgents(unlockedDexIds, xpBySpecies);

    return {
      agents,
      selectedAgentId: agents[0]?.id ?? null
    };
  } catch {
    return defaultState();
  }
}

function loadState(): RosterState {
  if (typeof window === 'undefined') return defaultState();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return migrateLegacyState();
    const parsed = JSON.parse(raw);
    const agents = Array.isArray(parsed?.agents)
      ? parsed.agents.map((agent: Partial<OwnedAgent>, index: number) => normalizeAgent(agent, index))
      : defaultState().agents;
    const expandedAgents = agents.length >= 12 ? agents : defaultState().agents;

    return {
      agents: expandedAgents,
      selectedAgentId:
        typeof parsed?.selectedAgentId === 'string' &&
        expandedAgents.some((agent: OwnedAgent) => agent.id === parsed.selectedAgentId)
          ? parsed.selectedAgentId
          : expandedAgents[0]?.id ?? null
    };
  } catch {
    return defaultState();
  }
}

export const rosterStore = writable<RosterState>(loadState());

if (typeof window !== 'undefined') {
  rosterStore.subscribe((state) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  });
}

export function selectRosterAgent(agentId: string | null): void {
  rosterStore.update((state) => ({
    ...state,
    selectedAgentId: agentId && state.agents.some((agent) => agent.id === agentId) ? agentId : null
  }));
}

function updateAgentById(state: RosterState, agentId: string, updater: (agent: OwnedAgent, now: number) => OwnedAgent): RosterState {
  const now = Date.now();
  return {
    ...state,
    agents: state.agents.map((agent) => (agent.id === agentId ? updater(agent, now) : agent))
  };
}

export function updateAgentConfiguration(
  agentId: string,
  patch: {
    baseModelId?: string;
    activeArtifactId?: string;
    status?: OwnedAgent['status'];
    loadout?: Partial<TrainingLoadout>;
    retrievalPolicy?: Partial<RetrievalPolicy>;
  }
): void {
  rosterStore.update((state) =>
    updateAgentById(state, agentId, (agent, now) => ({
      ...agent,
      baseModelId: patch.baseModelId ?? agent.baseModelId,
      activeArtifactId: patch.activeArtifactId ?? agent.activeArtifactId,
      status: patch.status ?? agent.status,
      loadout: {
        ...agent.loadout,
        ...patch.loadout,
        retrievalPolicy: {
          ...agent.loadout.retrievalPolicy,
          ...patch.retrievalPolicy
        }
      },
      updatedAt: now
    }))
  );
}

export function applyGrowthLane(agentId: string, laneId: GrowthLaneId): void {
  rosterStore.update((state) =>
    updateAgentById(state, agentId, (agent, now) => ({
      ...agent,
      loadout: {
        ...agent.loadout,
        ...applyGrowthLaneToLoadout(agent.loadout, laneId)
      },
      updatedAt: now
    }))
  );
}

export function applyBattleRewardsToRoster(agentIds: string[], result: BattleResult): void {
  const uniqueIds = [...new Set(agentIds)];
  if (uniqueIds.length === 0) return;

  rosterStore.update((state) => {
    const baseXp = Math.floor(result.xpGain / uniqueIds.length);
    const remainder = result.xpGain % uniqueIds.length;
    const bondGain = result.outcome === 'WIN' ? 3 : result.outcome === 'DRAW' ? 2 : 1;
    const now = Date.now();

    const agents = state.agents.map((agent) => {
      const idx = uniqueIds.indexOf(agent.id);
      if (idx === -1) return agent;

      const xpGain = baseXp + (idx < remainder ? 1 : 0);
      const xp = agent.xp + xpGain;
      const wins = agent.record.wins + (result.outcome === 'WIN' ? 1 : 0);
      const draws = agent.record.draws + (result.outcome === 'DRAW' ? 1 : 0);
      const losses = agent.record.losses + (result.outcome === 'LOSS' ? 1 : 0);

      return {
        ...agent,
        xp,
        bond: agent.bond + bondGain,
        level: calculateLevel(xp),
        record: {
          matches: agent.record.matches + 1,
          wins,
          draws,
          losses,
          lastOutcome: result.outcome,
          lastMatchAt: now
        },
        updatedAt: now
      };
    });

    return {
      ...state,
      agents
    };
  });
}
