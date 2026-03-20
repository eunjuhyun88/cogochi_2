import type {
  BattleInterventionCard,
  BattleLane,
  BattleObjectiveKind,
  BattlePhase,
  BattleState,
  ChartBackdropCandle,
  ChartBattleBackdrop,
  ChartBattleHazard,
  ChartBattleObjective,
  ChartBattleProjectile,
  ChartBattleScene,
  ChartBattleUnit,
  ChartBattleZone,
  EvalScenario
} from '../types';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function laneToY(lane: BattleLane): number {
  if (lane === 'UPPER') return 24;
  if (lane === 'LOWER') return 76;
  return 50;
}

function normalizePriceToY(price: number, minPrice: number, maxPrice: number): number {
  const ratio = (price - minPrice) / Math.max(1e-6, maxPrice - minPrice);
  return clamp(82 - ratio * 58, 16, 84);
}

function slotToX(slot: number): number {
  return [18, 38, 62, 82][slot] ?? 50;
}

function resolveFriendlyY(action: ChartBattleUnit['action']): number {
  if (action === 'LONG') return 70;
  if (action === 'SHORT') return 82;
  return 76;
}

function resolveRivalY(action: ChartBattleUnit['action']): number {
  if (action === 'SHORT') return 30;
  if (action === 'LONG') return 18;
  return 24;
}

function buildBackdrop(state: BattleState, scenario: EvalScenario): ChartBattleBackdrop {
  const candles: ChartBackdropCandle[] = [];
  const baseline = state.openingPrice;
  const drift = state.market.priceChange5m / 100;
  const volatilityScale = Math.max(0.008, state.market.volatility * 0.018);
  const points: number[] = [baseline];

  for (let index = 1; index < 14; index += 1) {
    const tilt = (index - 7) / 7;
    const next =
      points[index - 1] *
      (1 +
        drift * 0.16 +
        tilt * drift * 0.06 +
        Math.sin(index * 0.9 + state.market.tick * 0.4) * volatilityScale);
    points.push(next);
  }

  points.push(state.market.price);

  const minPrice = Math.min(...points) * 0.996;
  const maxPrice = Math.max(...points) * 1.004;

  for (let index = 0; index < points.length - 1; index += 1) {
    const open = points[index];
    const close = points[index + 1];
    const wickScale = 1 + Math.abs(Math.sin(index + state.market.tick));
    const high = Math.max(open, close) * (1 + 0.0015 * wickScale);
    const low = Math.min(open, close) * (1 - 0.0014 * wickScale);

    candles.push({
      id: `candle-${index}`,
      x: 8 + index * 6.3,
      openY: normalizePriceToY(open, minPrice, maxPrice),
      closeY: normalizePriceToY(close, minPrice, maxPrice),
      highY: normalizePriceToY(high, minPrice, maxPrice),
      lowY: normalizePriceToY(low, minPrice, maxPrice),
      bullish: close >= open
    });
  }

  return {
    symbol: scenario.symbol,
    timeframe: scenario.timeframe,
    regime: state.market.regime,
    candles,
    trendTilt: clamp(state.market.priceChange5m * 12, -18, 18),
    currentPriceLabel: `${state.market.price.toFixed(2)}`
  };
}

function buildZones(state: BattleState, scenario: EvalScenario): ChartBattleZone[] {
  const bullishBias = state.market.priceChange5m >= 0;
  const volatilityHigh = state.market.volatility >= 0.42;

  const zones: ChartBattleZone[] = [
    {
      id: 'support-zone',
      kind: 'SUPPORT',
      label: 'Support',
      lane: 'LOWER',
      x: 34,
      y: 70,
      width: 20,
      height: 11,
      state: 'ACTIVE',
      value: 0.68
    },
    {
      id: 'resistance-zone',
      kind: 'RESISTANCE',
      label: 'Liquidation Wall',
      lane: 'UPPER',
      x: 66,
      y: 24,
      width: 18,
      height: 16,
      state: bullishBias ? 'ACTIVE' : 'PRIMED',
      value: 0.74
    },
    {
      id: bullishBias ? 'long-liq-zone' : 'short-liq-zone',
      kind: bullishBias ? 'LONG_LIQ' : 'SHORT_LIQ',
      label: bullishBias ? 'Long Liq' : 'Short Liq',
      lane: bullishBias ? 'MID' : 'LOWER',
      x: bullishBias ? 64 : 26,
      y: bullishBias ? 64 : 82,
      width: 16,
      height: 10,
      state: Math.abs(state.market.openInterestChange) > 1.2 ? 'PRIMED' : 'ACTIVE',
      value: 0.8
    },
    {
      id: 'breakout-gate',
      kind: 'BREAKOUT',
      label: bullishBias ? 'Breakout Gate' : 'Breakdown Gate',
      lane: bullishBias ? 'UPPER' : 'LOWER',
      x: bullishBias ? 74 : 34,
      y: bullishBias ? 18 : 82,
      width: 12,
      height: 20,
      state: state.phase === 'RESULT' ? 'BROKEN' : 'ACTIVE',
      value: 1
    }
  ];

  if (volatilityHigh || scenario.id.includes('macro')) {
    zones.push({
      id: 'storm-zone',
      kind: 'STORM',
      label: scenario.id.includes('macro') ? 'Macro Shock' : 'Vol Storm',
      lane: 'MID',
      x: 50,
      y: 46,
      width: 24,
      height: 18,
      state: 'ACTIVE',
      value: clamp(state.market.volatility, 0.35, 0.9)
    });
  }

  return zones;
}

