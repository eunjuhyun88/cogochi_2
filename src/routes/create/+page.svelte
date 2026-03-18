<script lang="ts">
  import { goto } from '$app/navigation';
  import MissionFlowShell from '../../components/mission/MissionFlowShell.svelte';
  import { isWalletConnected, walletStore } from '$lib/stores/walletStore';
  import { openWalletModal } from '$lib/stores/walletModalStore';
  import {
    AGENT_GROWTH_FOCUS_OPTIONS,
    agentJourneyStore,
    hasMintedAgent,
    JOURNEY_SHELL_OPTIONS,
    readinessProgress,
    starterRoster,
    type AgentDoctrineId,
    type AgentGrowthFocusId,
    type AgentModelSource,
    type AgentShellId,
  } from '$lib/stores/agentJourneyStore';
  import { buildAgentLink, buildTerminalLink } from '$lib/utils/deepLinks';

  const connected = $derived($isWalletConnected);
  const wallet = $derived($walletStore);
  const journey = $derived($agentJourneyStore);
  const pinnedCrew = $derived($starterRoster);
  const alreadyActivated = $derived($hasMintedAgent);
  const readinessCount = $derived($readinessProgress);

  const modelOptions: Array<{ id: AgentModelSource; label: string; detail: string }> = [
    { id: 'openai', label: 'OpenAI Starter', detail: 'Fastest default brain for the first mission loop.' },
    { id: 'hootVerified', label: 'HOOT Verified', detail: 'Governed external brain path for later proof-heavy play.' },
    { id: 'custom', label: 'Custom Source', detail: 'Bring your own model endpoint and tune it deeper in Terminal.' },
  ];

  const doctrineOptions: Array<{ id: AgentDoctrineId; label: string; detail: string }> = [
    { id: 'balanced', label: 'Balanced', detail: 'A safe first doctrine for learning the loop without overcommitting.' },
    { id: 'aggressive', label: 'Aggressive', detail: 'Pushes earlier, commits faster, and rewards sharper reads.' },
    { id: 'defensive', label: 'Defensive', detail: 'Waits longer, protects the run, and keeps the squad alive.' },
  ];

  const focusPlaybook: Record<AgentGrowthFocusId, string> = {
    signalHunter: 'Terminal drills bias toward faster direction calls and clearer conviction in Arena.',
    riskKeeper: 'Training emphasizes survival, better exits, and fewer bad deaths during rough encounters.',
    memoryGardener: 'The companion spends more time on recall quality, reflection, and pattern reuse over time.',
  };

  const stepTitles = ['Crew', 'Identity', 'Growth', 'Brain'];

  let currentStep = $state(0);
  let shellId = $state<AgentShellId>('duckeeGreen');
  let agentName = $state('New Agent');
  let growthFocus = $state<AgentGrowthFocusId>('signalHunter');
  let modelSource = $state<AgentModelSource>('openai');
  let doctrineId = $state<AgentDoctrineId>('balanced');
  let submitError = $state('');
  let hydratedDraft = $state(false);

  $effect(() => {
    if (hydratedDraft || alreadyActivated) return;
    shellId = journey.shellId;
    agentName = journey.agentName;
    growthFocus = journey.growthFocus;
    modelSource = journey.modelSource;
    doctrineId = journey.doctrineId;
    hydratedDraft = true;
  });

  $effect(() => {
    agentJourneyStore.setDraft({ shellId, agentName, growthFocus, modelSource, doctrineId });
  });

  const selectedShellMeta = $derived(
    pinnedCrew.find((option) => option.id === shellId) ??
      JOURNEY_SHELL_OPTIONS.find((option) => option.id === shellId) ??
      pinnedCrew[0] ??
      JOURNEY_SHELL_OPTIONS[0]
  );

  const selectedGrowthFocus = $derived(
    AGENT_GROWTH_FOCUS_OPTIONS.find((option) => option.id === growthFocus) ?? AGENT_GROWTH_FOCUS_OPTIONS[0]
  );

  const canAdvance = $derived(
    currentStep === 0
      ? Boolean(shellId)
      : currentStep === 1
        ? agentName.trim().length >= 2
        : currentStep === 2
          ? Boolean(growthFocus)
          : Boolean(modelSource && doctrineId)
  );

  function goNext() {
    if (!canAdvance || currentStep >= stepTitles.length - 1) return;
    currentStep += 1;
  }

  function goBack() {
    if (currentStep === 0) return;
    currentStep -= 1;
  }

  function activateAgent() {
    submitError = '';
    if (agentName.trim().length < 2) {
      submitError = 'Agent name needs at least 2 characters.';
      currentStep = 1;
      return;
    }

    agentJourneyStore.activateAgent({
      starterRosterIds: journey.starterRosterIds,
      shellId,
      agentName,
      growthFocus,
      modelSource,
      doctrineId,
    });
  }

  function restartFlow() {
    agentJourneyStore.reset();
    shellId = 'duckeeGreen';
    agentName = 'New Agent';
    growthFocus = 'signalHunter';
    modelSource = 'openai';
    doctrineId = 'balanced';
    submitError = '';
    currentStep = 0;
    hydratedDraft = true;
  }
