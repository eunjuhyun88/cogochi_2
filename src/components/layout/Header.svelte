<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { gameState } from '$lib/stores/gameState';
  import { walletStore, isWalletConnected } from '$lib/stores/walletStore';
  import { openWalletModal } from '$lib/stores/walletModalStore';
  import { hydrateAuthSession } from '$lib/stores/walletStore';
  import { hydrateDomainStores } from '$lib/stores/hydration';
  import { livePrices } from '$lib/stores/priceStore';
  import { updatePrice } from '$lib/stores/priceStore';
  import { fetchPrice } from '$lib/api/binance';
  import { TOKEN_MAP } from '$lib/data/tokens';
  import { buildDeepLink } from '$lib/utils/deepLinks';
  import { DESKTOP_NAV_SURFACES, isAppSurfaceActive } from '$lib/navigation/appSurfaces';

  const gState = $derived($gameState);
  const wallet = $derived($walletStore);
  const connected = $derived($isWalletConnected);
  const liveP = $derived($livePrices);
  const activePath = $derived($page.url.pathname);

  let _lastFetchedToken = '';

  $effect(() => {
    const token = gState.pair.split('/')[0] || 'BTC';
    if (token !== _lastFetchedToken && !(token in liveP)) {
      _lastFetchedToken = token;
      const tokDef = TOKEN_MAP.get(token);
      if (tokDef) {
        fetchPrice(tokDef.binanceSymbol).then(price => {
          if (Number.isFinite(price) && price > 0) {
            updatePrice(token, price, 'rest');
          }
        }).catch(() => {});
      }
    }
  });

  onMount(() => {
    void (async () => {
      await hydrateAuthSession();
      await hydrateDomainStores();
    })();
  });

  function isActive(id: import('$lib/navigation/appSurfaces').AppSurfaceId): boolean {
    return isAppSurfaceActive(id, activePath);
  }

  let profileDropdownOpen = $state(false);

  function toggleProfileDropdown() {
    profileDropdownOpen = !profileDropdownOpen;
  }

  function closeProfileDropdown() {
    profileDropdownOpen = false;
  }

  function handleProfileNav(path: string) {
    closeProfileDropdown();
    goto(path);
  }

  $effect(() => {
    activePath;
    if (profileDropdownOpen) {
      closeProfileDropdown();
    }
  });

  $effect(() => {
    connected;
    if (!connected && profileDropdownOpen) {
      closeProfileDropdown();
    }
  });

  async function handleLogout() {
    closeProfileDropdown();
    const { logoutAuth } = await import('$lib/api/auth');
    const { clearAuthenticatedUser } = await import('$lib/stores/walletStore');
    const { disconnectWallet } = await import('$lib/stores/walletStore');
    await logoutAuth();
    clearAuthenticatedUser();
    disconnectWallet();
  }

  const selectedToken = $derived(gState.pair.split('/')[0] || 'BTC');
  const selectedPrice = $derived(liveP[selectedToken] || 0);
  const selectedPriceText = $derived(
    selectedPrice > 0
      ? Number(selectedPrice).toLocaleString('en-US', {
          minimumFractionDigits: selectedPrice >= 1000 ? 0 : 2,
          maximumFractionDigits: selectedPrice >= 1000 ? 0 : 2
        })
      : '---'
  );
</script>

