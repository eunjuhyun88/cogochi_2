<script lang="ts">
  import Sparkline from './Sparkline.svelte';

  type Item = {
    ticker: string;
    keyword: string;
    logo: string | null;
    mentions: number;
    mention_share: number;
    trend_score: number;
    total_reactions: number;
    total_forwards: number;
    total_comments: number;
  };

  type TimeseriesEntry = { stats_date: string; mention_count: number };

  let {
    items = [] as Item[],
    timeseries = {} as Record<string, { daily: TimeseriesEntry[] }>,
    width = 560,
    height = 480,
  }: {
    items: Item[];
    timeseries: Record<string, { daily: TimeseriesEntry[] }>;
    width?: number;
    height?: number;
  } = $props();

  // ── 반지름 계산 ──────────────────────────────────────────
  const MIN_R = 14;
  const MAX_R = 80;

  type Bubble = Item & { r: number; x: number; y: number };

  function computeBubbles(items: Item[], w: number, h: number): Bubble[] {
    if (items.length === 0) return [];

    const maxShare = Math.max(...items.map(i => i.mention_share));
    const minShare = Math.min(...items.map(i => i.mention_share));

    const bubbles: Bubble[] = items.map(item => {
      const norm = maxShare > minShare
        ? (item.mention_share - minShare) / (maxShare - minShare)
        : 0.5;
      const r = MIN_R + (MAX_R - MIN_R) * Math.sqrt(norm);
      return { ...item, r, x: w / 2, y: h / 2 };
    });

    // 초기 위치: 크기 순서로 나선형 배치
    const sorted = [...bubbles].sort((a, b) => b.r - a.r);
    const cx = w / 2;
    const cy = h / 2;

    sorted[0].x = cx;
    sorted[0].y = cy;

    for (let i = 1; i < sorted.length; i++) {
      const angle = (i / sorted.length) * Math.PI * 6;
      const dist  = (sorted[0].r + sorted[i].r) * (0.9 + (i / sorted.length) * 1.2);
      sorted[i].x = cx + Math.cos(angle) * dist;
      sorted[i].y = cy + Math.sin(angle) * dist * 0.75;
    }

    // 충돌 완화 반복 (40회)
    const pad = 3;
    for (let iter = 0; iter < 40; iter++) {
      for (let a = 0; a < sorted.length; a++) {
        for (let b = a + 1; b < sorted.length; b++) {
          const ba = sorted[a];
          const bb = sorted[b];
          const dx = bb.x - ba.x;
          const dy = bb.y - ba.y;
          const dist2 = dx * dx + dy * dy;
          const minDist = ba.r + bb.r + pad;
          if (dist2 < minDist * minDist && dist2 > 0) {
            const d = Math.sqrt(dist2);
            const overlap = (minDist - d) / d * 0.5;
            ba.x -= dx * overlap;
            ba.y -= dy * overlap;
            bb.x += dx * overlap;
            bb.y += dy * overlap;
          }
        }
      }
    }

    // 경계 클램핑 (패딩 8px)
    const pad2 = 8;
    for (const b of sorted) {
      b.x = Math.max(b.r + pad2, Math.min(w - b.r - pad2, b.x));
      b.y = Math.max(b.r + pad2, Math.min(h - b.r - pad2, b.y));
    }

    return sorted;
  }

  const bubbles = $derived(computeBubbles(items, width, height));

  // ── 툴팁 ────────────────────────────────────────────────
  type TooltipState = {
    visible: boolean;
    x: number;
    y: number;
    bubble: Bubble | null;
  };

  let tooltip: TooltipState = $state({ visible: false, x: 0, y: 0, bubble: null });
  let svgEl: SVGSVGElement | undefined = $state(undefined);

  function onEnter(e: MouseEvent, b: Bubble) {
    const rect = svgEl?.getBoundingClientRect();
    if (!rect) return;
    tooltip = { visible: true, x: e.clientX - rect.left, y: e.clientY - rect.top, bubble: b };
  }

  function onMove(e: MouseEvent, b: Bubble) {
    const rect = svgEl?.getBoundingClientRect();
    if (!rect) return;
    tooltip = { visible: true, x: e.clientX - rect.left, y: e.clientY - rect.top, bubble: b };
  }

  function onLeave() {
    tooltip = { ...tooltip, visible: false };
  }

  function fmtTrend(score: number) {
    const p = score * 100;
    return `${p >= 0 ? '+' : ''}${p.toFixed(1)}%`;
  }

  function fmtNum(n: number) {
    return n.toLocaleString('ko-KR');
  }

  function bubbleColor(trend: number, alpha = 0.7): string {
    return trend >= 0
      ? `rgba(173, 202, 124, ${alpha})`
      : `rgba(207, 127, 143, ${alpha})`;
  }

  function bubbleBorder(trend: number): string {
    return trend >= 0 ? 'rgba(173, 202, 124, 0.9)' : 'rgba(207, 127, 143, 0.9)';
  }

  // 툴팁 위치: SVG 경계 안으로 제한
  const TIP_W = 200;
  const TIP_H = 140;

  const tipX = $derived.by(() => {
    if (!tooltip.visible) return 0;
    let x = tooltip.x + 12;
    if (x + TIP_W > width - 4) x = tooltip.x - TIP_W - 12;
    return x;
  });

  const tipY = $derived.by(() => {
    if (!tooltip.visible) return 0;
    let y = tooltip.y - TIP_H / 2;
    if (y < 4) y = 4;
    if (y + TIP_H > height - 4) y = height - TIP_H - 4;
    return y;
  });

  const sparkData = $derived.by(() => {
    if (!tooltip.bubble) return [];
    return (timeseries[tooltip.bubble.ticker]?.daily ?? []).map(d => d.mention_count);
  });