function resolveObjectiveKind(scenario: EvalScenario): BattleObjectiveKind {
  if (scenario.id.includes('macro')) return 'MACRO_DEFENSE';
  if (scenario.id.includes('range')) return 'RANGE_HOLD';
  if (scenario.id.includes('liq')) return 'LIQUIDITY_HUNT';
  return scenario.targetRegime === 'RANGE' ? 'RANGE_HOLD' : 'BREAKOUT_PUSH';
}

function buildObjectives(state: BattleState, scenario: EvalScenario): ChartBattleObjective[] {
  const kind = resolveObjectiveKind(scenario);
  let progress = state.consensus;
  let x = 74;
  let y = 18;
  let label = 'Breakout Gate';
  let detail = scenario.objective;

  if (kind === 'RANGE_HOLD') {
    progress = clamp(100 - Math.abs(state.consensus - 50) * 2, 0, 100);
    x = 50;
    y = 50;
    label = 'Center Box';
  }

  if (kind === 'MACRO_DEFENSE') {
    progress = clamp(100 - state.market.volatility * 85 + state.focusTapCharges * 6, 0, 100);
    x = 34;
    y = 52;
    label = 'Defense Core';
  }

  if (kind === 'LIQUIDITY_HUNT') {
    progress = clamp(45 + state.market.openInterestChange * 16 + state.consensus * 0.35, 0, 100);
    x = 60;
    y = 60;
    label = 'Liq Trigger';
  }

  return [
    {
      id: 'primary-objective',
      kind,
      label,
      detail,
      progress,
      target: 100,
      x,
      y
    }
  ];
}

function mapStance(state: BattleState['playerTeam'][number]['state'], focused: boolean): ChartBattleUnit['stance'] {
  if (focused) return 'FOCUSED';
  if (state === 'CAST' || state === 'EXECUTE') return 'CASTING';
  if (state === 'CLASH') return 'HIT';
  if (state === 'LOCK') return 'READY';
  if (state === 'COOLDOWN') return 'GUARD';
  return 'IDLE';
}

function buildUnits(state: BattleState): Pick<ChartBattleScene, 'friendlyUnits' | 'rivalUnits'> {
  return {
    friendlyUnits: state.playerTeam.map((unit) => ({
      instanceId: unit.instanceId,
      ownedAgentId: unit.ownedAgentId,
      team: unit.team,
      name: unit.name,
      role: unit.role,
      action: unit.plannedAction,
      confidence: unit.recentAccuracy,
      memoryBoost: unit.memoryScore,
      stance: mapStance(unit.state, unit.focusTapUntil > Date.now()),
      x: slotToX(unit.slot),
      y: resolveFriendlyY(unit.plannedAction),
      readout: unit.readout,
      targetZoneId: unit.currentTarget
    })),
    rivalUnits: state.enemyTeam.map((unit) => ({
      instanceId: unit.instanceId,
      ownedAgentId: unit.ownedAgentId,
      team: unit.team,
      name: unit.name,
      role: unit.role,
      action: unit.plannedAction,
      confidence: unit.recentAccuracy,
      memoryBoost: unit.memoryScore,
      stance: mapStance(unit.state, false),
      x: slotToX(unit.slot),
      y: resolveRivalY(unit.plannedAction),
      readout: unit.readout,
      targetZoneId: unit.currentTarget
    }))
  };
}

