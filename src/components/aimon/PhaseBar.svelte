<script lang="ts">
  import type { BattlePhase } from '$lib/aimon/types';

  const { phase, remainingMs } = $props<{
    phase: BattlePhase;
    remainingMs: number;
  }>();

  const phases: BattlePhase[] = ['OPEN', 'EVIDENCE', 'DECISION', 'MARKET', 'RESULT'];
  const remainingSeconds = $derived(Math.ceil(remainingMs / 1000));
</script>

<div class="phase-bar">
  <div class="phase-row">
    {#each phases as step}
      <div class="phase-pill" class:active={step === phase}>{step}</div>
    {/each}
  </div>
  <div class="timer">{remainingSeconds}s</div>
</div>

<style>
  .phase-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 14px;
    border: 1px solid rgba(0, 229, 255, 0.18);
    border-radius: 16px;
    background: rgba(4, 10, 22, 0.82);
  }

  .phase-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .phase-pill {
    padding: 6px 10px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.08);
    color: var(--text-2);
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    letter-spacing: 0.08em;
  }

  .phase-pill.active {
    color: #04101a;
    background: var(--cyan);
    border-color: var(--cyan);
    font-weight: 800;
  }

  .timer {
    color: var(--yellow);
    font-family: 'Bebas Neue', 'Orbitron', sans-serif;
    font-size: 28px;
    letter-spacing: 1px;
  }
</style>
