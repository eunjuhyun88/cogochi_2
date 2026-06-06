<script lang="ts">
  type Call = {
    ticker: string;
    call_direction: number;
    price_return_24h: number;
    reward: number;
    msg_ts: string;
  };

  type PanelData = {
    influence: number;
    tier: string;
    engagement: number;
    content: number;
    reach: number;
    spread: number;
    hit: number;
    recent_calls: Call[];
  };

  let {
    channelId,
    channelName,
    onclose,
  }: {
    channelId: string;
    channelName: string;
    onclose: () => void;
  } = $props();

  let data: PanelData | null = $state(null);
  let loading = $state(true);

  const COMPONENTS: { key: keyof PanelData; label: string; desc: string }[] = [
    { key: 'engagement', label: '참여',     desc: '얼마나 읽히고 퍼지는가' },
    { key: 'content',    label: '콘텐츠',   desc: '분석 깊이'              },
    { key: 'reach',      label: '도달',     desc: '구독자 규모'            },
    { key: 'spread',     label: '다중채널', desc: '플랫폼 다양성'          },
    { key: 'hit',        label: '적중',     desc: '콜 성공률'              },
  ];

  $effect(() => {
    loading = true;
    fetch(`/api/influence/channel/${encodeURIComponent(channelId)}`)
      .then(r => r.json())
      .then(d => { data = d; })
      .catch(() => {})
      .finally(() => { loading = false; });
  });

  function fmtPct(n: number) {
    return `${n >= 0 ? '+' : ''}${(n * 100).toFixed(1)}%`;
  }

  function callLabel(dir: number) { return dir > 0 ? 'BULL' : 'BEAR'; }
  function callResult(reward: number) { return reward >= 0 ? '✓ 적중' : '✗ 빗나감'; }
  function callColor(reward: number) { return reward >= 0 ? 'hit-ok' : 'hit-miss'; }

  function tierColor(tier: string) {
    if (tier === '최상') return '#adca7c';
    if (tier === '높음') return '#7ec8ad';
    if (tier === '보통') return '#f2d193';
    return '#cf7f8f';
  }
</script>

<!-- 오버레이 -->
<div class="overlay" role="button" tabindex="-1" onclick={onclose} onkeydown={e => e.key === 'Escape' && onclose()}></div>

