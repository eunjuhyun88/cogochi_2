<!--
  ValueSection.svelte
  Reusable value proposition section: headline + description on one side,
  chart card cluster on the other (alternates via `align` prop).
-->
<script lang="ts">
  import { revealOnScroll } from '$lib/actions/revealOnScroll';
  import ChartCardCluster from './ChartCardCluster.svelte';

  interface CardDef {
    title: string;
    src: string;
  }

  interface Props {
    id?: string;
    title: string;
    titleHighlight: string;
    description: string;
    cards: CardDef[];
    align?: 'left' | 'right';
    mouseX?: number;
    mouseY?: number;
  }

  const {
    id,
    title,
    titleHighlight,
    description,
    cards,
    align = 'right',
    mouseX = 50,
    mouseY = 50,
  }: Props = $props();
</script>

<section {id} class="value-section" class:reverse={align === 'left'}>
  <div class="split">
    <div class="text-side" use:revealOnScroll>
      <h2 class="section-h2">
        <span class="dim">{title}</span>{' '}
        <span>{titleHighlight}</span>
      </h2>
      <p class="section-body">{description}</p>
    </div>
    <div class="cards-side" use:revealOnScroll={{ delay: 200 }}>
      <ChartCardCluster {cards} {mouseX} {mouseY} />
    </div>
  </div>
</section>

<style>
  .value-section {
    position: relative;
    z-index: 2;
    min-height: 70vh;
    display: flex;
    align-items: center;
    padding: clamp(80px, 10vh, 160px) clamp(24px, 5vw, 80px);
  }

  .split {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: clamp(40px, 6vw, 100px);
    align-items: center;
    max-width: 1120px;
    margin: 0 auto;
    width: 100%;
  }

  .reverse .split {
    direction: rtl;
  }

  .reverse .split > :global(*) {
    direction: ltr;
  }

  .text-side {
    display: flex;
    flex-direction: column;
    gap: clamp(12px, 2vh, 24px);
  }

  .section-h2 {
    font-size: clamp(2rem, 4.5vw, 3.5rem);
    font-weight: 700;
    line-height: 1.1;
    letter-spacing: -0.015em;
    color: rgba(247, 242, 234, 0.95);
    margin: 0;
  }

  .dim {
    color: rgba(247, 242, 234, 0.45);
  }

  .section-body {
    font-size: clamp(1rem, 1.8vw, 1.15rem);
    font-weight: 400;
    line-height: 1.65;
    color: rgba(247, 242, 234, 0.5);
    max-width: 480px;
    margin: 0;
  }

  .cards-side {
    display: flex;
    justify-content: center;
  }

  /* Tablet: stack vertically */
  @media (max-width: 900px) {
    .split {
      grid-template-columns: 1fr;
      gap: clamp(32px, 4vh, 60px);
      text-align: center;
    }

    .reverse .split {
      direction: ltr;
    }

    .text-side {
      align-items: center;
    }

    .section-body {
      max-width: 520px;
    }

    .cards-side {
      justify-content: center;
    }
  }

  @media (max-width: 768px) {
    .cards-side {
      display: none;
    }
  }
</style>