</script>

<div class="bubble-wrap" style="width:{width}px;max-width:100%">
  <svg
    bind:this={svgEl}
    viewBox="0 0 {width} {height}"
    style="width:100%;height:auto;display:block"
    role="img"
    aria-label="마인드쉐어 버블 차트"
  >
    <!-- 버블 -->
    {#each bubbles as b (b.ticker)}
      <g
        role="button"
        tabindex="0"
        aria-label="{b.ticker} {fmtTrend(b.trend_score)}"
        onmouseenter={e => onEnter(e, b)}
        onmousemove={e => onMove(e, b)}
        onmouseleave={onLeave}
        style="cursor:pointer"
      >
        <circle
          cx={b.x}
          cy={b.y}
          r={b.r}
          fill={bubbleColor(b.trend_score, 0.22)}
          stroke={bubbleBorder(b.trend_score)}
          stroke-width="1.5"
        />
        <!-- 티커 레이블 (반지름 20 이상만) -->
        {#if b.r >= 20}
          <text
            x={b.x}
            y={b.y - (b.r >= 32 ? 6 : 0)}
            text-anchor="middle"
            dominant-baseline="middle"
            font-size={Math.max(9, Math.min(14, b.r * 0.38))}
            font-weight="700"
            fill={b.trend_score >= 0 ? '#adca7c' : '#cf7f8f'}
            pointer-events="none"
          >{b.ticker}</text>
        {/if}
        {#if b.r >= 32}
          <text
            x={b.x}
            y={b.y + 10}
            text-anchor="middle"
            dominant-baseline="middle"
            font-size="9"
            fill={b.trend_score >= 0 ? 'rgba(173,202,124,0.7)' : 'rgba(207,127,143,0.7)'}
            pointer-events="none"
          >{fmtTrend(b.trend_score)}</text>
        {/if}
      </g>
    {/each}

    <!-- 툴팁 -->
    {#if tooltip.visible && tooltip.bubble}
      {@const b = tooltip.bubble}
      <g class="tooltip-group" transform="translate({tipX},{tipY})">
        <!-- 배경 -->
        <rect
          x="0" y="0"
          width={TIP_W} height={TIP_H}
          rx="8"
          fill="rgba(11,18,32,0.97)"
          stroke="rgba(219,154,159,0.4)"
          stroke-width="1"
        />
        <!-- 티커 + 키워드 -->
        <text x="12" y="20" font-size="13" font-weight="700" fill="#f7f2ea">{b.ticker}</text>
        <text x="12" y="36" font-size="10" fill="rgba(247,242,234,0.55)">{b.keyword}</text>

        <!-- 지표 -->
        <text x="12" y="54" font-size="10" fill="rgba(247,242,234,0.5)">언급</text>
        <text x="12" y="66" font-size="11" font-weight="600" fill="#f7f2ea">{fmtNum(b.mentions)}</text>

        <text x="76" y="54" font-size="10" fill="rgba(247,242,234,0.5)">비중</text>
        <text x="76" y="66" font-size="11" font-weight="600" fill="#f7f2ea">
          {(b.mention_share * 100).toFixed(1)}%
        </text>

        <text x="140" y="54" font-size="10" fill="rgba(247,242,234,0.5)">변화</text>
        <text
          x="140" y="66"
          font-size="11" font-weight="600"
          fill={b.trend_score >= 0 ? '#adca7c' : '#cf7f8f'}
        >{fmtTrend(b.trend_score)}</text>

        <!-- 반응·댓글 -->
        <text x="12" y="84" font-size="10" fill="rgba(247,242,234,0.4)">
          반응 {fmtNum(b.total_reactions)}  댓글 {fmtNum(b.total_comments)}
        </text>

        <!-- 스파크라인 -->
        {#if sparkData.length >= 2}
          <foreignObject x="12" y="92" width="80" height="32">
            <div xmlns="http://www.w3.org/1999/xhtml">
              <Sparkline data={sparkData} width={80} height={28} positive={b.trend_score >= 0} />
            </div>
          </foreignObject>
          <text x="100" y="112" font-size="9" fill="rgba(247,242,234,0.3)">일별 추이</text>
        {/if}
      </g>
    {/if}
  </svg>
</div>

<style>
  .bubble-wrap {
    position: relative;
    user-select: none;
  }

  .tooltip-group {
    pointer-events: none;
  }
</style>
