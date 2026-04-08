<script lang="ts">
  import { arenaWarStore, updateSetup, startMatch, setSelectedMode, startDraft } from '$lib/stores/arenaWarStore';
  import type { WagerAmount } from '$lib/engine/arenaWarTypes';

  // Svelte 5 runes
  let selectedPair = $state('BTCUSDT');
  let selectedTf = $state('4h');
  let selectedWager: WagerAmount = $state(0);
  let selectedMode = $state<'pvai' | 'spectator' | 'draft'>('pvai');

  const pairs = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'] as const;
  const timeframes = ['1h', '4h', '1d'] as const;
  const wagers: WagerAmount[] = [0, 5, 10, 20];

  const modes = [
    { id: 'pvai' as const,      label: 'VS AI',      icon: '⚔',  desc: 'Match Analysis vs AI' },
    { id: 'draft' as const,     label: 'DRAFT',      icon: '📋', desc: 'Ban/Pick Agent Draft' },
    { id: 'spectator' as const, label: 'AI vs AI',   icon: '👁',  desc: 'Spectate AI Battle' },
  ] as const;

  function handleStart() {
    const setup = { pair: selectedPair, timeframe: selectedTf, wager: selectedWager };
    setSelectedMode(selectedMode);
    updateSetup(setup);

    if (selectedMode === 'draft') {
      // Go to draft phase instead of directly starting match
      startDraft(setup);
    } else {
      startMatch(setup);
    }
  }
</script>

<div class="setup-phase">
  <div class="setup-header">
    <h2>ARENA WAR</h2>
    <p class="subtitle">Same data, different analysis — Match vs AI</p>
  </div>

  <div class="setup-grid">
    <!-- Mode Selection (NEW) -->
    <div class="setup-section">
      <span class="section-label">MODE</span>
      <div class="mode-row">
        {#each modes as mode}
          <button
            class="mode-btn"
            class:active={selectedMode === mode.id}
            onclick={() => selectedMode = mode.id}
          >
            <span class="mode-icon">{mode.icon}</span>
            <span class="mode-label">{mode.label}</span>
            <span class="mode-desc">{mode.desc}</span>
          </button>
        {/each}
      </div>
    </div>

    <!-- Pair Selection -->
    <div class="setup-section">
      <span class="section-label">PAIR</span>
      <div class="option-row">
        {#each pairs as pair}
          <button
            class="option-btn"
            class:active={selectedPair === pair}
            onclick={() => selectedPair = pair}
          >
            {pair.replace('USDT', '')}
          </button>
        {/each}
      </div>
    </div>

    <!-- Timeframe Selection -->
    <div class="setup-section">
      <span class="section-label">TIMEFRAME</span>
      <div class="option-row">
        {#each timeframes as tf}
          <button
            class="option-btn"
            class:active={selectedTf === tf}
            onclick={() => selectedTf = tf}
          >
            {tf}
          </button>
        {/each}
      </div>
    </div>

    <!-- Wager Selection -->
    <div class="setup-section">
      <span class="section-label">WAGER (LP)</span>
      <div class="option-row">
        {#each wagers as w}
          <button
            class="option-btn wager"
            class:active={selectedWager === w}
            onclick={() => selectedWager = w}
          >
            {w === 0 ? 'FREE' : `${w} LP`}
          </button>
        {/each}
      </div>
    </div>
  </div>

  <button class="start-btn" onclick={handleStart}>
    {selectedMode === 'spectator' ? '👁 SPECTATE' : selectedMode === 'draft' ? '📋 DRAFT' : '⚔ START MATCH'}
  </button>

  <div class="setup-hint">
    {#if selectedMode === 'spectator'}
      <p>Two AI teams auto-battle. Predict the winning team!</p>
    {:else if selectedMode === 'draft'}
      <p>Ban/Pick agents then battle.</p>
      <p>Use type matchups! TECH > FLOW > SENTI > MACRO > TECH</p>
    {:else}
      <p>AI analyzes 48 factors. You see the same data.</p>
      <p>Beat the AI with better analysis.</p>
    {/if}
  </div>
</div>

<style>
  .setup-phase {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
    padding: 2rem;
    max-width: 480px;
    margin: 0 auto;
  }

  .setup-header {
    text-align: center;
  }

  .setup-header h2 {
    font-family: 'Bebas Neue', 'Orbitron', sans-serif;
    font-size: 2.5rem;
    color: var(--arena-accent, #e8967d);
    margin: 0;
    letter-spacing: 2px;
  }

  .subtitle {
    color: var(--arena-text-1, #8ba59e);
    font-size: 0.85rem;
    margin-top: 0.25rem;
  }

  .setup-grid {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .setup-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .section-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    color: var(--arena-accent, #e8967d);
    letter-spacing: 2px;
    text-transform: uppercase;
  }

  /* ── Mode buttons ──────────────── */

  .mode-row {
    display: flex;
    gap: 0.5rem;
  }

  .mode-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 12px 8px;
    background: var(--arena-bg-1, #0d2118);
    border: 2px solid var(--arena-line, #1a3d2e);
    color: var(--arena-text-1, #8ba59e);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .mode-btn:hover {
    border-color: var(--arena-accent, #e8967d);
    color: var(--arena-text-0, #e0f0e8);
  }

  .mode-btn.active {
    background: var(--arena-accent, #e8967d);
    color: #000;
    border-color: var(--arena-accent, #e8967d);
  }

  .mode-icon {
    font-size: 1.5rem;
  }

  .mode-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 1px;
  }

  .mode-desc {
    font-size: 0.6rem;
    opacity: 0.7;
    text-align: center;
    font-family: 'JetBrains Mono', monospace;
  }

  /* ── Option buttons ────────────── */

  .option-row {
    display: flex;
    gap: 0.5rem;
  }

  .option-btn {
    flex: 1;
    padding: 0.75rem;
    background: var(--arena-bg-1, #0d2118);
    border: 2px solid var(--arena-line, #1a3d2e);
    color: var(--arena-text-1, #8ba59e);
    border-radius: 6px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: center;
  }

  .option-btn:hover {
    border-color: var(--arena-accent, #e8967d);
    color: var(--arena-text-0, #e0f0e8);
  }

  .option-btn.active {
    background: var(--arena-accent, #e8967d);
    color: #000;
    border-color: var(--arena-accent, #e8967d);
    font-weight: 700;
  }

  .start-btn {
    width: 100%;
    padding: 1rem;
    background: var(--arena-accent, #e8967d);
    color: #000;
    border: 3px solid #000;
    border-radius: 8px;
    font-family: 'Bebas Neue', 'Orbitron', sans-serif;
    font-size: 1.5rem;
    letter-spacing: 3px;
    cursor: pointer;
    box-shadow: 3px 3px 0 #000;
    transition: all 0.1s ease;
  }

  .start-btn:hover {
    transform: translate(-1px, -1px);
    box-shadow: 4px 4px 0 #000;
  }

  .start-btn:active {
    transform: translate(2px, 2px);
    box-shadow: 1px 1px 0 #000;
  }

  .setup-hint {
    text-align: center;
    color: var(--arena-text-2, #5a7d6e);
    font-size: 0.75rem;
    line-height: 1.6;
  }

  .setup-hint p {
    margin: 0;
  }
</style>
