# WebGL Shader Analysis: ssscript-app.js

Reverse-engineered from `/static/vendor/ssscript-app.js` (292KB minified).
This document extracts all GLSL/WGSL shader programs, the rendering pipeline,
and the key algorithms powering the ASCII dot-matrix background effect.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Rendering Pipeline](#rendering-pipeline)
3. [Asset Paths](#asset-paths)
4. [Configuration Constants](#configuration-constants)
5. [Screen Background Shader (WGSL)](#screen-background-shader-wgsl)
6. [3D Model Shader (GLB Logo)](#3d-model-shader-glb-logo)
7. [Mouse Trail System](#mouse-trail-system)
8. [Post-Processing Chain](#post-processing-chain)
9. [Background Flip-Wipe Effect](#background-flip-wipe-effect)
10. [ASCII Trail-Mix Effect (Core Visual)](#ascii-trail-mix-effect-core-visual)
11. [Utility Shaders](#utility-shaders)
12. [Mouse Position System](#mouse-position-system)
13. [Key Algorithm Insights](#key-algorithm-insights)

---

## Architecture Overview

The runtime is a custom "mini WebGL" engine (exposed as `window.__miniGpu` / `window.__miniWebgl`).
It uses **WebGL 2** (`#version 300 es`) with a WGSL-to-GLSL transpiler for the
screen/background shader (originally written in WGSL, transpiled at init time).

**Key classes and functions (minified names):**

| Minified | Purpose |
|----------|---------|
| `yJ` | `Scene` - creates canvas, initializes WebGL, manages screen quad |
| `pq` | `PostProcessChain` - manages ordered fragment effects |
| `mJ` | `MouseTrail` - ping-pong FBO trail system |
| `uJ` | `MouseEaser` - normalizes pointer position with easing |
| `f0` | Global WebGL runtime singleton (init, render hooks) |
| `f1` | `WebGLItem` - attaches renderable objects to the runtime |
| `_1` | `WebGLObject` - 3D mesh renderer (GLB models) |
| `w$` | Reactive uniform controller (observable float vec4 arrays) |
| `i7` | Main entry function for the "webgl" module |
| `mW` | Creates the post-processing chain with background-flip-wipe + ASCII effects |
| `gJ` | Loads and animates the 3D GLB logo model |
| `dJ` | Creates a `MouseTrail` instance |
| `V9` | Creates a `MouseEaser` instance |

---

## Rendering Pipeline

```
1. Screen Quad (background gradient)
   - WGSL fragment shader -> transpiled to GLSL
   - Renders dark gradient with wave distortion
   - Alpha=0 marks background pixels

2. 3D GLB Model (logo.glb)
   - Loaded from /cogochi/logo.glb
   - PBR-like fragment shader with env map + mask
   - Alpha=1 marks model pixels
   - Animated: idle float, mouse follow, scroll response

3. Mouse Trail (ping-pong FBO)
   - Paint pass: draws trail from pointer movement
   - Grow pass: expands trail + dissipates over time
   - Output: grayscale trail texture

4. Post-Processing Chain (pq class)
   - Effect 1: "background-flip-wipe" - light/dark mode transition
   - Effect 2: "ascii-trail-mix" - THE ASCII EFFECT
   - Effect 3: noise grain overlay (amount: 0.03)
   - Each effect reads scene texture + trail texture
   - Final blit to canvas
```

---

## Asset Paths

```javascript
var _J = {
  icon: "/cogochi/logo.glb",    // 3D model (GLTF binary)
  logo: "/cogochi/empty.png"    // Mask texture for the logo white regions
};
```

The environment map is **procedurally generated** via a 2D canvas (`vJ` function):
- 1024x512 canvas
- Sky gradient: `#2c3f63` -> `#10192b`
- Ground gradient: `#18131f` -> `#050508`
- Sun glow + blue rim light painted as radial gradients

---

## Configuration Constants

```javascript
var p = {
  scene: {
    subdivs: 1,
    mouseEasing: 0.12,
    icon: {
      placement: { centerX: 0, centerY: 0, scale: 1 },
      scrollVelocityToYOffset: 0.000055,
      scrollVelocityToXRotation: -0.012,
      scrollVelocityToYRotation: -0.0015,
      scrollFlipVelocityThreshold: 70,
      scrollFlipDuration: 0.85,
      scrollYOffsetDamping: 0.9,
      scrollBounceBack: 0.04,
      scrollYOffsetEase: 0.14,
      idleFloatYOffsetAmplitude: 0.04,
      idleFloatYOffsetSpeed: 0.9,
      idleFloatRotationAmplitude: 0.082,
      idleFloatRotationSpeed: 0.9,
    },
    background: {
      xWaveFreq: 6.28,
      yWaveFreq: 9.42,
      diagonalFreq: 4,
      timeFreq: 0.5,
      xWaveAmp: 0.025,
      yWaveAmp: 0.02,
      diagonalAmp: 0.015,
      darkGray: [0.08, 0.08, 0.09],
      lightGradientA: [0.39, 0.41, 0.46],
      lightGradientB: [0.72, 0.74, 0.79],
      lightMotionFreqX: 3.8,
      lightMotionFreqY: 2.2,
      lightMotionTimeFreq: 0.42,
      lightMotionAmp: 0.09,
    },
  },
  ascii: {
    flipSceneTextureY: false,
    cellSizePx: 10,
    trailThreshold: 0.14,
    rgbShiftPx: 10.2,
    trailBoost: 1.45,
    sampledGain: 0.18,
    sampledLift: 0.015,
    shiftedGain: 1.45,
    shiftedLift: 0.08,
  },
};

var WEBGL_DARK_BACKGROUND = "rgb(3, 2, 5)";
```

---

## Screen Background Shader (WGSL)

The background is originally written in WGSL, transpiled to GLSL at runtime.
It renders a subtle animated gradient on the screen quad.

```wgsl
@fragment
fn fsMain(in: VertexOut) -> @location(0) vec4f {
  let uv = in.uv;
  let t = uUni.values0.w;

  // Slight distortion so the gradient isn't a straight line
  let distort =
    sin(uv.x * 6.28) * 0.025 +
    sin(uv.y * 9.42) * 0.020 +
    sin((uv.x + uv.y) * 4.0 + t * 0.5) * 0.015;

  let grad = clamp(1.0 - uv.y + distort, 0.0, 1.0);
  let black = vec3f(0.0, 0.0, 0.0);
  let darkGray = vec3f(0.08, 0.08, 0.09);
  let darkCol = mix(black, darkGray, grad);

  // Alpha=0 marks background pixels so the post wipe can distinguish
  // them from the model.
  return vec4f(darkCol, 0.0);
}
```

**GLSL equivalent** (after transpilation):

```glsl
#version 300 es
precision highp float;
in vec2 vUv;
uniform vec4 uUni[4];
out vec4 outColor;

void main() {
  vec2 uv = vUv;
  float t = uUni[0].w;

  float distort =
    sin(uv.x * 6.28) * 0.025 +
    sin(uv.y * 9.42) * 0.020 +
    sin((uv.x + uv.y) * 4.0 + t * 0.5) * 0.015;

  float grad = clamp(1.0 - uv.y + distort, 0.0, 1.0);
  vec3 black = vec3(0.0);
  vec3 darkGray = vec3(0.08, 0.08, 0.09);
  vec3 darkCol = mix(black, darkGray, grad);

  outColor = vec4(darkCol, 0.0);
}
```

---

## 3D Model Shader (GLB Logo)

### Vertex Shader (function `TJ`)

```glsl
#version 300 es
layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec2 aUv;
uniform mat4 uMvp;
uniform mat4 uModel;
out vec3 vNormal;
out vec2 vUv;

void main() {
  gl_Position = uMvp * vec4(aPosition, 1.0);
  vNormal = normalize((uModel * vec4(aNormal, 0.0)).xyz);
  vUv = aUv;
}
```

### Fragment Shader (inline in `gJ`)

PBR-inspired shader with environment mapping, Fresnel, and mask-based logo coloring:

```glsl
#version 300 es
precision highp float;
in vec3 vNormal;
in vec2 vUv;
uniform sampler2D uEnvMap;
uniform sampler2D uMaskMap;
uniform float uHasUv;
uniform float uValue1;   // backgroundFlipProgress (0=dark, 1=light)
out vec4 outColor;

const float PI = 3.14159265359;

void main() {
  vec3 n = normalize(vNormal);
  vec3 v = normalize(vec3(0.0, 0.0, 1.0));  // view direction (ortho)
  vec3 r = reflect(-v, n);

  // Spherical environment map sampling
  vec2 envUv = vec2(
    atan(r.z, r.x) / (2.0 * PI) + 0.5,
    acos(clamp(r.y, -1.0, 1.0)) / PI
  );
  vec3 env = texture(uEnvMap, envUv).rgb;

  vec2 envUvDiffuse = vec2(
    atan(n.z, n.x) / (2.0 * PI) + 0.5,
    acos(clamp(n.y, -1.0, 1.0)) / PI
  );
  vec3 envDiffuse = texture(uEnvMap, envUvDiffuse).rgb;

  // Material properties
  float metallic = 0.0;
  float roughness = 0.9;

  // Background flip affects highlight intensity
  float bgFlipRaw = clamp(uValue1, 0.0, 1.0);
  float bgFlip = bgFlipRaw * bgFlipRaw * (3.0 - 2.0 * bgFlipRaw);  // smoothstep
  float highlightBoost = 1.0 + bgFlip * 0.6;

  // Gradient along normal Y with wave variation
  float gradBase = clamp(0.5 + n.y * 0.5, 0.0, 1.0);
  float gradWave =
    sin(n.x * 6.0) * 0.03 +
    sin(n.z * 8.5) * 0.02 +
    sin((n.x + n.z) * 4.0) * 0.015;
  float grad = clamp(gradBase + gradWave, 0.0, 1.0);

  // Very dark albedo (near-black metallic look)
  vec3 albedo = mix(
    vec3(0.004, 0.004, 0.005),
    vec3(0.04, 0.043, 0.048),
    grad
  );

  // Fresnel (Schlick)
  vec3 f0 = mix(vec3(0.04), albedo, metallic);
  float ndv = max(dot(n, v), 0.0);
  vec3 fresnel = f0 + (1.0 - f0) * pow(1.0 - ndv, 5.0);
  float rim = pow(1.0 - ndv, 1.55);

  // Lighting
  vec3 diffuse = (1.0 - metallic) * albedo * envDiffuse * 0.55;
  vec3 specular = env * fresnel * (1.0 - roughness) * 0.08 * highlightBoost;
  vec3 rimLight = envDiffuse * vec3(0.95, 0.98, 1.04) * rim * 0.72 * highlightBoost;

  float baseBrightness = mix(0.48, 0.72, bgFlip);
  vec3 baseColor = (diffuse + specular + rimLight) * baseBrightness;

  // Mask-based white logo regions
  float mask = uHasUv > 0.5 ? texture(uMaskMap, vUv).r : 0.0;
  mask = smoothstep(0.1, 0.9, mask);

  float whiteGrad = clamp(1.0 - vUv.y, 0.0, 1.0);
  vec3 whiteColorDark = mix(
    vec3(0.48, 0.49, 0.51),
    vec3(0.68, 0.69, 0.72),
    whiteGrad
  );
  vec3 whiteColorLight = mix(
    vec3(0.62, 0.63, 0.66),
    vec3(0.82, 0.83, 0.86),
    whiteGrad
  );
  vec3 whiteColor = mix(whiteColorDark, whiteColorLight, bgFlip);
  vec3 whiteShinyColor = whiteColor + (specular + rimLight) * 0.96;

  vec3 color = mix(baseColor, whiteShinyColor, mask);

  // Tonemap (Reinhard) + gamma
  color = color / (color + vec3(1.0));
  color = pow(color, vec3(1.0 / 2.2));

  outColor = vec4(color, 1.0);
}
```

---

## Mouse Trail System

The mouse trail uses a **ping-pong FBO** (two render targets swapped each frame).
Two passes per frame:

### Pass 1: Paint Shader

Draws ink along the mouse movement path with organic fBm edge variation.

**Vertex:**
```glsl
#version 300 es
layout(location = 0) in vec2 aPosition;
out vec2 vUv;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
  vUv = aPosition * 0.5 + 0.5;
}
```

**Fragment:**
```glsl
#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uPrev;
uniform vec2 uMouse;
uniform vec2 uMousePrev;
uniform vec2 uResolution;
uniform float uSpeed;
uniform float uSize;
uniform float uTime;
uniform float uFade;       // default: 0.986
uniform float uRadius;     // default: 0.012
uniform float uStrength;   // default: 0.9
uniform float uCutoff;     // default: 0.0025
out vec4 outColor;

float distanceToSegment(vec2 p, vec2 a, vec2 b) {
  vec2 ab = b - a;
  float l2 = dot(ab, ab);
  if (l2 <= 1e-6) return length(p - a);
  float t = clamp(dot(p - a, ab) / l2, 0.0, 1.0);
  vec2 q = a + t * ab;
  return length(p - q);
}

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash12(i + vec2(0.0, 0.0));
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d2 = hash12(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d2, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 4; i++) {
    v += a * valueNoise(p);
    p = m * p;
    a *= 0.5;
  }
  return v;
}

void main() {
  // Fade previous frame
  vec3 prev = texture(uPrev, vUv).rgb * uFade;

  // Aspect-corrected coordinates
  float aspect = uResolution.x / max(1.0, uResolution.y);
  vec2 p = vec2(vUv.x * aspect, vUv.y);
  vec2 a = vec2(uMousePrev.x * aspect, uMousePrev.y);
  vec2 b = vec2(uMouse.x * aspect, uMouse.y);

  // Distance to mouse movement segment
  float d = distanceToSegment(p, a, b);
  float segmentLen = length(b - a);
  float movementMask = smoothstep(0.00025, 0.0015, segmentLen);

  // Speed-dependent radius
  float speedCurve = clamp(uSize, 0.0, 1.0);
  float dynamicRadius = mix(uRadius, uRadius * 18.0, speedCurve);
  float intensity = movementMask * uStrength;

  // Organic edge variation using warped fBm
  vec2 baseNoiseUv = vUv * vec2(7.0, 4.8) + vec2(uTime * 0.35, -uTime * 0.22);
  float warpX = fbm(baseNoiseUv + vec2(1.7, 5.1));
  float warpY = fbm(baseNoiseUv + vec2(8.3, 2.4));
  vec2 warpedUv = baseNoiseUv + (vec2(warpX, warpY) - 0.5) * 1.35;
  float organic = fbm(warpedUv);
  float edgeNoise = (organic - 0.5) * 2.0;

  float noisyD = d + edgeNoise * dynamicRadius * 0.22;
  float brush = exp(-pow(noisyD / max(0.0001, dynamicRadius), 2.0) * 2.0) * intensity;

  vec3 ink = vec3(brush);
  vec3 trail = clamp(prev + ink, 0.0, 1.0);
  trail = max(trail - vec3(uCutoff), vec3(0.0));

  outColor = vec4(trail, 1.0);
}
```

### Pass 2: Grow/Dissipate Shader

Expands the trail outward and slowly fades it with animated noise.

```glsl
#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uPrev;
uniform vec2 uResolution;
uniform float uGrow;       // default: 0.24
uniform float uDissipate;  // default: 0.992
uniform float uTime;
uniform float uCutoff;
out vec4 outColor;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash12(i + vec2(0.0, 0.0));
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

void main() {
  vec2 texel = 1.0 / max(uResolution, vec2(1.0));
  vec3 c = texture(uPrev, vUv).rgb;

  // Sample all 8 neighbors
  vec3 s1 = texture(uPrev, vUv + vec2( texel.x,  0.0)).rgb;
  vec3 s2 = texture(uPrev, vUv + vec2(-texel.x,  0.0)).rgb;
  vec3 s3 = texture(uPrev, vUv + vec2( 0.0,  texel.y)).rgb;
  vec3 s4 = texture(uPrev, vUv + vec2( 0.0, -texel.y)).rgb;
  vec3 s5 = texture(uPrev, vUv + vec2( texel.x,  texel.y)).rgb;
  vec3 s6 = texture(uPrev, vUv + vec2(-texel.x,  texel.y)).rgb;
  vec3 s7 = texture(uPrev, vUv + vec2( texel.x, -texel.y)).rgb;
  vec3 s8 = texture(uPrev, vUv + vec2(-texel.x, -texel.y)).rgb;

  vec3 neighborMax = max(max(max(s1, s2), max(s3, s4)),
                         max(max(s5, s6), max(s7, s8)));

  // Grow: blend toward neighbor max
  vec3 grown = mix(c, max(c, neighborMax), clamp(uGrow, 0.0, 1.0));

  // Animated noise-modulated dissipation
  vec2 noiseUv = vUv * vec2(5.0, 3.4) + vec2(uTime * 0.18, -uTime * 0.12);
  float n = valueNoise(noiseUv) * 2.0 - 1.0;
  float noisyDissipate = clamp(uDissipate + n * 0.04, 0.0, 1.0);

  vec3 dissipated = grown * noisyDissipate;
  vec3 trail = max(dissipated - vec3(uCutoff), vec3(0.0));

  outColor = vec4(trail, 1.0);
}
```

### Trail Uniforms (passed from JS each frame)

| Uniform | Source | Description |
|---------|--------|-------------|
| `uPrev` | Previous FBO texture | Last frame's trail |
| `uMouse` | `pointer.x, pointer.y` | Current mouse UV (0..1) |
| `uMousePrev` | `prevPointer.x, prevPointer.y` | Previous frame mouse UV |
| `uResolution` | FBO width, height | Trail buffer dimensions |
| `uSpeed` | `hasPointer ? speed : 0` | Pointer movement speed |
| `uSize` | `smoothedSize` | Smoothed speed-based size (0..1) |
| `uTime` | `now * 0.001` | Time in seconds |
| `uFade` | `0.986` | Per-frame fade multiplier |
| `uRadius` | `0.012` | Base brush radius |
| `uStrength` | `0.9` | Brush intensity |
| `uCutoff` | `0.0025` | Minimum threshold |

---

## Post-Processing Chain

The `pq` class manages a chain of fullscreen fragment effects applied after the
scene renders. Each effect reads the previous output + optional extra textures.

### Post-Processing Vertex Shader (shared)

Note: UV is flipped vertically (`* vec2(0.5, -0.5)`) to correct for WebGL's
framebuffer orientation.

```glsl
#version 300 es
in vec2 aPosition;
out vec2 vUv;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
  vUv = aPosition * vec2(0.5, -0.5) + vec2(0.5, 0.5);
}
```

### Fragment Effect Wrapper

When a custom fragment effect provides only an `applyEffect` function (not a
complete shader), the engine wraps it:

```glsl
#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uTexture;
// (any extra texture uniforms, e.g. uniform sampler2D uTrail;)
uniform vec2 uResolution;
uniform float uTime;
uniform float uDelta;
uniform float uPassIndex;
uniform vec4 uUni[4];
out vec4 outColor;

// --- user-provided applyEffect function is inserted here ---

void main() {
  vec4 color = texture(uTexture, vUv);
  outColor = applyEffect(color, vUv, uResolution, uUni);
}
```

### Built-in Post Effects

**Copy (blit):**
```glsl
void main() {
  outColor = texture(uTexture, vUv);
}
```

**Black & White:**
```glsl
void main() {
  vec4 color = texture(uTexture, vUv);
  float luma = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
  outColor = vec4(mix(color.rgb, vec3(luma), clamp(uMix, 0.0, 1.0)), color.a);
}
```

**Bloom (box blur + threshold):**
```glsl
void main() {
  vec2 texel = 1.0 / vec2(textureSize(uTexture, 0));
  vec2 o = texel * max(0.25, uRadius);
  // 3x3 box blur
  vec3 c0 = texture(uTexture, vUv + vec2(-o.x, -o.y)).rgb;
  vec3 c1 = texture(uTexture, vUv + vec2( 0.0, -o.y)).rgb;
  vec3 c2 = texture(uTexture, vUv + vec2( o.x, -o.y)).rgb;
  vec3 c3 = texture(uTexture, vUv + vec2(-o.x,  0.0)).rgb;
  vec3 c4 = texture(uTexture, vUv).rgb;
  vec3 c5 = texture(uTexture, vUv + vec2( o.x,  0.0)).rgb;
  vec3 c6 = texture(uTexture, vUv + vec2(-o.x,  o.y)).rgb;
  vec3 c7 = texture(uTexture, vUv + vec2( 0.0,  o.y)).rgb;
  vec3 c8 = texture(uTexture, vUv + vec2( o.x,  o.y)).rgb;
  vec3 blur = (c0+c1+c2+c3+c4+c5+c6+c7+c8) / 9.0;
  float bright = max(max(blur.r, blur.g), blur.b);
  float mask = smoothstep(uThreshold, 1.0, bright);
  vec3 bloom = blur * mask * max(0.0, uIntensity);
  outColor = vec4(c4 + bloom, 1.0);
}
```

**Noise Grain:**
```glsl
void main() {
  vec4 color = texture(uTexture, vUv);
  vec2 cell = floor(vUv * uScale);
  float cellHash = hash(cell);
  float n = hash(vec2(cellHash, uTime * 1000.0));
  float noise = (n - 0.5) * uAmount;
  vec3 rgb = clamp(color.rgb + noise, 0.0, 1.0);
  outColor = vec4(rgb, color.a);
}
```

---

## Background Flip-Wipe Effect

This effect handles the light/dark mode transition with a wipe animation.
Applied as a fragment post-effect via `addFragmentEffect({ id: "background-flip-wipe" })`.

```glsl
vec4 applyEffect(vec4 color, vec2 uv, vec2 _resolution, vec4 uni[4]) {
  float t = uTime;

  // Smoothstep the flip progress
  float flipRaw = clamp(uni[0].x, 0.0, 1.0);
  float flip = flipRaw * flipRaw * (3.0 - 2.0 * flipRaw);

  // Alpha channel distinguishes background (alpha=0) from model (alpha=1)
  float backgroundMask = 1.0 - color.a;
  float foregroundMask = color.a;

  // Light gradient (revealed during flip)
  float grad = clamp(1.0 - uv.y, 0.0, 1.0);
  float lightMotion = 0.5 + 0.5 * sin(
    uv.x * 3.80 +
    uv.y * 2.20 +
    t * 0.42
  );
  float animatedGrad = clamp(
    grad + (lightMotion - 0.5) * 0.09,
    0.0, 1.0
  );
  vec3 lightGradientA = vec3(0.39, 0.41, 0.46);
  vec3 lightGradientB = vec3(0.72, 0.74, 0.79);
  vec3 lightCol = mix(lightGradientA, lightGradientB, 1.0 - animatedGrad) * 0.92;

  // Wipe line with slight arc
  float wipeBase = -0.14 + flip * 1.22;
  float xFromCenter = (uv.x - 0.5) * 2.0;
  float arcAmount = mix(0.09, 0.002, flip);
  float wipeArc = (1.0 - xFromCenter * xFromCenter) * arcAmount;
  float wipeY = wipeBase + wipeArc;
  float reveal = 1.0 - smoothstep(wipeY - 0.035, wipeY + 0.035, uv.y);

  // Background: replace with light gradient. Model: gentle lift.
  vec3 bgResult = mix(color.rgb, lightCol, reveal);
  vec3 fgResult = color.rgb + color.rgb * reveal * 0.35;
  vec3 outRgb = mix(fgResult, bgResult, backgroundMask);

  // Subtle blue band at wipe edge during transition
  float band = 1.0 - smoothstep(0.0, 0.022, abs(uv.y - wipeY));
  float transitionStrength =
    (1.0 - abs(flip * 2.0 - 1.0)) *
    smoothstep(0.06, 0.14, flip) *
    (1.0 - smoothstep(0.86, 0.96, flip));
  vec3 bandTint = vec3(0.18, 0.55, 1.0) * band * 0.16;
  outRgb = clamp(outRgb + bandTint * transitionStrength * backgroundMask, 0.0, 1.0);

  // Dither to hide banding
  vec2 ditherUv = uv * _resolution + vec2(t * 60.0, t * 37.0);
  float ditherNoise = fract(sin(dot(ditherUv, vec2(12.9898, 78.233))) * 43758.5453);
  float dither = (ditherNoise - 0.5) / 255.0;
  outRgb = clamp(outRgb + vec3(dither) * backgroundMask, 0.0, 1.0);

  return vec4(outRgb, 1.0);
}
```

---

## ASCII Trail-Mix Effect (Core Visual)

**This is the main ASCII/dot-matrix rendering shader.**

Applied as `addFragmentEffect({ id: "ascii-trail-mix", textureUniforms: { uTrail: ... } })`.

### Glyph Rendering Functions

The shader renders ASCII characters procedurally using SDF-like primitives.
Nine glyph levels (0-8) are defined:

| Level | Character | Method |
|-------|-----------|--------|
| 0 | (space) | Returns 0 |
| 1 | `.` | Single dot at center |
| 2 | `:` | Two dots vertically |
| 3 | `+` | Cross (horizontal + vertical lines) |
| 4 | `x` | X shape (two diagonal lines) |
| 5 | `o` | Ring (abs distance from circle) |
| 6 | `#` | Hash (two horizontal + two vertical lines) |
| 7 | `8` | Two overlapping rings |
| 8 | `@` | Ring + center dot + tail line |

```glsl
float glyphStroke(float dist, float radius, float edge) {
  return 1.0 - smoothstep(radius, radius + edge, dist);
}

float glyphDot(vec2 p, vec2 center, float radius) {
  return glyphStroke(length(p - center), radius, 0.03);
}

float glyphLine(vec2 p, vec2 a, vec2 b, float thickness) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  float d = length(pa - ba * h);
  return glyphStroke(d, thickness, 0.02);
}

float glyph(vec2 cellUv, float level) {
  vec2 p = cellUv;
  float c = 0.0;

  if (level < 0.5) {
    return 0.0;                                     // " "
  } else if (level < 1.5) {
    c = glyphDot(p, vec2(0.5, 0.5), 0.08);         // "."
  } else if (level < 2.5) {
    c = max(
      glyphDot(p, vec2(0.5, 0.33), 0.08),
      glyphDot(p, vec2(0.5, 0.68), 0.08)
    );                                               // ":"
  } else if (level < 3.5) {
    c = max(
      glyphLine(p, vec2(0.18, 0.5), vec2(0.82, 0.5), 0.05),
      glyphLine(p, vec2(0.5, 0.18), vec2(0.5, 0.82), 0.05)
    );                                               // "+"
  } else if (level < 4.5) {
    c = max(
      glyphLine(p, vec2(0.2, 0.2), vec2(0.8, 0.8), 0.05),
      glyphLine(p, vec2(0.8, 0.2), vec2(0.2, 0.8), 0.05)
    );                                               // "x"
  } else if (level < 5.5) {
    float ring = abs(length(p - vec2(0.5)) - 0.24);
    c = glyphStroke(ring, 0.06, 0.02);              // "o"
  } else if (level < 6.5) {
    c = max(
      max(
        glyphLine(p, vec2(0.2, 0.32), vec2(0.8, 0.32), 0.045),
        glyphLine(p, vec2(0.2, 0.68), vec2(0.8, 0.68), 0.045)
      ),
      max(
        glyphLine(p, vec2(0.32, 0.2), vec2(0.32, 0.8), 0.045),
        glyphLine(p, vec2(0.68, 0.2), vec2(0.68, 0.8), 0.045)
      )
    );                                               // "#"
  } else if (level < 7.5) {
    float ringTop = abs(length(p - vec2(0.5, 0.37)) - 0.16);
    float ringBottom = abs(length(p - vec2(0.5, 0.65)) - 0.16);
    c = max(
      glyphStroke(ringTop, 0.05, 0.02),
      glyphStroke(ringBottom, 0.05, 0.02)
    );                                               // "8"
  } else {
    float ring = abs(length(p - vec2(0.5)) - 0.24);
    float core = glyphDot(p, vec2(0.52, 0.48), 0.09);
    float tail = glyphLine(p, vec2(0.55, 0.55), vec2(0.82, 0.76), 0.045);
    c = max(max(glyphStroke(ring, 0.06, 0.02), core), tail);  // "@"
  }

  return clamp(c, 0.0, 1.0);
}
```

### Main ASCII Effect

```glsl
vec4 applyEffect(vec4 color, vec2 uv, vec2 resolution, vec4 uni[4]) {
  vec2 sourceUv = uv;

  // Grid cell calculation (10px cells)
  float cellSizePx = 10.0;
  vec2 grid = floor((sourceUv * resolution) / cellSizePx);
  vec2 cellUv = fract((sourceUv * resolution) / cellSizePx);
  vec2 sampleUv = ((grid + 0.5) * cellSizePx) / resolution;

  // Sample scene at cell center
  vec2 textureSampleUv = vec2(sampleUv.x, sampleUv.y);
  vec3 sampled = texture(uTexture, textureSampleUv).rgb;

  // RGB shift for chromatic aberration (10.2px horizontal shift)
  vec2 shift = vec2(10.20 / resolution.x, 0.0);
  vec3 shiftedSampled = vec3(
    texture(uTexture, textureSampleUv + shift).r,
    texture(uTexture, textureSampleUv).g,
    texture(uTexture, textureSampleUv - shift).b
  );

  // Sample trail at ASCII cell resolution (quantized, not per-pixel)
  vec2 trailSampleUv = vec2(sampleUv.x, 1.0 - sampleUv.y);
  float trail = texture(uTrail, trailSampleUv).r;

  // Map trail intensity to glyph complexity (9 levels)
  float trailForGlyph = clamp(pow(trail, 0.9), 0.0, 1.0);
  float level = floor(trailForGlyph * 8.0 + 0.5);
  float charMask = glyph(cellUv, level);

  // Reuse wipe math to determine dark/light region
  float flipRaw = clamp(uni[0].x, 0.0, 1.0);
  float flip = flipRaw * flipRaw * (3.0 - 2.0 * flipRaw);
  float wipeBase = -0.14 + flip * 1.22;
  float xFromCenter = (uv.x - 0.5) * 2.0;
  float arcAmount = mix(0.09, 0.002, flip);
  float wipeArc = (1.0 - xFromCenter * xFromCenter) * arcAmount;
  float wipeY = wipeBase + wipeArc;
  float lightness = 1.0 - smoothstep(wipeY - 0.035, wipeY + 0.035, uv.y);

  // Dark mode colors (default state)
  vec3 bgDark = sampled * 0.18 + vec3(0.015);
  vec3 fgDark = clamp(shiftedSampled * 1.45 + vec3(0.08), 0.0, 1.0);

  // Light mode colors (revealed by wipe)
  vec3 bgLight = clamp(sampled * 1.06 + vec3(0.015), 0.0, 1.0);
  float shiftedLuma = dot(shiftedSampled, vec3(0.2126, 0.7152, 0.0722));
  vec3 shiftedChroma = shiftedSampled - vec3(shiftedLuma);
  vec3 fgLight = clamp(vec3(0.07) + shiftedChroma * 2.6, 0.0, 1.0);

  // Blend dark/light based on wipe position
  vec3 bg = mix(bgDark, bgLight, lightness);
  vec3 fg = mix(fgDark, fgLight, lightness);

  // Composite: glyph mask selects between bg and fg
  vec3 asciiRgb = mix(bg, fg, charMask);

  // Only apply ASCII where trail exists (threshold: 0.14)
  float asciiMask = step(0.14, trail);
  vec3 mixed = mix(color.rgb, asciiRgb, asciiMask);

  return vec4(mixed, color.a);
}
```

---

## Utility Shaders

### Screen Quad Vertex (function `Dq` / `Oq` / `Nq`)

Multiple copies exist with identical code:

```glsl
#version 300 es
in vec2 aPosition;
in vec2 aUv;
out vec2 vUv;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
  vUv = aUv;
}
```

### Textured Screen Fragment (function `fU`)

Used for screen quads with texture + noise distortion:

```glsl
#version 300 es
precision highp float;
in vec2 vUv;
uniform vec4 uUni[4];
uniform sampler2D uTexture;
out vec4 outColor;

float hash21(vec2 p) {
  vec2 q = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(q.x + q.y) * 43758.5453);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i + vec2(0.0, 0.0));
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

void main() {
  float time = uUni[0].w;
  vec2 uv = vUv * uUni[1].xy + uUni[1].zw;
  vec2 noiseUv = uv * 9.0 + vec2(time * 0.35, time * 0.22);
  float n = valueNoise(noiseUv);
  float offset = (n - 0.5) * 0.035;
  vec2 distortedUv = uv + vec2(offset, -offset * 0.65);
  outColor = texture(uTexture, distortedUv);
}
```

### Debug UV Fragment (function `hU`)

```glsl
#version 300 es
precision highp float;
in vec2 vUv;
uniform vec4 uUni[4];
out vec4 outColor;
void main() {
  outColor = vec4(vUv, max(0.0, uUni[0].x), 1.0);
}
```

### Model Normal-Only Fragment (function `rU`)

```glsl
#version 300 es
precision highp float;
in vec3 vNormal;
in vec2 vUv;
out vec4 outColor;
void main() {
  outColor = vec4(
    mix(normalize(vNormal) * 0.5 + vec3(0.5), vec3(vUv, 0.0), 0.0),
    1.0
  );
}
```

---

## Mouse Position System

### MouseEaser (`uJ` class, created via `V9()`)

Normalizes pointer position to [-1, 1] range with configurable easing.
Supports drag with inertia and auto-recenter after release.

**Key parameters:**
- `easing`: 0.12 (lerp factor per frame)
- `dragSensitivity`: 0.9
- `releaseInertiaDamping`: 0.9
- `releaseInertiaBoost`: 0.7
- `recenterDurationFrames`: 64

**Output state:**
```typescript
{
  x: number,        // eased mouse X [-1, 1]
  y: number,        // eased mouse Y [-1, 1]
  targetX: number,  // raw mouse X
  targetY: number,  // raw mouse Y
  dragX: number,    // eased drag offset
  dragY: number,    // eased drag offset
  isDragging: boolean,
  hasPointer: boolean
}
```

### MouseTrail (`mJ` class, created via `dJ()`)

**Constructor params:**
- `element`: canvas element
- `eventElement`: window
- `resolutionScale`: 0.75 (trail rendered at 75% resolution)
- `fade`: 0.986 (per-frame decay)
- `radius`: 0.012 (brush radius in UV space)
- `strength`: 0.9 (ink intensity)
- `cutoff`: 0.0025 (minimum brightness threshold)
- `growth`: 0.24 (neighbor-max expansion rate)
- `dissipate`: 0.992 (slow global fade)

Pointer position is read via `pointermove` events, converted to UV (0..1) space.
The trail system runs in `onPostRender` (after the scene renders, before post-effects).

---

## Key Algorithm Insights

### How the ASCII Effect Works

1. **Grid Quantization**: The screen is divided into a grid of 10x10 pixel cells.
   Each cell samples the scene color at its center point (not per-pixel).

2. **Trail-Driven Glyph Selection**: The mouse trail texture (grayscale, 0-1) is
   sampled at the same quantized cell position. The trail value is mapped to one
   of 9 procedural glyphs (space, `.`, `:`, `+`, `x`, `o`, `#`, `8`, `@`) using
   `floor(trail^0.9 * 8 + 0.5)`.

3. **Procedural SDF Glyphs**: Characters are rendered using signed-distance-field
   primitives (dots, lines, rings). The `cellUv` (0-1 within each cell) is used
   to evaluate the glyph shape at each pixel.

4. **Chromatic Aberration**: The scene color is sampled with a 10.2px horizontal
   RGB shift (R shifted right, B shifted left, G centered) to create a
   chromatic aberration effect on the ASCII foreground.

5. **Dark/Light Mode Blending**: The wipe position determines whether each pixel
   uses dark-mode or light-mode color palettes for both background and foreground
   of the ASCII cells.

6. **Threshold Gating**: The ASCII effect is only applied where the trail value
   exceeds 0.14 (`step(0.14, trail)`). Below that, the original scene color
   shows through unmodified.

### Rendering Order

```
Frame N:
  1. Clear canvas
  2. Render screen quad (dark gradient background, alpha=0)
  3. Render 3D GLB model (PBR shading, alpha=1)
  4. Post-render: Update mouse trail (paint + grow passes)
  5. Post-process effect 1: background-flip-wipe (light/dark transition)
  6. Post-process effect 2: ascii-trail-mix (ASCII overlay)
  7. Post-process effect 3: noise grain (0.03 amount)
  8. Final blit to canvas
```

### How the 3D Logo is Loaded

1. GLB binary fetched from `/cogochi/logo.glb`
2. Parsed for mesh data (positions, normals, UVs, indices)
3. Environment map procedurally generated (fake HDRI via 2D canvas)
4. Mask texture loaded from `/cogochi/empty.png` (white regions of logo)
5. Animated per frame:
   - Mouse position drives rotation (X/Y axes)
   - Scroll velocity drives Y offset + X/Z rotation
   - Fast scroll triggers a flip animation (PI rotation over 0.85s)
   - Idle state: sinusoidal float + gentle rotation

### How Uniforms Flow

| Uniform | Packed Location | Source |
|---------|----------------|--------|
| `uUni[0].x` (value1) | `uni[0].x` | `backgroundFlipProgress` (0..1) |
| `uUni[0].w` | - | `performance.now() * 0.001` (time) |
| `uTime` | standalone | `now * 0.001` from render context |
| `uResolution` | standalone | Canvas width/height |
| `uTexture` | TEXTURE0 | Previous post-effect output |
| `uTrail` | TEXTURE1 | Mouse trail FBO texture |
