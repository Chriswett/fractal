export type FractalType = "mandelbrot" | "julia" | "sierpinski" | "koch";

export type RGBA = {
  r: number;
  g: number;
  b: number;
  a: number;
};

export type GradientStop = {
  t: number;
  color: RGBA;
};

export type Viewport = {
  centerX: number;
  centerY: number;
  scale: number;
  rotation?: number;
};

export type MandelbrotParams = {
  maxIter: number;
  escapeRadius: number;
};

export type JuliaParams = MandelbrotParams & {
  cRe: number;
  cIm: number;
};

export type SierpinskiParams = {
  depth: number;
};

export type KochParams = {
  depth: number;
  variant?: "curve" | "snowflake";
};

export type FractalParams = MandelbrotParams | JuliaParams | SierpinskiParams | KochParams;

export type ColorProfile = {
  gradientStops: GradientStop[];
  smoothColoring: boolean;
  gamma: number;
  levels: { black: number; white: number };
  hueShift: number;
  saturation: number;
  exposure?: number;
  dither?: boolean;
};

export type RenderSettings = {
  resolutionScale: number;
  progressive: { enabled: boolean; tileSizes: number[] };
  qualityHint: "interactive" | "final";
};

export type Scene = {
  id: string;
  fractalType: FractalType;
  params: FractalParams;
  viewport: Viewport;
  color: ColorProfile;
  render: RenderSettings;
};

export type Preset = {
  id: string;
  name: string;
  kind: "builtin" | "user";
  scene: Scene;
  tags?: string[];
  thumbnail?: string;
};

export type Timeline = {
  durationMs: number;
  keyframes: Keyframe[];
};

export type Keyframe = {
  t: number;
  viewport: Viewport;
};

export type RenderQualityHint = "interactive" | "final";

export type UiPreferences = {
  activePanel: "gallery" | "color" | "timeline" | "export";
  showAdvancedColor: boolean;
};

export type AppState = {
  scene: Scene;
  presets: {
    builtins: Preset[];
    users: Preset[];
  };
  timeline: Timeline;
  ui: UiPreferences;
  renderRequestId: number;
  renderHint: RenderQualityHint;
};
