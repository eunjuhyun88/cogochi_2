<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import BubbleChart from '../../../../components/mindshare/BubbleChart.svelte';
  import ChannelPanel from '../../../../components/mindshare/ChannelPanel.svelte';

  // ── 공통 타입 ────────────────────────────────────────────
  type Item = {
    rank: number; ticker: string; keyword: string; logo: string | null; tge: boolean;
    mentions: number; prev_count: number; trend_score: number; mention_share: number;
    total_reactions: number; total_forwards: number; total_comments: number;
  };
  type WeightedItem = {
    rank: number; ticker: string; keyword: string; logo: string | null;
    weighted_mentions: number; trend_weighted: number;
    raw_mentions: number; trend_raw: number; divergence_flag: boolean;
    total_reactions: number; total_forwards: number; total_comments: number;
  };
  type KolItem = {
    channel_id: string; channel_name: string; influence: number;
    tier: string; participants: number; mentions_count: number;
  };
  type ApiResponse = {
    total_keywords: number; total_mentions: number;
    top_gainer: { ticker: string; keyword: string; trend_score: number } | null;
    items: Item[]; timeseries: Record<string, { daily: { stats_date: string; mention_count: number }[] }>;
    top_gainers: { rank:number; ticker:string; keyword:string; logo:string|null; trend_score:number; mentions:number }[];
    top_losers:  { rank:number; ticker:string; keyword:string; logo:string|null; trend_score:number; mentions:number }[];
    latestUpdatedAt: string | null; _mock?: boolean;
  };

  const INTERVALS = [7, 14, 30, 90] as const;
  type ViewTab = 'raw' | 'weighted' | 'kol';
  type TableFilter = 'all' | 'up' | 'down';

  // ── 상태 ────────────────────────────────────────────────
  let rawData:      ApiResponse | null = $state(null);
  let weightedData: { items: WeightedItem[]; latestUpdatedAt: string | null } | null = $state(null);
  let kolData:      KolItem[] | null = $state(null);

  let loading    = $state(true);
  let error      = $state(false);
  let viewTab:   ViewTab     = $state('raw');
  let tableFilter: TableFilter = $state('all');
  let chartWidth = $state(520);
  let chartWrap: HTMLDivElement | undefined = $state(undefined);

  // 채널 패널
  let panelChannel: { id: string; name: string } | null = $state(null);

  const intervalDays = $derived(
    Number($page.url.searchParams.get('intervalDays') ?? '7') as 7 | 14 | 30 | 90
  );
  const pretge = $derived($page.url.searchParams.get('pretge') === 'true');

  const filteredItems = $derived.by(() => {
    if (!rawData) return [];
    const items = rawData.items;
    if (tableFilter === 'up')   return items.filter(i => i.trend_score > 0);
    if (tableFilter === 'down') return items.filter(i => i.trend_score < 0);
    return items;
  });

  // ── 데이터 페치 ─────────────────────────────────────────
  async function fetchRaw(days: number, isPretge: boolean) {
    loading = true; error = false;
    try {
      const res = await fetch(`/api/mindshare/community?intervalDays=${days}&pretge=${isPretge}&limit=50`);
      if (!res.ok) throw new Error();
      rawData = await res.json();
    } catch { error = true; }
    finally { loading = false; }
  }

  async function fetchWeighted(days: number, isPretge: boolean) {
    loading = true; error = false;
    try {
      // 5초 timeout → raw 폴백
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`/api/mindshare/weighted?intervalDays=${days}&pretge=${isPretge}`, { signal: controller.signal });
      clearTimeout(tid);
      if (!res.ok) throw new Error();
      const d = await res.json();
      weightedData = d;
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError') {
        // timeout → raw 탭으로 폴백
        viewTab = 'raw';
        if (!rawData) await fetchRaw(days, isPretge);
      } else {
        error = true;
      }
    } finally { loading = false; }
  }

  async function fetchKol(days: number) {
    loading = true; error = false;
    try {
      const res = await fetch(`/api/influence/leaderboard?intervalDays=${days}&limit=20`);
      if (!res.ok) throw new Error();
      const d = await res.json();
      kolData = d.items;
    } catch { error = true; }
    finally { loading = false; }
  }

  $effect(() => {
    if (viewTab === 'raw')      void fetchRaw(intervalDays, pretge);
    if (viewTab === 'weighted') void fetchWeighted(intervalDays, pretge);
    if (viewTab === 'kol')      void fetchKol(intervalDays);
  });

  $effect(() => {
    if (!chartWrap) return;
    const ro = new ResizeObserver(e => { chartWidth = e[0].contentRect.width; });
    ro.observe(chartWrap);
    return () => ro.disconnect();
  });

  function setInterval(days: number) {
    goto(`?intervalDays=${days}&pretge=${pretge}`, { noScroll: true });
  }

  // ── 포맷 ────────────────────────────────────────────────
  function fmtTrend(s: number) { const p = s * 100; return `${p >= 0 ? '+' : ''}${p.toFixed(1)}%`; }
  function fmtNum(n: number)   { return n.toLocaleString('ko-KR'); }
  function tClass(s: number)   { return s > 0 ? 'up' : s < 0 ? 'down' : 'flat'; }

  function tierColor(t: string) {
    return t === '최상' ? '#adca7c' : t === '높음' ? '#7ec8ad' : t === '보통' ? '#f2d193' : '#cf7f8f';
  }
