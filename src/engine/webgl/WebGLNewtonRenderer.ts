import { ColorProfile, FractalType, RenderQualityHint, Scene } from "../../state/types";
import { nextFrame } from "../../utils/async";
import { IFractalRenderer, RenderPass, RenderRequest, RenderStillRequest } from "../types";

const MAX_STOPS = 8;

const vertexSource = `#version 300 es
in vec2 aPosition;
out vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const fragmentSource = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 outColor;

uniform vec2 uResolution;
uniform vec2 uCenter;
uniform float uScale;
uniform float uRotation;
uniform int uMaxIter;
uniform float uTolerance;
uniform int uFractalKind;
uniform float uParameter;

uniform int uStopCount;
uniform float uStopT[${MAX_STOPS}];
uniform vec4 uStopColor[${MAX_STOPS}];

uniform int uSmooth;
uniform float uGamma;
uniform float uBlack;
uniform float uWhite;
uniform float uHueShift;
uniform float uSaturation;
uniform float uExposure;
uniform int uDither;

vec3 hueToRgb(float p, float q, float t) {
  float tt = t;
  if (tt < 0.0) tt += 1.0;
  if (tt > 1.0) tt -= 1.0;
  if (tt < 1.0 / 6.0) return vec3(p + (q - p) * 6.0 * tt);
  if (tt < 1.0 / 2.0) return vec3(q);
  if (tt < 2.0 / 3.0) return vec3(p + (q - p) * (2.0 / 3.0 - tt) * 6.0);
  return vec3(p);
}

vec3 hslToRgb(vec3 hsl) {
  float h = hsl.x;
  float s = hsl.y;
  float l = hsl.z;
  if (s == 0.0) {
    return vec3(l);
  }
  float q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
  float p = 2.0 * l - q;
  vec3 rgb;
  rgb.r = hueToRgb(p, q, h + 1.0 / 3.0).r;
  rgb.g = hueToRgb(p, q, h).r;
  rgb.b = hueToRgb(p, q, h - 1.0 / 3.0).r;
  return rgb;
}

vec3 rgbToHsl(vec3 color) {
  float maxc = max(color.r, max(color.g, color.b));
  float minc = min(color.r, min(color.g, color.b));
  float h = 0.0;
  float s = 0.0;
  float l = (maxc + minc) * 0.5;
  if (maxc != minc) {
    float d = maxc - minc;
    s = l > 0.5 ? d / (2.0 - maxc - minc) : d / (maxc + minc);
    if (maxc == color.r) {
      h = (color.g - color.b) / d + (color.g < color.b ? 6.0 : 0.0);
    } else if (maxc == color.g) {
      h = (color.b - color.r) / d + 2.0;
    } else {
      h = (color.r - color.g) / d + 4.0;
    }
    h /= 6.0;
  }
  return vec3(h, s, l);
}

vec3 applyColorAdjust(vec3 color) {
  float exposureScale = pow(2.0, uExposure);
  color *= exposureScale;
  color = clamp((color - vec3(uBlack)) / max(0.0001, (uWhite - uBlack)), 0.0, 1.0);
  color = pow(color, vec3(1.0 / max(uGamma, 0.01)));
  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  color = vec3(luma) + (color - vec3(luma)) * uSaturation;
  vec3 hsl = rgbToHsl(color);
  hsl.x = fract(hsl.x + uHueShift / 360.0);
  color = hslToRgb(hsl);
  return color;
}

vec3 sampleGradient(float t) {
  float tt = clamp(t, 0.0, 1.0);
  vec3 color = uStopColor[0].rgb;
  for (int i = 0; i < ${MAX_STOPS} - 1; i++) {
    if (i >= uStopCount - 1) {
      break;
    }
    float t0 = uStopT[i];
    float t1 = uStopT[i + 1];
    if (tt >= t0 && tt <= t1) {
      float localT = (tt - t0) / max(0.0001, (t1 - t0));
      color = mix(uStopColor[i].rgb, uStopColor[i + 1].rgb, localT);
      return color;
    }
  }
  return color;
}

vec2 cMul(vec2 a, vec2 b) {
  return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
}

vec2 cDiv(vec2 a, vec2 b) {
  float denom = max(1e-12, b.x * b.x + b.y * b.y);
  return vec2((a.x * b.x + a.y * b.y) / denom, (a.y * b.x - a.x * b.y) / denom);
}

vec2 cSin(vec2 z) {
  return vec2(sin(z.x) * cosh(z.y), cos(z.x) * sinh(z.y));
}

vec2 cCos(vec2 z) {
  return vec2(cos(z.x) * cosh(z.y), -sin(z.x) * sinh(z.y));
}

void main() {
  vec2 pixel = gl_FragCoord.xy - 0.5 * uResolution;
  float cosR = cos(uRotation);
  float sinR = sin(uRotation);
  vec2 rotated = vec2(pixel.x * cosR - pixel.y * sinR, pixel.x * sinR + pixel.y * cosR);
  vec2 z = uCenter + rotated * uScale;

  float iter = float(uMaxIter);
  int rootId = -1;

  float phase = radians(uParameter);
  float rootPhase = phase / 3.0;
  vec2 rootRot = vec2(cos(rootPhase), sin(rootPhase));

  vec2 roots[3];
  roots[0] = vec2(
    1.0 * rootRot.x - 0.0 * rootRot.y,
    1.0 * rootRot.y + 0.0 * rootRot.x
  );
  roots[1] = vec2(
    -0.5 * rootRot.x - 0.8660254 * rootRot.y,
    -0.5 * rootRot.y + 0.8660254 * rootRot.x
  );
  roots[2] = vec2(
    -0.5 * rootRot.x - -0.8660254 * rootRot.y,
    -0.5 * rootRot.y + -0.8660254 * rootRot.x
  );

  for (int i = 0; i < 2000; i++) {
    if (i >= uMaxIter) {
      break;
    }

    vec2 f;
    vec2 fp;
    vec2 fpp;

    if (uFractalKind == 2) {
      vec2 zShift = z + vec2(phase, 0.0);
      f = cSin(zShift);
      fp = cCos(zShift);
      fpp = vec2(0.0);
    } else {
      vec2 z2 = cMul(z, z);
      vec2 z3 = cMul(z2, z);
      vec2 constant = vec2(cos(phase), sin(phase));
      f = z3 - constant;
      fp = 3.0 * z2;
      fpp = 6.0 * z;
    }

    if (length(f) < uTolerance) {
      iter = float(i);
      if (uFractalKind == 2) {
        float n = round(z.x / 3.14159265);
        float group = mod(abs(n), 3.0);
        rootId = int(group);
      } else {
        float d0 = length(z - roots[0]);
        float d1 = length(z - roots[1]);
        float d2 = length(z - roots[2]);
        if (d0 <= d1 && d0 <= d2) {
          rootId = 0;
        } else if (d1 <= d2) {
          rootId = 1;
        } else {
          rootId = 2;
        }
      }
      break;
    }

    if (uFractalKind == 1) {
      vec2 numerator = 2.0 * cMul(f, fp);
      vec2 denom = cMul(vec2(2.0, 0.0), cMul(fp, fp)) - cMul(f, fpp);
      z = z - cDiv(numerator, denom);
    } else {
      z = z - cDiv(f, fp);
    }
  }

  float t = iter / float(uMaxIter);
  vec3 gradient = sampleGradient(t);
  vec3 rootColors[3];
  rootColors[0] = vec3(0.95, 0.33, 0.2);
  rootColors[1] = vec3(0.2, 0.75, 0.7);
  rootColors[2] = vec3(0.95, 0.82, 0.3);

  vec3 color;
  if (rootId < 0) {
    color = applyColorAdjust(gradient * 0.08);
  } else {
    vec3 base = rootColors[rootId];
    color = mix(base, gradient, 0.35);
    color = applyColorAdjust(color);
  }

  if (uDither == 1) {
    float noise = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
    color += (noise - 0.5) / 255.0;
  }

  outColor = vec4(color, 1.0);
}`;

