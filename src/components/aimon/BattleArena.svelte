<script lang="ts">
  import { aimonDexById } from '$lib/aimon/data/aimonDex';
  import type {
    BattleInterventionCard,
    BattleState,
    ChartBackdropCandle,
    ChartBattleHazard,
    ChartBattleProjectile,
    ChartBattleUnit,
    ChartBattleZone
  } from '$lib/aimon/types';
  import PokemonFrame from '../shared/PokemonFrame.svelte';

  const { battle, onFocusTap, onIntervention } = $props<{
    battle: BattleState;
    onFocusTap: (instanceId: string) => void;
    onIntervention: (kind: Exclude<BattleInterventionCard['kind'], 'FOCUS_TAP'>) => void;
  }>();

  let scene = $derived(battle.scene);
  let primaryObjective = $derived(scene?.objectives[0] ?? null);
  let focusCard = $derived(
    scene?.interventionCards.find((card: BattleInterventionCard) => card.kind === 'FOCUS_TAP') ?? null
  );
  let liveCommands = $derived([
    battle.memoryPulseUntil > Date.now() ? 'Memory Pulse' : null,
    battle.riskVetoUntil > Date.now() ? 'Risk Veto' : null,
    battle.retargetUntil > Date.now() ? 'Retarget' : null
  ].filter((value): value is string => Boolean(value)));

  function getOrbColor(kind: ChartBattleProjectile['kind'], team: ChartBattleProjectile['team']): string {
    if (kind === 'LONG') return '#28ff99';
    if (kind === 'SHORT') return '#ff5f5f';
    if (kind === 'RISK') return '#67d7ff';
    return team === 'player' ? '#ffe082' : '#ffb174';
  }

  function getZoneColor(kind: ChartBattleZone['kind']): string {
    if (kind === 'SUPPORT') return '#00ff88';
    if (kind === 'RESISTANCE') return '#ff6b35';
    if (kind === 'LONG_LIQ') return '#64ff7f';
    if (kind === 'SHORT_LIQ') return '#ff526e';
    if (kind === 'BREAKOUT') return '#ffe66d';
    return '#67d7ff';
  }

  function getHazardColor(hazard: ChartBattleHazard): string {
    if (hazard.kind === 'LIQUIDATION') return '#ff734f';
    if (hazard.kind === 'NEWS') return '#ffe082';
    return '#63e0ff';
  }

  function getUnitHue(unit: ChartBattleUnit): string {
    const fromDex =
      aimonDexById[battle.playerTeam.find((item: BattleState['playerTeam'][number]) => item.instanceId === unit.instanceId)?.dexId ?? ''] ??
      aimonDexById[battle.enemyTeam.find((item: BattleState['enemyTeam'][number]) => item.instanceId === unit.instanceId)?.dexId ?? ''];
    return fromDex?.color ?? (unit.team === 'player' ? '#67d7ff' : '#ff845c');
  }

  function canFocus(unit: ChartBattleUnit): boolean {
    return unit.team === 'player' && Boolean(focusCard?.enabled);
  }

  function getTrendPoints(): string {
    if (!scene) return '';
    return scene.backdrop.candles
      .map((candle: ChartBackdropCandle) => `${candle.x},${(candle.openY + candle.closeY) / 2}`)
      .join(' ');
  }

  function getTrendArea(): string {
    if (!scene || scene.backdrop.candles.length === 0) return '';
    const first = scene.backdrop.candles[0];
    const last = scene.backdrop.candles[scene.backdrop.candles.length - 1];
    const body = scene.backdrop.candles
      .map((candle: ChartBackdropCandle) => `L ${candle.x} ${((candle.openY + candle.closeY) / 2).toFixed(2)}`)
      .join(' ');
    return `M ${first.x} 92 L ${first.x} ${((first.openY + first.closeY) / 2).toFixed(2)} ${body} L ${last.x} 92 Z`;
  }

  function getUnitByInstanceId(instanceId: string): ChartBattleUnit | undefined {
    return (
      scene?.friendlyUnits.find((unit: ChartBattleUnit) => unit.instanceId === instanceId) ??
      scene?.rivalUnits.find((unit: ChartBattleUnit) => unit.instanceId === instanceId)
    );
  }

  function getProjectileTrail(projectile: ChartBattleProjectile):
    | {
        x1: number;
        y1: number;
        x2: number;
        y2: number;
      }
    | null {
    const owner = getUnitByInstanceId(projectile.ownerId);
    if (!owner) return null;
    return {
      x1: owner.x,
      y1: owner.y,
      x2: projectile.x,
      y2: projectile.y
    };
  }

  function getPressureLine(unit: ChartBattleUnit):
    | {
        x1: number;
        y1: number;
        x2: number;
        y2: number;
        kind: string;
      }
    | null {
    if (!primaryObjective) return null;

    if (unit.team === 'player') {
      if (unit.action === 'LONG') {
        return { x1: unit.x, y1: unit.y - 3, x2: primaryObjective.x - 2, y2: primaryObjective.y + 8, kind: 'long' };
      }
      if (unit.action === 'SHORT') {
        return { x1: unit.x, y1: unit.y - 3, x2: unit.x - 4, y2: 54, kind: 'short' };
      }
      return { x1: unit.x, y1: unit.y - 3, x2: unit.x, y2: 58, kind: 'neutral' };
    }

    if (unit.action === 'SHORT') {
      return { x1: unit.x, y1: unit.y + 3, x2: primaryObjective.x + 1, y2: primaryObjective.y + 34, kind: 'short' };
    }
    if (unit.action === 'LONG') {
      return { x1: unit.x, y1: unit.y + 3, x2: unit.x + 4, y2: 46, kind: 'long' };
    }
    return { x1: unit.x, y1: unit.y + 3, x2: unit.x, y2: 44, kind: 'neutral' };
  }
