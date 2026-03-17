<script lang="ts">
  import { goto } from '$app/navigation';
  import { isWalletConnected, walletStore } from '$lib/stores/walletStore';
  import { openWalletModal } from '$lib/stores/walletModalStore';
  import {
    agentJourneyStore,
    currentJourneyShell,
    hasMintedAgent,
    JOURNEY_SHELL_OPTIONS,
    readinessProgress,
    type AgentDoctrineId,
    type AgentModelSource,
    type AgentShellId,
  } from '$lib/stores/agentJourneyStore';
  import { buildAgentLink, buildTerminalLink } from '$lib/utils/deepLinks';

  const connected = $derived($isWalletConnected);
  const wallet = $derived($walletStore);
  const journey = $derived($agentJourneyStore);
  const selectedShell = $derived($currentJourneyShell);
  const alreadyActivated = $derived($hasMintedAgent);
  const readinessCount = $derived($readinessProgress);

  const modelOptions: Array<{ id: AgentModelSource; label: string; detail: string }> = [
    { id: 'openai', label: 'OpenAI Starter', detail: 'Fastest default brain for the first activation.' },
    { id: 'hootVerified', label: 'HOOT Verified', detail: 'Verified external model path for more governed runs.' },
    { id: 'custom', label: 'Custom Source', detail: 'Bring your own model endpoint and tune it later in Terminal.' },
  ];

  const doctrineOptions: Array<{ id: AgentDoctrineId; label: string; detail: string }> = [
    { id: 'balanced', label: 'Balanced', detail: 'Default risk posture for the first world run.' },
    { id: 'aggressive', label: 'Aggressive', detail: 'Pushes earlier and prefers faster intervention windows.' },
    { id: 'defensive', label: 'Defensive', detail: 'Protects HP and waits for stronger confirmation.' },
  ];

  const stepTitles = ['Shell', 'Identity', 'Wallet + Brain', 'Temperament'];

  let currentStep = $state(0);
  let shellId = $state<AgentShellId>(JOURNEY_SHELL_OPTIONS[0].id);
  let agentName = $state('New Agent');
  let modelSource = $state<AgentModelSource>('openai');
  let doctrineId = $state<AgentDoctrineId>('balanced');
  let submitError = $state('');
  let hydratedDraft = $state(false);

  $effect(() => {
    if (hydratedDraft || alreadyActivated) return;
    shellId = journey.shellId;
    agentName = journey.agentName;
    modelSource = journey.modelSource;
    doctrineId = journey.doctrineId;
    hydratedDraft = true;
  });

  $effect(() => {
    agentJourneyStore.setDraft({ shellId, agentName, modelSource, doctrineId });
  });

  const selectedShellMeta = $derived(
    JOURNEY_SHELL_OPTIONS.find((option) => option.id === shellId) ?? JOURNEY_SHELL_OPTIONS[0]
  );

  const canAdvance = $derived(
    currentStep === 0
      ? Boolean(shellId)
      : currentStep === 1
        ? agentName.trim().length >= 2
        : currentStep === 2
          ? connected
          : Boolean(doctrineId)
  );

  function goNext() {
    if (currentStep === 2 && !connected) {
      openWalletModal();
      return;
    }
    if (!canAdvance || currentStep >= stepTitles.length - 1) return;
    currentStep += 1;
  }

  function goBack() {
    if (currentStep === 0) return;
    currentStep -= 1;
  }

  function activateAgent() {
    submitError = '';
    if (!connected) {
      submitError = 'Connect wallet before activation.';
      openWalletModal();
      return;
    }
    if (agentName.trim().length < 2) {
      submitError = 'Agent name needs at least 2 characters.';
      currentStep = 1;
      return;
    }

    agentJourneyStore.activateAgent({
      shellId,
      agentName,
      modelSource,
      doctrineId,
    });
  }

  function restartFlow() {
    agentJourneyStore.reset();
    shellId = JOURNEY_SHELL_OPTIONS[0].id;
    agentName = 'New Agent';
    modelSource = 'openai';
    doctrineId = 'balanced';
    submitError = '';
    currentStep = 0;
  }
</script>

<svelte:head>
  <title>Create Agent — Cogochi</title>
</svelte:head>