export class WebGLNewtonRenderer implements IFractalRenderer {
  private gl: WebGL2RenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private uniformLocations: Record<string, WebGLUniformLocation | null> = {};
  private activeJobId = 0;

  async render(request: RenderRequest) {
    this.activeJobId = request.jobId;
    await this.renderInternal(request.canvas, request.scene, request.qualityHint, request.pass, request.signal, request.jobId);
  }

  async renderStill(request: RenderStillRequest) {
    await this.renderInternal(request.canvas, request.scene, request.qualityHint, null, null, null);
  }

  private async renderInternal(
    canvas: HTMLCanvasElement,
    scene: Scene,
    qualityHint: RenderQualityHint,
    pass: RenderPass | null,
    signal: AbortSignal | null,
    jobId: number | null
  ) {
    if (signal?.aborted || (jobId !== null && jobId !== this.activeJobId)) {
      return;
    }

    const gl = this.ensureContext(canvas);
    if (!gl) {
      return;
    }

    const resolutionScale = Math.max(1, pass?.resolutionScale ?? scene.render.resolutionScale);
    this.resizeCanvas(canvas, scene, resolutionScale);

    if (signal?.aborted || (jobId !== null && jobId !== this.activeJobId)) {
      return;
    }

    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);

    const { viewport, params, color } = scene;
    const maxIter = "maxIter" in params ? params.maxIter : 120;
    const tolerance = "tolerance" in params ? params.tolerance : 1e-6;
    const parameter = "parameter" in params ? params.parameter : 0;
    const fractalKind = getNewtonFractalKind(scene.fractalType);
    const iterValue = Math.max(20, Math.floor(maxIter * (qualityHint === "interactive" ? 0.6 : 1)));

