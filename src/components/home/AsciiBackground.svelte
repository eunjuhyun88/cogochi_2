<!--
  AsciiBackground.svelte
  Loads a filled PNG logo into an offscreen canvas, samples pixel
  brightness, and renders ASCII characters on a fullscreen 2D canvas.
  Mouse proximity creates a glow effect that brightens nearby characters.
  Pure Canvas 2D — no Three.js dependency.
-->
<script lang="ts">
  import { onMount } from 'svelte';

  // ── Props ──────────────────────────────────────────────────
  interface Props {
    /** Mouse X position as 0-100 percentage of viewport width */
    mouseX?: number;
    /** Mouse Y position as 0-100 percentage of viewport height */
    mouseY?: number;
  }

  const { mouseX = 50, mouseY = 50 }: Props = $props();

  // ── Constants ──────────────────────────────────────────────
  const CELL_SIZE = 10;
  const CHAR_SET = ' .:-=+*#%@';
  const IMG_PATH = '/cogochi/logo-filled.png';
  const BASE_OPACITY = 0.10;
  const GLOW_RADIUS = 300;
  const GLOW_MAX = 0.85;
  const MOBILE_BREAKPOINT = 768;
  /** Logo covers ~65% of viewport */
  const LOGO_SCALE = 0.65;
  /** Drift amplitude in pixels */
  const DRIFT_AMP_X = 20;
  const DRIFT_AMP_Y = 15;

  // Brand palette: rose, sage, gold
  const PALETTE: [number, number, number][] = [
    [219, 154, 159], // rose
    [173, 202, 124], // sage
    [242, 209, 147], // gold
  ];

  // ── State ──────────────────────────────────────────────────
  let canvasEl: HTMLCanvasElement | undefined = $state(undefined);
  let isMobile = $state(false);

  // ── Lifecycle ──────────────────────────────────────────────
  onMount(() => {
    if (!canvasEl) return;

    const ctx = canvasEl.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId = 0;
    let destroyed = false;
    let cols = 0;
    let rows = 0;

    // Offscreen image data
    let imgData: Uint8ClampedArray | null = null;
    let imgW = 0;
    let imgH = 0;

    // ── Resize handler ────────────────────────────────────
    function resize() {
      if (destroyed || !canvasEl) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;

      canvasEl.width = w * dpr;
      canvasEl.height = h * dpr;
      canvasEl.style.width = `${w}px`;
      canvasEl.style.height = `${h}px`;

      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      cols = Math.ceil(w / CELL_SIZE);
      rows = Math.ceil(h / CELL_SIZE);
      isMobile = w < MOBILE_BREAKPOINT;
    }

    // ── Load PNG into offscreen canvas ────────────────────
    function loadImage(): Promise<void> {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const offscreen = document.createElement('canvas');
          offscreen.width = img.naturalWidth;
          offscreen.height = img.naturalHeight;
          const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
          if (!offCtx) {
            reject(new Error('Failed to get offscreen 2d context'));
            return;
          }
          offCtx.drawImage(img, 0, 0);
          const data = offCtx.getImageData(0, 0, offscreen.width, offscreen.height);
          imgData = data.data;
          imgW = offscreen.width;
          imgH = offscreen.height;
          resolve();
        };
        img.onerror = () => reject(new Error(`Failed to load ${IMG_PATH}`));
        img.src = IMG_PATH;
      });
    }

    /**
     * Sample brightness from the loaded PNG.
     * nx, ny are normalised 0-1 coordinates within the image.
     */
    function sampleBrightness(nx: number, ny: number): number {
      if (!imgData) return 0;
      // Clamp to image bounds
      if (nx < 0 || nx > 1 || ny < 0 || ny > 1) return 0;
      const px = Math.floor(nx * (imgW - 1));
      const py = Math.floor(ny * (imgH - 1));
      const idx = (py * imgW + px) * 4;
      const r = imgData[idx];
      const g = imgData[idx + 1];
      const b = imgData[idx + 2];
      const a = imgData[idx + 3] / 255;
      // Perceived luminance (Rec. 709)
      const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      return lum * a;
    }

    // ── ASCII render loop ───────────────────────────────────
    const FONT_BASE = `"JetBrains Mono", "Courier New", monospace`;
    const fontCache = new Map<number, string>();

    function getFont(size: number): string {
      const rounded = Math.round(size * 2) / 2;
      let f = fontCache.get(rounded);
      if (!f) {
        f = `${rounded}px ${FONT_BASE}`;
        fontCache.set(rounded, f);
      }
      return f;
    }

    function render(time: number) {
      if (destroyed || !ctx || !canvasEl) return;

      // Skip rendering on mobile
      if (isMobile) {
        animId = requestAnimationFrame(render);
        return;
      }

      // Wait for image data
      if (!imgData) {
        animId = requestAnimationFrame(render);
        return;
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvasEl.width / dpr;
      const h = canvasEl.height / dpr;

      ctx.clearRect(0, 0, w, h);

      // Mouse position in pixels
      const mxPx = (mouseX / 100) * w;
      const myPx = (mouseY / 100) * h;

      // Time-based drift
      const timeSec = time * 0.001;
      const driftX = Math.sin(timeSec * 0.15) * DRIFT_AMP_X;
      const driftY = Math.cos(timeSec * 0.12) * DRIFT_AMP_Y;

      // Compute logo placement: centered, covering ~65% of viewport
      const viewMin = Math.min(w, h);
      const logoSize = viewMin * LOGO_SCALE;
      const logoLeft = (w - logoSize) * 0.5 + driftX;
      const logoTop = (h - logoSize) * 0.5 + driftY;
      const invLogoSize = 1 / logoSize;

      // Precompute
      const invGlowRadius = 1 / GLOW_RADIUS;
      const glowRadiusSq = GLOW_RADIUS * GLOW_RADIUS;
      const halfCell = CELL_SIZE * 0.5;
      const fontSize = CELL_SIZE * 0.88;
      const charLen = CHAR_SET.length;

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      let lastFont = getFont(fontSize);
      ctx.font = lastFont;

      for (let row = 0; row < rows; row++) {
        const cy = row * CELL_SIZE + halfCell;

        for (let col = 0; col < cols; col++) {
          const cx = col * CELL_SIZE + halfCell;

          // Map canvas position to normalised image coords
          const nx = (cx - logoLeft) * invLogoSize;
          const ny = (cy - logoTop) * invLogoSize;

          // Sample brightness from the PNG
          const brightness = sampleBrightness(nx, ny);

          // Skip empty cells
          if (brightness < 0.02) continue;

          // Map brightness to ASCII character
          const charIdx = Math.min(charLen - 1, (brightness * charLen) | 0);
          if (charIdx === 0) continue;
          const ch = CHAR_SET[charIdx];

          // Distance from mouse cursor
          const dx = cx - mxPx;
          const dy = cy - myPx;
          const distSq = dx * dx + dy * dy;

          // Mouse glow factor
          let glow = 0;
          if (distSq < glowRadiusSq) {
            const glowRaw = 1 - Math.sqrt(distSq) * invGlowRadius;
            glow = glowRaw * glowRaw; // quadratic falloff
          }

          // Combined alpha
          const alpha = Math.min(GLOW_MAX, BASE_OPACITY + glow * (GLOW_MAX - BASE_OPACITY));
          if (alpha < 0.01) continue;

          // Color from palette (smooth spatial + temporal blend)
          const v =
            (Math.sin(nx * 4.7 + timeSec * 0.3) + Math.cos(ny * 3.3 - timeSec * 0.2)) *
              0.5 +
            0.5;
          const fi = v * (PALETTE.length - 1);
          const lo = fi | 0;
          const hi = Math.min(lo + 1, PALETTE.length - 1);
          const t = fi - lo;
          const cr = PALETTE[lo][0] + (PALETTE[hi][0] - PALETTE[lo][0]) * t;
          const cg = PALETTE[lo][1] + (PALETTE[hi][1] - PALETTE[lo][1]) * t;
          const cb = PALETTE[lo][2] + (PALETTE[hi][2] - PALETTE[lo][2]) * t;

          // Size variation for glowing cells
          if (glow > 0.01) {
            const charSize = fontSize * (1 + glow * 0.35);
            const f = getFont(charSize);
            if (f !== lastFont) {
              ctx.font = f;
              lastFont = f;
            }
          } else if (lastFont !== getFont(fontSize)) {
            lastFont = getFont(fontSize);
            ctx.font = lastFont;
          }

          ctx.fillStyle = `rgba(${(cr + 0.5) | 0},${(cg + 0.5) | 0},${(cb + 0.5) | 0},${alpha.toFixed(3)})`;
          ctx.fillText(ch, cx, cy);
        }
      }

      animId = requestAnimationFrame(render);
    }

    // ── Initialize ────────────────────────────────────────
    resize();
    window.addEventListener('resize', resize, { passive: true });

    loadImage()
      .then(() => {
        if (!destroyed) {
          animId = requestAnimationFrame(render);
        }
      })
      .catch((err) => {
        console.warn('[AsciiBackground] Image load failed:', err);
      });

    // ── Cleanup ───────────────────────────────────────────
    return () => {
      destroyed = true;
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      imgData = null;
    };
  });
</script>

<canvas
  bind:this={canvasEl}
  class="ascii-bg"
  class:hidden={isMobile}
  aria-hidden="true"
></canvas>

<style>
  .ascii-bg {
    position: fixed;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    width: 100%;
    height: 100%;
    display: block;
  }

  .hidden {
    display: none;
  }

  /* Respect user motion preferences */
  @media (prefers-reduced-motion: reduce) {
    .ascii-bg {
      display: none;
    }
  }
</style>
