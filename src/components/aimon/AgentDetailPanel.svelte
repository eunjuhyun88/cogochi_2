<script lang="ts">
  import PokemonFrame from '../shared/PokemonFrame.svelte';
  import { aimonDexById } from '$lib/aimon/data/aimonDex';
  import { getEvolutionPreview } from '$lib/aimon/engine/evolutionSystem';
  import type { OwnedAgent } from '$lib/aimon/types';

  const { agent, inSquad = false } = $props<{
    agent: OwnedAgent | null;
    inSquad?: boolean;
  }>();

  const entry = $derived(agent ? aimonDexById[agent.speciesId] ?? null : null);

  const statRows = $derived(
    entry
      ? [
          ['Detection', entry.baseStats.detection],
          ['Prediction', entry.baseStats.prediction],
          ['Risk', entry.baseStats.risk],
          ['Speed', entry.baseStats.speed]
        ]
      : []
  );

  const evolution = $derived(agent && entry ? getEvolutionPreview(entry.id, agent.xp) : null);
</script>

<PokemonFrame variant={entry ? 'accent' : 'dark'} padding="16px">
  {#if agent && entry && evolution}
    <section class="detail">
      <div class="hero" style={`--type-color:${entry.color}; --type-accent:${entry.accent};`}>
        <div class="hero-art">
          <div class="sprite">
            <span>{agent.name.slice(0, 2).toUpperCase()}</span>
          </div>
        </div>
        <div class="hero-copy">
          <p class="eyebrow">{entry.dexNo} · {entry.type} · LVL {agent.level}</p>
          <h2>{agent.name}</h2>
          <p class="description">{entry.description}</p>
          <div class="hero-badges">
            <span>{agent.role}</span>
            <span>{agent.loadout.retrainingPath}</span>
            <span>{agent.baseModelId}</span>
            {#if inSquad}
              <span class="active">ACTIVE SQUAD</span>
            {/if}
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-head">
          <h3>Signal Readout</h3>
          <span>{agent.loadout.readout}</span>
        </div>
        <div class="stats">
          {#each statRows as [label, value]}
            <div class="stat-row">
              <span>{label}</span>
              <div class="stat-bar">
                <div class="stat-fill" style:width={`${value}%`} style:background={entry.color}></div>
              </div>
              <strong>{value}</strong>
            </div>
          {/each}
        </div>
      </div>

      <div class="section two-col">
        <div>
          <div class="section-head">
            <h3>Training Loadout</h3>
            <span>{agent.loadout.focusSkill}</span>
          </div>
          <p class="support">{agent.loadout.behaviorNote}</p>
          <div class="chips">
            {#each agent.loadout.indicators as indicator}
              <span>{indicator}</span>
            {/each}
          </div>
        </div>

        <div>
          <div class="section-head">
            <h3>Evolution Watch</h3>
            <span>{evolution.canEvolve ? 'READY' : 'TRAINING'}</span>
          </div>
          <div class="evolution-meta">
            <span>Current XP</span><strong>{agent.xp}</strong>
            <span>Required XP</span><strong>{evolution.requiredXp ?? 'Final Form'}</strong>
            <span>Next Form</span><strong>{evolution.evolvesTo ?? 'Final Form'}</strong>
            <span>Counter Type</span><strong>{entry.counterType}</strong>
          </div>
        </div>
      </div>

      <div class="actions">
        <a href={`/agent/${agent.id}`}>Open Console</a>
        <a href="/team">Adjust Squad</a>
        <a href="/battle">Enter Battle</a>
        <a href="/lab">Open Lab</a>
      </div>
    </section>
  {:else}
    <section class="empty">
      <p class="eyebrow">AGENT DETAIL</p>
      <h2>Select an Owned Agent</h2>
      <p>Roster에서 개체를 선택하면 loadout, evolution, squad 상태가 이 패널에 표시됩니다.</p>
    </section>
  {/if}
</PokemonFrame>

<style>
  .detail,
  .empty {
    display: grid;
    gap: 18px;
  }

  .hero {
    display: grid;
    grid-template-columns: 168px minmax(0, 1fr);
    gap: 16px;
    align-items: center;
  }

  .hero-art {
    display: grid;
    place-items: center;
    min-height: 168px;
    border-radius: 24px;
    background:
      radial-gradient(circle at 50% 35%, rgba(255,255,255,0.08), transparent 54%),
      linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01));
    border: 1px solid rgba(255,255,255,0.08);
  }

  .sprite {
    display: grid;
    place-items: center;
    width: 132px;
    aspect-ratio: 1;
    border-radius: 30px;
    background:
      radial-gradient(circle at 35% 30%, var(--type-color), transparent 48%),
      linear-gradient(145deg, rgba(255,255,255,0.08), rgba(0,0,0,0.26)),
      var(--type-accent);
    border: 1px solid rgba(255,255,255,0.1);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.24);
  }

  .sprite span {
    font-family: 'Orbitron', sans-serif;
    font-size: 38px;
    font-weight: 700;
    letter-spacing: 0.08em;
  }

  .eyebrow,
  .section-head span,
  .stat-row span:first-child,
  .evolution-meta span {
    color: var(--text-2);
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    letter-spacing: 0.08em;
  }

  h2 {
    margin: 4px 0 8px;
    font-family: 'Orbitron', sans-serif;
    font-size: clamp(30px, 4vw, 40px);
    line-height: 0.92;
  }

  .description,
  .support,
  .empty p:last-child {
    margin: 0;
    color: var(--text-1);
    font-size: 16px;
    line-height: 1.45;
  }

  .hero-badges,
  .chips,
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .hero-badges span,
  .chips span {
    padding: 6px 10px;
    border-radius: 999px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    font-size: 14px;
  }

  .hero-badges .active {
    border-color: rgba(0, 229, 255, 0.3);
    background: rgba(0, 229, 255, 0.12);
    color: #9cefff;
  }

  .section {
    display: grid;
    gap: 12px;
    padding-top: 14px;
    border-top: 1px solid rgba(255,255,255,0.08);
  }

  .two-col {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .section-head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: baseline;
  }

  .section-head h3 {
    margin: 0;
    font-size: 19px;
  }

  .stats {
    display: grid;
    gap: 10px;
  }

  .stat-row {
    display: grid;
    grid-template-columns: 88px minmax(0, 1fr) 36px;
    gap: 10px;
    align-items: center;
  }

  .stat-bar {
    height: 8px;
    border-radius: 999px;
    background: rgba(255,255,255,0.08);
    overflow: hidden;
  }

  .stat-fill {
    height: 100%;
    border-radius: 999px;
  }

  .stat-row strong,
  .evolution-meta strong {
    font-size: 15px;
  }

  .evolution-meta {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 10px 14px;
  }

  .actions a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    padding: 0 14px;
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.04);
    color: var(--text-0);
    text-decoration: none;
  }

  @media (max-width: 860px) {
    .hero,
    .two-col {
      grid-template-columns: 1fr;
    }

    .hero-art {
      min-height: 144px;
    }
  }
</style>
