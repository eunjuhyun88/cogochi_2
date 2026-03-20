<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import StrategyVariantWorkbench from '../../components/agent/StrategyVariantWorkbench.svelte';
  import {
    AGENT_GROWTH_FOCUS_OPTIONS,
    JOURNEY_SHELL_OPTIONS,
    agentJourneyStore,
    currentJourneyGrowthFocus,
  } from '$lib/stores/agentJourneyStore';
  import { agentStats, hydrateAgentStats } from '$lib/stores/agentData';
  import { hydrateMatchHistory, matchHistoryStore, winRate, bestStreak } from '$lib/stores/matchHistoryStore';
  import { hydrateUserProfile, profileTier, userProfileStore } from '$lib/stores/userProfileStore';
  import { walletStore, openWalletModal } from '$lib/stores/walletStore';
  import { activeSignalCount } from '$lib/stores/trackedSignalStore';
  import { openTradeCount, totalQuickPnL } from '$lib/stores/quickTradeStore';
  import {
    buildAgentLink,
    buildArenaLink,
    buildCreateLink,
    buildMarketLink,
    buildTerminalLink,
    buildWorldLink,
  } from '$lib/utils/deepLinks';

  type AgentHQTab = 'overview' | 'train' | 'record';

  interface TabOption {
    id: AgentHQTab;
    label: string;
    detail: string;
  }

  interface GrowthDrill {
    title: string;
    detail: string;
  }

  interface GateRow {
    label: string;
    detail: string;
    done: boolean;
  }

  const TAB_OPTIONS: TabOption[] = [
    { id: 'overview', label: 'Overview', detail: 'lead, crew, and next mission' },
    { id: 'train', label: 'Train', detail: 'brain setup and readiness gates' },
    { id: 'record', label: 'Record', detail: 'proof, release, and rental prep' },
  ];

  const GROWTH_DRILLS: Record<string, GrowthDrill[]> = {
    signalHunter: [
      { title: 'Sharpen opening read', detail: 'Use Terminal to tighten the first conviction before the clash starts.' },
      { title: 'Run another scenario', detail: 'World preview gives one cleaner setup before the next Arena proof run.' },
      { title: 'Bias toward decisive entries', detail: 'Favor faster calls and stronger attack windows until the agent stops hesitating.' },
    ],
    riskKeeper: [
      { title: 'Stabilize downside', detail: 'Tune doctrine so the lead protects LP before it chases perfect upside.' },
      { title: 'Test rough eras', detail: 'Send the crew back into harder weather and validate survival, not just wins.' },
      { title: 'Track loss quality', detail: 'Record tab should show fewer ugly losses before release becomes credible.' },
    ],
    memoryGardener: [
      { title: 'Collect cleaner samples', detail: 'Keep feeding the lead more distinct encounters so recall becomes trustworthy.' },
      { title: 'Revisit prior proof', detail: 'Use recent matches as memory anchors, then replay them through Terminal framing.' },
      { title: 'Promote only after pattern reuse', detail: 'Wait for consistent improvement across multiple proofs, not one lucky win.' },
    ],
  };

  function normalizeTab(value: string | null): AgentHQTab {
    if (value === 'train' || value === 'record') return value;
    return 'overview';
  }

  function formatDateLabel(value: number | null): string {
    if (!value) return 'not yet';
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(value);
  }

  function formatPercent(value: number): string {
    const normalized = Number.isFinite(value) ? value : 0;
    return `${normalized >= 0 ? '+' : ''}${normalized.toFixed(1)}%`;
  }

  $: journey = $agentJourneyStore;
  $: growthFocus = $currentJourneyGrowthFocus;
  $: profile = $userProfileStore;
  $: tier = $profileTier;
  $: wallet = $walletStore;
  $: matchState = $matchHistoryStore;
  $: records = matchState.records;
  $: wr = $winRate;
  $: streak = $bestStreak;
  $: trackedSignals = $activeSignalCount;
  $: openPositions = $openTradeCount;
  $: quickPnL = $totalQuickPnL;
  $: allAgentStats = $agentStats;
  $: currentTab = normalizeTab($page.url.searchParams.get('tab'));
  $: isOverviewTab = currentTab === 'overview';
  $: leadShell = JOURNEY_SHELL_OPTIONS.find((option) => option.id === journey.shellId) ?? JOURNEY_SHELL_OPTIONS[0];
  $: rosterShells = JOURNEY_SHELL_OPTIONS.filter((option) => journey.starterRosterIds.includes(option.id));
  $: readinessRows = [
    {
      label: 'Model linked',
      detail: journey.minted ? `Activated ${formatDateLabel(journey.mintedAt)}` : 'Choose a lead and bind the first shell.',
      done: journey.readiness.modelLinked,
    },
    {
      label: 'Doctrine locked',
      detail: `Current doctrine is ${journey.doctrineId}.`,
      done: journey.readiness.doctrineSet,
    },
    {
      label: 'First validation run',
      detail: journey.terminalReady ? `Validated ${formatDateLabel(journey.terminalReadyAt)}` : 'Run Terminal once so the lead can enter proof mode.',
      done: journey.readiness.firstValidationRun,
    },
  ] satisfies GateRow[];
  $: releaseRows = [
    {
      label: 'Starter activated',
      detail: journey.minted ? `${journey.agentName} is now the active lead.` : 'No lead is active yet.',
      done: journey.minted,
    },
    {
      label: 'Mission ready',
      detail: journey.terminalReady ? 'Terminal cleared and Arena is open.' : 'Terminal still needs one clean pass.',
      done: journey.terminalReady,
    },
    {
      label: 'Proof sample',
      detail: records.length > 0 ? `${records.length} recorded proof runs available.` : 'Need the first Arena result before release.',
      done: records.length > 0,
    },
    {
      label: 'Release wallet',
      detail: wallet.connected ? `Wallet ready as ${wallet.shortAddr}` : 'Connect wallet only when you want to publish or rent.',
      done: wallet.connected,
    },
  ] satisfies GateRow[];
  $: readinessCount = readinessRows.filter((row) => row.done).length;
  $: readinessPct = Math.round((readinessCount / readinessRows.length) * 100);
  $: totalProofMatches = Math.max(profile.stats.totalMatches ?? 0, records.length);
  $: positiveAgentStats = Object.values(allAgentStats).filter((stat) => stat.wins + stat.losses > 0);
  $: totalMemory = positiveAgentStats.reduce((sum, stat) => sum + (stat.learning?.totalRAGEntries ?? 0), 0);
  $: averageLearningLevel = positiveAgentStats.length > 0
    ? Math.round(
        positiveAgentStats.reduce((sum, stat) => sum + (stat.learning?.learningLevel ?? 0), 0) / positiveAgentStats.length
      )
    : 0;
  $: recentMatches = records.slice(0, 4);
  $: growthDrills = GROWTH_DRILLS[growthFocus?.id ?? AGENT_GROWTH_FOCUS_OPTIONS[0].id] ?? GROWTH_DRILLS.signalHunter;
  $: proofState = !journey.minted
    ? 'Boot sequence'
    : !journey.terminalReady
      ? 'Training in progress'
      : totalProofMatches === 0
        ? 'Awaiting first proof'
        : wr >= 55
          ? 'Release candidate'
          : 'Tune before release';
  $: nextAction = !journey.minted
    ? {
        label: 'Choose lead',
        detail: 'Pick the starter crew and set the first identity.',
        href: buildCreateLink(),
      }
    : !journey.terminalReady
      ? {
          label: 'Resume Terminal',
          detail: 'Finish readiness so the lead can enter proof mode.',
          href: buildTerminalLink(),
        }
      : totalProofMatches === 0
        ? {
            label: 'Enter Arena',
            detail: 'Get the first real proof run on the board.',
            href: buildArenaLink(),
          }
        : {
            label: 'Prepare Market story',
        detail: 'Move toward public proof, sharing, and rental.',
        href: buildMarketLink(),
      };
  $: heroStatusChips = currentTab === 'train'
    ? [
        `Lead ${journey.agentName}`,
        `Growth ${growthFocus?.label ?? 'Signal Hunter'}`,
        `Readiness ${readinessPct}%`,
      ]
    : [
        `Lead ${journey.agentName}`,
        `Growth ${growthFocus?.label ?? 'Signal Hunter'}`,
        `Proof ${proofState}`,
      ];
  $: heroPrimaryAction = currentTab === 'train'
    ? journey.minted
      ? {
          label: 'Open Terminal',
          href: buildTerminalLink(),
        }
      : {
          label: 'Complete Setup',
          href: buildCreateLink(),
      }
    : nextAction;
  $: heroTitle = currentTab === 'train'
    ? 'Tune the winner.'
    : currentTab === 'record'
      ? 'Review the proof.'
      : 'Grow the lead.';
  $: heroSubtitle = currentTab === 'train'
    ? 'Clone one build, change one lever, rerun, and keep only clear improvement.'
    : currentTab === 'record'
      ? 'Check whether this lead is ready for release, sharing, or one more training loop.'
      : 'One lead, one crew, one next move. Train, prove, then decide if the agent is ready.';
  $: heroSecondaryAction = currentTab === 'train'
    ? { label: 'Open Arena', href: buildArenaLink() }
    : currentTab === 'record'
      ? { label: 'Open Market', href: buildMarketLink() }
      : { label: 'Open Arena', href: buildArenaLink() };
  $: heroTertiaryAction = currentTab === 'train'
    ? { label: 'Open Record', href: buildAgentLink({ tab: 'record' }) }
    : { label: 'Preview World', href: buildWorldLink() };

  onMount(() => {
    void hydrateAgentStats();
    void hydrateMatchHistory();
    void hydrateUserProfile();
  });
