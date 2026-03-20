<script lang="ts">
  import PokemonFrame from '../shared/PokemonFrame.svelte';
  import { aimonDexById } from '$lib/aimon/data/aimonDex';
  import type { OwnedAgent } from '$lib/aimon/types';

  const { agent, selected = false, onSelect = undefined } = $props<{
    agent: OwnedAgent;
    selected?: boolean;
    onSelect?: ((id: string) => void) | undefined;
  }>();

  const entry = $derived(aimonDexById[agent.speciesId]);
</script>

{#if entry}
  <PokemonFrame variant={selected ? 'accent' : 'default'} padding="10px">
    <article class="aimon-card" class:selected>
      <button class="card-button" type="button" onclick={() => onSelect?.(agent.id)}>
        <div class="card-top">
          <span class="dex-no">{entry.dexNo} · LVL {agent.level}</span>
          <span class="type-pill" style:color={entry.color}>{entry.type}</span>
        </div>
        <div class="avatar" style={`--card-color:${entry.color}; --card-accent:${entry.accent};`}>
          <span>{agent.name.slice(0, 2).toUpperCase()}</span>
        </div>
        <div class="meta">
          <strong>{agent.name}</strong>
          <p>{agent.role} · {agent.loadout.retrainingPath}</p>
        </div>
        <div class="stats">
          <span>DET {entry.baseStats.detection}</span>
          <span>PRED {entry.baseStats.prediction}</span>
          <span>XP {agent.xp}</span>
        </div>
      </button>
      <div class="card-actions">
        <a href={`/agent/${agent.id}`}>Agent Console</a>
      </div>
    </article>
  </PokemonFrame>
{/if}

<style>
  .card-button {
    width: 100%;
    background: transparent;
    border: 0;
    padding: 0;
    cursor: pointer;
    text-align: left;
    display: grid;
    gap: 10px;
  }

  .aimon-card {
    display: grid;
    gap: 10px;
    color: var(--text-0);
  }

  .card-top,
  .stats {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
  }

  .dex-no {
    color: var(--text-2);
  }

  .type-pill {
    font-weight: 700;
  }

  .avatar {
    display: grid;
    place-items: center;
    aspect-ratio: 1;
    border-radius: 16px;
    background:
      radial-gradient(circle at 30% 30%, var(--card-color), transparent 45%),
      linear-gradient(145deg, rgba(255,255,255,0.08), rgba(0,0,0,0.28)),
      var(--card-accent);
    border: 1px solid rgba(255,255,255,0.08);
    min-height: 92px;
    font-family: 'Bebas Neue', 'Orbitron', sans-serif;
    font-size: 26px;
    letter-spacing: 1px;
  }

  .meta strong {
    display: block;
    font-size: 18px;
    margin-bottom: 4px;
  }

  .meta p {
    margin: 0;
    color: var(--text-1);
    font-size: 15px;
    line-height: 1.45;
  }

  .stats {
    color: #b9c8e8;
  }

  .card-actions {
    display: flex;
    justify-content: flex-end;
  }

  .card-actions a {
    display: inline-flex;
    align-items: center;
    min-height: 40px;
    padding: 0 12px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.04);
    color: var(--text-0);
    text-decoration: none;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    letter-spacing: 0.08em;
  }
</style>
