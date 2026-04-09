/** WebGL 2 helpers: shader compilation, FBO management, texture loading. */

export function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const s = gl.createShader(type);
  if (!s) throw new Error('createShader failed');
  gl.shaderSource(s, source);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(s);
    gl.deleteShader(s);
    throw new Error(`Shader compile: ${log}`);
  }
  return s;
}

export function linkProgram(gl: WebGL2RenderingContext, vert: string, frag: string): WebGLProgram {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vert);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, frag);
  const p = gl.createProgram()!;
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(p);
    gl.deleteProgram(p);
    throw new Error(`Program link: ${log}`);
  }
  return p;
}

export interface FBO {
  fb: WebGLFramebuffer;
  tex: WebGLTexture;
  w: number;
  h: number;
}

export function createFBO(gl: WebGL2RenderingContext, w: number, h: number, useFloat: boolean): FBO {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  if (useFloat) {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
  } else {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  }
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const fb = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { fb, tex, w, h };
}

function destroyFBO(gl: WebGL2RenderingContext, fbo: FBO): void {
  gl.deleteFramebuffer(fbo.fb);
  gl.deleteTexture(fbo.tex);
}

export interface PingPong {
  read: FBO;
  write: FBO;
  swap(): void;
  resize(w: number, h: number): void;
  destroy(): void;
}

export function createPingPong(gl: WebGL2RenderingContext, w: number, h: number, useFloat: boolean): PingPong {
  let a = createFBO(gl, w, h, useFloat);
  let b = createFBO(gl, w, h, useFloat);
  return {
    get read() { return a; },
    get write() { return b; },
    swap() { [a, b] = [b, a]; },
    resize(nw: number, nh: number) {
      destroyFBO(gl, a);
      destroyFBO(gl, b);
      a = createFBO(gl, nw, nh, useFloat);
      b = createFBO(gl, nw, nh, useFloat);
    },
    destroy() { destroyFBO(gl, a); destroyFBO(gl, b); },
  };
}

/** Fullscreen triangle VAO (3 vertices, covers NDC [-1,1]). */
export function createFullscreenTriangle(gl: WebGL2RenderingContext): WebGLVertexArrayObject {
  const vao = gl.createVertexArray()!;
  gl.bindVertexArray(vao);
  const buf = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);
  return vao;
}

/** Load an image as a WebGL texture (Y-flipped for GL convention). */
export function loadTexture(gl: WebGL2RenderingContext, src: string): Promise<WebGLTexture> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const tex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindTexture(gl.TEXTURE_2D, null);
      resolve(tex);
    };
    img.onerror = () => reject(new Error(`Failed to load: ${src}`));
    img.src = src;
  });
}