<nav id="nav">
  <div class="nav-main">
    <!-- Logo -->
    <a class="nav-logo" href={buildDeepLink(connected ? '/dashboard' : '/')} aria-label="Home">
      <span class="nav-logo-main">COGOTCHI</span>
    </a>

    <div class="nav-sep desktop-only"></div>

    <!-- Ticker -->
    <div class="selected-ticker">
      <span class="st-pair">{selectedToken}</span>
      <span class="st-price">${selectedPriceText}</span>
    </div>

    <div class="nav-sep desktop-only"></div>

    <!-- Desktop/Tablet Nav Tabs -->
    {#each DESKTOP_NAV_SURFACES as item}
      <a
        class="nav-tab-desktop"
        class:active={isActive(item.id)}
        class:highlight={item.highlight === true}
        title={`${item.label} · ${item.description}`}
        aria-label={`${item.label}: ${item.description}`}
        aria-current={isActive(item.id) ? 'page' : undefined}
        href={item.href}
      >
        <span class="tab-full">{item.label.toUpperCase()}{#if item.highlight}<span class="tab-star">&#9733;</span>{/if}</span>
        <span class="tab-short">{item.shortLabel}{#if item.highlight}<span class="tab-star">&#9733;</span>{/if}</span>
      </a>
    {/each}
  </div>

  <div class="nav-right">
    <!-- Score badge (desktop only) -->
    <div class="score-badge desktop-only">
      <span class="score-label">SCORE</span>
      <span class="score-value">{Math.round(gState.score).toLocaleString()}</span>
    </div>

    <!-- Settings (desktop only, hidden on home) -->
    <a
      class="settings-btn desktop-only"
      title="Settings"
      aria-label="Settings"
      href={buildDeepLink('/settings')}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
      </svg>
    </a>

    <!-- Wallet / Profile -->
    {#if connected}
      <div class="profile-dropdown-wrap">
        <button class="wallet-btn connected" onclick={toggleProfileDropdown}>
          <span class="wallet-dot"></span>
          {wallet.shortAddr}
        </button>
        {#if profileDropdownOpen}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div class="dropdown-backdrop" onclick={closeProfileDropdown}></div>
          <div class="profile-dropdown">
            <button class="dropdown-item" onclick={() => handleProfileNav('/agent')}>Agent</button>
            <button class="dropdown-item" onclick={() => handleProfileNav('/settings')}>Settings</button>
            <button class="dropdown-item" onclick={() => { closeProfileDropdown(); openWalletModal(); }}>Wallet</button>
            <div class="dropdown-sep"></div>
            <button class="dropdown-item dropdown-item-danger" onclick={handleLogout}>Disconnect</button>
          </div>
        {/if}
      </div>
    {:else}
      <button class="wallet-btn" onclick={openWalletModal}>
        CONNECT
      </button>
    {/if}
  </div>

</nav>

<style>
  #nav {
    background:
      radial-gradient(circle at 10% 0%, rgba(219, 154, 159, 0.10), transparent 28%),
      radial-gradient(circle at 86% 0%, rgba(173, 202, 124, 0.08), transparent 24%),
      linear-gradient(180deg, rgba(10, 15, 26, 0.96), rgba(8, 13, 23, 0.94));
    border-bottom: 1px solid var(--sc-line-soft);
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: var(--sc-z-header);
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    height: 56px;
    padding: 0 20px;
    font-family: var(--sc-font-body);
    color: var(--sc-text-0);
    backdrop-filter: blur(18px);
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.22);
  }

  #nav::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(219, 154, 159, 0.36), rgba(242, 209, 147, 0.18), rgba(173, 202, 124, 0.22), transparent);
    pointer-events: none;
  }

  .nav-main {
    display: flex;
    align-items: center;
    min-width: 0;
    flex: 1 1 auto;
    overflow: hidden;
    height: 100%;
  }

  .nav-logo {
    display: inline-flex;
    align-items: baseline;
    gap: 8px;
    color: var(--sc-text-0);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    flex-shrink: 0;
    line-height: 1;
    text-decoration: none;
    transition: opacity var(--sc-duration-fast);
  }
  .nav-logo:hover { opacity: 0.8; }

  .nav-logo-main {
    font-family: 'Orbitron', var(--sc-font-display);
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 2px;
    text-shadow: 0 0 10px rgba(219, 154, 159, 0.1);
  }

  .nav-sep {
    width: 1px;
    height: 24px;
    background: var(--sc-line-soft);
    margin: 0 14px;
    flex-shrink: 0;
  }

  /* Ticker */
  .selected-ticker {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 8px;
    flex-shrink: 0;
  }
  .st-pair {
    font-family: var(--sc-font-mono);
    font-size: 11px;
    color: var(--sc-text-3);
    letter-spacing: 1px;
  }
  .st-price {
    font-family: var(--sc-font-mono);
    font-size: 14px;
    font-weight: 700;
    color: var(--sc-text-0);
  }

  /* Desktop Nav Tabs */
  .nav-tab-desktop {
    font-family: var(--sc-font-body);
    font-weight: 600;
    font-size: 12px;
    letter-spacing: 0.08em;
    color: var(--sc-text-3);
    padding: 0 16px;
    height: 32px;
    display: flex;
    align-items: center;
    border: 1px solid rgba(219, 154, 159, 0.08);
    border-radius: 999px;
    background: rgba(13, 19, 31, 0.72);
    cursor: pointer;
    transition: color var(--sc-duration-fast), background var(--sc-duration-fast);
    white-space: nowrap;
    position: relative;
    text-decoration: none;
    margin-right: 6px;
  }
  .nav-tab-desktop.disabled {
    opacity: .35;
    pointer-events: none;
    cursor: default;
  }
  .nav-tab-desktop:last-of-type { margin-right: 0; }

  .tab-short { display: none; }

  .tab-star {
    margin-left: 3px;
    font-size: 9px;
    color: var(--sc-accent);
  }

  .nav-tab-desktop:hover {
    color: var(--sc-text-0);
    background: rgba(219, 154, 159, 0.08);
  }

  /* Highlight tab (LAB) */
  .nav-tab-desktop.highlight {
    color: var(--sc-accent);
    border-color: rgba(219, 154, 159, 0.18);
  }
  .nav-tab-desktop.highlight:hover {
    color: var(--sc-text-0);
    background: rgba(219, 154, 159, 0.12);
  }

  /* Active tab */
  .nav-tab-desktop.active {
    color: var(--sc-text-0);
    background: linear-gradient(135deg, rgba(219, 154, 159, 0.14), rgba(173, 202, 124, 0.08));
    text-shadow: 0 0 10px rgba(219, 154, 159, 0.12);
  }
  .nav-tab-desktop.active::after {
    content: '';
    position: absolute;
    inset: auto 10px -6px;
    height: 2px;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--sc-accent), var(--sc-accent-3));
    box-shadow: 0 0 8px rgba(219, 154, 159, 0.18);
  }
  .nav-tab-desktop.active.highlight {
    color: var(--sc-accent);
    text-shadow: 0 0 12px rgba(219, 154, 159, 0.2);
  }
  .nav-tab-desktop.active.highlight::after {
    background: var(--sc-accent);
  }

  /* Right Section */
  .nav-right {
    margin-left: 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  .score-badge {
    font-family: var(--sc-font-mono);
    font-size: 11px;
    background: rgba(242, 209, 147, 0.06);
    color: var(--sc-accent-3);
    border: 1px solid rgba(242, 209, 147, 0.12);
    border-radius: 8px;
    padding: 6px 12px;
    letter-spacing: 0.08em;
    display: flex;
    align-items: center;
    gap: var(--sc-sp-1);
  }
  .score-value {
    font-size: 13px;
    color: var(--sc-text-0);
    font-weight: 700;
  }

  /* Settings */
  .settings-btn {
    color: var(--sc-text-2);
    background: rgba(13, 19, 31, 0.52);
    border: 1px solid var(--sc-line-soft);
    border-radius: var(--sc-radius-sm);
    cursor: pointer;
    padding: var(--sc-sp-1);
    transition: all var(--sc-duration-fast);
    line-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
  }
  .settings-btn:hover {
    color: var(--sc-text-0);
    border-color: rgba(219, 154, 159, 0.28);
    background: rgba(219, 154, 159, 0.08);
  }

  /* Wallet */
  .wallet-btn {
    font-family: var(--sc-font-body);
    font-weight: 700;
    font-size: 13px;
    background: #E8967D;
    color: #0a0a0f;
    border: 1px solid rgba(232, 150, 125, 0.5);
    border-radius: 10px;
    padding: 8px 20px;
    min-height: 36px;
    cursor: pointer;
    letter-spacing: 0.06em;
    transition: all var(--sc-duration-fast);
    box-shadow: var(--sc-shadow-glow);
    display: flex;
    align-items: center;
    gap: var(--sc-sp-1);
  }
  .wallet-btn:hover {
    filter: brightness(1.1);
    box-shadow: 0 0 16px rgba(219, 154, 159, 0.2);
    transform: translateY(-1px);
  }
  .wallet-btn.connected {
    background: rgba(173, 202, 124, 0.12);
    color: #dff8bd;
    border: 1px solid rgba(173, 202, 124, 0.2);
    box-shadow: none;
    font-size: var(--sc-fs-2xs);
  }
  .wallet-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: var(--sc-good);
    box-shadow: 0 0 6px var(--sc-good);
  }

  /* Profile Dropdown */
  .profile-dropdown-wrap {
    position: relative;
  }
  .dropdown-backdrop {
    position: fixed;
    inset: 0;
    z-index: 99;
  }
  .profile-dropdown {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    z-index: 100;
    min-width: 150px;
    background: rgba(10, 15, 25, 0.98);
    border: 1px solid rgba(219, 154, 159, 0.2);
    border-radius: var(--sc-radius-md);
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    padding: var(--sc-sp-1) 0;
    display: flex;
    flex-direction: column;
  }
  .dropdown-item {
    font-family: var(--sc-font-body);
    font-weight: 600;
    font-size: var(--sc-fs-2xs);
    letter-spacing: 0.04em;
    color: var(--sc-text-1);
    background: none;
    border: none;
    padding: var(--sc-sp-2) var(--sc-sp-3);
    text-align: left;
    cursor: pointer;
    transition: background var(--sc-duration-fast), color var(--sc-duration-fast);
  }
  .dropdown-item:hover {
    background: rgba(219, 154, 159, 0.08);
    color: var(--sc-text-0);
  }
  .dropdown-item-danger:hover {
    background: rgba(255, 89, 89, 0.1);
    color: #ff6b6b;
  }
  .dropdown-sep {
    height: 1px;
    background: var(--sc-line-soft);
    margin: var(--sc-sp-1) 0;
  }

  /* Active States (touch feedback) */
  .nav-logo:active { opacity: 0.6; transform: scale(0.95); }
  .nav-tab-desktop:active { background: var(--sc-accent-bg); }
  .settings-btn:active {
    background: var(--sc-accent-bg);
    transform: scale(0.92);
  }
  .wallet-btn:active {
    transform: scale(0.96);
    opacity: 0.85;
  }

  /* ═══ TABLET (769-1024px) ═══ */
  @media (max-width: 1024px) and (min-width: 769px) {
    #nav { height: 52px; padding: 0 16px; }
    .desktop-only { display: none; }
    .selected-ticker { display: flex; gap: 6px; }
    .st-pair { font-size: 10px; }
    .st-price { font-size: 13px; }
    .nav-tab-desktop {
      padding: 0 14px;
      height: 30px;
      font-size: 11px;
      letter-spacing: 0.06em;
    }
    .tab-full { display: none; }
    .tab-short { display: inline; }
    .nav-logo-main { font-size: 15px; letter-spacing: 2px; }
    .nav-right { gap: 8px; }
    .wallet-btn { padding: 6px 16px; font-size: 12px; }
  }

  /* ═══ MOBILE (<=768px) ═══ */
  @media (max-width: 768px) {
    #nav {
      height: 48px;
      flex-wrap: nowrap;
      padding: 0 16px;
    }
    .desktop-only { display: none; }
    .nav-tab-desktop { display: none; }
    .nav-main { height: 48px; }
    .nav-logo { gap: 0; }
    .nav-logo-main { font-size: 15px; letter-spacing: 2px; }
    .selected-ticker { display: flex; margin-left: auto; gap: 6px; padding: 0 8px; }
    .st-pair { font-size: 10px; }
    .st-price { font-size: 13px; }
    .nav-right { margin-left: 10px; height: 48px; gap: 8px; }
    .settings-btn { display: none; }
    .wallet-btn { padding: 6px 16px; border-radius: 8px; font-size: 12px; }
  }

  /* ═══ SMALL MOBILE (<=480px) ═══ */
  @media (max-width: 480px) {
    #nav { height: 44px; padding: 0 12px; }
    .nav-main { height: 44px; }
    .nav-right { height: 44px; }
    .nav-logo-main { font-size: 14px; letter-spacing: 1.5px; }
    .st-price { font-size: 12px; }
    .wallet-btn { padding: 6px 14px; font-size: 11px; min-height: 32px; }
  }
</style>