</script>

<svelte:head>
  <title>Create Agent — Cogochi</title>
</svelte:head>

<main class="create-page">
  <MissionFlowShell
    step="create"
    title="Choose the lead. Lock the first build."
    summary="Pick the lead, set the first growth bias, then move straight into Terminal."
    metrics={[
      { label: 'Pinned Crew', value: `${pinnedCrew.length}/3` },
      { label: 'Lead', value: selectedShellMeta.label },
      { label: 'Growth', value: selectedGrowthFocus.label },
    ]}
  />

  {#if alreadyActivated}
    <section class="completion-grid">
      <article class="summary-card">
        <p class="eyebrow">Activation Complete</p>
        <h2>{journey.agentName}</h2>
        <p class="summary-text">
          {journey.shellLabel} is now the live lead. Terminal is unlocked for the first training run,
          Arena opens after readiness, and wallet proof can be attached later when you want rental
          access.
        </p>

        <div class="summary-grid">
          <div class="metric-card">
            <span>Starter Crew</span>
            <strong>{journey.starterRosterIds.length}/3 pinned</strong>
          </div>
          <div class="metric-card">
            <span>Growth Path</span>
            <strong>{selectedGrowthFocus.label}</strong>
          </div>
          <div class="metric-card">
            <span>Profile</span>
            <strong>{connected ? (wallet.shortAddr ?? 'Connected') : 'Offline starter'}</strong>
          </div>
        </div>

        <div class="action-row">
          <button
            class="primary-btn"
            type="button"
            onclick={() => goto(buildTerminalLink({ entry: 'create', agent: journey.agentName }))}
          >
            Enter Terminal
          </button>
          <button class="secondary-btn" type="button" onclick={() => goto(buildAgentLink({ source: 'create' }))}>
            Open Agent HQ
          </button>
          <button class="ghost-btn" type="button" onclick={restartFlow}>
            Start Over
          </button>
        </div>
      </article>

      <article class="preview-card">
        <p class="preview-kicker">Lead card</p>
        <div class="preview-stage">
          <img src={selectedShellMeta.sheet} alt={selectedShellMeta.title} />
        </div>
        <div class="preview-copy">
          <strong>{journey.agentName}</strong>
          <span>{selectedShellMeta.title}</span>
          <p>{focusPlaybook[journey.growthFocus]}</p>
        </div>
        <div class="preview-meta-grid">
          <div class="preview-meta-card">
            <span>Shell</span>
            <strong>{selectedShellMeta.label}</strong>
          </div>
          <div class="preview-meta-card">
            <span>Growth</span>
            <strong>{selectedGrowthFocus.label}</strong>
          </div>
        </div>
        <div class="preview-pill-row">
          {#each pinnedCrew as crew}
            <span class="preview-pill">{crew.label}</span>
          {/each}
        </div>
      </article>
    </section>
  {:else}
    <section class="wizard-grid">
      <article class="builder-card">
        <div class="step-strip" aria-label="Create flow steps">
          {#each stepTitles as label, index}
            <button
              class="step-chip"
              class:active={index === currentStep}
              class:done={index < currentStep}
              type="button"
              onclick={() => (currentStep = index)}
            >
              <span>0{index + 1}</span>
              <strong>{label}</strong>
            </button>
          {/each}
        </div>

        {#if currentStep === 0}
          <div class="roster-head">
            <div class="section-head">
              <p class="eyebrow">Step 1</p>
              <h2>Choose the lead from your starter crew</h2>
              <p>The other pinned companions stay on the bench for later growth. Only one becomes the first playable lead.</p>
            </div>
            <button class="ghost-inline" type="button" onclick={() => goto('/')}>
              Edit roster on Home
            </button>
          </div>

          <div class="crew-banner">
            <span>Pinned crew</span>
            <div class="crew-list">
              {#each pinnedCrew as crew}
                <span class="crew-chip">{crew.label}</span>
              {/each}
            </div>
          </div>

          <div class="shell-grid">
            {#each pinnedCrew as option}
              <button
                class="shell-card"
                class:selected={option.id === shellId}
                type="button"
                onclick={() => (shellId = option.id)}
              >
                <img src={option.sheet} alt={option.label} />
                <div class="shell-copy">
                  <span>{option.id === shellId ? 'Lead companion' : 'Bench companion'}</span>
                  <strong>{option.label}</strong>
                  <em>{option.title}</em>
                  <p>{option.detail}</p>
                </div>
              </button>
            {/each}
          </div>
        {:else if currentStep === 1}
          <div class="section-head">
            <p class="eyebrow">Step 2</p>
            <h2>Name the lead companion</h2>
            <p>Give the first public identity the player will see in Terminal, Arena, and the future rental card.</p>
          </div>

          <div class="identity-layout">
            <label class="field-card">
              <span>Agent Name</span>
              <input bind:value={agentName} maxlength="24" placeholder="New Agent" />
              <small>{agentName.trim().length || 0}/24 characters</small>
            </label>

            <div class="identity-card">
              <span>Lead shell</span>
              <strong>{selectedShellMeta.label}</strong>
              <p>{selectedShellMeta.title}</p>
              <div class="crew-list">
                {#each pinnedCrew as crew}
                  <span class="crew-chip" class:active={crew.id === shellId}>{crew.label}</span>
                {/each}
              </div>
            </div>
          </div>
        {:else if currentStep === 2}
          <div class="section-head">
            <p class="eyebrow">Step 3</p>
            <h2>Choose how this companion should grow</h2>
            <p>This sets the first emphasis for training, battle feel, and the kind of proof you will build later.</p>
          </div>

          <div class="option-grid">
            {#each AGENT_GROWTH_FOCUS_OPTIONS as option}
              <button
                class="option-card"
                class:selected={option.id === growthFocus}
                type="button"
                onclick={() => (growthFocus = option.id)}
              >
                <span>{option.title}</span>
                <strong>{option.label}</strong>
                <p>{option.detail}</p>
              </button>
            {/each}
          </div>

          <div class="activation-card">
            <div>
              <span>Training consequence</span>
              <strong>{selectedGrowthFocus.title}</strong>
              <p>{focusPlaybook[growthFocus]}</p>
            </div>
          </div>
        {:else}
          <div class="section-head">
            <p class="eyebrow">Step 4</p>
            <h2>Bind the starter brain and doctrine</h2>
            <p>Keep wallet optional for now. The first fun loop should happen before proof, market, or rental layers.</p>
          </div>

          <div class="wallet-card">
            <div>
              <strong>{connected ? 'Wallet attached' : 'Wallet optional for now'}</strong>
              <p>
                {connected
                  ? wallet.shortAddr ?? 'Connected profile'
                  : 'Attach a wallet later when you want onchain proof, rental setup, or account portability.'}
              </p>
            </div>
            <button class="secondary-btn" type="button" onclick={openWalletModal}>
              {connected ? 'Change Wallet' : 'Attach Wallet'}
            </button>
          </div>

          <div class="option-section">
            <div class="option-section-head">
              <span>Starter brain</span>
              <strong>Choose the first inference path</strong>
            </div>
            <div class="option-grid">
              {#each modelOptions as option}
                <button
                  class="option-card"
                  class:selected={option.id === modelSource}
                  type="button"
                  onclick={() => (modelSource = option.id)}
                >
                  <strong>{option.label}</strong>
                  <p>{option.detail}</p>
                </button>
              {/each}
            </div>
          </div>

          <div class="option-section">
            <div class="option-section-head">
              <span>Mission temperament</span>
              <strong>Set the default attitude for early runs</strong>
            </div>
            <div class="option-grid">
              {#each doctrineOptions as option}
                <button
                  class="option-card"
                  class:selected={option.id === doctrineId}
                  type="button"
                  onclick={() => (doctrineId = option.id)}
                >
                  <strong>{option.label}</strong>
                  <p>{option.detail}</p>
                </button>
              {/each}
            </div>
          </div>

          <div class="activation-card">
            <div>
              <span>Activation result</span>
              <strong>Lead ready · Terminal unlocked · proof layer can wait</strong>
              <p>The first mission should start immediately after this. Market and rental systems stay behind the core loop.</p>
            </div>
          </div>
        {/if}

        {#if submitError}
          <p class="error-text">{submitError}</p>
        {/if}

        <div class="action-row">
          <button class="ghost-btn" type="button" onclick={goBack} disabled={currentStep === 0}>
            Back
          </button>
          {#if currentStep < stepTitles.length - 1}
            <button class="primary-btn" type="button" onclick={goNext} disabled={!canAdvance}>
              Next
            </button>
          {:else}
            <button class="primary-btn" type="button" onclick={activateAgent}>
              Activate Agent
            </button>
          {/if}
        </div>
      </article>

      <article class="preview-card">
        <p class="preview-kicker">Lead card</p>
        <div class="preview-stage">
          <img src={selectedShellMeta.sheet} alt={selectedShellMeta.label} />
        </div>
        <div class="preview-copy">
          <strong>{agentName.trim() || 'New Agent'}</strong>
          <span>{selectedShellMeta.title}</span>
          <p>{focusPlaybook[growthFocus]}</p>
        </div>
        <div class="preview-meta-grid">
          <div class="preview-meta-card">
            <span>Shell</span>
            <strong>{selectedShellMeta.label}</strong>
          </div>
          <div class="preview-meta-card">
            <span>Growth</span>
            <strong>{selectedGrowthFocus.label}</strong>
          </div>
        </div>
        <div class="preview-pill-row">
          {#each pinnedCrew as crew}
            <span class="preview-pill" class:active={crew.id === shellId}>
              {crew.label}
            </span>
          {/each}
        </div>
      </article>
    </section>
  {/if}
</main>

<style>
  .create-page {
    min-height: 100%;
    padding: var(--sc-sp-6) var(--sc-sp-4) calc(var(--sc-sp-8) + var(--sc-bottom-bar-h));
    display: grid;
    gap: var(--sc-sp-3);
    background:
      radial-gradient(circle at top right, rgba(173, 202, 124, 0.12), transparent 28%),
      radial-gradient(circle at bottom left, rgba(242, 209, 147, 0.06), transparent 22%),
      linear-gradient(180deg, rgba(8, 14, 13, 0.96), rgba(8, 12, 12, 0.99));
  }

  .builder-card,
  .preview-card,
  .summary-card {
    border-radius: 24px;
    border: 1px solid rgba(173, 202, 124, 0.14);
    background: linear-gradient(180deg, rgba(13, 20, 18, 0.94), rgba(10, 16, 15, 0.97));
    box-shadow: 0 20px 56px rgba(0, 0, 0, 0.24);
  }

  .summary-card,
  .builder-card {
    padding: clamp(22px, 3vw, 30px);
  }

  .wizard-grid,
  .completion-grid,
  .step-strip,
  .summary-grid,
  .shell-grid,
  .option-grid,
  .action-row,
  .preview-pill-row {
    display: grid;
    gap: 12px;
  }

  .wizard-grid {
    grid-template-columns: minmax(0, 1fr) minmax(300px, 360px);
    align-items: start;
  }

  .completion-grid {
    grid-template-columns: minmax(0, 0.9fr) minmax(300px, 0.5fr);
    align-items: stretch;
  }

  .section-head,
  .preview-copy,
  .identity-layout,
  .option-section,
  .activation-card,
  .roster-head {
    display: grid;
    gap: 12px;
  }

  .roster-head {
    grid-template-columns: minmax(0, 1fr) max-content;
    align-items: start;
  }

  .eyebrow,
  .step-chip span,
  .metric-card span,
  .activation-card span,
  .crew-banner span,
  .option-section-head span {
    margin: 0;
    font-family: var(--sc-font-mono);
    font-size: var(--sc-fs-sm);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--sc-accent-2);
  }

  h2 {
    margin: 0;
    color: var(--sc-text-0);
    font-family: var(--sc-font-display);
    font-size: clamp(1.45rem, 2vw, 2rem);
    letter-spacing: 0.03em;
  }

  .section-head p,
  .summary-text,
  .preview-copy p,
  .option-card p,
  .shell-copy p,
  .wallet-card p,
  .activation-card p,
  .identity-card p {
    margin: 0;
    color: var(--sc-text-1);
    font-size: var(--sc-fs-base);
    line-height: 1.5;
  }

  .step-strip {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .step-chip {
    min-height: 66px;
    padding: 14px 16px;
    border-radius: 18px;
    border: 1px solid rgba(173, 202, 124, 0.1);
    background: rgba(8, 16, 14, 0.56);
    color: var(--sc-text-1);
    display: grid;
    gap: 6px;
    text-align: left;
    cursor: pointer;
  }

  .step-chip strong {
    color: var(--sc-text-0);
    font-size: var(--sc-fs-base);
  }

  .step-chip.active {
    border-color: rgba(173, 202, 124, 0.28);
    background: rgba(173, 202, 124, 0.09);
  }

  .step-chip.done span {
    color: #edf4df;
  }

  .builder-card {
    display: grid;
    gap: 18px;
  }

  .shell-grid,
  .summary-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .option-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .shell-card,
  .option-card,
  .wallet-card,
  .field-card,
  .activation-card,
  .metric-card,
  .identity-card,
  .crew-banner {
    border-radius: 20px;
    border: 1px solid rgba(173, 202, 124, 0.12);
    background: rgba(8, 16, 14, 0.72);
  }

  .shell-card,
  .option-card {
    padding: 16px;
    display: grid;
    gap: 12px;
    text-align: left;
    cursor: pointer;
    color: inherit;
  }

  .shell-card {
    grid-template-columns: 84px minmax(0, 1fr);
    align-items: center;
    min-height: 152px;
  }

  .shell-card img {
    width: 84px;
    aspect-ratio: 1;
    object-fit: contain;
    image-rendering: pixelated;
    justify-self: center;
  }

  .preview-kicker {
    margin: 0;
    font-family: var(--sc-font-mono);
    font-size: var(--sc-fs-sm);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--sc-text-3);
  }

  .preview-stage {
    min-height: 220px;
    border-radius: 18px;
    border: 1px solid rgba(173, 202, 124, 0.12);
    background:
      radial-gradient(circle at 50% 20%, rgba(173, 202, 124, 0.12), transparent 42%),
      linear-gradient(180deg, rgba(8, 16, 14, 0.92), rgba(6, 12, 12, 0.96));
    display: grid;
    place-items: center;
    padding: 18px;
  }

  .preview-stage img {
    width: min(100%, 180px);
    aspect-ratio: 1;
    object-fit: contain;
    image-rendering: pixelated;
    filter: drop-shadow(0 16px 28px rgba(0, 0, 0, 0.35));
  }

  .shell-copy,
  .wallet-card,
  .field-card,
  .activation-card,
  .identity-card {
    display: grid;
    gap: 8px;
  }

  .shell-copy strong,
  .option-card strong,
  .metric-card strong,
  .wallet-card strong,
  .activation-card strong,
  .preview-copy strong,
  .identity-card strong,
  .option-section-head strong {
    color: var(--sc-text-0);
  }

  .shell-copy span,
  .preview-copy span,
  .shell-copy em {
    color: var(--sc-accent-2);
    font-family: var(--sc-font-mono);
    font-size: var(--sc-fs-sm);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-style: normal;
  }

  .shell-copy p {
    font-size: var(--sc-fs-base);
  }

  .shell-card.selected,
  .option-card.selected,
  .preview-pill.active,
  .crew-chip.active {
    border-color: rgba(173, 202, 124, 0.26);
    background: rgba(173, 202, 124, 0.08);
  }

  .wallet-card,
  .field-card,
  .activation-card,
  .metric-card,
  .identity-card,
  .crew-banner {
    padding: 18px;
  }

  .wallet-card {
    grid-template-columns: minmax(0, 1fr) max-content;
    align-items: center;
  }

  .crew-banner,
  .identity-card {
    gap: 12px;
  }

  .crew-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .crew-chip,
  .preview-pill {
    min-height: 32px;
    padding: 0 12px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    border: 1px solid rgba(173, 202, 124, 0.14);
    background: rgba(5, 11, 10, 0.72);
    color: #edf4df;
    font-family: var(--sc-font-mono);
    font-size: var(--sc-fs-xs);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .field-card span {
    color: var(--sc-text-0);
    font-weight: 700;
    font-size: var(--sc-fs-base);
  }

  .field-card input {
    min-height: 48px;
    padding: 0 14px;
    border-radius: 14px;
    border: 1px solid rgba(173, 202, 124, 0.16);
    background: rgba(5, 11, 10, 0.92);
    color: var(--sc-text-0);
    font-size: 1rem;
  }

  .field-card small {
    color: var(--sc-text-2);
    font-size: var(--sc-fs-xs);
  }

  .identity-layout {
    grid-template-columns: minmax(0, 1fr) minmax(240px, 0.72fr);
    align-items: start;
  }

  .option-section-head {
    display: grid;
    gap: 4px;
  }

  .ghost-inline {
    min-height: 42px;
    padding: 0 14px;
    border-radius: 14px;
    border: 1px solid rgba(173, 202, 124, 0.12);
    background: rgba(8, 16, 14, 0.42);
    color: var(--sc-text-2);
    cursor: pointer;
    font-family: var(--sc-font-body);
    font-size: var(--sc-fs-base);
    font-weight: 600;
  }

  .preview-card {
    padding: 20px;
    display: grid;
    align-content: start;
    gap: 16px;
    position: sticky;
    top: 16px;
  }

  .preview-meta-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .preview-meta-card {
    display: grid;
    gap: 6px;
    padding: 12px;
    border-radius: 16px;
    border: 1px solid rgba(173, 202, 124, 0.12);
    background: rgba(8, 16, 14, 0.72);
  }

  .preview-meta-card span {
    font-family: var(--sc-font-mono);
    font-size: var(--sc-fs-xs);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--sc-text-3);
  }

  .preview-meta-card strong {
    margin: 0;
    font-family: var(--sc-font-display);
    font-size: var(--sc-fs-base);
    color: var(--sc-text-0);
    letter-spacing: 0.03em;
  }

  .preview-pill-row {
    grid-template-columns: 1fr;
  }

  .summary-grid {
    margin-top: 8px;
  }

  .metric-card {
    display: grid;
    gap: 8px;
  }

  .action-row {
    grid-template-columns: repeat(auto-fit, minmax(0, max-content));
    align-items: center;
    gap: 10px;
  }

  .primary-btn,
  .secondary-btn,
  .ghost-btn {
    min-height: 46px;
    padding: 0 var(--sc-sp-4);
    border-radius: 16px;
    cursor: pointer;
    font-family: var(--sc-font-body);
    font-size: var(--sc-fs-base);
    font-weight: 700;
    transition:
      transform var(--sc-duration-fast) var(--sc-ease),
      border-color var(--sc-duration-fast) var(--sc-ease),
      background var(--sc-duration-fast) var(--sc-ease);
  }

  .primary-btn {
    border: 1px solid rgba(173, 202, 124, 0.34);
    background: linear-gradient(135deg, #adca7c, #e4d6a3 42%, #f4f1e4 100%);
    color: #09111b;
  }

  .secondary-btn {
    border: 1px solid rgba(173, 202, 124, 0.16);
    background: rgba(8, 16, 14, 0.88);
    color: var(--sc-text-0);
  }

  .ghost-btn {
    border: none;
    background: transparent;
    color: var(--sc-text-2);
  }

  .primary-btn:hover,
  .secondary-btn:hover,
  .ghost-btn:hover,
  .shell-card:hover,
  .option-card:hover,
  .ghost-inline:hover {
    transform: translateY(-2px);
  }

  .primary-btn:disabled,
  .ghost-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .error-text {
    margin: 0;
    color: #f2d193;
  }

  @media (max-width: 980px) {
    .wizard-grid,
    .completion-grid,
    .identity-layout,
    .roster-head {
      grid-template-columns: 1fr;
    }

    .preview-card {
      position: static;
    }
  }

  @media (max-width: 768px) {
    .create-page {
      padding: var(--sc-sp-4) var(--sc-sp-3) var(--sc-sp-8);
    }

    .step-strip,
    .shell-grid,
    .option-grid,
    .summary-grid,
    .preview-meta-grid {
      grid-template-columns: 1fr;
    }

    .wallet-card {
      grid-template-columns: 1fr;
    }

    .shell-card {
      grid-template-columns: 72px minmax(0, 1fr);
      min-height: 0;
    }

    .shell-card img {
      width: 72px;
    }

    .action-row {
      grid-template-columns: 1fr;
    }
  }
</style>