    gl.uniform2f(this.uniformLocations.uResolution, gl.canvas.width, gl.canvas.height);
    gl.uniform2f(this.uniformLocations.uCenter, viewport.centerX, viewport.centerY);
    gl.uniform1f(this.uniformLocations.uScale, viewport.scale * resolutionScale);
    gl.uniform1f(this.uniformLocations.uRotation, viewport.rotation ?? 0);
    gl.uniform1i(this.uniformLocations.uMaxIter, iterValue);
    gl.uniform1f(this.uniformLocations.uTolerance, tolerance);
    gl.uniform1i(this.uniformLocations.uFractalKind, fractalKind);
    gl.uniform1f(this.uniformLocations.uParameter, parameter);

    this.applyColorProfile(gl, color);

    const width = gl.canvas.width;
    const height = gl.canvas.height;
    const tileSize = Math.max(1, Math.floor(pass?.tileSize ?? 1));
    const useTiling = qualityHint === "final" && tileSize >= 4;

    if (!useTiling) {
      gl.disable(gl.SCISSOR_TEST);
      gl.viewport(0, 0, width, height);
      if (signal?.aborted || (jobId !== null && jobId !== this.activeJobId)) {
        return;
      }
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      return;
    }

    const tilesX = Math.max(1, Math.ceil(width / tileSize));
    const tilesY = Math.max(1, Math.ceil(height / tileSize));
    const shouldYield = tilesX * tilesY > 512;

    gl.enable(gl.SCISSOR_TEST);

    for (let ty = 0; ty < tilesY; ty += 1) {
      for (let tx = 0; tx < tilesX; tx += 1) {
        if (signal?.aborted || (jobId !== null && jobId !== this.activeJobId)) {
          gl.disable(gl.SCISSOR_TEST);
          return;
        }
        const x = tx * tileSize;
        const y = ty * tileSize;
        const w = Math.min(tileSize, width - x);
        const h = Math.min(tileSize, height - y);
        gl.viewport(x, y, w, h);
        gl.scissor(x, y, w, h);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
      if (shouldYield && ty % 4 === 3) {
        await nextFrame();
      }
    }

    gl.disable(gl.SCISSOR_TEST);
    gl.viewport(0, 0, width, height);
  }

