<script lang="ts">
  import { buildBattleLink, buildCreateLink, buildTerminalLink } from '$lib/utils/deepLinks';

  type MissionFlowStepId = 'create' | 'train' | 'arena';
  type MissionMetric = { label: string; value: string };

  export let step: MissionFlowStepId;
  export let title: string;
  export let summary: string;
  export let eyebrow = 'Mission';
  export let metrics: MissionMetric[] = [];

  const steps: Array<{ id: MissionFlowStepId; label: string; href: string }> = [
    { id: 'create', label: 'Create', href: buildCreateLink() },
    { id: 'train', label: 'Train', href: buildTerminalLink() },
    { id: 'arena', label: 'Arena', href: buildBattleLink() },
  ];

  $: currentIndex = steps.findIndex((item) => item.id === step);

  function isDone(index: number) {
    return index < currentIndex;
  }
</script>

<section class="mission-flow-shell" aria-label="Mission flow progress">
  <div class="mission-flow-shell__copy">
    <div class="mission-flow-shell__heading">
      <p class="mission-flow-shell__eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{summary}</p>
    </div>

    {#if metrics.length > 0}
      <div class="mission-flow-shell__metrics">
        {#each metrics as metric}
          <div class="mission-flow-shell__metric">
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <nav class="mission-flow-shell__steps" aria-label="Mission stages">
    {#each steps as item, index}
      <a
        class="mission-flow-shell__step"
        class:active={item.id === step}
        class:done={isDone(index)}
        aria-current={item.id === step ? 'step' : undefined}
        href={item.href}
      >
        <span class="mission-flow-shell__index">0{index + 1}</span>
        <span class="mission-flow-shell__label">{item.label}</span>
      </a>
    {/each}
  </nav>
</section>

<style>
  .mission-flow-shell {
    position: relative;
    z-index: 12;
    display: grid;
    gap: 8px;
    padding: 12px 16px 10px;
    border-bottom: 1px solid rgba(232, 150, 125, 0.14);
    background:
      linear-gradient(180deg, rgba(9, 14, 23, 0.92), rgba(10, 16, 24, 0.82)),
      radial-gradient(circle at top right, rgba(173, 202, 124, 0.12), transparent 34%);
    backdrop-filter: blur(16px);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.2);
  }

  .mission-flow-shell__copy {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 12px;
    align-items: end;
  }

  .mission-flow-shell__heading {
    display: grid;
    gap: 3px;
    max-width: 36rem;
  }

  .mission-flow-shell__eyebrow {
    margin: 0;
    font-family: var(--sc-font-mono, 'IBM Plex Mono', monospace);
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(232, 150, 125, 0.78);
  }

  h1 {
    margin: 0;
    font-family: var(--sc-font-display, 'Bebas Neue', sans-serif);
    font-size: clamp(1.12rem, 1.45vw, 1.45rem);
    line-height: 0.92;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: rgba(248, 243, 232, 0.98);
  }

  p {
    margin: 0;
    font-family: var(--sc-font-body, 'Space Grotesk', sans-serif);
    font-size: 0.9rem;
    line-height: 1.4;
    color: rgba(240, 237, 228, 0.74);
  }

  .mission-flow-shell__metrics {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: flex-end;
  }

  .mission-flow-shell__metric {
    min-width: 92px;
    padding: 7px 9px;
    border-radius: 12px;
    border: 1px solid rgba(173, 202, 124, 0.18);
    background: rgba(9, 14, 22, 0.46);
    display: grid;
    gap: 2px;
  }

  .mission-flow-shell__metric span {
    font-family: var(--sc-font-mono, 'IBM Plex Mono', monospace);
    font-size: var(--sc-fs-xs);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(240, 237, 228, 0.48);
  }

  .mission-flow-shell__metric strong {
    font-family: var(--sc-font-body, 'Space Grotesk', sans-serif);
    font-size: 0.92rem;
    color: rgba(248, 243, 232, 0.96);
  }

  .mission-flow-shell__steps {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .mission-flow-shell__step {
    padding: 9px 10px;
    border-radius: 14px;
    border: 1px solid rgba(240, 237, 228, 0.08);
    background: rgba(9, 14, 22, 0.36);
    color: inherit;
    text-decoration: none;
    display: grid;
    gap: 2px;
    transition: border-color 0.15s ease, transform 0.15s ease, background 0.15s ease;
  }

  .mission-flow-shell__step:hover {
    transform: translateY(-1px);
    border-color: rgba(232, 150, 125, 0.28);
  }

  .mission-flow-shell__step.done {
    border-color: rgba(173, 202, 124, 0.24);
    background: rgba(173, 202, 124, 0.08);
  }

  .mission-flow-shell__step.active {
    border-color: rgba(232, 150, 125, 0.42);
    background: linear-gradient(180deg, rgba(232, 150, 125, 0.18), rgba(9, 14, 22, 0.54));
    box-shadow: inset 0 0 0 1px rgba(232, 150, 125, 0.12);
  }

  .mission-flow-shell__index {
    font-family: var(--sc-font-mono, 'IBM Plex Mono', monospace);
    font-size: 0.7rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(240, 237, 228, 0.42);
  }

  .mission-flow-shell__label {
    font-family: var(--sc-font-body, 'Space Grotesk', sans-serif);
    font-size: 0.92rem;
    font-weight: 600;
    color: rgba(248, 243, 232, 0.98);
  }

  @media (max-width: 768px) {
    .mission-flow-shell {
      gap: 10px;
      padding: 12px 14px 10px;
    }

    .mission-flow-shell__copy {
      grid-template-columns: 1fr;
      align-items: start;
    }

    .mission-flow-shell__metrics {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      justify-content: stretch;
    }

    .mission-flow-shell__steps {
      gap: 8px;
    }

    .mission-flow-shell__step {
      padding: 10px;
    }
  }
</style>