</script>

<div class="community-page">

  <!-- 헤더 -->
  <div class="page-top">
    <a href="/dashboard/mindshare" class="back-link">← 마인드쉐어</a>
    <h1 class="page-title">{pretge ? 'Pre-TGE' : '한국 커뮤니티'} 마인드쉐어</h1>
    <div class="interval-tabs">
      {#each INTERVALS as d}
        <button class="itab" class:active={intervalDays === d} onclick={() => setInterval(d)}>{d}d</button>
      {/each}
    </div>
  </div>

  <!-- 뷰 탭 -->
  <div class="view-tabs">
    <button class="vtab" class:active={viewTab === 'raw'}      onclick={() => viewTab = 'raw'}>Raw</button>
    <button class="vtab" class:active={viewTab === 'weighted'} onclick={() => viewTab = 'weighted'}>가중 ◉</button>
    <button class="vtab" class:active={viewTab === 'kol'}      onclick={() => viewTab = 'kol'}>KOL 리더보드</button>
  </div>

  <!-- ══ RAW 탭 ══════════════════════════════════════════ -->
  {#if viewTab === 'raw'}

    {#if loading}
      <div class="kpi-strip">
        {#each { length: 3 } as _}<div class="kpi-item skeleton"></div>{/each}
      </div>
    {:else if rawData}
      <div class="kpi-strip">
        <div class="kpi-item">
          <span class="kpi-label">키워드 수</span>
          <span class="kpi-value">{rawData.total_keywords}개</span>
        </div>
        <div class="kpi-item">
          <span class="kpi-label">총 언급량</span>
          <span class="kpi-value">{fmtNum(rawData.total_mentions)}회</span>
        </div>
        {#if rawData.top_gainer}
          <div class="kpi-item">
            <span class="kpi-label">최고 상승</span>
            <span class="kpi-value">
              {rawData.top_gainer.ticker}
              <span class="kpi-badge up">{fmtTrend(rawData.top_gainer.trend_score)}</span>
            </span>
          </div>
        {/if}
        {#if rawData.latestUpdatedAt}
          <div class="kpi-item kpi-dim">
            <span class="kpi-label">업데이트</span>
            <span class="kpi-value kpi-small">{new Date(rawData.latestUpdatedAt).toLocaleString('ko-KR',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})}</span>
          </div>
        {/if}
      </div>
    {/if}

    <div class="body-grid">
      <div class="chart-col" bind:this={chartWrap}>
        {#if loading}
          <div class="chart-skeleton"></div>
        {:else if rawData?.items.length}
          <BubbleChart items={rawData.items} timeseries={rawData.timeseries} width={chartWidth} height={Math.round(chartWidth * 0.82)} />
        {:else}
          <div class="chart-empty">데이터 없음</div>
        {/if}
      </div>

      <div class="right-col">
        <section class="table-section">
          <div class="table-filter-tabs">
            {#each [['all','전체'],['up','상승'],['down','하락']] as [k,l]}
              <button class="ftab" class:active={tableFilter === k} onclick={() => tableFilter = k as TableFilter}>{l}</button>
            {/each}
          </div>
          {#if loading}
            <div class="table-skel">{#each {length:5} as _}<div class="row-skel"></div>{/each}</div>
          {:else if error}
            <p class="error-msg">데이터 불러오기 실패</p>
          {:else}
            <table class="rank-table">
              <thead><tr><th>#</th><th>이름</th><th class="num">변화</th><th class="num">반응</th><th class="num">댓글</th></tr></thead>
              <tbody>
                {#each filteredItems as item (item.ticker)}
                  <tr>
                    <td class="rank-cell">{item.rank}</td>
                    <td class="name-cell">
                      {#if item.logo}<img src={item.logo} alt={item.ticker} class="logo" />{:else}<span class="logo-ph">{item.ticker.slice(0,2)}</span>{/if}
                      <span class="ticker">{item.ticker}</span>
                      <span class="keyword">{item.keyword}</span>
                      {#if !item.tge}<span class="pre-badge">PRE</span>{/if}
                    </td>
                    <td class="num {tClass(item.trend_score)}">{fmtTrend(item.trend_score)}</td>
                    <td class="num muted">{fmtNum(item.total_reactions)}</td>
                    <td class="num muted">{fmtNum(item.total_comments)}</td>
                  </tr>
                {/each}
                {#if filteredItems.length === 0}<tr><td colspan="5" class="empty-row">없음</td></tr>{/if}
              </tbody>
            </table>
          {/if}
        </section>

        {#if rawData}
          <div class="top5-row">
            <div class="top5-card">
              <h3 class="top5-title up-title">Top 5 상승</h3>
              <ol class="top5-list">
                {#each rawData.top_gainers as g}
                  <li class="top5-item"><span class="top5-name">{g.ticker}</span><span class="top5-trend up">{fmtTrend(g.trend_score)}</span></li>
                {/each}
              </ol>
            </div>
            <div class="top5-card">
              <h3 class="top5-title down-title">Top 5 하락</h3>
              <ol class="top5-list">
                {#each rawData.top_losers as l}
                  <li class="top5-item"><span class="top5-name">{l.ticker}</span><span class="top5-trend down">{fmtTrend(l.trend_score)}</span></li>
                {/each}
              </ol>
            </div>
          </div>
        {/if}
      </div>
    </div>

  <!-- ══ 가중 탭 ═════════════════════════════════════════ -->
  {:else if viewTab === 'weighted'}
    {#if loading}
      <div class="table-skel">{#each {length:8} as _}<div class="row-skel"></div>{/each}</div>
    {:else if error}
      <p class="error-msg">가중 데이터 불러오기 실패 — Raw 탭을 사용하세요</p>
    {:else if weightedData}
      <table class="rank-table weighted-table">
        <thead>
          <tr>
            <th>#</th><th>이름</th>
            <th class="num">가중 언급량</th>
            <th class="num">가중 변화</th>
            <th class="num">Raw 변화</th>
            <th class="num">반응</th>
          </tr>
        </thead>
        <tbody>
          {#each weightedData.items as item (item.ticker)}
            <tr class:diverge={item.divergence_flag}>
              <td class="rank-cell">{item.rank}</td>
              <td class="name-cell">
                {#if item.logo}<img src={item.logo} alt={item.ticker} class="logo" />{:else}<span class="logo-ph">{item.ticker.slice(0,2)}</span>{/if}
                <span class="ticker">{item.ticker}</span>
                <span class="keyword">{item.keyword}</span>
                {#if item.divergence_flag}
                  <span
                    class="warn-badge"
                    title="raw {fmtTrend(item.trend_raw)}, weighted {fmtTrend(item.trend_weighted)}: 잡 채널 도배 의심"
                  >⚠</span>
                {/if}
              </td>
              <td class="num muted">{fmtNum(Math.round(item.weighted_mentions))}</td>
              <td class="num {tClass(item.trend_weighted)}">{fmtTrend(item.trend_weighted)}</td>
              <td class="num {tClass(item.trend_raw)} dim">{fmtTrend(item.trend_raw)}</td>
              <td class="num muted">{fmtNum(item.total_reactions)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}

  <!-- ══ KOL 리더보드 탭 ═══════════════════════════════ -->
  {:else}
    {#if loading}
      <div class="table-skel">{#each {length:8} as _}<div class="row-skel"></div>{/each}</div>
    {:else if error}
      <p class="error-msg">KOL 데이터 불러오기 실패</p>
    {:else if kolData}
      <table class="rank-table kol-table">
        <thead>
          <tr><th>순위</th><th>채널명</th><th class="num">영향력</th><th>등급</th><th class="num">구독자</th><th class="num">언급수</th></tr>
        </thead>
        <tbody>
          {#each kolData as ch, i}
            <tr class="kol-row" role="button" tabindex="0"
              onclick={() => panelChannel = { id: ch.channel_id, name: ch.channel_name }}
              onkeydown={e => e.key === 'Enter' && (panelChannel = { id: ch.channel_id, name: ch.channel_name })}
            >
              <td class="rank-cell">{i + 1}</td>
              <td class="name-cell">
                <span class="logo-ph">{ch.channel_name.slice(0,2)}</span>
                <span class="ticker">{ch.channel_name}</span>
              </td>
              <td class="num">
                <span class="inf-score" style="color:{tierColor(ch.tier)}">{ch.influence.toFixed(1)}</span>
              </td>
              <td>
                <span class="tier-chip" style="color:{tierColor(ch.tier)};border-color:{tierColor(ch.tier)}">{ch.tier}</span>
              </td>
              <td class="num muted">{fmtNum(ch.participants)}</td>
              <td class="num muted">{fmtNum(ch.mentions_count)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  {/if}

</div>

<!-- 채널 상세 패널 -->
{#if panelChannel}
  <ChannelPanel
    channelId={panelChannel.id}
    channelName={panelChannel.name}
    onclose={() => panelChannel = null}
  />
{/if}

<style>
  .community-page { padding: 20px 20px 48px; max-width: 1140px; margin: 0 auto; }

  /* ── 헤더 ─── */
  .page-top { display:flex; align-items:center; gap:16px; margin-bottom:14px; flex-wrap:wrap; }
  .back-link { font-size:12px; color:var(--sc-text-2); text-decoration:none; white-space:nowrap; }
  .back-link:hover { color:var(--sc-text-0); }
  .page-title { font-family:var(--sc-font-display); font-size:22px; letter-spacing:.03em; color:var(--sc-text-0); flex:1; min-width:160px; }

  .interval-tabs { display:flex; gap:3px; background:var(--sc-bg-1); border:1px solid var(--sc-line); border-radius:8px; padding:3px; }
  .itab { padding:4px 12px; border-radius:5px; border:none; background:transparent; color:var(--sc-text-2); font-size:12px; font-weight:600; cursor:pointer; }
  .itab.active { background:var(--sc-accent); color:var(--sc-bg-0); }

  /* ── 뷰 탭 ─── */
  .view-tabs { display:flex; gap:4px; margin-bottom:16px; border-bottom:1px solid var(--sc-line); padding-bottom:0; }
  .vtab {
    padding:8px 16px; border:none; background:transparent;
    color:var(--sc-text-2); font-size:13px; font-weight:600;
    cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-1px;
    transition:color .12s, border-color .12s;
  }
  .vtab.active { color:var(--sc-accent); border-color:var(--sc-accent); }
  .vtab:hover:not(.active) { color:var(--sc-text-0); }

  /* ── KPI ─── */
  .kpi-strip { display:flex; gap:10px; margin-bottom:16px; flex-wrap:wrap; }
  .kpi-item { background:var(--sc-bg-1); border:1px solid var(--sc-line); border-radius:8px; padding:10px 16px; display:flex; flex-direction:column; gap:3px; min-width:120px; }
  .kpi-item.skeleton { flex:1; min-height:52px; animation:pulse 1.4s ease-in-out infinite; }
  .kpi-dim { opacity:.7; }
  .kpi-label { font-size:10px; color:var(--sc-text-3); text-transform:uppercase; letter-spacing:.06em; }
  .kpi-value { font-size:17px; font-weight:700; color:var(--sc-text-0); display:flex; align-items:baseline; gap:6px; }
  .kpi-small { font-size:12px; }
  .kpi-badge { font-size:11px; font-weight:700; padding:1px 6px; border-radius:4px; }
  .kpi-badge.up { background:var(--sc-good-bg); color:var(--sc-good); }

  /* ── 바디 그리드 ─── */
  .body-grid { display:grid; grid-template-columns:1fr 340px; gap:20px; align-items:start; }
  .chart-col { background:var(--sc-bg-1); border:1px solid var(--sc-line); border-radius:12px; overflow:hidden; min-height:200px; }
  .chart-skeleton { width:100%; aspect-ratio:1.22; background:var(--sc-bg-1); animation:pulse 1.4s ease-in-out infinite; }
  .chart-empty { height:260px; display:grid; place-content:center; color:var(--sc-text-3); font-size:13px; }
  .right-col { display:flex; flex-direction:column; gap:14px; }

  /* ── 테이블 공통 ─── */
  .table-filter-tabs { display:flex; gap:4px; margin-bottom:8px; }
  .ftab { padding:4px 14px; border-radius:6px; border:1px solid var(--sc-line); background:transparent; color:var(--sc-text-2); font-size:12px; cursor:pointer; }
  .ftab.active { border-color:var(--sc-accent); color:var(--sc-accent); background:var(--sc-accent-bg-subtle); }

  .table-skel { display:flex; flex-direction:column; gap:5px; }
  .row-skel { height:38px; background:var(--sc-bg-1); border-radius:5px; animation:pulse 1.4s ease-in-out infinite; }

  .rank-table { width:100%; border-collapse:collapse; font-size:12px; }
  .rank-table thead th { font-size:10px; color:var(--sc-text-3); text-transform:uppercase; letter-spacing:.06em; font-weight:600; padding:5px 8px; text-align:left; border-bottom:1px solid var(--sc-line); }
  .rank-table thead th.num { text-align:right; }
  .rank-table tbody tr { border-bottom:1px solid var(--sc-line-soft); transition:background .1s; }
  .rank-table tbody tr:hover { background:var(--sc-accent-bg-subtle); }
  .rank-table tbody tr:last-child { border-bottom:none; }
  .rank-table td { padding:7px 8px; }

  .rank-cell { color:var(--sc-text-3); font-size:11px; font-family:var(--sc-font-mono); width:24px; }
  .name-cell { display:flex; align-items:center; gap:6px; }
  .logo { width:18px; height:18px; border-radius:50%; object-fit:cover; flex-shrink:0; }
  .logo-ph { width:18px; height:18px; border-radius:50%; background:var(--sc-accent-bg); color:var(--sc-accent); font-size:7px; font-weight:700; display:grid; place-content:center; flex-shrink:0; }
  .ticker { font-weight:700; color:var(--sc-text-0); }
  .keyword { color:var(--sc-text-2); font-size:11px; }
  .pre-badge { font-size:8px; font-weight:700; background:rgba(173,202,124,.16); color:var(--sc-good); border-radius:3px; padding:1px 4px; }

  .num { text-align:right; font-family:var(--sc-font-mono); font-size:11px; }
  .muted { color:var(--sc-text-2); }
  .up   { color:var(--sc-good); }
  .down { color:var(--sc-bad); }
  .flat { color:var(--sc-text-2); }
  .dim  { opacity:.6; }

  .empty-row { text-align:center; color:var(--sc-text-3); padding:20px; font-size:12px; }
  .error-msg { color:var(--sc-bad); font-size:13px; padding:12px 0; }

  /* ── Top5 ─── */
  .top5-row { display:flex; gap:10px; }
  .top5-card { flex:1; background:var(--sc-bg-1); border:1px solid var(--sc-line); border-radius:10px; padding:12px; }
  .top5-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; margin-bottom:8px; }
  .up-title   { color:var(--sc-good); }
  .down-title { color:var(--sc-bad); }
  .top5-list  { list-style:none; display:flex; flex-direction:column; gap:6px; }
  .top5-item  { display:flex; justify-content:space-between; align-items:center; font-size:11px; }
  .top5-name  { color:var(--sc-text-1); font-weight:600; }
  .top5-trend { font-family:var(--sc-font-mono); font-size:10px; }

  /* ── 가중 테이블 ─── */
  .weighted-table { margin-top:8px; }
  .diverge td { background:rgba(207,127,143,.04); }
  .warn-badge { font-size:13px; cursor:help; }

  /* ── KOL 테이블 ─── */
  .kol-table { margin-top:8px; }
  .kol-row { cursor:pointer; }
  .kol-row:hover { background:var(--sc-accent-bg-subtle); }
  .inf-score { font-family:var(--sc-font-mono); font-size:13px; font-weight:700; }
  .tier-chip { font-size:9px; font-weight:700; border:1px solid; border-radius:4px; padding:1px 6px; letter-spacing:.04em; }

  /* ── 애니메이션 ─── */
  @keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.8} }

  /* ── 반응형 ─── */
  @media (max-width:900px) {
    .body-grid { grid-template-columns:1fr; }
    .right-col { order:-1; }
  }
  @media (max-width:480px) {
    .top5-row { flex-direction:column; }
    .page-title { font-size:18px; }
  }
</style>
