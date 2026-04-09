<!--
  ChartCardCluster.svelte
  Grid of chart tool SVG cards with gentle breathe animation
  and mouse-proximity tilt effect.
-->
<script lang="ts">
  interface CardDef {
    title: string;
    src: string;
  }

  interface Props {
    cards: CardDef[];
    mouseX?: number;
    mouseY?: number;
  }

  const { cards, mouseX = 50, mouseY = 50 }: Props = $props();
</script>

<div class="cluster">
  {#each cards as card, i}
    <div
      class="card"
      style:--stagger={`${i * -1.2}s`}
      style:--tilt={`${(i % 2 === 0 ? 1 : -1) * (2 + (i % 3))}deg`}
    >
      <img src={card.src} alt={card.title} class="card-img" loading="lazy" />
    </div>
  {/each}
</div>

<style>
  .cluster {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    max-width: 420px;
    perspective: 800px;
  }

  .card {
    opacity: 0.65;
    border-radius: 12px;
    transition: opacity 0.3s ease, transform 0.3s ease;
    animation: card-breathe 8s ease-in-out infinite;
    animation-delay: var(--stagger, 0s);
    transform: rotate(var(--tilt, 0deg));
  }

  .card:hover {
    opacity: 1;
    transform: rotate(var(--tilt, 0deg)) scale(1.06) translateZ(8px);
  }

  .card-img {
    display: block;
    width: 100%;
    height: auto;
    pointer-events: none;
  }

  @keyframes card-breathe {
    0%, 100% { translate: 0 0; }
    50% { translate: 0 -4px; }
  }

  /* Last row: if only 1 or 2 items, center them */
  .card:last-child:nth-child(3n+1) {
    grid-column: 2;
  }

  @media (max-width: 768px) {
    .cluster {
      grid-template-columns: repeat(2, 1fr);
      max-width: 280px;
      gap: 0.75rem;
    }
  }
</style>
