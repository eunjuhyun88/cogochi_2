<script lang="ts">
  import { summarizeTeamSynergy } from '$lib/aimon/data/synergies';
  import type { OwnedAgent } from '$lib/aimon/types';
  import AiMonCard from './AiMonCard.svelte';

  const { agents, selectedIds, onToggle } = $props<{
    agents: OwnedAgent[];
    selectedIds: string[];
    onToggle: (id: string) => void;
  }>();

  const synergy = $derived(
    summarizeTeamSynergy(
      agents
        .filter((agent: OwnedAgent) => selectedIds.includes(agent.id))
        .map((agent: OwnedAgent) => agent.speciesId)
    )
  );
</script>

<section class="builder">
  <div class="builder-head">
    <div>
      <h2>Team Builder</h2>
      <p>최대 4개체까지 선택됩니다. 4개체 초과 선택 시 가장 오래된 슬롯이 교체됩니다.</p>
    </div>
    <div class="summary">
      <span>{selectedIds.length}/4 selected</span>
      <strong>Synergy {synergy.score}</strong>
    </div>
  </div>

  <div class="notes">
    {#each synergy.notes as note}
      <span>{note}</span>
    {/each}
  </div>

  <div class="grid">
    {#each agents as agent (agent.id)}
      <AiMonCard agent={agent} selected={selectedIds.includes(agent.id)} onSelect={onToggle} />
    {/each}
  </div>
</section>

<style>
  .builder {
    display: grid;
    gap: 16px;
  }

  .builder-head {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: end;
  }

  .builder-head h2 {
    margin: 0;
    font-size: 28px;
  }

  .builder-head p {
    margin: 6px 0 0;
    color: var(--text-1);
    font-size: 16px;
  }

  .summary {
    display: grid;
    justify-items: end;
    gap: 4px;
    font-family: 'JetBrains Mono', monospace;
  }

  .summary span {
    color: var(--text-2);
    font-size: 13px;
  }

  .summary strong {
    color: var(--cyan);
    font-size: 20px;
  }

  .notes {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .notes span {
    padding: 6px 10px;
    border-radius: 999px;
    background: rgba(0, 229, 255, 0.08);
    border: 1px solid rgba(0, 229, 255, 0.15);
    color: #b7ebff;
    font-size: 14px;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 14px;
  }
</style>
