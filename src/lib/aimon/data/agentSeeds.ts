import { AIMON_DEX, DEFAULT_TEAM_DEX_IDS } from './aimonDex';
import { DEFAULT_BASE_MODEL_ID } from './baseModels';
import { applyGrowthLaneToLoadout, getDefaultGrowthLaneId } from './growthLanes';
import { getTrainingProfile } from './trainingProfiles';
import type {
  AgentConfidenceStyle,
  AgentHorizon,
  AgentRole,
  AgentStatus,
  AiMonDexEntry,
  AiMonType,
  MemoryBank,
  MemoryRecord,
  OwnedAgent,
  Squad,
  SquadRoleMap,
  ToolKind,
  TrainingLoadout
} from '../types';

interface StarterAgentSeed {
  speciesId: string;
  name: string;
  seedXp: number;
  bond: number;
  tag: string;
}

const ROLE_BY_TYPE: Record<AiMonType, AgentRole> = {
  Momentum: 'EXECUTOR',
  MeanReversion: 'RISK',
  Flow: 'SCOUT',
  Derivatives: 'ANALYST',
  Sentiment: 'ANALYST',
  Macro: 'RISK'
};

function getConfidenceStyle(type: AiMonType): AgentConfidenceStyle {
  if (type === 'Momentum' || type === 'Derivatives') return 'AGGRESSIVE';
  if (type === 'Macro' || type === 'MeanReversion') return 'CONSERVATIVE';
  return 'BALANCED';
}

function getHorizon(type: AiMonType): AgentHorizon {
  if (type === 'Momentum' || type === 'Derivatives') return 'SCALP';
  if (type === 'Macro') return 'SWING';
  return 'INTRADAY';
}

function getDefaultDataSourceIds(type: AiMonType): string[] {
  const shared = ['ds-price-core', 'ds-user-doctrine'];
  if (type === 'Macro') return [...shared, 'ds-macro-calendar', 'ds-news-brief'];
  if (type === 'Sentiment') return [...shared, 'ds-news-brief'];
  return [...shared, 'ds-news-brief'];
}

function getDefaultToolIds(role: AgentRole): string[] {
  const shared: ToolKind[] = ['RETRIEVER', 'SUMMARIZER'];
  if (role === 'RISK') {
    shared.push('RISK_FILTER');
  }

  return shared.map((kind) => {
    if (kind === 'RETRIEVER') return 'tool-retriever';
    if (kind === 'SUMMARIZER') return 'tool-summarizer';
    return 'tool-risk-filter';
  });
}

function buildRolePrompt(entry: AiMonDexEntry, role: AgentRole): string {
  switch (role) {
    case 'SCOUT':
      return `You are ${entry.name}, the scout. Surface early directional and regime clues before the rest of the squad commits.`;
    case 'ANALYST':
      return `You are ${entry.name}, the analyst. Convert raw signals into a coherent thesis with explicit evidence and uncertainty.`;
    case 'RISK':
      return `You are ${entry.name}, the risk lead. Block weak setups and keep the squad inside conservative downside limits.`;
    case 'EXECUTOR':
      return `You are ${entry.name}, the executor. Combine squad input into one final action and state a clear invalidation.`;
  }
}

function createLoadout(entry: AiMonDexEntry, role: AgentRole): TrainingLoadout {
  const profile = getTrainingProfile(entry.id);
  const growthLaneId = getDefaultGrowthLaneId(entry.id);
  const seededLoadout: TrainingLoadout = {
    systemPrompt: `You are ${entry.name}, an owned Cogochi evaluation agent. Respond with concise market reasoning and structured outputs.`,
    rolePrompt: buildRolePrompt(entry, role),
    policyPrompt: profile.behavior,
    enabledDataSourceIds: getDefaultDataSourceIds(entry.type),
    enabledToolIds: getDefaultToolIds(role),
    riskTolerance: role === 'RISK' ? 0.22 : role === 'EXECUTOR' ? 0.62 : 0.45,
    confidenceStyle: getConfidenceStyle(entry.type),
    horizon: getHorizon(entry.type),
    growthLaneId,
    retrievalPolicy: {
      topK: 3,
      recencyWeight: 0.15,
      similarityWeight: 0.45,
      successWeight: 0.15,
      importanceWeight: 0.1,
      roleMatchWeight: 0.1,
      regimeMatchWeight: 0.05
    },
    outputSchemaVersion: 'agent-decision.v1',
    retrainingPath: profile.retrainingPath,
    focusSkill: profile.focusSkill,
    indicators: [...profile.indicators],
    readout: profile.readout,
    behaviorNote: profile.behavior
  };

  return {
    ...seededLoadout,
    ...applyGrowthLaneToLoadout(seededLoadout, growthLaneId)
  };
}

