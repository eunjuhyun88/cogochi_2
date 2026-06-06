<script lang="ts">
  let {
    data = [] as number[],
    width = 80,
    height = 28,
    positive = true,
  }: {
    data: number[];
    width?: number;
    height?: number;
    positive?: boolean;
  } = $props();

  const points = $derived.by(() => {
    if (data.length < 2) return '';
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    return data
      .map((v, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((v - min) / range) * (height - 2) - 1;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  });

  const color = $derived(positive ? '#adca7c' : '#cf7f8f');
</script>

{#if data.length >= 2}
  <svg {width} {height} viewBox="0 0 {width} {height}" class="sparkline">
    <polyline
      {points}
      fill="none"
      stroke={color}
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      opacity="0.9"
    />
  </svg>
{/if}

<style>
  .sparkline {
    display: block;
    overflow: visible;
  }
</style>
