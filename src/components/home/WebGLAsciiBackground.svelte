<!--
  WebGLAsciiBackground.svelte
  WebGL 2 mouse-trail ASCII effect: organic fBm brush → ping-pong FBO →
  SDF glyph rendering with chromatic aberration + brand palette.
  Falls back gracefully if WebGL 2 is unavailable.
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import {
    linkProgram,
    createPingPong,
    createFullscreenTriangle,
    loadTexture,
  } from '$lib/webgl/webgl-utils';
  import {
    FULLSCREEN_VERT,
    TRAIL_PAINT_FRAG,
    TRAIL_GROW_FRAG,
    COMPOSITE_FRAG,
  } from '$lib/webgl/ascii-trail-shaders';

  interface Props {
    mouseX?: number;
    mouseY?: number;
  }

  const { mouseX = 50, mouseY = 50 }: Props = $props();

  const MOBILE_BP = 768;
  const TRAIL_SCALE_DESKTOP = 0.75;
  const TRAIL_SCALE_MOBILE = 0.38; // ~4x fewer fragment ops
  const DPR_CAP_DESKTOP = 2;
  const DPR_CAP_MOBILE = 1;
  const TARGET_FPS_MOBILE = 30;
  const LOGO_PATH = '/cogochi/logo-filled.png';
  const LOGO_COVER = 0.65;
  const DRIFT_AMP_X = 20;
  const DRIFT_AMP_Y = 15;

  let canvas: HTMLCanvasElement | undefined = $state(undefined);
  let isMobile = $state(false);

  onMount(() => {
    if (!canvas) return;

    const maybeGl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
    });
    if (!maybeGl) {
      console.warn('[WebGLAscii] WebGL 2 not available');
      return;
    }
    const gl: WebGL2RenderingContext = maybeGl;

    const useFloat = !!gl.getExtension('EXT_color_buffer_float');
    let destroyed = false;
    let animId = 0;

    // ── Setup ───────────────────────────────────────────────
    const quad = createFullscreenTriangle(gl);
    const paintProg = linkProgram(gl, FULLSCREEN_VERT, TRAIL_PAINT_FRAG);
    const growProg = linkProgram(gl, FULLSCREEN_VERT, TRAIL_GROW_FRAG);
    const compProg = linkProgram(gl, FULLSCREEN_VERT, COMPOSITE_FRAG);

    // Uniform locations
    const uPaint = {
      prev: gl.getUniformLocation(paintProg, 'uPrev'),
      mouse: gl.getUniformLocation(paintProg, 'uMouse'),
      mousePrev: gl.getUniformLocation(paintProg, 'uMousePrev'),
      res: gl.getUniformLocation(paintProg, 'uRes'),
      size: gl.getUniformLocation(paintProg, 'uSize'),
      time: gl.getUniformLocation(paintProg, 'uTime'),
    };
    const uGrow = {
      prev: gl.getUniformLocation(growProg, 'uPrev'),
      res: gl.getUniformLocation(growProg, 'uRes'),
      time: gl.getUniformLocation(growProg, 'uTime'),
    };
    const uComp = {
      trail: gl.getUniformLocation(compProg, 'uTrail'),
      logo: gl.getUniformLocation(compProg, 'uLogo'),
      res: gl.getUniformLocation(compProg, 'uRes'),
      mouse: gl.getUniformLocation(compProg, 'uMouse'),
      logoRect: gl.getUniformLocation(compProg, 'uLogoRect'),
      time: gl.getUniformLocation(compProg, 'uTime'),
    };

    // ── FBOs + textures ─────────────────────────────────────
    let w = window.innerWidth;
    let h = window.innerHeight;
    let scale = w < MOBILE_BP ? TRAIL_SCALE_MOBILE : TRAIL_SCALE_DESKTOP;
    let tw = Math.ceil(w * scale);
    let th = Math.ceil(h * scale);
    let trail = createPingPong(gl, tw, th, useFloat);

    let logoTex: WebGLTexture | null = null;
    loadTexture(gl, LOGO_PATH)
      .then((tex) => { if (!destroyed) logoTex = tex; })
      .catch(() => {});

    const blankTex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, blankTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 0]));

    // ── Mouse state ─────────────────────────────────────────
    let prevMx = mouseX / 100;
    let prevMy = 1 - mouseY / 100;
    let smoothedSize = 0;

    // ── Resize ──────────────────────────────────────────────
    function resize() {
      if (destroyed || !canvas) return;
      w = window.innerWidth;
      h = window.innerHeight;
      isMobile = w < MOBILE_BP;
      scale = isMobile ? TRAIL_SCALE_MOBILE : TRAIL_SCALE_DESKTOP;
      const dprCap = isMobile ? DPR_CAP_MOBILE : DPR_CAP_DESKTOP;
      const dpr = Math.min(window.devicePixelRatio, dprCap);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      tw = Math.ceil(w * scale);
      th = Math.ceil(h * scale);
      trail.resize(tw, th);
    }

    resize();
    window.addEventListener('resize', resize, { passive: true });

    // ── Logo rect in UV space ───────────────────────────────
    function logoRect(t: number): [number, number, number, number] {
      const viewMin = Math.min(w, h);
      const sz = viewMin * LOGO_COVER;
      const driftX = Math.sin(t * 0.15) * DRIFT_AMP_X;
      const driftY = Math.cos(t * 0.12) * DRIFT_AMP_Y;
      const left = ((w - sz) * 0.5 + driftX) / w;
      const bottom = 1 - ((h - sz) * 0.5 + driftY + sz) / h; // GL: bottom=0
      const right = left + sz / w;
      const top = bottom + sz / h;
      return [left, bottom, right, top];
    }

    // ── Render loop ─────────────────────────────────────────
    const MOBILE_FRAME_MS = 1000 / TARGET_FPS_MOBILE;
    let lastFrameTime = 0;

    function render(time: number) {
      if (destroyed) return;

      // Frame throttling on mobile (30fps target)
      if (isMobile && time - lastFrameTime < MOBILE_FRAME_MS) {
        animId = requestAnimationFrame(render);
        return;
      }
      lastFrameTime = time;

      const t = time * 0.001;
      const mx = mouseX / 100;
      const my = 1 - mouseY / 100;
      const dx = mx - prevMx;
      const dy = my - prevMy;
      const speed = Math.sqrt(dx * dx + dy * dy);
      smoothedSize += (Math.min(speed * 40, 1) - smoothedSize) * 0.15;

      gl.bindVertexArray(quad);

      // ── Pass 1: Paint ──
      gl.bindFramebuffer(gl.FRAMEBUFFER, trail.write.fb);
      gl.viewport(0, 0, tw, th);
      gl.useProgram(paintProg);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, trail.read.tex);
      gl.uniform1i(uPaint.prev, 0);
      gl.uniform2f(uPaint.mouse, mx, my);
      gl.uniform2f(uPaint.mousePrev, prevMx, prevMy);
      gl.uniform2f(uPaint.res, tw, th);
      gl.uniform1f(uPaint.size, smoothedSize);
      gl.uniform1f(uPaint.time, t);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      trail.swap();

      // ── Pass 2: Grow ──
      gl.bindFramebuffer(gl.FRAMEBUFFER, trail.write.fb);
      gl.useProgram(growProg);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, trail.read.tex);
      gl.uniform1i(uGrow.prev, 0);
      gl.uniform2f(uGrow.res, tw, th);
      gl.uniform1f(uGrow.time, t);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      trail.swap();

      // ── Pass 3: Composite ──
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas!.width, canvas!.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(compProg);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, trail.read.tex);
      gl.uniform1i(uComp.trail, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, logoTex ?? blankTex);
      gl.uniform1i(uComp.logo, 1);
      gl.uniform2f(uComp.res, canvas!.width, canvas!.height);
      gl.uniform2f(uComp.mouse, mx, my);
      gl.uniform1f(uComp.time, t);
      const lr = logoRect(t);
      gl.uniform4f(uComp.logoRect, lr[0], lr[1], lr[2], lr[3]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.disable(gl.BLEND);

      prevMx = mx;
      prevMy = my;
      animId = requestAnimationFrame(render);
    }

    animId = requestAnimationFrame(render);

    // ── Cleanup ─────────────────────────────────────────────
    return () => {
      destroyed = true;
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      trail.destroy();
      gl.deleteTexture(blankTex);
      if (logoTex) gl.deleteTexture(logoTex);
      gl.deleteProgram(paintProg);
      gl.deleteProgram(growProg);
      gl.deleteProgram(compProg);
    };
  });
</script>

<canvas
  bind:this={canvas}
  class="ascii-bg"
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
  .hidden { display: none; }
  @media (prefers-reduced-motion: reduce) {
    .ascii-bg { display: none; }
  }
</style>