<main class="create-page">
  <section class="hero-card">
    <div class="hero-copy">
      <p class="eyebrow">Create Agent</p>
      <h1>Own the shell. Bind the starter brain.</h1>
      <p class="subtitle">
        Finish one activation flow and leave with a named agent, a bound starter model, and Terminal unlocked
        for the first validation run.
      </p>
    </div>

    <div class="status-row">
      <span class="status-chip">{connected ? wallet.shortAddr : 'Wallet required'}</span>
      <span class="status-chip">{selectedShellMeta.label}</span>
      <span class="status-chip">Readiness {readinessCount}/3</span>
    </div>
  </section>

  {#if alreadyActivated}
    <section class="completion-grid">
      <article class="summary-card">
        <p class="eyebrow">Activation Complete</p>
        <h2>{journey.agentName}</h2>
        <p class="summary-text">
          Agent ID `{journey.agentId}` created. Stage 1 is active and Terminal is unlocked for the first
          validation run.
        </p>

        <div class="summary-grid">
          <div class="metric-card">
            <span>Shell</span>
            <strong>{journey.shellLabel}</strong>
          </div>
          <div class="metric-card">
            <span>Brain</span>
            <strong>{modelOptions.find((option) => option.id === journey.modelSource)?.label}</strong>
          </div>
          <div class="metric-card">
            <span>Temperament</span>
            <strong>{doctrineOptions.find((option) => option.id === journey.doctrineId)?.label}</strong>
          </div>
        </div>

        <div class="action-row">
          <button class="primary-btn" type="button" onclick={() => goto(buildTerminalLink({ entry: 'create', agent: journey.agentName }))}>
            Enter Terminal
          </button>
          <button class="secondary-btn" type="button" onclick={() => goto(buildAgentLink({ source: 'create' }))}>
            Open Agent
          </button>
          <button class="ghost-btn" type="button" onclick={restartFlow}>
            Start Over
          </button>
        </div>
      </article>

      <article class="preview-card">
        <img src={selectedShell.sheet} alt={selectedShell.title} />
      </article>
    </section>
  {:else}
    <section class="wizard-grid">
      <article class="rail-card">
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
      </article>

      <article class="builder-card">
        {#if currentStep === 0}
          <div class="section-head">
            <p class="eyebrow">Step 1</p>
            <h2>Choose the character shell</h2>
            <p>Select the companion identity you want to own and train.</p>
          </div>

          <div class="shell-grid">
            {#each JOURNEY_SHELL_OPTIONS as option}
              <button
                class="shell-card"
                class:selected={option.id === shellId}
                type="button"
                onclick={() => (shellId = option.id)}
              >
                <img src={option.sheet} alt={option.label} />
                <div class="shell-copy">
                  <strong>{option.label}</strong>
                  <span>{option.title}</span>
                  <p>{option.detail}</p>
                </div>
              </button>
            {/each}
          </div>
        {:else if currentStep === 1}
          <div class="section-head">
            <p class="eyebrow">Step 2</p>
            <h2>Name the agent</h2>
            <p>Make the first identity permanent enough to show on the trainer card later.</p>
          </div>

          <label class="field-card">
            <span>Agent Name</span>
            <input bind:value={agentName} maxlength="24" placeholder="New Agent" />
            <small>{agentName.trim().length || 0}/24 characters</small>
          </label>
        {:else if currentStep === 2}
          <div class="section-head">
            <p class="eyebrow">Step 3</p>
            <h2>Connect wallet and choose the starter brain</h2>
            <p>Ownership and first model binding stay in one activation flow.</p>
          </div>

          <div class="wallet-card">
            <div>
              <strong>{connected ? 'Wallet connected' : 'Wallet required'}</strong>
              <p>{connected ? wallet.shortAddr : 'Connect wallet to create ownership and save the agent.'}</p>
            </div>
            <button class="secondary-btn" type="button" onclick={openWalletModal}>
              {connected ? 'Change Wallet' : 'Connect Wallet'}
            </button>
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
        {:else}
          <div class="section-head">
            <p class="eyebrow">Step 4</p>
            <h2>Save the starter temperament</h2>
            <p>Set the first doctrine now, then finish validation in Terminal.</p>
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

          <div class="activation-card">
            <div>
              <span>Activation result</span>
              <strong>Agent ID created · Stage 1 active · Terminal unlocked</strong>
            </div>
            <button class="primary-btn" type="button" onclick={activateAgent}>
              Activate Agent
            </button>
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
              {currentStep === 2 && !connected ? 'Connect Wallet' : 'Next'}
            </button>
          {:else}
            <button class="secondary-btn" type="button" onclick={() => goto(buildTerminalLink({ entry: 'create' }))}>
              Skip to Terminal
            </button>
          {/if}
        </div>
      </article>

      <article class="preview-card">
        <img src={selectedShellMeta.sheet} alt={selectedShellMeta.label} />
        <div class="preview-copy">
          <strong>{agentName.trim() || 'New Agent'}</strong>
          <span>{selectedShellMeta.title}</span>
          <p>{selectedShellMeta.detail}</p>
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
    gap: var(--sc-sp-4);
    background:
      radial-gradient(circle at top right, rgba(173, 202, 124, 0.12), transparent 28%),
      radial-gradient(circle at bottom left, rgba(242, 209, 147, 0.06), transparent 22%),
      linear-gradient(180deg, rgba(8, 14, 13, 0.96), rgba(8, 12, 12, 0.99));
  }

  .hero-card,
  .rail-card,
  .builder-card,
  .preview-card,
  .summary-card {
    border-radius: 24px;
    border: 1px solid rgba(173, 202, 124, 0.14);
    background: linear-gradient(180deg, rgba(13, 20, 18, 0.94), rgba(10, 16, 15, 0.97));
    box-shadow: 0 20px 56px rgba(0, 0, 0, 0.24);
  }

  .hero-card,
  .summary-card,
  .builder-card {
    padding: clamp(22px, 3vw, 30px);
  }

  .hero-card,
  .wizard-grid,
  .completion-grid,
  .status-row,
  .summary-grid,
  .shell-grid,
  .option-grid,
  .action-row {
    display: grid;
    gap: 12px;
  }

  .wizard-grid {
    grid-template-columns: minmax(220px, 0.34fr) minmax(0, 0.9fr) minmax(280px, 0.5fr);
    align-items: start;
  }

  .completion-grid {
    grid-template-columns: minmax(0, 0.9fr) minmax(260px, 0.45fr);
    align-items: stretch;
  }

  .hero-copy,
  .section-head,
  .preview-copy {
    display: grid;
    gap: 10px;
  }

  .eyebrow,
  .step-chip span,
  .metric-card span,
  .activation-card span {
    margin: 0;
    font-family: var(--sc-font-mono);
    font-size: var(--sc-fs-xs);
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--sc-accent-2);
  }

  h1,
  h2 {
    margin: 0;
    color: var(--sc-text-0);
    font-family: var(--sc-font-display);
    letter-spacing: 0.04em;
  }

  h1 {
    font-size: clamp(2.2rem, 4vw, 3.4rem);
    line-height: 0.96;
    max-width: 12ch;
  }

  h2 {
    font-size: clamp(1.45rem, 2vw, 2rem);
  }

  .subtitle,
  .section-head p,
  .summary-text,
  .preview-copy p,
  .option-card p,
  .shell-copy p,
  .wallet-card p {
    margin: 0;
    color: var(--sc-text-1);
    line-height: 1.5;
  }

  .status-row {
    grid-template-columns: repeat(3, minmax(0, max-content));
  }

  .status-chip {
    min-height: 36px;
    padding: 0 12px;
    border-radius: 999px;
    border: 1px solid rgba(173, 202, 124, 0.16);
    background: rgba(8, 16, 14, 0.88);
    display: inline-flex;
    align-items: center;
    color: var(--sc-text-1);
  }

  .rail-card {
    padding: 16px;
    display: grid;
    gap: 10px;
  }

  .step-chip {
    min-height: 68px;
    padding: 14px 16px;
    border-radius: 18px;
    border: 1px solid rgba(173, 202, 124, 0.1);
    background: rgba(8, 16, 14, 0.56);
    color: var(--sc-text-1);
    display: grid;
    gap: 4px;
    text-align: left;
    cursor: pointer;
  }

  .step-chip strong {
    color: var(--sc-text-0);
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
  .option-grid,
  .summary-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .shell-card,
  .option-card,
  .wallet-card,
  .field-card,
  .activation-card,
  .metric-card {
    border-radius: 20px;
    border: 1px solid rgba(173, 202, 124, 0.12);
    background: rgba(8, 16, 14, 0.72);
  }

  .shell-card,
  .option-card {
    padding: 14px;
    display: grid;
    gap: 10px;
    text-align: left;
    cursor: pointer;
    color: inherit;
  }

  .shell-card img,
  .preview-card img {
    width: 100%;
    aspect-ratio: 1;
    object-fit: contain;
    image-rendering: pixelated;
  }

  .shell-copy,
  .wallet-card,
  .field-card,
  .activation-card {
    display: grid;
    gap: 8px;
  }

  .shell-copy strong,
  .option-card strong,
  .metric-card strong,
  .wallet-card strong,
  .activation-card strong,
  .preview-copy strong {
    color: var(--sc-text-0);
  }

  .shell-copy span,
  .preview-copy span {
    color: var(--sc-accent-2);
    font-family: var(--sc-font-mono);
    font-size: var(--sc-fs-xs);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .shell-card.selected,
  .option-card.selected {
    border-color: rgba(173, 202, 124, 0.26);
    background: rgba(173, 202, 124, 0.08);
  }

  .wallet-card,
  .field-card,
  .activation-card,
  .metric-card {
    padding: 16px;
  }

  .wallet-card,
  .activation-card {
    grid-template-columns: minmax(0, 1fr) max-content;
    align-items: center;
  }

  .field-card span {
    color: var(--sc-text-0);
    font-weight: 700;
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
  }

  .preview-card {
    padding: 18px;
    display: grid;
    align-content: start;
    gap: 14px;
  }

  .summary-grid {
    margin-top: 8px;
  }

  .metric-card {
    display: grid;
    gap: 6px;
  }

  .action-row {
    grid-template-columns: repeat(3, minmax(0, max-content));
    align-items: center;
  }

  .primary-btn,
  .secondary-btn,
  .ghost-btn {
    min-height: 44px;
    padding: 0 var(--sc-sp-4);
    border-radius: 16px;
    cursor: pointer;
    font-family: var(--sc-font-body);
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
  .option-card:hover {
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

  @media (max-width: 1100px) {
    .wizard-grid,
    .completion-grid {
      grid-template-columns: 1fr;
    }

    .shell-grid,
    .option-grid,
    .summary-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 768px) {
    .create-page {
      padding: var(--sc-sp-4) var(--sc-sp-3) calc(var(--sc-sp-7) + var(--sc-bottom-bar-h));
    }

    .status-row,
    .wallet-card,
    .activation-card,
    .action-row {
      grid-template-columns: 1fr;
    }
  }
</style>