</script>

<svelte:head>
  <title>Agent HQ — Cogochi</title>
</svelte:head>

<main class="agent-hq-page">
  <section class="hq-hero" class:hq-hero-compact={!isOverviewTab} class:hq-hero-train={currentTab === 'train'}>
    <div class="hero-copy">
      <p class="hero-kicker">Agent HQ</p>
      <h1>{heroTitle}</h1>
      <p class="hero-subtitle">{heroSubtitle}</p>

      <div class="status-strip">
        {#each heroStatusChips as chip}
          <span class="status-chip">{chip}</span>
        {/each}
      </div>

      <div class="hero-actions">
        <button class="primary-btn" type="button" onclick={() => goto(heroPrimaryAction.href)}>{heroPrimaryAction.label}</button>
        <button class="secondary-btn" type="button" onclick={() => goto(heroSecondaryAction.href)}>{heroSecondaryAction.label}</button>
        <button class="ghost-btn" type="button" onclick={() => goto(heroTertiaryAction.href)}>{heroTertiaryAction.label}</button>
      </div>
    </div>

    <aside class="hero-spotlight">
      <div class="spotlight-head">
        <span class="spotlight-kicker">Lead shell</span>
        <strong>{leadShell.label}</strong>
        <span class="spotlight-note">{leadShell.title}</span>
      </div>

      <div class="spotlight-stage">
        <img class="spotlight-image" src={leadShell.sheet} alt={leadShell.label} />
      </div>

      <div class="spotlight-grid">
        <div class="spotlight-stat">
          <span class="spotlight-label">Readiness</span>
          <strong>{readinessPct}%</strong>
        </div>
        <div class="spotlight-stat">
          <span class="spotlight-label">Proof</span>
          <strong>{totalProofMatches}</strong>
        </div>
        <div class="spotlight-stat">
          <span class="spotlight-label">Tier</span>
          <strong>{tier.toUpperCase()}</strong>
        </div>
      </div>
    </aside>
  </section>

  <section class="tab-strip" aria-label="Agent HQ sections">
    {#each TAB_OPTIONS as tab}
      <button
        type="button"
        class="tab-btn"
        class:tab-btn-active={currentTab === tab.id}
        onclick={() => goto(buildAgentLink(tab.id === 'overview' ? {} : { tab: tab.id }))}
      >
        <strong>{tab.label}</strong>
        <span>{tab.detail}</span>
      </button>
    {/each}
  </section>

  {#if currentTab === 'overview'}
    <section class="content-grid">
      <article class="surface-card lead-card">
        <div class="card-head">
          <div>
            <p class="card-kicker">Lead</p>
            <h2>{journey.agentName}</h2>
          </div>
          <span class="card-badge">{journey.agentId ?? 'pending id'}</span>
        </div>

        <p class="card-copy">
          {leadShell.detail}
          The current crew is sized for one guided Steam session: choose, train, prove, then come back here to decide
          whether the lead is worth pushing further.
        </p>

        <div class="metric-row">
          <div class="metric-card">
            <span class="metric-label">Activated</span>
            <strong>{formatDateLabel(journey.mintedAt)}</strong>
          </div>
          <div class="metric-card">
            <span class="metric-label">Growth lane</span>
            <strong>{growthFocus?.title ?? 'Sharpen direction calls'}</strong>
          </div>
          <div class="metric-card">
            <span class="metric-label">Next move</span>
            <strong>{nextAction.label}</strong>
          </div>
        </div>
      </article>

      <article class="surface-card">
        <div class="card-head">
          <div>
            <p class="card-kicker">Mission state</p>
            <h2>Current run health</h2>
          </div>
          <span class="card-badge">{proofState}</span>
        </div>

        <div class="metric-row">
          <div class="metric-card">
            <span class="metric-label">Win rate</span>
            <strong>{wr}%</strong>
          </div>
          <div class="metric-card">
            <span class="metric-label">Best streak</span>
            <strong>{streak}</strong>
          </div>
          <div class="metric-card">
            <span class="metric-label">Tracked signals</span>
            <strong>{trackedSignals}</strong>
          </div>
          <div class="metric-card">
            <span class="metric-label">Open positions</span>
            <strong>{openPositions}</strong>
          </div>
        </div>

        <p class="card-copy card-copy-tight">{nextAction.detail}</p>
      </article>

      <article class="surface-card crew-card">
        <div class="card-head">
          <div>
            <p class="card-kicker">Crew</p>
            <h2>Pinned starters</h2>
          </div>
          <span class="card-badge">{rosterShells.length} active</span>
        </div>

        <div class="crew-grid">
          {#each rosterShells as shell}
            <div class="crew-tile" class:crew-tile-lead={shell.id === journey.shellId}>
              <img src={shell.sheet} alt={shell.label} />
              <strong>{shell.label}</strong>
              <span>{shell.title}</span>
            </div>
          {/each}
        </div>
      </article>

      <article class="surface-card">
        <div class="card-head">
          <div>
            <p class="card-kicker">Release gate</p>
            <h2>What makes this shippable</h2>
          </div>
          <span class="card-badge">{releaseRows.filter((row) => row.done).length}/{releaseRows.length}</span>
        </div>

        <div class="gate-list">
          {#each releaseRows as row}
            <div class="gate-row">
              <span class="gate-dot" class:gate-dot-done={row.done}></span>
              <div>
                <strong>{row.label}</strong>
                <p>{row.detail}</p>
              </div>
            </div>
          {/each}
        </div>
      </article>
    </section>
  {:else if currentTab === 'train'}
    <section class="content-grid">
      <article class="surface-card workbench-card">
        <StrategyVariantWorkbench
          compact
          dense
          title="Run builds before you call this lead ready."
          subtitle="Clone one setup, change one lever, rerun, and keep only the build that clearly improves."
        />
      </article>

      <article class="surface-card">
        <div class="card-head">
          <div>
            <p class="card-kicker">Brain setup</p>
            <h2>Current training contract</h2>
          </div>
          <span class="card-badge">{journey.modelSource}</span>
        </div>

        <div class="metric-row">
          <div class="metric-card">
            <span class="metric-label">Model source</span>
            <strong>{journey.modelSource}</strong>
          </div>
          <div class="metric-card">
            <span class="metric-label">Doctrine</span>
            <strong>{journey.doctrineId}</strong>
          </div>
          <div class="metric-card">
            <span class="metric-label">Memory pool</span>
            <strong>{totalMemory}</strong>
          </div>
          <div class="metric-card">
            <span class="metric-label">Learning level</span>
            <strong>{averageLearningLevel}</strong>
          </div>
        </div>

        <p class="card-copy">
          Keep the contract tight: one doctrine, one growth focus, one readiness target.
        </p>
      </article>

      <article class="surface-card">
        <div class="card-head">
          <div>
            <p class="card-kicker">Readiness gates</p>
            <h2>Three checks before Arena</h2>
          </div>
          <span class="card-badge">{readinessPct}%</span>
        </div>

        <div class="gate-list">
          {#each readinessRows as row}
            <div class="gate-row">
              <span class="gate-dot" class:gate-dot-done={row.done}></span>
              <div>
                <strong>{row.label}</strong>
                <p>{row.detail}</p>
              </div>
            </div>
          {/each}
        </div>

        <div class="inline-actions">
          <button class="secondary-btn" type="button" onclick={() => goto(buildTerminalLink())}>Open Terminal</button>
          <button class="ghost-btn" type="button" onclick={() => goto(buildWorldLink())}>Open World</button>
        </div>
      </article>

      <article class="surface-card drill-card">
        <div class="card-head">
          <div>
            <p class="card-kicker">Growth focus</p>
            <h2>{growthFocus?.title ?? 'Sharpen direction calls'}</h2>
          </div>
          <span class="card-badge">{growthFocus?.label ?? 'Signal Hunter'}</span>
        </div>

        <div class="drill-list">
          {#each growthDrills as drill}
            <div class="drill-row">
              <strong>{drill.title}</strong>
              <p>{drill.detail}</p>
            </div>
          {/each}
        </div>
      </article>

      <article class="surface-card">
        <div class="card-head">
          <div>
            <p class="card-kicker">Next loop</p>
            <h2>Run, review, prove</h2>
          </div>
          <span class="card-badge">Mission</span>
        </div>

        <div class="queue-list">
          <button class="queue-item" type="button" onclick={() => goto(buildTerminalLink())}>
            <span>Retune in Terminal</span>
            <small>Clean up the brief before the next run.</small>
          </button>
          <button class="queue-item" type="button" onclick={() => goto(buildWorldLink())}>
            <span>Stage one more route</span>
            <small>Use World as a softer setup before Arena.</small>
          </button>
          <button class="queue-item" type="button" onclick={() => goto(buildArenaLink())}>
            <span>Move to proof</span>
            <small>When readiness is green, stop tuning and get a real result.</small>
          </button>
        </div>
      </article>
    </section>
  {:else}
    <section class="content-grid">
      <article class="surface-card">
        <div class="card-head">
          <div>
            <p class="card-kicker">Proof ledger</p>
            <h2>What the public story would show</h2>
          </div>
          <span class="card-badge">{proofState}</span>
        </div>

        <div class="metric-row">
          <div class="metric-card">
            <span class="metric-label">Proof runs</span>
            <strong>{totalProofMatches}</strong>
          </div>
          <div class="metric-card">
            <span class="metric-label">Win rate</span>
            <strong>{wr}%</strong>
          </div>
          <div class="metric-card">
            <span class="metric-label">Best streak</span>
            <strong>{streak}</strong>
          </div>
          <div class="metric-card">
            <span class="metric-label">PnL</span>
            <strong>{formatPercent(quickPnL)}</strong>
          </div>
        </div>

        <p class="card-copy">
          Steam players should understand the loop before rental ever appears. Record tab exists to make the eventual
          proof, sharing, and monetization feel earned rather than bolted on.
        </p>
      </article>

      <article class="surface-card">
        <div class="card-head">
          <div>
            <p class="card-kicker">Recent proof</p>
            <h2>Latest Arena outcomes</h2>
          </div>
          <span class="card-badge">{recentMatches.length} shown</span>
        </div>

        <div class="history-list">
          {#if recentMatches.length > 0}
            {#each recentMatches as record}
              <div class="history-row">
                <div>
                  <strong>Match #{record.matchN}</strong>
                  <p>{record.win ? 'Win logged' : 'Loss logged'} · {record.hypothesis?.dir ?? 'No call'} · {record.signals?.slice(0, 2).join(' · ') || 'No signal tags'}</p>
                </div>
                <span class="history-badge" class:history-badge-win={record.win} class:history-badge-loss={!record.win}>
                  {record.lp >= 0 ? '+' : ''}{record.lp} LP
                </span>
              </div>
            {/each}
          {:else}
            <div class="empty-card">
              <strong>No proof yet</strong>
              <p>Run one Arena session first so Record has something real to hold onto.</p>
            </div>
          {/if}
        </div>
      </article>

      <article class="surface-card">
        <div class="card-head">
          <div>
            <p class="card-kicker">Release readiness</p>
            <h2>Share and rental prerequisites</h2>
          </div>
          <span class="card-badge">{wallet.connected ? 'wallet ready' : 'wallet optional'}</span>
        </div>

        <div class="gate-list">
          {#each releaseRows as row}
            <div class="gate-row">
              <span class="gate-dot" class:gate-dot-done={row.done}></span>
              <div>
                <strong>{row.label}</strong>
                <p>{row.detail}</p>
              </div>
            </div>
          {/each}
        </div>

        <div class="inline-actions">
          <button class="secondary-btn" type="button" onclick={() => goto(buildMarketLink())}>Open Market</button>
          {#if wallet.connected}
            <button class="ghost-btn" type="button" onclick={() => goto(buildAgentLink({ tab: 'overview' }))}>Back to overview</button>
          {:else}
            <button class="ghost-btn" type="button" onclick={openWalletModal}>Connect wallet later</button>
          {/if}
        </div>
      </article>
    </section>
  {/if}
</main>

<style>
  .agent-hq-page {
    min-height: 100%;
    padding: var(--sc-sp-5) var(--sc-sp-4) var(--sc-sp-7);
    display: grid;
    gap: 12px;
    overflow: auto;
    background:
      radial-gradient(circle at top left, rgba(173, 202, 124, 0.1), transparent 24%),
      radial-gradient(circle at bottom right, rgba(242, 209, 147, 0.08), transparent 22%),
      linear-gradient(180deg, rgba(7, 11, 20, 0.98), rgba(8, 12, 22, 0.98));
  }

  .hq-hero,
  .surface-card,
  .tab-btn {
    border-radius: 24px;
    border: 1px solid rgba(173, 202, 124, 0.16);
    background: linear-gradient(180deg, rgba(13, 21, 34, 0.94), rgba(9, 15, 25, 0.95));
    box-shadow: 0 20px 54px rgba(0, 0, 0, 0.2);
  }

  .hq-hero {
    padding: clamp(14px, 1.9vw, 18px);
    display: grid;
    grid-template-columns: minmax(0, 1.38fr) minmax(250px, 0.6fr);
    gap: 12px;
    align-items: stretch;
  }

  .hq-hero-compact {
    grid-template-columns: minmax(0, 1.5fr) minmax(220px, 0.52fr);
    padding: 12px 14px;
    gap: 10px;
  }

  .hq-hero-train {
    grid-template-columns: minmax(0, 1.8fr) minmax(210px, 0.42fr);
    padding: 10px 12px;
    gap: 8px;
  }

  .hero-copy,
  .hero-spotlight,
  .surface-card,
  .spotlight-head,
  .spotlight-grid,
  .card-head,
  .metric-row,
  .status-strip,
  .hero-actions,
  .tab-strip,
  .content-grid,
  .crew-grid,
  .gate-list,
  .inline-actions,
  .queue-list,
  .history-list,
  .drill-list {
    display: grid;
    gap: 12px;
  }

  .hero-kicker,
  .card-kicker,
  .spotlight-kicker,
  .metric-label,
  .spotlight-label {
    margin: 0;
    font-family: var(--sc-font-mono);
    font-size: var(--sc-fs-sm);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--sc-accent-2);
  }

  h1,
  h2,
  .tab-btn strong,
  .queue-item span {
    margin: 0;
    color: var(--sc-text-0);
    font-family: var(--sc-font-display);
    letter-spacing: 0.04em;
  }

  h1 {
    font-size: clamp(1.45rem, 2.15vw, 2.1rem);
    line-height: 0.96;
    max-width: 14ch;
  }

  .hq-hero-compact h1 {
    font-size: clamp(1.2rem, 1.7vw, 1.48rem);
    max-width: 16ch;
  }

  .hq-hero-train h1 {
    font-size: clamp(1rem, 1.45vw, 1.22rem);
    max-width: none;
  }

  h2 {
    font-size: clamp(1.2rem, 2vw, 1.7rem);
    line-height: 1;
  }

  .hero-subtitle,
  .card-copy,
  .gate-row p,
  .drill-row p,
  .history-row p,
  .queue-item small,
  .spotlight-note {
    margin: 0;
    color: var(--sc-text-1);
    line-height: 1.5;
  }

  .hero-subtitle {
    max-width: 60ch;
    font-size: 0.94rem;
  }

  .hq-hero-compact .hero-subtitle {
    font-size: 0.88rem;
    max-width: 50ch;
  }

  .hq-hero-train .hero-subtitle {
    font-size: 0.84rem;
    max-width: 54ch;
  }

  .hq-hero-train .hero-copy {
    gap: 10px;
    align-content: start;
  }

  .hq-hero-train .status-strip {
    grid-auto-flow: column;
    grid-auto-columns: max-content;
    gap: 6px;
  }

  .hq-hero-train .status-chip {
    min-height: 26px;
    padding: 0 9px;
    font-size: 0.76rem;
  }

  .hq-hero-train .hero-actions {
    gap: 8px;
  }

  .hq-hero-train .primary-btn,
  .hq-hero-train .secondary-btn,
  .hq-hero-train .ghost-btn {
    min-height: 36px;
    padding: 0 13px;
    border-radius: 12px;
  }

  .status-strip {
    grid-template-columns: repeat(3, minmax(0, max-content));
    gap: 6px;
  }

  .status-chip,
  .card-badge,
  .history-badge,
  .spotlight-note {
    min-height: 28px;
    padding: 0 10px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(173, 202, 124, 0.14);
    background: rgba(10, 16, 26, 0.78);
    color: var(--sc-text-1);
    font-family: var(--sc-font-mono);
    font-size: 0.74rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .hero-actions,
  .inline-actions {
    grid-template-columns: repeat(3, minmax(0, max-content));
    align-items: center;
    gap: 8px;
  }

  .primary-btn,
  .secondary-btn,
  .ghost-btn {
    min-height: 36px;
    padding: 0 14px;
    border-radius: 12px;
    cursor: pointer;
    font-family: var(--sc-font-body);
    font-weight: 700;
  }

  .primary-btn {
    border: 1px solid rgba(173, 202, 124, 0.34);
    background: linear-gradient(135deg, #adca7c, #f2d193 42%, #f7f2ea 100%);
    color: #09111b;
  }

  .secondary-btn {
    border: 1px solid rgba(173, 202, 124, 0.18);
    background: rgba(10, 16, 26, 0.88);
    color: var(--sc-text-0);
  }

  .ghost-btn {
    border: none;
    background: transparent;
    color: var(--sc-text-2);
  }

  .hero-spotlight {
    padding: 10px 12px;
    display: grid;
    align-content: start;
    gap: 8px;
  }

  .spotlight-stage {
    min-height: 110px;
    border-radius: 14px;
    border: 1px solid rgba(173, 202, 124, 0.12);
    background: radial-gradient(circle at top, rgba(173, 202, 124, 0.12), transparent 60%), rgba(8, 14, 24, 0.9);
    display: grid;
    place-items: center;
    overflow: hidden;
  }

  .hq-hero-compact .spotlight-stage {
    min-height: 96px;
  }

  .hq-hero-train .spotlight-stage {
    min-height: 76px;
    width: 76px;
    padding: 6px;
    grid-row: 1 / span 2;
  }

  .spotlight-image {
    width: min(100%, 140px);
    max-height: 96px;
    object-fit: contain;
    image-rendering: pixelated;
  }

  .hq-hero-train .spotlight-image {
    width: min(100%, 58px);
    max-height: 58px;
  }

  .hq-hero-train .hero-spotlight {
    grid-template-columns: 76px minmax(0, 1fr);
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
  }

  .hq-hero-train .spotlight-head {
    gap: 4px;
    align-content: center;
  }

  .hq-hero-train .spotlight-grid {
    grid-column: 2;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .hq-hero-train .spotlight-stat {
    padding: 8px 10px;
    gap: 4px;
  }

  .spotlight-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .spotlight-stat,
  .metric-card {
    padding: 10px;
    border-radius: 14px;
    border: 1px solid rgba(173, 202, 124, 0.12);
    background: rgba(9, 16, 26, 0.82);
    display: grid;
    gap: 6px;
  }

  .spotlight-stat strong,
  .metric-card strong,
  .gate-row strong,
  .drill-row strong,
  .history-row strong {
    color: var(--sc-text-0);
  }

  .tab-strip {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
  }

  .tab-btn {
    padding: 8px 11px;
    border-radius: 999px;
    text-align: left;
    cursor: pointer;
  }

  .tab-btn span {
    color: var(--sc-text-2);
    font-size: 0.82rem;
    line-height: 1.4;
  }

  .tab-btn-active {
    border-color: rgba(173, 202, 124, 0.3);
    background:
      linear-gradient(135deg, rgba(173, 202, 124, 0.16), transparent 50%),
      linear-gradient(180deg, rgba(13, 21, 34, 0.98), rgba(9, 15, 25, 0.95));
  }

  .content-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .surface-card {
    padding: 16px;
    align-content: start;
  }

  .workbench-card {
    grid-column: 1 / -1;
    padding: 0;
    overflow: hidden;
    background: transparent;
    border: none;
    box-shadow: none;
  }

  .card-head {
    grid-template-columns: minmax(0, 1fr) max-content;
    align-items: start;
  }

  .metric-row {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }

  .card-copy-tight {
    margin-top: -2px;
  }

  .crew-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }

  .crew-tile {
    padding: 10px;
    border-radius: 14px;
    border: 1px solid rgba(173, 202, 124, 0.12);
    background: rgba(8, 14, 24, 0.9);
    display: grid;
    gap: 8px;
  }

  .crew-tile img {
    width: 100%;
    height: 86px;
    object-fit: contain;
    image-rendering: pixelated;
  }

  .crew-tile strong {
    color: var(--sc-text-0);
  }

  .crew-tile span {
    color: var(--sc-text-2);
    line-height: 1.45;
  }

  .crew-tile-lead {
    border-color: rgba(173, 202, 124, 0.28);
    background:
      linear-gradient(135deg, rgba(173, 202, 124, 0.14), transparent 60%),
      rgba(8, 14, 24, 0.94);
  }

  .gate-row,
  .history-row,
  .drill-row {
    display: grid;
    grid-template-columns: max-content minmax(0, 1fr);
    gap: 12px;
    padding: 12px 0;
    border-top: 1px solid rgba(173, 202, 124, 0.08);
  }

  .gate-row:first-child,
  .history-row:first-child,
  .drill-row:first-child {
    border-top: none;
    padding-top: 0;
  }

  .gate-dot {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    margin-top: 8px;
    background: rgba(173, 202, 124, 0.16);
    box-shadow: 0 0 0 1px rgba(173, 202, 124, 0.14);
  }

  .gate-dot-done {
    background: #adca7c;
    box-shadow: 0 0 14px rgba(173, 202, 124, 0.4);
  }

  .queue-item {
    width: 100%;
    padding: 12px 14px;
    border-radius: 14px;
    border: 1px solid rgba(173, 202, 124, 0.12);
    background: rgba(8, 14, 24, 0.9);
    display: grid;
    gap: 6px;
    text-align: left;
    cursor: pointer;
  }

  .history-row {
    grid-template-columns: minmax(0, 1fr) max-content;
    align-items: start;
  }

  .history-badge-win {
    color: #b7ffce;
    border-color: rgba(115, 214, 148, 0.24);
  }

  .history-badge-loss {
    color: #ffb29a;
    border-color: rgba(255, 122, 89, 0.24);
  }

  .empty-card {
    padding: 16px;
    border-radius: 14px;
    border: 1px dashed rgba(173, 202, 124, 0.18);
    background: rgba(8, 14, 24, 0.72);
    display: grid;
    gap: 6px;
  }

  .empty-card strong {
    color: var(--sc-text-0);
  }

  @media (max-width: 1080px) {
    .hq-hero,
    .hq-hero-compact,
    .hq-hero-train,
    .content-grid,
    .metric-row,
    .crew-grid,
    .spotlight-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 820px) {
    .status-strip,
    .hero-actions,
    .tab-strip,
    .inline-actions {
      grid-template-columns: 1fr;
    }

    .ghost-btn {
      justify-self: start;
      padding-inline: 0;
      min-height: auto;
    }
  }
</style>
