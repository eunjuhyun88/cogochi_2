<script lang="ts">
  import {
    activeJourneyVariant,
    agentVariantStore,
    currentJourneyVariantCollection,
    journeyStrategyVariants,
    liveJourneyVariant,
    STRATEGY_RISK_OPTIONS,
    STRATEGY_SIGNAL_OPTIONS,
    STRATEGY_TIMEFRAME_OPTIONS,
  } from '$lib/stores/agentVariantStore';
  import { agentJourneyStore } from '$lib/stores/agentJourneyStore';
  import type { AgentDoctrineId } from '$lib/stores/agentJourneyStore';

  export let compact = false;
  export let dense = false;
  export let title = 'Run variants. Keep the winner.';
  export let subtitle =
    'One lead can hold multiple builds. Change one lever, rerun, and promote only the build that improves.';

  $: journey = $agentJourneyStore;
  $: collection = $currentJourneyVariantCollection;
  $: variants = $journeyStrategyVariants;
  $: activeVariant = $activeJourneyVariant;
  $: liveVariant = $liveJourneyVariant;
  $: activeResult = activeVariant?.latestResult ?? null;
  $: liveResult = liveVariant?.latestResult ?? null;
  $: activeDelta = activeResult?.deltaVsAnchor ?? 0;
  $: deltaTone = activeDelta > 0 ? 'up' : activeDelta < 0 ? 'down' : 'flat';
  $: activeStatus =
    liveVariant && activeVariant && liveVariant.id === activeVariant.id
      ? 'Live'
      : activeVariant?.id === variants[0]?.id
        ? 'Baseline'
        : 'Candidate';

  const DOCTRINE_OPTIONS: AgentDoctrineId[] = ['balanced', 'aggressive', 'defensive'];

  function formatSigned(value: number, suffix = ''): string {
    const normalized = Number.isFinite(value) ? value : 0;
    return `${normalized > 0 ? '+' : ''}${normalized.toFixed(1)}${suffix}`;
  }

  function formatPercent(value: number): string {
    return `${value.toFixed(1)}%`;
  }
</script>