</script>

<PokemonFrame variant="dark" padding="14px">
  <section class="arena-shell">
    {#if scene}
      <div class="arena-topline">
        <div class="arena-callout">
          <span class="side-label">LIVE FEED</span>
          <strong>{scene.eventBanner ?? battle.eventBanner}</strong>
        </div>
        <div class="chart-meta">
          <span>{scene.backdrop.symbol}</span>
          <span>{scene.backdrop.timeframe}</span>
          <span>{scene.backdrop.regime}</span>
          <strong>{scene.backdrop.currentPriceLabel}</strong>
        </div>
      </div>

      <div class="field-shell">
        <div class="battlefield">
          <div class="chart-terrain">
            <svg class="terrain-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <linearGradient id="trend-fill" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="rgba(40,255,153,0.32)"></stop>
                  <stop offset="100%" stop-color="rgba(40,255,153,0.02)"></stop>
                </linearGradient>
                <linearGradient id="price-surge" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#19c4ff"></stop>
                  <stop offset="55%" stop-color="#5df3a6"></stop>
                  <stop offset="100%" stop-color="#d6ff7a"></stop>
                </linearGradient>
                <marker id="arrow-long" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
                  <path d="M0,0 L5,2.5 L0,5 z" fill="#5df3a6"></path>
                </marker>
                <marker id="arrow-short" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
                  <path d="M0,0 L5,2.5 L0,5 z" fill="#ff6b5f"></path>
                </marker>
                <marker id="arrow-risk" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
                  <path d="M0,0 L5,2.5 L0,5 z" fill="#67d7ff"></path>
                </marker>
              </defs>
              <path class="trend-area" d={getTrendArea()}></path>
              <polyline class="trend-line" points={getTrendPoints()}></polyline>
              {#each scene.backdrop.candles as candle (candle.id)}
                <line class:bullish={candle.bullish} class="bg-wick" x1={candle.x} y1={candle.highY} x2={candle.x} y2={candle.lowY}></line>
                <rect
                  class:bullish={candle.bullish}
                  class="bg-candle"
                  x={candle.x - 0.65}
                  y={Math.min(candle.openY, candle.closeY)}
                  width="1.3"
                  height={Math.max(1.6, Math.abs(candle.closeY - candle.openY))}
                  rx="0.45"
                ></rect>
              {/each}
              {#each [...scene.friendlyUnits, ...scene.rivalUnits] as unit (unit.instanceId)}
                {@const pressure = getPressureLine(unit)}
                {#if pressure}
                  <line
                    class={`pressure-lane ${pressure.kind}`}
                    x1={pressure.x1}
                    y1={pressure.y1}
                    x2={pressure.x2}
                    y2={pressure.y2}
                    marker-end={`url(#arrow-${pressure.kind === 'neutral' ? 'risk' : pressure.kind})`}
                  ></line>
                {/if}
              {/each}
              {#each scene.projectiles as projectile (projectile.id)}
                {@const trail = getProjectileTrail(projectile)}
                {#if trail}
                  <line
                    class={`action-vector ${projectile.kind.toLowerCase()}`}
                    x1={trail.x1}
                    y1={trail.y1}
                    x2={trail.x2}
                    y2={trail.y2}
                  ></line>
                {/if}
              {/each}
            </svg>
          </div>
          <div class="field-lines"></div>
          <div class="field-meta">
            <span>{battle.phase}</span>
            <span>{scene.backdrop.symbol} · {scene.backdrop.timeframe}</span>
            <span>ADV {scene.advantage}%</span>
          </div>
          <div class="mission-box">
            <span>Mission</span>
            <strong>{primaryObjective?.label ?? 'Primary Objective'}</strong>
            <small>{primaryObjective?.detail ?? battle.eventBanner}</small>
            <div class="mission-progress">
              <div class="mission-progress-fill" style={`width:${primaryObjective?.progress ?? battle.consensus}%;`}></div>
            </div>
          </div>
          {#if liveCommands.length > 0}
            <div class="active-command-row">
              {#each liveCommands as command (command)}
                <span>{command}</span>
              {/each}
            </div>
          {/if}

          {#each scene.objectives as objective (objective.id)}
            <div class="objective-beacon" style={`left:${objective.x}%; top:${objective.y}%;`}>
              <span>{objective.label}</span>
            </div>
          {/each}

          {#each scene.zones as zone (zone.id)}
            <div
              class={`zone ${zone.kind.toLowerCase()}`}
              style={`left:${zone.x}%; top:${zone.y}%; width:${zone.width}%; height:${zone.height}%; --zone-color:${getZoneColor(zone.kind)};`}
            >
              <strong>{zone.label}</strong>
              <small>{zone.state}</small>
            </div>
          {/each}

          {#each scene.hazards as hazard (hazard.id)}
            <div
              class="hazard"
              style={`left:${hazard.x}%; top:${hazard.y}%; --hazard-color:${getHazardColor(hazard)}; --hazard-scale:${0.65 + hazard.severity * 0.5};`}
            >
              <span>{hazard.label}</span>
            </div>
          {/each}

          {#each scene.projectiles as projectile (projectile.id)}
            <div
              class="projectile"
              style={`left:${projectile.x}%; top:${projectile.y}%; width:${projectile.size}px; height:${projectile.size}px; --orb-color:${getOrbColor(projectile.kind, projectile.team)};`}
            >
              {projectile.kind === 'LONG' ? '▲' : projectile.kind === 'SHORT' ? '▼' : projectile.kind === 'RISK' ? '!' : '•'}
            </div>
          {/each}

          {#each scene.friendlyUnits as unit (unit.instanceId)}
            <button
              class={`field-unit ${unit.stance.toLowerCase()} ${canFocus(unit) ? 'focusable' : ''}`}
              type="button"
              style={`left:${unit.x}%; top:${unit.y}%; --unit-color:${getUnitHue(unit)};`}
              onclick={() => canFocus(unit) && onFocusTap(unit.instanceId)}
            >
              <span>{unit.name.slice(0, 2).toUpperCase()}</span>
              <small>{unit.action}</small>
            </button>
          {/each}

          {#each scene.rivalUnits as unit (unit.instanceId)}
            <div
              class={`field-unit rival ${unit.stance.toLowerCase()}`}
              style={`left:${unit.x}%; top:${unit.y}%; --unit-color:${getUnitHue(unit)};`}
            >
              <span>{unit.name.slice(0, 2).toUpperCase()}</span>
              <small>{unit.action}</small>
            </div>
          {/each}
        </div>

        <div class="rail-grid">
          <section class="wing">
            <span class="side-label">MY AGENTS</span>
            <div class="unit-rail">
              {#each scene.friendlyUnits as unit (unit.instanceId)}
                <button class="unit-card friendly" type="button" onclick={() => canFocus(unit) && onFocusTap(unit.instanceId)}>
                  <strong>{unit.name}</strong>
                  <small>{unit.role ?? 'UNSET'} · {unit.action}</small>
                  <small>{Math.round(unit.confidence * 100)}% · mem {Math.round(unit.memoryBoost * 100)}%</small>
                  {#if canFocus(unit)}
                    <span class="card-tag">FOCUS</span>
                  {/if}
                </button>
              {/each}
            </div>
          </section>

          <section class="wing">
            <span class="side-label">RIVAL SQUAD</span>
            <div class="unit-rail">
              {#each scene.rivalUnits as unit (unit.instanceId)}
                <div class="unit-card enemy">
                  <strong>{unit.name}</strong>
                  <small>{unit.role ?? 'RIVAL'} · {unit.action}</small>
                  <small>{Math.round(unit.confidence * 100)}% conviction</small>
                </div>
              {/each}
            </div>
          </section>
        </div>
      </div>

      <div class="intervention-row">
        {#each scene.interventionCards as card (card.id)}
          <button
            class:enabled={card.enabled}
            class="intervention-card"
            type="button"
            disabled={!card.enabled}
            onclick={() => card.kind !== 'FOCUS_TAP' && onIntervention(card.kind)}
          >
            <strong>{card.label}</strong>
            <small>{card.description}</small>
            <span>{card.kind === 'FOCUS_TAP' ? `${card.charges} charge · tap agent` : `${card.charges} charge`}</span>
          </button>
        {/each}
      </div>
    {:else}
      <div class="empty-state">Battle scene is loading.</div>
    {/if}
  </section>
</PokemonFrame>

<style>
  .arena-shell {
    display: grid;
    gap: 10px;
  }

  .arena-topline {
    display: flex;
    align-items: start;
    justify-content: space-between;
    gap: 14px;
    padding: 0 4px;
  }

  .arena-callout {
    display: grid;
    gap: 4px;
    max-width: min(560px, 100%);
  }

  .arena-callout strong {
    margin: 0;
    color: var(--text-0);
    font-size: 14px;
    line-height: 1.45;
  }

  .chart-meta {
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    letter-spacing: 0.08em;
    color: var(--text-2);
  }

  .chart-meta span,
  .chart-meta strong {
    display: inline-flex;
    align-items: center;
    min-height: 30px;
    padding: 0 10px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.03);
  }

  .chart-meta strong {
    color: #c7f4ff;
    font-size: 13px;
  }

  .field-shell,
  .wing {
    display: grid;
    gap: 10px;
  }

  .rail-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .unit-rail {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }

  .side-label {
    color: var(--text-2);
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    letter-spacing: 0.08em;
  }

  .unit-card {
    position: relative;
    display: grid;
    gap: 4px;
    min-height: 82px;
    padding: 10px 12px;
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(10, 18, 34, 0.94);
    color: var(--text-0);
    text-align: left;
  }

  .unit-card small {
    color: var(--text-2);
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    line-height: 1.35;
  }

  .unit-card .card-tag {
    position: absolute;
    top: 10px;
    right: 10px;
    padding: 4px 8px;
    border-radius: 999px;
    background: rgba(0,229,255,0.12);
    color: #8ff3ff;
    font-size: 14px;
  }

  .battlefield {
    position: relative;
    min-height: 540px;
    border-radius: 24px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.08);
    background:
      linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01)),
      radial-gradient(circle at 50% 42%, rgba(98,215,218,0.14), transparent 42%),
      linear-gradient(180deg, rgba(11,24,36,0.94), rgba(5,10,20,0.98));
  }

  .chart-terrain {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    opacity: 0.92;
  }

  .terrain-svg {
    width: 100%;
    height: 100%;
  }

  .trend-area {
    fill: url(#trend-fill);
    opacity: 0.9;
  }

  .trend-line {
    fill: none;
    stroke: url(#price-surge);
    stroke-width: 1.2;
    stroke-linecap: round;
    stroke-linejoin: round;
    filter: drop-shadow(0 0 8px rgba(40,255,153,0.28));
  }

  .bg-wick {
    stroke: rgba(255,255,255,0.2);
    stroke-width: 0.22;
  }

  .bg-wick.bullish {
    stroke: rgba(120,255,178,0.42);
  }

  .bg-candle {
    fill: rgba(255,95,95,0.36);
  }

  .bg-candle.bullish {
    fill: rgba(40,255,153,0.42);
  }

  .action-vector {
    stroke-width: 0.4;
    stroke-linecap: round;
    opacity: 0.72;
    stroke-dasharray: 1.4 1.2;
  }

  .action-vector.long {
    stroke: rgba(40,255,153,0.85);
  }

  .action-vector.short {
    stroke: rgba(255,95,95,0.85);
  }

  .action-vector.risk,
  .action-vector.neutral {
    stroke: rgba(103,215,255,0.82);
  }

  .pressure-lane {
    stroke-width: 0.9;
    stroke-linecap: round;
    fill: none;
    opacity: 0.92;
  }

  .pressure-lane.long {
    stroke: rgba(93,243,166,0.9);
    filter: drop-shadow(0 0 6px rgba(93,243,166,0.3));
  }

  .pressure-lane.short {
    stroke: rgba(255,107,95,0.92);
    filter: drop-shadow(0 0 6px rgba(255,107,95,0.3));
  }

  .pressure-lane.risk,
  .pressure-lane.neutral {
    stroke: rgba(103,215,255,0.88);
    filter: drop-shadow(0 0 6px rgba(103,215,255,0.24));
    stroke-dasharray: 1.2 1.2;
  }

  .field-lines {
    position: absolute;
    inset: 0;
    opacity: 0.1;
    background:
      linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
    background-size: 28px 28px;
    mask-image: linear-gradient(180deg, black, rgba(0,0,0,0.55));
  }

  .field-meta {
    position: absolute;
    top: 14px;
    left: 14px;
    z-index: 3;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    letter-spacing: 0.06em;
  }

  .field-meta span {
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    padding: 0 10px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(7, 14, 28, 0.8);
    color: #d9fbff;
  }

  .objective-beacon {
    position: absolute;
    z-index: 3;
    transform: translate(-50%, -50%);
    padding: 6px 9px;
    border-radius: 999px;
    border: 1px solid rgba(255,230,109,0.32);
    background: rgba(255,230,109,0.14);
    color: #fff2a2;
    box-shadow: 0 0 16px rgba(255,230,109,0.18);
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    letter-spacing: 0.04em;
  }

  .mission-box {
    position: absolute;
    z-index: 3;
    display: grid;
    gap: 6px;
    padding: 10px 12px;
    border-radius: 14px;
    background: rgba(7, 14, 28, 0.8);
    border: 1px solid rgba(255,255,255,0.08);
    font-family: 'JetBrains Mono', monospace;
  }

  .mission-box {
    top: 14px;
    right: 14px;
    width: min(240px, calc(100% - 28px));
  }

  .mission-box span {
    color: var(--text-2);
    font-size: 14px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .mission-box strong {
    color: #e9fbff;
    font-size: 13px;
  }

  .mission-box small {
    color: rgba(255,255,255,0.72);
    font-size: 14px;
    line-height: 1.4;
  }

  .mission-progress {
    height: 8px;
    border-radius: 999px;
    background: rgba(255,255,255,0.08);
    overflow: hidden;
  }

  .mission-progress-fill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, rgba(255,230,109,0.65), rgba(40,255,153,0.95));
  }

  .active-command-row {
    position: absolute;
    bottom: 12px;
    left: 50%;
    z-index: 4;
    transform: translateX(-50%);
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    max-width: calc(100% - 24px);
  }

  .active-command-row span {
    padding: 6px 10px;
    border-radius: 999px;
    background: rgba(0,229,255,0.12);
    border: 1px solid rgba(0,229,255,0.24);
    color: #bff6ff;
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    letter-spacing: 0.04em;
  }

  .zone {
    position: absolute;
    transform: translate(-50%, -50%);
    display: grid;
    place-items: center;
    gap: 3px;
    padding: 7px;
    border-radius: 18px;
    color: white;
    text-align: center;
    border: 1px solid color-mix(in srgb, var(--zone-color) 58%, white 16%);
    background:
      linear-gradient(180deg, color-mix(in srgb, var(--zone-color) 28%, transparent), rgba(255,255,255,0.02)),
      rgba(5, 10, 20, 0.52);
    box-shadow: 0 0 14px color-mix(in srgb, var(--zone-color) 20%, transparent);
    z-index: 1;
    backdrop-filter: blur(2px);
  }

  .zone.support {
    background:
      linear-gradient(180deg, rgba(40,255,153,0.24), rgba(40,255,153,0.06)),
      rgba(5, 10, 20, 0.52);
  }

  .zone.resistance,
  .zone.breakout {
    background:
      repeating-linear-gradient(
        180deg,
        rgba(255,107,53,0.28) 0 10px,
        rgba(255,107,53,0.12) 10px 20px
      ),
      rgba(9, 13, 24, 0.76);
    box-shadow: 0 0 24px rgba(255,107,53,0.22);
  }

  .zone.long_liq,
  .zone.short_liq {
    background:
      radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--zone-color) 36%, transparent), transparent 70%),
      rgba(5, 10, 20, 0.56);
  }

  .zone strong {
    font-size: 13px;
  }

  .zone small {
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    color: rgba(255,255,255,0.78);
  }

  .hazard {
    position: absolute;
    transform: translate(-50%, -50%) scale(var(--hazard-scale));
    z-index: 2;
    display: grid;
    place-items: center;
    width: 76px;
    height: 76px;
    border-radius: 50%;
    border: 1px dashed color-mix(in srgb, var(--hazard-color) 56%, white 10%);
    color: var(--hazard-color);
    box-shadow: 0 0 16px color-mix(in srgb, var(--hazard-color) 30%, transparent);
    background: radial-gradient(circle, color-mix(in srgb, var(--hazard-color) 18%, transparent), transparent 68%);
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    text-align: center;
  }

  .projectile {
    position: absolute;
    z-index: 4;
    transform: translate(-50%, -50%);
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, #ffffff, var(--orb-color));
    box-shadow: 0 0 18px var(--orb-color);
    color: #03121f;
    font-size: 13px;
    font-weight: 800;
    animation: pulse-shot 1s ease-in-out infinite;
  }

  .field-unit {
    position: absolute;
    z-index: 5;
    transform: translate(-50%, -50%);
    display: grid;
    place-items: center;
    gap: 2px;
    width: 80px;
    min-height: 80px;
    padding: 14px 8px 10px;
    border-radius: 46% 46% 42% 42% / 58% 58% 34% 34%;
    border: 1px solid rgba(255,255,255,0.14);
    background:
      radial-gradient(circle at 50% 22%, rgba(255,255,255,0.62), transparent 22%),
      radial-gradient(circle at 35% 30%, color-mix(in srgb, var(--unit-color) 48%, white 8%), transparent 48%),
      linear-gradient(145deg, rgba(255,255,255,0.08), rgba(0,0,0,0.28)),
      rgba(10,18,34,0.96);
    color: white;
    box-shadow: 0 20px 38px rgba(0, 0, 0, 0.32);
    animation: bob-unit 2.4s ease-in-out infinite;
  }

  .field-unit.focusable {
    cursor: pointer;
  }

  .field-unit.focused,
  .field-unit.focusable:hover {
    box-shadow: 0 0 0 2px rgba(0,229,255,0.22), 0 18px 34px rgba(0, 0, 0, 0.28);
  }

  .field-unit.rival {
    border-color: rgba(255,255,255,0.1);
    opacity: 0.92;
  }

  .field-unit::before,
  .field-unit::after {
    content: '';
    position: absolute;
    top: 24px;
    width: 6px;
    height: 8px;
    border-radius: 999px;
    background: rgba(7, 14, 28, 0.82);
    box-shadow: 0 0 6px rgba(255,255,255,0.12);
  }

  .field-unit::before {
    left: 23px;
  }

  .field-unit::after {
    right: 23px;
  }

  .field-unit span {
    font-family: 'Orbitron', sans-serif;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.06em;
    transform: translateY(6px);
    text-shadow: 0 0 10px rgba(255,255,255,0.12);
  }

  .field-unit small {
    position: absolute;
    bottom: -16px;
    left: 50%;
    transform: translateX(-50%);
    padding: 3px 7px;
    border-radius: 999px;
    background: rgba(6, 12, 24, 0.88);
    border: 1px solid rgba(255,255,255,0.08);
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    color: rgba(255,255,255,0.78);
    white-space: nowrap;
  }

  .field-unit.casting {
    transform: translate(-50%, -56%) scale(1.08);
    box-shadow: 0 0 0 2px rgba(40,255,153,0.14), 0 18px 34px rgba(0, 0, 0, 0.32);
  }

  .field-unit.hit {
    transform: translate(-50%, -50%) rotate(-4deg);
    box-shadow: 0 0 0 2px rgba(255,95,95,0.18), 0 18px 34px rgba(0, 0, 0, 0.32);
  }

  .field-unit.guard {
    box-shadow: 0 0 0 2px rgba(103,215,255,0.16), 0 18px 34px rgba(0, 0, 0, 0.28);
  }

  .field-unit.focused {
    transform: translate(-50%, -58%) scale(1.06);
  }

  .intervention-row {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }

  .intervention-card {
    display: grid;
    gap: 4px;
    padding: 12px;
    border-radius: 16px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.03);
    text-align: left;
    opacity: 0.62;
  }

  .intervention-card.enabled {
    opacity: 1;
    border-color: rgba(0,229,255,0.28);
    background: rgba(0,229,255,0.08);
  }

  .intervention-card strong {
    font-size: 14px;
    color: var(--text-0);
  }

  .intervention-card small,
  .intervention-card span {
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    color: var(--text-2);
  }

  .empty-state {
    padding: 40px 20px;
    text-align: center;
    color: var(--text-2);
  }

  @keyframes bob-unit {
    0%,
    100% {
      translate: 0 0;
    }

    50% {
      translate: 0 -4px;
    }
  }

  @keyframes pulse-shot {
    0%,
    100% {
      transform: translate(-50%, -50%) scale(0.94);
    }

    50% {
      transform: translate(-50%, -50%) scale(1.08);
    }
  }

  @media (max-width: 1180px) {
    .rail-grid,
    .unit-rail {
      grid-template-columns: 1fr;
    }

    .intervention-row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 720px) {
    .arena-topline {
      flex-direction: column;
      align-items: stretch;
    }

    .battlefield {
      min-height: 460px;
    }

    .mission-box {
      width: calc(100% - 24px);
    }

    .intervention-row {
      grid-template-columns: 1fr;
    }
  }
</style>
