<script lang="ts">
  import { goto } from '$app/navigation';
</script>

<div class="mindshare-index">
  <header class="page-header">
    <h1>마인드쉐어</h1>
    <p class="subtitle">한국 크립토 텔레그램 커뮤니티 언급 트렌드</p>
  </header>

  <div class="card-grid">
    <button
      class="card"
      onclick={() => goto('/dashboard/mindshare/community?intervalDays=7&pretge=false')}
    >
      <div class="card-inner">
        <span class="card-label">한국 커뮤니티</span>
        <span class="card-title">마인드쉐어</span>
        <span class="card-desc">전체 키워드 · 7d / 14d / 30d / 90d</span>
        <span class="card-arrow">→</span>
      </div>
    </button>

    <button
      class="card card--pretge"
      onclick={() => goto('/dashboard/mindshare/community?intervalDays=7&pretge=true')}
    >
      <div class="card-inner">
        <span class="card-label">Pre-TGE</span>
        <span class="card-title">마인드쉐어</span>
        <span class="card-desc">TGE 전 토큰 · 7d / 14d / 30d / 90d</span>
        <span class="card-arrow">→</span>
      </div>
    </button>
  </div>
</div>

<style>
  .mindshare-index {
    padding: 24px 20px 40px;
    max-width: 900px;
    margin: 0 auto;
  }

  .page-header {
    margin-bottom: 32px;
  }

  h1 {
    font-family: var(--sc-font-display);
    font-size: 28px;
    font-weight: 700;
    color: var(--sc-text-0);
    letter-spacing: 0.04em;
    margin-bottom: 6px;
  }

  .subtitle {
    font-size: 13px;
    color: var(--sc-text-2);
  }

  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 380px));
    gap: 16px;
  }

  .card {
    background: var(--sc-bg-1);
    border: 1px solid var(--sc-line);
    border-radius: 12px;
    padding: 0;
    cursor: pointer;
    text-align: left;
    transition: border-color 0.15s, background 0.15s;
    width: 100%;
    height: 160px;
  }

  .card:hover {
    border-color: var(--sc-accent);
    background: var(--lis-surface-1);
  }

  .card--pretge {
    border-color: rgba(173, 202, 124, 0.3);
  }

  .card--pretge:hover {
    border-color: var(--sc-good);
  }

  .card-inner {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 24px;
    height: 100%;
    position: relative;
  }

  .card-label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--sc-accent);
  }

  .card--pretge .card-label {
    color: var(--sc-good);
  }

  .card-title {
    font-family: var(--sc-font-display);
    font-size: 22px;
    letter-spacing: 0.03em;
    color: var(--sc-text-0);
  }

  .card-desc {
    font-size: 12px;
    color: var(--sc-text-2);
    margin-top: 4px;
  }

  .card-arrow {
    position: absolute;
    bottom: 20px;
    right: 24px;
    font-size: 18px;
    color: var(--sc-text-3);
    transition: color 0.15s, transform 0.15s;
  }

  .card:hover .card-arrow {
    color: var(--sc-text-1);
    transform: translateX(4px);
  }

  @media (max-width: 600px) {
    .card-grid {
      grid-template-columns: 1fr;
    }

    h1 {
      font-size: 22px;
    }
  }
</style>