function buildStarterPool(): StarterAgentSeed[] {
  return [
    { speciesId: 'trendlet', name: 'Trendlet Nova', seedXp: 128, bond: 16, tag: 'ignition' },
    { speciesId: 'trendlet', name: 'Trendlet Rush', seedXp: 88, bond: 9, tag: 'surge' },
    { speciesId: 'trendlet', name: 'Trendlet Vale', seedXp: 34, bond: 3, tag: 'apex' },
    { speciesId: 'trendlet', name: 'Trendlet Halo', seedXp: 12, bond: 1, tag: 'flare' },
    { speciesId: 'reverto', name: 'Reverto Arc', seedXp: 118, bond: 14, tag: 'rebound' },
    { speciesId: 'reverto', name: 'Reverto Shade', seedXp: 78, bond: 8, tag: 'counter' },
    { speciesId: 'reverto', name: 'Reverto Mint', seedXp: 26, bond: 2, tag: 'range' },
    { speciesId: 'reverto', name: 'Reverto Loom', seedXp: 10, bond: 1, tag: 'coil' },
    { speciesId: 'flowling', name: 'Flowling Tide', seedXp: 122, bond: 18, tag: 'liquidity' },
    { speciesId: 'flowling', name: 'Flowling Loom', seedXp: 82, bond: 7, tag: 'whale' },
    { speciesId: 'flowling', name: 'Flowling Peak', seedXp: 36, bond: 3, tag: 'current' },
    { speciesId: 'flowling', name: 'Flowling Crest', seedXp: 14, bond: 1, tag: 'sweep' },
    { speciesId: 'deribit', name: 'Deribit Volt', seedXp: 132, bond: 12, tag: 'shock' },
    { speciesId: 'deribit', name: 'Deribit Clash', seedXp: 94, bond: 8, tag: 'break' },
    { speciesId: 'deribit', name: 'Deribit Rift', seedXp: 42, bond: 4, tag: 'strike' },
    { speciesId: 'deribit', name: 'Deribit Vane', seedXp: 18, bond: 2, tag: 'edge' },
    { speciesId: 'sentra', name: 'Sentra Echo', seedXp: 116, bond: 17, tag: 'crowd' },
    { speciesId: 'sentra', name: 'Sentra Bloom', seedXp: 68, bond: 10, tag: 'mood' },
    { speciesId: 'sentra', name: 'Sentra Veil', seedXp: 22, bond: 2, tag: 'pulse' },
    { speciesId: 'sentra', name: 'Sentra Prism', seedXp: 8, bond: 1, tag: 'glow' },
    { speciesId: 'macrobit', name: 'Macrobit Crown', seedXp: 138, bond: 20, tag: 'cycle' },
    { speciesId: 'macrobit', name: 'Macrobit Forge', seedXp: 86, bond: 9, tag: 'anchor' },
    { speciesId: 'macrobit', name: 'Macrobit Ember', seedXp: 28, bond: 3, tag: 'regime' },
    { speciesId: 'macrobit', name: 'Macrobit Atlas', seedXp: 16, bond: 1, tag: 'hold' }
  ];
}

