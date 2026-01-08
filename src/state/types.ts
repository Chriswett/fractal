export type FractalType =
  | "mandelbrot"
  | "multibrot3"
  | "tricorn"
  | "burning-ship"
  | "julia"
  | "tricorn-julia"
  | "burning-ship-julia"
  | "newton-z3"
  | "halley-z3"
  | "newton-sin";

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

export type EscapeTimeParams = {
  maxIter: number;
  escapeRadius: number;
  parameter: number;
};

export type JuliaParams = EscapeTimeParams & {
  cRe: number;
  cIm: number;
};

export type NewtonParams = {
  maxIter: number;
  tolerance: number;
  parameter: number;
};

export type FractalParams = EscapeTimeParams | JuliaParams | NewtonParams;

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

export type Journey = {
  id: string;
  name: string;
  kind: "user";
  scene: Scene;
  timeline: Timeline;
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
  timelinePlaying: boolean;
  activeJourneyId: string | null;
};

export type AppState = {
  scene: Scene;
  presets: {
    builtins: Preset[];
    users: Preset[];
  };
  timeline: Timeline;
  journeys: {
    users: Journey[];
  };
  ui: UiPreferences;
  renderRequestId: number;
  renderHint: RenderQualityHint;
};
