import { ColorProfile, RenderSettings, Scene, Viewport } from "./types";
import { createId } from "../utils/id";

export const defaultViewport: Viewport = {
  centerX: 0,
  centerY: 0,
  scale: 0.005
};

export const defaultColorProfile: ColorProfile = {
  gradientStops: [
    { t: 0, color: { r: 0.02, g: 0.03, b: 0.05, a: 1 } },
    { t: 0.35, color: { r: 0.12, g: 0.4, b: 0.48, a: 1 } },
    { t: 0.7, color: { r: 0.96, g: 0.82, b: 0.52, a: 1 } },
    { t: 1, color: { r: 0.92, g: 0.28, b: 0.12, a: 1 } }
  ],
  smoothColoring: true,
  gamma: 1,
  levels: { black: 0, white: 1 },
  hueShift: 0,
  saturation: 1,
  exposure: 0,
  dither: false
};

export const defaultRenderSettings: RenderSettings = {
  resolutionScale: 1,
  progressive: { enabled: true, tileSizes: [16, 8, 4, 2, 1] },
  qualityHint: "final"
};

export const defaultScene: Scene = {
  id: createId("scene"),
  fractalType: "mandelbrot",
  params: { maxIter: 300, escapeRadius: 4, parameter: 0 },
  viewport: defaultViewport,
  color: defaultColorProfile,
  render: defaultRenderSettings
};
