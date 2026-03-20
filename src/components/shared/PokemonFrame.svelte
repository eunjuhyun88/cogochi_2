<script lang="ts">
  const { variant = 'default', padding = '10px', children } = $props<{
    variant?: 'default' | 'dark' | 'accent';
    padding?: string;
    children: import('svelte').Snippet;
  }>();
</script>

<div class={`poke-frame ${variant}`} style:padding={padding}>
  <div class="poke-inner">
    {@render children()}
  </div>
</div>

<style>
  .poke-frame {
    position: relative;
    overflow: hidden;
    border: 1px solid rgba(173, 204, 208, 0.12);
    border-radius: 24px;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0)),
      rgba(8, 18, 27, 0.84);
    box-shadow: 0 20px 44px rgba(0, 0, 0, 0.22);
    backdrop-filter: blur(18px);
  }

  .poke-frame.dark {
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0)),
      rgba(8, 18, 27, 0.92);
  }

  .poke-frame.accent {
    border-color: rgba(223, 161, 129, 0.3);
    background:
      linear-gradient(180deg, rgba(223, 161, 129, 0.08), rgba(255, 255, 255, 0)),
      rgba(10, 18, 26, 0.9);
  }

  .poke-inner {
    position: relative;
    height: 100%;
    border-radius: 18px;
    border: 1px solid rgba(255, 255, 255, 0.04);
  }

  .poke-frame::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 24px;
    border: 1px solid rgba(255, 255, 255, 0.03);
    pointer-events: none;
  }
 </style>