<section class="variant-workbench" class:compact class:dense aria-label="Strategy variant lab">
  <div class="workbench-head">
    <div class="head-copy">
      <p class="eyebrow">Strategy Lab</p>
      <h3>{title}</h3>
      <p>{subtitle}</p>
    </div>

    <div class="head-actions">
      <button class="secondary-btn" type="button" onclick={() => agentVariantStore.createVariantFromActive()}>
        Clone
      </button>
      <button class="primary-btn" type="button" onclick={() => agentVariantStore.runVariant('backtest')}>
        Backtest
      </button>
      <button class="primary-btn" type="button" onclick={() => agentVariantStore.runVariant('simulation')}>
        Simulate
      </button>
      <button class="ghost-btn" type="button" onclick={() => agentVariantStore.promoteVariant()}>
        Promote
      </button>
    </div>
  </div>

  <div class="summary-grid">
    <article class="summary-card">
      <span class="summary-label">Active build</span>
      <strong>{activeVariant?.label ?? 'V1'} · {activeVariant?.name ?? journey.agentName}</strong>
      <p>{activeStatus} · {activeVariant?.runCount ?? 0} runs</p>
      {#if activeResult}
        <div class="metric-inline">
          <span>Edge {activeResult.edgeScore}</span>
          <span>Win {formatPercent(activeResult.winRate)}</span>
          <span>PnL {formatSigned(activeResult.pnl, '%')}</span>
        </div>
      {:else}
        <div class="metric-inline">
          <span>No result yet</span>
          <span>Set and run</span>
        </div>
      {/if}
    </article>

    <article class="summary-card delta-card" data-tone={deltaTone}>
      <span class="summary-label">Change vs live</span>
      <strong>{formatSigned(activeDelta)}</strong>
      <p>
        {#if activeResult}
          {activeResult.note}
        {:else}
          Run this build once to compare it with live.
        {/if}
      </p>
    </article>

    <article class="summary-card">
      <span class="summary-label">Live build</span>
      <strong>{liveVariant?.label ?? 'V1'} · {liveVariant?.name ?? 'Core'}</strong>
      {#if liveResult}
        <div class="metric-inline">
          <span>Edge {liveResult.edgeScore}</span>
          <span>Consistency {liveResult.consistency}</span>
          <span>DD {formatSigned(liveResult.maxDrawdown, '%')}</span>
        </div>
      {:else}
        <div class="metric-inline">
          <span>No live proof yet</span>
          <span>Promote after proof</span>
        </div>
      {/if}
    </article>
  </div>

  <div class="control-grid">
    <div class="control-group">
      <span class="control-label">Doctrine</span>
      <div class="chip-row">
        {#each DOCTRINE_OPTIONS as option}
          <button
            class="chip-btn"
            class:chip-btn-active={activeVariant?.doctrineId === option}
            type="button"
            onclick={() => agentVariantStore.updateActiveVariant({ doctrineId: option })}
          >
            {option}
          </button>
        {/each}
      </div>
    </div>

    <div class="control-group">
      <span class="control-label">Risk</span>
      <div class="chip-row">
        {#each STRATEGY_RISK_OPTIONS as option}
          <button
            class="chip-btn"
            class:chip-btn-active={activeVariant?.riskProfile === option.id}
            type="button"
            onclick={() => agentVariantStore.updateActiveVariant({ riskProfile: option.id })}
          >
            {option.label}
          </button>
        {/each}
      </div>
    </div>

    <div class="control-group">
      <span class="control-label">Timeframe</span>
      <div class="chip-row">
        {#each STRATEGY_TIMEFRAME_OPTIONS as option}
          <button
            class="chip-btn"
            class:chip-btn-active={activeVariant?.timeframeProfile === option.id}
            type="button"
            onclick={() => agentVariantStore.updateActiveVariant({ timeframeProfile: option.id })}
          >
            {option.label}
          </button>
        {/each}
      </div>
    </div>

    <div class="control-group">
      <span class="control-label">Signal</span>
      <div class="chip-row">
        {#each STRATEGY_SIGNAL_OPTIONS as option}
          <button
            class="chip-btn"
            class:chip-btn-active={activeVariant?.signalProfile === option.id}
            type="button"
            onclick={() => agentVariantStore.updateActiveVariant({ signalProfile: option.id })}
          >
            {option.label}
          </button>
        {/each}
      </div>
    </div>
  </div>

  <div class="variant-list">
    {#each variants as variant}
      <button
        class="variant-row"
        class:variant-row-active={variant.id === activeVariant?.id}
        type="button"
        onclick={() => agentVariantStore.selectVariant(variant.id)}
      >
        <div class="variant-copy">
          <div class="variant-head">
            <strong>{variant.label}</strong>
            <div class="badge-row">
              {#if variant.id === variants[0]?.id}
                <span class="variant-badge">Baseline</span>
              {/if}
              {#if variant.id === collection.promotedVariantId}
                <span class="variant-badge variant-badge-live">Live</span>
              {/if}
            </div>
          </div>
          <span>{variant.name}</span>
          <p>
            {variant.doctrineId} · {variant.riskProfile} · {variant.timeframeProfile} · {variant.signalProfile}
          </p>
        </div>

        <div class="variant-metrics">
          {#if variant.latestResult}
            <span>Edge {variant.latestResult.edgeScore}</span>
            <span>Win {formatPercent(variant.latestResult.winRate)}</span>
            <span>Delta {formatSigned(variant.latestResult.deltaVsAnchor)}</span>
          {:else}
            <span>Ready to test</span>
            <span>0 runs</span>
          {/if}
        </div>
      </button>
    {/each}
  </div>
</section>

<style>
  .variant-workbench,
  .workbench-head,
  .head-copy,
  .head-actions,
  .summary-grid,
  .summary-card,
  .control-grid,
  .control-group,
  .chip-row,
  .variant-list,
  .variant-row,
  .variant-copy,
  .variant-head,
  .variant-metrics,
  .badge-row,
  .metric-inline {
    display: grid;
    gap: 12px;
  }

  .variant-workbench {
    padding: 18px;
    border-radius: 24px;
    border: 1px solid rgba(173, 202, 124, 0.16);
    background:
      radial-gradient(circle at top right, rgba(173, 202, 124, 0.12), transparent 30%),
      linear-gradient(180deg, rgba(12, 20, 29, 0.96), rgba(8, 13, 20, 0.98));
  }

  .compact {
    padding: 14px;
  }

  .workbench-head {
    grid-template-columns: minmax(0, 1fr) max-content;
    align-items: start;
  }

  .eyebrow,
  .summary-label,
  .control-label,
  .variant-badge {
    margin: 0;
    font-family: var(--sc-font-mono);
    font-size: var(--sc-fs-sm);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--sc-accent-2);
  }

  h3,
  .summary-card strong,
  .variant-copy strong {
    margin: 0;
    color: var(--sc-text-0);
    font-family: var(--sc-font-display);
    letter-spacing: 0.03em;
  }

  h3 {
    font-size: clamp(1.05rem, 1.6vw, 1.5rem);
    line-height: 1.05;
  }

  .head-copy p,
  .summary-card p,
  .variant-copy span,
  .variant-copy p,
  .variant-metrics span {
    margin: 0;
    color: var(--sc-text-1);
    line-height: 1.45;
    font-size: 0.95rem;
  }

  .head-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    align-items: center;
    gap: 8px;
  }

  .primary-btn,
  .secondary-btn,
  .ghost-btn,
  .chip-btn,
  .variant-row {
    cursor: pointer;
  }

  .primary-btn,
  .secondary-btn,
  .ghost-btn {
    min-height: 40px;
    padding: 0 14px;
    border-radius: 12px;
    font-family: var(--sc-font-body);
    font-weight: 700;
    white-space: nowrap;
    font-size: 0.95rem;
  }

  .primary-btn {
    border: 1px solid rgba(173, 202, 124, 0.34);
    background: linear-gradient(135deg, #adca7c, #f2d193 42%, #f7f2ea 100%);
    color: #09111b;
  }

  .secondary-btn {
    border: 1px solid rgba(173, 202, 124, 0.18);
    background: rgba(10, 16, 26, 0.88);
    color: var(--sc-text-0);
  }

  .ghost-btn {
    border: none;
    background: transparent;
    color: var(--sc-text-2);
  }

  .summary-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .summary-card {
    padding: 14px;
    border-radius: 18px;
    border: 1px solid rgba(173, 202, 124, 0.12);
    background: rgba(8, 14, 24, 0.84);
    align-content: start;
  }

  .delta-card[data-tone='up'] {
    border-color: rgba(173, 202, 124, 0.28);
    box-shadow: inset 0 0 0 1px rgba(173, 202, 124, 0.1);
  }

  .delta-card[data-tone='down'] {
    border-color: rgba(255, 142, 105, 0.28);
  }

  .metric-inline {
    grid-template-columns: repeat(3, minmax(0, max-content));
    gap: 8px;
  }

  .metric-inline span {
    min-height: 30px;
    padding: 0 10px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    border: 1px solid rgba(173, 202, 124, 0.12);
    background: rgba(12, 18, 28, 0.84);
    font-family: var(--sc-font-mono);
    font-size: 0.82rem;
  }

  .control-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .control-group {
    padding: 14px;
    border-radius: 18px;
    border: 1px solid rgba(173, 202, 124, 0.1);
    background: rgba(8, 14, 24, 0.76);
  }

  .chip-row {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .chip-btn {
    min-height: 40px;
    padding: 0 10px;
    border-radius: 999px;
    border: 1px solid rgba(173, 202, 124, 0.12);
    background: rgba(10, 16, 26, 0.9);
    color: var(--sc-text-1);
    font-family: var(--sc-font-body);
    font-weight: 700;
    font-size: 0.92rem;
  }

  .chip-btn-active {
    border-color: rgba(173, 202, 124, 0.28);
    background: rgba(173, 202, 124, 0.12);
    color: var(--sc-text-0);
  }

  .variant-row {
    grid-template-columns: minmax(0, 1fr) max-content;
    align-items: center;
    padding: 14px;
    border-radius: 18px;
    border: 1px solid rgba(173, 202, 124, 0.12);
    background: rgba(8, 14, 24, 0.78);
    text-align: left;
  }

  .variant-row-active {
    border-color: rgba(173, 202, 124, 0.28);
    background:
      linear-gradient(135deg, rgba(173, 202, 124, 0.12), transparent 60%),
      rgba(8, 14, 24, 0.86);
  }

  .variant-copy {
    gap: 6px;
  }

  .variant-head {
    grid-template-columns: max-content minmax(0, 1fr);
    align-items: center;
    gap: 8px;
  }

  .badge-row {
    grid-auto-flow: column;
    justify-content: start;
    gap: 6px;
  }

  .variant-badge {
    min-height: 26px;
    padding: 0 8px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    border: 1px solid rgba(173, 202, 124, 0.16);
    background: rgba(12, 18, 28, 0.84);
  }

  .variant-badge-live {
    border-color: rgba(242, 209, 147, 0.22);
    color: #f2d193;
  }

  .variant-metrics {
    grid-auto-flow: row;
    justify-items: end;
    text-align: right;
    min-width: 142px;
  }

  .compact {
    gap: 10px;
  }

  .compact .workbench-head {
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;
  }

  .compact h3 {
    font-size: clamp(0.98rem, 1.4vw, 1.2rem);
  }

  .compact .head-copy p:last-child {
    font-size: 0.94rem;
    max-width: 68ch;
  }

  .compact .head-actions {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    justify-content: stretch;
    gap: 8px;
  }

  .compact .head-actions .primary-btn,
  .compact .head-actions .secondary-btn,
  .compact .head-actions .ghost-btn {
    width: 100%;
    min-height: 38px;
    padding: 0 11px;
    border-radius: 11px;
  }

  .compact .head-actions .ghost-btn {
    border: 1px solid rgba(173, 202, 124, 0.12);
    background: rgba(10, 16, 26, 0.9);
    color: var(--sc-text-1);
  }

  .compact .summary-grid {
    grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.8fr) minmax(0, 1fr);
    gap: 10px;
  }

  .compact .summary-card {
    padding: 12px;
    gap: 8px;
  }

  .compact .metric-inline {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
  }

  .compact .metric-inline span {
    justify-content: center;
    min-width: 0;
    text-align: center;
  }

  .compact .control-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }

  .compact .control-group {
    padding: 12px;
    gap: 8px;
  }

  .compact .chip-btn {
    min-height: 38px;
    padding: 0 9px;
    font-size: 0.9rem;
  }

  .compact .variant-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .compact .variant-row {
    grid-template-columns: minmax(0, 1fr);
    align-items: start;
    min-height: 96px;
    padding: 12px;
    gap: 8px;
  }

  .compact .variant-copy {
    gap: 4px;
  }

  .compact .variant-copy span,
  .compact .variant-copy p,
  .compact .variant-metrics span {
    font-size: 0.92rem;
  }

  .compact .variant-metrics {
    grid-template-columns: repeat(3, minmax(0, max-content));
    grid-auto-flow: column;
    justify-content: start;
    justify-items: start;
    text-align: left;
    min-width: 0;
    gap: 8px;
  }

  .dense {
    padding: 10px 12px;
    gap: 8px;
    border-radius: 18px;
  }

  .dense .workbench-head {
    grid-template-columns: minmax(0, 1fr) max-content;
    align-items: center;
    gap: 8px;
  }

  .dense .head-copy {
    gap: 4px;
  }

  .dense .eyebrow {
    font-size: 0.68rem;
  }

  .dense h3 {
    font-size: clamp(0.92rem, 1.1vw, 1.02rem);
  }

  .dense .head-copy p:last-child {
    font-size: 0.82rem;
    max-width: 56ch;
  }

  .dense .head-actions {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, max-content));
    align-items: center;
    justify-content: end;
    gap: 6px;
  }

  .dense .head-actions .primary-btn,
  .dense .head-actions .secondary-btn,
  .dense .head-actions .ghost-btn {
    min-height: 34px;
    padding: 0 11px;
    border-radius: 10px;
    font-size: 0.84rem;
  }

  .dense .summary-grid {
    gap: 8px;
  }

  .dense .summary-card {
    padding: 10px;
    gap: 6px;
    border-radius: 14px;
  }

  .dense .summary-card strong {
    font-size: 1rem;
    line-height: 1.05;
  }

  .dense .summary-card p {
    font-size: 0.82rem;
    line-height: 1.38;
  }

  .dense .metric-inline {
    gap: 6px;
  }

  .dense .metric-inline span {
    min-height: 24px;
    padding: 0 8px;
    font-size: 0.74rem;
  }

  .dense .control-grid {
    gap: 8px;
  }

  .dense .control-group {
    padding: 10px;
    gap: 6px;
    border-radius: 14px;
  }

  .dense .control-label {
    font-size: 0.68rem;
  }

  .dense .chip-row {
    gap: 6px;
  }

  .dense .chip-btn {
    min-height: 32px;
    padding: 0 8px;
    font-size: 0.82rem;
  }

  .dense .variant-list {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    overflow-y: hidden;
    padding-bottom: 2px;
    scrollbar-width: thin;
  }

  .dense .variant-row {
    flex: 0 0 260px;
    grid-template-columns: minmax(0, 1fr);
    align-items: start;
    min-height: 0;
    padding: 10px;
    gap: 6px;
    border-radius: 14px;
  }

  .dense .variant-copy {
    gap: 4px;
  }

  .dense .variant-copy span,
  .dense .variant-copy p,
  .dense .variant-metrics span {
    font-size: 0.82rem;
    line-height: 1.36;
  }

  .dense .variant-metrics {
    grid-template-columns: repeat(3, minmax(0, max-content));
    grid-auto-flow: column;
    justify-content: start;
    justify-items: start;
    text-align: left;
    min-width: 0;
    gap: 8px;
  }

  @media (max-width: 980px) {
    .workbench-head,
    .summary-grid,
    .control-grid,
    .variant-row {
      grid-template-columns: 1fr;
    }

    .chip-row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .variant-metrics {
      justify-items: start;
      text-align: left;
      min-width: 0;
    }

    .compact .head-actions,
    .compact .control-grid,
    .compact .variant-list {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .dense .workbench-head {
      grid-template-columns: 1fr;
      align-items: start;
    }

    .dense .head-actions {
      grid-template-columns: repeat(4, minmax(0, 1fr));
      justify-content: stretch;
    }

    .dense .head-actions .primary-btn,
    .dense .head-actions .secondary-btn,
    .dense .head-actions .ghost-btn {
      width: 100%;
    }
  }

  @media (max-width: 640px) {
    .chip-row,
    .metric-inline {
      grid-template-columns: 1fr;
    }

    .head-actions,
    .compact .workbench-head {
      grid-template-columns: 1fr;
    }

    .head-actions {
      justify-content: stretch;
    }

    .compact .head-actions,
    .compact .control-grid,
    .compact .variant-list {
      grid-template-columns: 1fr;
    }

    .dense .summary-grid,
    .dense .control-grid {
      grid-template-columns: 1fr;
    }

    .dense .head-actions {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .dense .variant-row {
      flex-basis: 220px;
    }

    .head-actions :global(button) {
      width: 100%;
    }
  }
</style>
