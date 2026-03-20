import type {
  AgentConfidenceStyle,
  AgentHorizon,
  GrowthLaneId,
  TrainingLoadout
} from '../types';

export interface GrowthLaneDefinition {
  id: GrowthLaneId;
  label: string;
  shortLabel: string;
  summary: string;
  retrainingPath: string;
  focusSkill: string;
  readout: string;
  behaviorNote: string;
  indicators: string[];
  riskTolerance?: number;
  confidenceStyle?: AgentConfidenceStyle;
  horizon?: AgentHorizon;
  accent: string;
}

export const GROWTH_LANES: GrowthLaneDefinition[] = [
  {
    id: 'SIGNAL_HUNTER',
    label: 'Signal Hunter',
    shortLabel: 'Hunter',
    summary: 'Surf early clues, scan the field, and react before the market fully shows its hand.',
    retrainingPath: 'Signal Hunter',
    focusSkill: 'Early Ping',
    readout: 'Built to catch new information before the rest of the squad commits.',
    behaviorNote: 'Bias toward first-detected signal shifts and early regime clues.',
    indicators: ['Trend Scan', 'Whale Ping', 'Heat Shift'],
    confidenceStyle: 'BALANCED',
    horizon: 'INTRADAY',
    accent: '#62d7da'
  },
  {
    id: 'RISK_GUARDIAN',
    label: 'Risk Guardian',
    shortLabel: 'Guardian',
    summary: 'Prioritize survival, protect the squad, and reject weak setups before they become costly.',
    retrainingPath: 'Risk Guardian',
    focusSkill: 'Guard Rail',
    readout: 'Low-drawdown bias with tight invalidation control.',
    behaviorNote: 'Favor capital protection and early vetoes over aggressive follow-through.',
    indicators: ['Risk Filter', 'Drawdown Shield', 'Exposure Check'],
    riskTolerance: 0.24,
    confidenceStyle: 'CONSERVATIVE',
    horizon: 'SWING',
    accent: '#8bf0b4'
  },
  {
    id: 'PATTERN_ORACLE',
    label: 'Pattern Oracle',
    shortLabel: 'Oracle',
    summary: 'Lean on replayed memory, divergence, and repeatable formation reads.',
    retrainingPath: 'Pattern Oracle',
    focusSkill: 'Pattern Lock',
    readout: 'Pattern memory lane tuned for divergence, inflection, and timing clarity.',
    behaviorNote: 'Look for recurring formation signatures before increasing conviction.',
    indicators: ['Pattern Grid', 'Memory Recall', 'Divergence Check'],
    confidenceStyle: 'BALANCED',
    horizon: 'INTRADAY',
    accent: '#c58cff'
  },
  {
    id: 'MOMENTUM_RIDER',
    label: 'Momentum Rider',
    shortLabel: 'Rider',
    summary: 'Press directional conviction hard once momentum confirms and liquidity follows.',
    retrainingPath: 'Momentum Rider',
    focusSkill: 'Velocity Burst',
    readout: 'Aggressive follow-through tuned for breakout continuation.',
    behaviorNote: 'Escalate once momentum is live and do not overstay range-bound noise.',
    indicators: ['Breakout Ping', 'Momentum Lift', 'Pressure Sync'],
    riskTolerance: 0.62,
    confidenceStyle: 'AGGRESSIVE',
    horizon: 'SCALP',
    accent: '#ff9d4d'
  },
  {
    id: 'BREAKER',
    label: 'Breaker',
    shortLabel: 'Breaker',
    summary: 'Attack walls, crack resistance, and punish overextended liquidations.',
    retrainingPath: 'Breaker',
    focusSkill: 'Wall Break',
    readout: 'High-pressure lane built for resistance breaks and liquidation hunts.',
    behaviorNote: 'Commit when pressure and structure align around obvious break points.',
    indicators: ['Wall Crack', 'OI Pulse', 'Liq Radar'],
    riskTolerance: 0.56,
    confidenceStyle: 'AGGRESSIVE',
    horizon: 'SCALP',
    accent: '#ff6b61'
  },
  {
    id: 'STABILITY_CORE',
    label: 'Stability Core',
    shortLabel: 'Core',
    summary: 'Anchor the team around consistency, regime fit, and cleaner confidence curves.',
    retrainingPath: 'Stability Core',
    focusSkill: 'Regime Anchor',
    readout: 'Consistency lane for smoother reads, clearer invalidation, and stronger retention.',
    behaviorNote: 'Reduce noisy reactions and optimize for repeatable, stable outcomes.',
    indicators: ['Macro Pulse', 'Confidence Curve', 'Regime Lock'],
    riskTolerance: 0.34,
    confidenceStyle: 'CONSERVATIVE',
    horizon: 'SWING',
    accent: '#dfa181'
  }
];

export const growthLaneById = GROWTH_LANES.reduce<Record<GrowthLaneId, GrowthLaneDefinition>>((acc, lane) => {
  acc[lane.id] = lane;
  return acc;
}, {} as Record<GrowthLaneId, GrowthLaneDefinition>);

const DEFAULT_GROWTH_LANE_BY_SPECIES: Record<string, GrowthLaneId> = {
  trendlet: 'MOMENTUM_RIDER',
  reverto: 'STABILITY_CORE',
  flowling: 'SIGNAL_HUNTER',
  deribit: 'BREAKER',
  sentra: 'PATTERN_ORACLE',
  macrobit: 'RISK_GUARDIAN'
};

export function getDefaultGrowthLaneId(speciesId: string): GrowthLaneId {
  return DEFAULT_GROWTH_LANE_BY_SPECIES[speciesId] ?? 'SIGNAL_HUNTER';
}

export function applyGrowthLaneToLoadout(
  loadout: TrainingLoadout,
  laneId: GrowthLaneId
): Partial<TrainingLoadout> {
  const lane = growthLaneById[laneId];
  if (!lane) return { growthLaneId: laneId };

  return {
    growthLaneId: lane.id,
    retrainingPath: lane.retrainingPath,
    focusSkill: lane.focusSkill,
    readout: lane.readout,
    behaviorNote: lane.behaviorNote,
    indicators: lane.indicators,
    riskTolerance: lane.riskTolerance ?? loadout.riskTolerance,
    confidenceStyle: lane.confidenceStyle ?? loadout.confidenceStyle,
    horizon: lane.horizon ?? loadout.horizon
  };
}