function buildProjectiles(
  state: BattleState,
  objectives: ChartBattleObjective[],
  units: Pick<ChartBattleScene, 'friendlyUnits' | 'rivalUnits'>
): ChartBattleProjectile[] {
  const unitIndex = [...units.friendlyUnits, ...units.rivalUnits].reduce<Record<string, ChartBattleUnit>>((acc, unit) => {
    acc[unit.instanceId] = unit;
    return acc;
  }, {});
  const primaryObjective = objectives[0];

  return state.orbs.map((orb) => {
    const owner = unitIndex[orb.ownerId];
    const progress = orb.team === 'player' ? clamp((orb.x - 18) / 64, 0, 1) : clamp((82 - orb.x) / 64, 0, 1);
    const targetX =
      orb.kind === 'RISK'
        ? owner
          ? clamp(owner.x + (orb.team === 'player' ? 8 : -8), 10, 90)
          : primaryObjective?.x ?? 50
        : primaryObjective?.x ?? 50;
    const targetY =
      orb.kind === 'LONG'
        ? 20
        : orb.kind === 'SHORT'
          ? 80
          : orb.team === 'player'
            ? 58
            : 42;
    const arc = orb.kind === 'LONG' ? -Math.sin(progress * Math.PI) * 8 : orb.kind === 'SHORT' ? Math.sin(progress * Math.PI) * 8 : 0;
    const x = owner ? owner.x + (targetX - owner.x) * progress : orb.x;
    const y = owner ? owner.y + (targetY - owner.y) * progress + arc : orb.y;

    return {
      id: orb.id,
      ownerId: orb.ownerId,
      team: orb.team,
      kind: orb.kind,
      x,
      y,
      size: 16 + orb.strength * 0.22,
      trail: orb.confidence >= 0.62
    };
  });
}

function buildHazards(state: BattleState, zones: ChartBattleZone[]): ChartBattleHazard[] {
  const hazards: ChartBattleHazard[] = [];

  zones.forEach((zone) => {
    if (zone.kind === 'LONG_LIQ' || zone.kind === 'SHORT_LIQ') {
      hazards.push({
        id: `${zone.id}-hazard`,
        kind: 'LIQUIDATION',
        label: zone.label,
        lane: zone.lane,
        x: zone.x,
        y: zone.y,
        severity: zone.value
      });
    }

    if (zone.kind === 'STORM') {
      hazards.push({
        id: `${zone.id}-hazard`,
        kind: 'VOLATILITY',
        label: zone.label,
        lane: zone.lane,
        x: zone.x,
        y: zone.y,
        severity: zone.value
      });
    }
  });

  if (Math.abs(state.market.fundingRate) > 0.0009) {
    hazards.push({
      id: 'news-pulse',
      kind: 'NEWS',
      label: 'Funding Bias',
      lane: 'MID',
      x: 50,
      y: 18,
      severity: clamp(Math.abs(state.market.fundingRate) * 550, 0.2, 1)
    });
  }

  return hazards;
}

function buildInterventionCards(state: BattleState): BattleInterventionCard[] {
  const cards: BattleInterventionCard[] = [
    {
      id: 'focus-tap',
      kind: 'FOCUS_TAP',
      label: 'Focus Tap',
      description: '다음 시전의 집중도를 올립니다.',
      enabled: state.phase === 'EVIDENCE' && state.focusTapCharges > 0,
      charges: state.focusTapCharges
    },
    {
      id: 'memory-pulse',
      kind: 'MEMORY_PULSE',
      label: 'Memory Pulse',
      description: '추가 기억 1장을 강제로 호출합니다.',
      enabled: state.phase === 'EVIDENCE' && state.memoryPulseCharges > 0,
      charges: state.memoryPulseCharges
    },
    {
      id: 'risk-veto',
      kind: 'RISK_VETO',
      label: 'Risk Veto',
      description: '무리한 행동을 1회 취소합니다.',
      enabled: state.phase === 'DECISION' && state.riskVetoCharges > 0,
      charges: state.riskVetoCharges
    },
    {
      id: 'retarget',
      kind: 'RETARGET',
      label: 'Retarget',
      description: '다음 우선 목표를 한 번 바꿉니다.',
      enabled: (state.phase === 'OPEN' || state.phase === 'EVIDENCE') && state.retargetCharges > 0,
      charges: state.retargetCharges
    }
  ];

  return cards;
}

export function compileChartBattleScene(state: BattleState, scenario: EvalScenario): ChartBattleScene {
  const backdrop = buildBackdrop(state, scenario);
  const zones = buildZones(state, scenario);
  const objectives = buildObjectives(state, scenario);
  const units = buildUnits(state);

  return {
    id: `scene-${scenario.id}-${state.round}-${state.phase}`,
    phase: state.phase,
    eventBanner: state.eventBanner,
    backdrop,
    zones,
    objectives,
    friendlyUnits: units.friendlyUnits,
    rivalUnits: units.rivalUnits,
    projectiles: buildProjectiles(state, objectives, units),
    hazards: buildHazards(state, zones),
    interventionCards: buildInterventionCards(state),
    advantage: clamp(state.consensus, 0, 100)
  };
}
