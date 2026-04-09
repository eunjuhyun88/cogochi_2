<!--
  WaitlistSection.svelte
  macOS-style waitlist card with Message, Name, Email fields.
  Self-contained form state and POST /api/waitlist submission.
-->
<script lang="ts">
  let email = $state('');
  let name = $state('');
  let message = $state('');
  let submitted = $state(false);
  let submitting = $state(false);
  let errorMsg = $state('');

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (!email.includes('@') || !name.trim() || submitting) return;

    submitting = true;
    errorMsg = '';

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          message: message.trim(),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? 'Unable to join the waitlist.');
      }

      submitted = true;
    } catch (error) {
      errorMsg = error instanceof Error ? error.message : 'Unable to join the waitlist.';
    } finally {
      submitting = false;
    }
  }
</script>

<div id="waitlist" class="waitlist-card">
    <div class="card-chrome">
      <div class="dot"></div>
      <div class="dot"></div>
      <div class="dot"></div>
    </div>

    <div class="card-body">
      <div class="card-header">
        <div class="brand-mark">COGOTCHI</div>
        <div class="brand-sub">Closed Alpha — 200 spots</div>
      </div>

      <h2 class="card-title">Something is being built.</h2>
      <p class="card-desc">Your trading edge, remembered. Your judgment, provable.</p>

      {#if submitted}
        <div class="success-state">
          <h3 class="success-title">You're on the list.</h3>
          <p class="success-desc">We'll reach out when your slot opens. Check your inbox.</p>
        </div>
      {:else}
        <form class="waitlist-form" onsubmit={handleSubmit}>
          <textarea
            bind:value={message}
            class="field textarea"
            maxlength="500"
            placeholder="Leave a Message (optional)"
            rows="3"
          ></textarea>
          <input
            bind:value={name}
            class="field"
            maxlength="100"
            placeholder="Your Name*"
            type="text"
            required
          />
          <div class="field-row">
            <input
              bind:value={email}
              class="field"
              maxlength="256"
              placeholder="Sign-up Email*"
              type="email"
              required
            />
            <button
              class="submit-btn"
              type="submit"
              disabled={submitting || !email.includes('@') || !name.trim()}
            >
              {submitting ? '...' : 'Join Waitlist'}
            </button>
          </div>
        </form>

        {#if errorMsg}
          <p class="error-msg">{errorMsg}</p>
        {/if}
      {/if}

      <p class="notice">Invitation-only. No spam. First 200 get founder access.</p>
    </div>
  </div>

<style>
  .waitlist-card {
    width: min(400px, 88vw);
    background: rgba(12, 14, 20, 0.82);
    border: 1px solid rgba(219, 154, 159, 0.15);
    border-radius: 16px;
    overflow: hidden;
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    box-shadow:
      0 24px 60px rgba(0, 0, 0, 0.5),
      0 0 1px rgba(255, 255, 255, 0.1);
  }

  .card-chrome {
    display: flex;
    gap: 6px;
    padding: 14px 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.15);
  }

  .card-body {
    padding: 28px 28px 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .card-header {
    text-align: center;
  }

  .brand-mark {
    font-size: 1.6rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    color: rgba(247, 242, 234, 0.92);
  }

  .brand-sub {
    font-size: 0.75rem;
    color: rgba(247, 242, 234, 0.35);
    margin-top: 4px;
  }

  .card-title {
    font-size: clamp(1.5rem, 3vw, 2rem);
    font-weight: 700;
    line-height: 1.15;
    color: rgba(247, 242, 234, 0.92);
    text-align: center;
    margin: 0;
  }

  .card-desc {
    font-size: 0.95rem;
    line-height: 1.5;
    color: rgba(247, 242, 234, 0.5);
    text-align: center;
    margin: 0;
  }

  .waitlist-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 8px;
  }

  .field {
    width: 100%;
    padding: 12px 14px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    color: rgba(247, 242, 234, 0.92);
    font-family: inherit;
    font-size: 0.9rem;
    outline: none;
    transition: border-color 0.2s ease;
  }

  .field::placeholder {
    color: rgba(247, 242, 234, 0.25);
  }

  .field:focus {
    border-color: rgba(219, 154, 159, 0.5);
  }

  .textarea {
    resize: vertical;
    min-height: 72px;
    max-height: 140px;
  }

  .field-row {
    display: flex;
    gap: 8px;
  }

  .submit-btn {
    flex-shrink: 0;
    padding: 12px 22px;
    background: rgba(219, 154, 159, 0.9);
    color: #0a0e1a;
    font-family: inherit;
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .submit-btn:hover:not(:disabled) {
    background: rgba(219, 154, 159, 1);
    transform: translateY(-1px);
  }

  .submit-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .error-msg {
    font-size: 0.8rem;
    color: #ff6b6b;
    margin: 0;
  }

  .success-state {
    text-align: center;
    padding: 20px 0;
  }

  .success-title {
    font-size: 1.3rem;
    font-weight: 700;
    color: rgba(247, 242, 234, 0.92);
    margin: 0 0 8px;
  }

  .success-desc {
    font-size: 0.9rem;
    color: rgba(247, 242, 234, 0.5);
    margin: 0;
  }

  .notice {
    font-size: 0.75rem;
    color: rgba(247, 242, 234, 0.25);
    text-align: center;
    margin: 0;
  }
</style>