<!-- 패널 -->
<aside class="panel">
  <div class="panel-header">
    <button class="back-btn" onclick={onclose}>←</button>
    <span class="panel-title">{channelName}</span>
    <button class="close-btn" onclick={onclose}>✕</button>
  </div>

  {#if loading}
    <div class="panel-loading">
      {#each { length: 6 } as _}
        <div class="skeleton-row"></div>
      {/each}
    </div>
  {:else if data}
    <!-- 영향력 헤더 -->
    <div class="influence-header">
      <span class="influence-score">{data.influence.toFixed(1)}</span>
      <span class="influence-label">/ 100</span>
      <span class="tier-badge" style="color:{tierColor(data.tier)};border-color:{tierColor(data.tier)}">{data.tier}</span>
    </div>

    <!-- 컴포넌트 바 -->
    <div class="components">
      {#each COMPONENTS as c}
        {@const val = Number(data[c.key])}
        <div class="comp-row">
          <span class="comp-label">{c.label}</span>
          <div class="comp-bar-wrap">
            <div class="comp-bar" style="width:{val}%;background:{val >= 70 ? '#adca7c' : val >= 40 ? '#f2d193' : '#cf7f8f'}"></div>
          </div>
          <span class="comp-val">{val.toFixed(1)}</span>
          <span class="comp-desc">{c.desc}</span>
        </div>
      {/each}
    </div>

    <!-- 최근 콜 -->
    {#if data.recent_calls.length > 0}
      <div class="calls-section">
        <h4 class="calls-title">최근 콜</h4>
        <div class="calls-list">
          {#each data.recent_calls.slice(0, 10) as call}
            <div class="call-row">
              <span class="call-ticker">{call.ticker}</span>
              <span class="call-dir" class:bull={call.call_direction > 0} class:bear={call.call_direction < 0}>
                {callLabel(call.call_direction)}
              </span>
              <span class="call-return">{fmtPct(call.price_return_24h)}</span>
              <span class="call-result {callColor(call.reward)}">{callResult(call.reward)}</span>
              <span class="call-reward" class:pos={call.reward >= 0} class:neg={call.reward < 0}>
                {call.reward >= 0 ? '+' : ''}{call.reward.toFixed(2)}
              </span>
            </div>
          {/each}
        </div>
      </div>
    {:else}
      <p class="no-calls">콜 이력 없음 (24h 경과 콜만 표시)</p>
    {/if}
  {/if}
</aside>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(4, 8, 14, 0.5);
    z-index: 100;
  }

  .panel {
    position: fixed;
    top: 0;
    right: 0;
    width: 480px;
    max-width: 100vw;
    height: 100dvh;
    background: var(--sc-bg-1);
    border-left: 1px solid var(--sc-line);
    z-index: 101;
    overflow-y: auto;
    animation: slideIn 0.2s ease-out;
  }

  @keyframes slideIn {
    from { transform: translateX(100%); }
    to   { transform: translateX(0); }
  }

  .panel-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    border-bottom: 1px solid var(--sc-line);
    position: sticky;
    top: 0;
    background: var(--sc-bg-1);
    z-index: 1;
  }

  .back-btn, .close-btn {
    background: none;
    border: none;
    color: var(--sc-text-2);
    cursor: pointer;
    font-size: 16px;
    padding: 4px;
    line-height: 1;
  }
  .back-btn:hover, .close-btn:hover { color: var(--sc-text-0); }
  .close-btn { margin-left: auto; }

  .panel-title {
    font-size: 15px;
    font-weight: 700;
    color: var(--sc-text-0);
    flex: 1;
  }

  .panel-loading {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .skeleton-row {
    height: 32px;
    background: var(--sc-bg-2);
    border-radius: 6px;
    animation: pulse 1.4s ease-in-out infinite;
  }
  @keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.8} }

  /* 영향력 헤더 */
  .influence-header {
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding: 20px 20px 12px;
  }
  .influence-score {
    font-family: var(--sc-font-display);
    font-size: 36px;
    color: var(--sc-text-0);
  }
  .influence-label {
    font-size: 14px;
    color: var(--sc-text-3);
  }
  .tier-badge {
    margin-left: 8px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    border: 1px solid;
    border-radius: 5px;
    padding: 3px 8px;
  }

  /* 컴포넌트 바 */
  .components {
    padding: 4px 20px 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .comp-row {
    display: grid;
    grid-template-columns: 52px 1fr 36px auto;
    align-items: center;
    gap: 8px;
  }
  .comp-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--sc-text-1);
  }
  .comp-bar-wrap {
    height: 6px;
    background: var(--sc-bg-2);
    border-radius: 3px;
    overflow: hidden;
  }
  .comp-bar {
    height: 100%;
    border-radius: 3px;
    transition: width 0.4s ease;
  }
  .comp-val {
    font-size: 11px;
    font-family: var(--sc-font-mono);
    color: var(--sc-text-2);
    text-align: right;
  }
  .comp-desc {
    font-size: 10px;
    color: var(--sc-text-3);
  }

  /* 최근 콜 */
  .calls-section {
    border-top: 1px solid var(--sc-line);
    padding: 16px 20px;
  }
  .calls-title {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--sc-text-3);
    margin-bottom: 10px;
  }
  .calls-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .call-row {
    display: grid;
    grid-template-columns: 48px 36px 52px 60px 40px;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-family: var(--sc-font-mono);
  }
  .call-ticker { font-weight: 700; color: var(--sc-text-0); }
  .call-dir { font-size: 10px; font-weight: 700; }
  .bull { color: var(--sc-good); }
  .bear { color: var(--sc-bad); }
  .call-return { color: var(--sc-text-2); }
  .hit-ok   { color: var(--sc-good); font-size: 11px; }
  .hit-miss { color: var(--sc-bad);  font-size: 11px; }
  .pos { color: var(--sc-good); }
  .neg { color: var(--sc-bad);  }

  .no-calls {
    padding: 20px;
    font-size: 12px;
    color: var(--sc-text-3);
    text-align: center;
  }

  @media (max-width: 520px) {
    .panel { width: 100vw; }
    .comp-row { grid-template-columns: 44px 1fr 32px; }
    .comp-desc { display: none; }
  }
</style>