  private applyColorProfile(gl: WebGL2RenderingContext, profile: ColorProfile) {
    const stops = profile.gradientStops.slice(0, MAX_STOPS);
    const count = Math.max(1, stops.length);
    const stopT = new Float32Array(MAX_STOPS);
    const stopColor = new Float32Array(MAX_STOPS * 4);

    for (let i = 0; i < MAX_STOPS; i += 1) {
      const stop = stops[i] ?? stops[stops.length - 1];
      stopT[i] = stop.t;
      stopColor[i * 4] = stop.color.r;
      stopColor[i * 4 + 1] = stop.color.g;
      stopColor[i * 4 + 2] = stop.color.b;
      stopColor[i * 4 + 3] = stop.color.a;
    }

    gl.uniform1i(this.uniformLocations.uStopCount, count);
    gl.uniform1fv(this.uniformLocations.uStopT, stopT);
    gl.uniform4fv(this.uniformLocations.uStopColor, stopColor);
    gl.uniform1i(this.uniformLocations.uSmooth, profile.smoothColoring ? 1 : 0);
    gl.uniform1f(this.uniformLocations.uGamma, profile.gamma);
    gl.uniform1f(this.uniformLocations.uBlack, profile.levels.black);
    gl.uniform1f(this.uniformLocations.uWhite, profile.levels.white);
    gl.uniform1f(this.uniformLocations.uHueShift, profile.hueShift);
    gl.uniform1f(this.uniformLocations.uSaturation, profile.saturation);
    gl.uniform1f(this.uniformLocations.uExposure, profile.exposure ?? 0);
    gl.uniform1i(this.uniformLocations.uDither, profile.dither ? 1 : 0);
  }

  private ensureContext(canvas: HTMLCanvasElement) {
    if (this.gl && this.gl.canvas === canvas) {
      return this.gl;
    }

    const gl = canvas.getContext("webgl2", { antialias: false, preserveDrawingBuffer: true });
    if (!gl) {
      return null;
    }

    const program = createProgram(gl, vertexSource, fragmentSource);
    if (!program) {
      return null;
    }

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    const vertices = new Float32Array([
      -1, -1,
      1, -1,
      -1, 1,
      -1, 1,
      1, -1,
      1, 1
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const location = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);

    this.gl = gl;
    this.program = program;
    this.vao = vao;
    this.uniformLocations = {
      uResolution: gl.getUniformLocation(program, "uResolution"),
      uCenter: gl.getUniformLocation(program, "uCenter"),
      uScale: gl.getUniformLocation(program, "uScale"),
      uRotation: gl.getUniformLocation(program, "uRotation"),
      uMaxIter: gl.getUniformLocation(program, "uMaxIter"),
      uTolerance: gl.getUniformLocation(program, "uTolerance"),
      uFractalKind: gl.getUniformLocation(program, "uFractalKind"),
      uParameter: gl.getUniformLocation(program, "uParameter"),
      uStopCount: gl.getUniformLocation(program, "uStopCount"),
      uStopT: gl.getUniformLocation(program, "uStopT"),
      uStopColor: gl.getUniformLocation(program, "uStopColor"),
      uSmooth: gl.getUniformLocation(program, "uSmooth"),
      uGamma: gl.getUniformLocation(program, "uGamma"),
      uBlack: gl.getUniformLocation(program, "uBlack"),
      uWhite: gl.getUniformLocation(program, "uWhite"),
      uHueShift: gl.getUniformLocation(program, "uHueShift"),
      uSaturation: gl.getUniformLocation(program, "uSaturation"),
      uExposure: gl.getUniformLocation(program, "uExposure"),
      uDither: gl.getUniformLocation(program, "uDither")
    };

    gl.useProgram(program);
    gl.clearColor(0, 0, 0, 1);

    return gl;
  }

  private resizeCanvas(
    canvas: HTMLCanvasElement,
    scene: Scene,
    resolutionScale: number | undefined
  ) {
    const dpr = window.devicePixelRatio || 1;
    const scale = Math.max(1, resolutionScale ?? scene.render.resolutionScale);
    const clientWidth = canvas.clientWidth || canvas.width || 1;
    const clientHeight = canvas.clientHeight || canvas.height || 1;
    const width = Math.max(1, Math.floor(clientWidth * dpr / scale));
    const height = Math.max(1, Math.floor(clientHeight * dpr / scale));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  }
}

function createShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) {
    return null;
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGL2RenderingContext, vertex: string, fragment: string) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertex);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragment);
  if (!vertexShader || !fragmentShader) {
    return null;
  }
  const program = gl.createProgram();
  if (!program) {
    return null;
  }
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  return program;
}

function getNewtonFractalKind(type: FractalType) {
  switch (type) {
    case "halley-z3":
      return 1;
    case "newton-sin":
      return 2;
    case "newton-z3":
    default:
      return 0;
  }
}
