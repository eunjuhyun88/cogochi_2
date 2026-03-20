<script lang="ts">
  import '../app.css';
  import { page } from '$app/state';

  let { children } = $props();

  const links = [
    { href: '/', label: 'Deck' },
    { href: '/roster', label: 'Roster' },
    { href: '/team', label: 'Team' },
    { href: '/battle', label: 'Battle' },
    { href: '/lab', label: 'Lab' },
    { href: '/market', label: 'Market' }
  ] as const;

  let pathname = $derived(page.url.pathname);

  function isActive(href: string): boolean {
    if (href === '/') return pathname === '/';
    if (href === '/roster') return pathname === '/roster' || pathname.startsWith('/agent/');
    return pathname === href || pathname.startsWith(`${href}/`);
  }
</script>

<div class="app-shell">
  <header class="topbar">
    <a class="brand-block" href="/">
      <span class="device-tag">MAXIDOGE COMMAND</span>
      <strong class="brand">AI MON: SIGNAL WARS</strong>
      <span class="brand-sub">Pick the pack. Train the model. Win the proof.</span>
    </a>

    <nav class="dock" aria-label="Primary">
      {#each links as link}
        <a href={link.href} class:active={isActive(link.href)}>{link.label}</a>
      {/each}
    </nav>
  </header>

  <main>
    {@render children()}
  </main>
</div>

<style>
  .app-shell {
    min-height: 100vh;
    max-width: 1320px;
    margin: 0 auto;
    padding: 16px;
  }

  .topbar {
    position: sticky;
    top: 16px;
    z-index: 10;
    display: flex;
    justify-content: space-between;
    gap: 18px;
    align-items: start;
    padding: 18px 20px;
    border: 1px solid var(--line);
    border-radius: 28px;
    background: linear-gradient(180deg, rgba(8, 18, 27, 0.88), rgba(8, 18, 27, 0.76));
    backdrop-filter: blur(18px);
    box-shadow: 0 18px 44px rgba(0, 0, 0, 0.18);
  }

  .brand-block {
    display: grid;
    gap: 4px;
    text-decoration: none;
  }

  .device-tag,
  .brand-sub {
    color: var(--text-2);
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .brand {
    color: var(--cyan);
    font-family: 'Orbitron', sans-serif;
    font-size: clamp(24px, 4vw, 34px);
    letter-spacing: 0.04em;
    line-height: 0.95;
  }

  .dock {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: end;
  }

  .dock a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    padding: 0 14px;
    border-radius: 999px;
    border: 1px solid var(--line);
    background: rgba(255, 255, 255, 0.03);
    color: var(--text-1);
    text-decoration: none;
    transition: border-color 160ms ease, background 160ms ease, color 160ms ease;
  }

  .dock a:hover,
  .dock a.active {
    border-color: rgba(98, 215, 218, 0.3);
    background: rgba(98, 215, 218, 0.1);
    color: var(--text-0);
  }

  main {
    min-height: calc(100vh - 132px);
    padding: 18px 0 24px;
  }

  @media (max-width: 860px) {
    .topbar {
      flex-direction: column;
      align-items: stretch;
    }

    .dock {
      justify-content: start;
    }
  }
</style>