export function createOwnedAgentFromSpecies(
  entry: AiMonDexEntry,
  index: number,
  seedXp = 0,
  overrides: Partial<OwnedAgent> = {}
): OwnedAgent {
  const role = ROLE_BY_TYPE[entry.type];
  const id = overrides.id ?? `starter-${String(index + 1).padStart(2, '0')}-${entry.id}`;
  const now = Date.now();

  return {
    id,
    speciesId: entry.id,
    name: overrides.name ?? entry.name,
    archetypeId: entry.id,
    baseModelId: DEFAULT_BASE_MODEL_ID,
    role,
    status: 'READY' satisfies AgentStatus,
    level: 1 + Math.floor(seedXp / 60),
    xp: seedXp,
    bond: overrides.bond ?? 0,
    specializationTags: overrides.specializationTags ?? [entry.type, role, getTrainingProfile(entry.id).archetype],
    loadout: createLoadout(entry, role),
    memoryBankId: `memory-${id}`,
    record: {
      matches: 0,
      wins: 0,
      losses: 0,
      draws: 0
    },
    progression: {
      specializationTier: 1,
      unlockedToolIds: [],
      unlockedDataSourceIds: [],
      memoryCapacityBonus: 0
    },
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

export function createStarterAgents(
  dexIds: string[] | undefined = undefined,
  seedXpBySpecies: Record<string, number> = {}
): OwnedAgent[] {
  if (!dexIds) {
    return buildStarterPool()
      .map((seed, index) => {
        const entry = AIMON_DEX.find((item) => item.id === seed.speciesId);
        if (!entry) return null;

        return createOwnedAgentFromSpecies(entry, index, seed.seedXp, {
          id: `starter-${String(index + 1).padStart(2, '0')}-${seed.speciesId}-${seed.tag}`,
          name: seed.name,
          bond: seed.bond,
          specializationTags: [entry.type, ROLE_BY_TYPE[entry.type], seed.tag]
        });
      })
      .filter((agent): agent is OwnedAgent => Boolean(agent));
  }

  return dexIds
    .map((dexId) => AIMON_DEX.find((entry) => entry.id === dexId))
    .filter((entry): entry is AiMonDexEntry => Boolean(entry))
    .map((entry, index) => createOwnedAgentFromSpecies(entry, index, seedXpBySpecies[entry.id] ?? 0));
}

export function buildSquadRoleMap(agentIds: string[], agents: OwnedAgent[]): SquadRoleMap {
  const map: SquadRoleMap = {};

  for (const agentId of agentIds) {
    const agent = agents.find((item) => item.id === agentId);
    if (!agent) continue;

    if (agent.role === 'SCOUT' && !map.scout) map.scout = agent.id;
    if (agent.role === 'ANALYST' && !map.analyst) map.analyst = agent.id;
    if (agent.role === 'RISK' && !map.risk) map.risk = agent.id;
    if (agent.role === 'EXECUTOR' && !map.executor) map.executor = agent.id;
  }

  return map;
}

export function createStarterSquad(agents: OwnedAgent[]): Squad {
  const chosenIds = DEFAULT_TEAM_DEX_IDS
    .map((dexId) => agents.find((agent) => agent.speciesId === dexId)?.id)
    .filter((id): id is string => Boolean(id))
    .slice(0, 4);

  return {
    id: 'starter-squad',
    name: 'Starter Squad',
    memberAgentIds: chosenIds,
    roleMap: buildSquadRoleMap(chosenIds, agents),
    tacticPreset: 'BALANCED'
  };
}

function createStarterMemoryRecord(agent: OwnedAgent): MemoryRecord {
  return {
    id: `memory-record-${agent.id}-starter`,
    agentId: agent.id,
    kind: 'PLAYBOOK',
    title: `${agent.name} starter doctrine`,
    summary: agent.loadout.readout,
    lesson: agent.loadout.behaviorNote,
    tags: [agent.speciesId, agent.role, 'starter'],
    role: agent.role,
    regime: 'RANGE',
    symbol: 'BTCUSDT',
    timeframe: '15m',
    sourceIds: ['ds-user-doctrine'],
    successScore: 0.2,
    importance: 0.6,
    retrievalCount: 0,
    createdAt: agent.createdAt
  };
}

export function createStarterMemoryBanks(agents: OwnedAgent[]): MemoryBank[] {
  return agents.map((agent) => ({
    id: agent.memoryBankId,
    agentId: agent.id,
    capacity: 24 + agent.progression.memoryCapacityBonus,
    compactionLevel: 0,
    records: [createStarterMemoryRecord(agent)]
  }));
}
