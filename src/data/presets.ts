import { gradients } from "./gradients";
import { createId } from "../utils/id";
import { defaultRenderSettings } from "../state/defaults";
import { Preset, Scene } from "../state/types";

function makeScene(partial: Partial<Scene>): Scene {
  return {
    id: createId("scene"),
    fractalType: "mandelbrot",
    params: { maxIter: 300, escapeRadius: 4, parameter: 0 },
    viewport: { centerX: 0, centerY: 0, scale: 0.005 },
    color: {
      gradientStops: cloneStops(gradients[0].stops),
      smoothColoring: true,
      gamma: 1,
      levels: { black: 0, white: 1 },
      hueShift: 0,
      saturation: 1,
      exposure: 0,
      dither: false
    },
    render: {
      ...defaultRenderSettings,
      progressive: {
        ...defaultRenderSettings.progressive,
        tileSizes: [...defaultRenderSettings.progressive.tileSizes]
      }
    },
    ...partial
  };
}

function cloneStops(stops: typeof gradients[number]["stops"]) {
  return stops.map((stop) => ({ t: stop.t, color: { ...stop.color } }));
}

function preset(name: string, scene: Scene, tags: string[] = []): Preset {
  return {
    id: createId("preset"),
    name,
    kind: "builtin",
    scene,
    tags
  };
}

const baseColor = makeScene({}).color;

function withGradient(index: number) {
  return { ...baseColor, gradientStops: cloneStops(gradients[index].stops) };
}

export const builtinPresets: Preset[] = [
  preset(
    "Mandelbrot Classic",
    makeScene({
      fractalType: "mandelbrot",
      params: { maxIter: 320, escapeRadius: 4, parameter: 0 },
      viewport: { centerX: -0.5, centerY: 0, scale: 0.005 },
      color: withGradient(0)
    }),
    ["mandelbrot"]
  ),
  preset(
    "Seahorse Valley",
    makeScene({
      fractalType: "mandelbrot",
      params: { maxIter: 480, escapeRadius: 4, parameter: 0 },
      viewport: { centerX: -0.75, centerY: 0.1, scale: 0.0009 },
      color: withGradient(1)
    }),
    ["mandelbrot"]
  ),
  preset(
    "Multibrot Trio",
    makeScene({
      fractalType: "multibrot3",
      params: { maxIter: 360, escapeRadius: 4, parameter: 0 },
      viewport: { centerX: 0, centerY: 0, scale: 0.005 },
      color: withGradient(3)
    }),
    ["multibrot3"]
  ),
  preset(
    "Multibrot Crescent",
    makeScene({
      fractalType: "multibrot3",
      params: { maxIter: 420, escapeRadius: 4, parameter: 0 },
      viewport: { centerX: -0.3, centerY: 0.25, scale: 0.0016 },
      color: withGradient(2)
    }),
    ["multibrot3"]
  ),
  preset(
    "Tricorn Classic",
    makeScene({
      fractalType: "tricorn",
      params: { maxIter: 320, escapeRadius: 4, parameter: 1 },
      viewport: { centerX: -0.2, centerY: 0, scale: 0.005 },
      color: withGradient(1)
    }),
    ["tricorn"]
  ),
  preset(
    "Tricorn Reef",
    makeScene({
      fractalType: "tricorn",
      params: { maxIter: 420, escapeRadius: 4, parameter: 1 },
      viewport: { centerX: -0.4, centerY: 0.55, scale: 0.0013 },
      color: withGradient(0)
    }),
    ["tricorn"]
  ),
  preset(
    "Burning Ship Classic",
    makeScene({
      fractalType: "burning-ship",
      params: { maxIter: 420, escapeRadius: 4, parameter: 1 },
      viewport: { centerX: -1.75, centerY: -0.03, scale: 0.004 },
      color: withGradient(3)
    }),
    ["burning-ship"]
  ),
  preset(
    "Burning Ship Hull",
    makeScene({
      fractalType: "burning-ship",
      params: { maxIter: 520, escapeRadius: 4, parameter: 1 },
      viewport: { centerX: -1.72, centerY: -0.02, scale: 0.0011 },
      color: withGradient(0)
    }),
    ["burning-ship"]
  ),
  preset(
    "Julia Bloom",
    makeScene({
      fractalType: "julia",
      params: { maxIter: 320, escapeRadius: 4, cRe: -0.70176, cIm: -0.3842, parameter: 0 },
      viewport: { centerX: 0, centerY: 0, scale: 0.004 },
      color: withGradient(2)
    }),
    ["julia"]
  ),
  preset(
    "Julia Spiral",
    makeScene({
      fractalType: "julia",
      params: { maxIter: 340, escapeRadius: 4, cRe: 0.285, cIm: 0.01, parameter: 0 },
      viewport: { centerX: 0, centerY: 0, scale: 0.0038 },
      color: withGradient(3)
    }),
    ["julia"]
  ),
  preset(
    "Tricorn Julia Drift",
    makeScene({
      fractalType: "tricorn-julia",
      params: { maxIter: 340, escapeRadius: 4, cRe: -0.4, cIm: 0.6, parameter: 0 },
      viewport: { centerX: 0, centerY: 0, scale: 0.004 },
      color: withGradient(1)
    }),
    ["tricorn-julia"]
  ),
  preset(
    "Tricorn Julia Halo",
    makeScene({
      fractalType: "tricorn-julia",
      params: { maxIter: 360, escapeRadius: 4, cRe: 0.32, cIm: -0.42, parameter: 0 },
      viewport: { centerX: 0, centerY: 0, scale: 0.0036 },
      color: withGradient(0)
    }),
    ["tricorn-julia"]
  ),
  preset(
    "Burning Ship Julia Ember",
    makeScene({
      fractalType: "burning-ship-julia",
      params: { maxIter: 360, escapeRadius: 4, cRe: -0.62, cIm: 0.32, parameter: 0 },
      viewport: { centerX: 0, centerY: 0, scale: 0.004 },
      color: withGradient(3)
    }),
    ["burning-ship-julia"]
  ),
  preset(
    "Burning Ship Julia Smoke",
    makeScene({
      fractalType: "burning-ship-julia",
      params: { maxIter: 380, escapeRadius: 4, cRe: 0.18, cIm: 0.64, parameter: 0 },
      viewport: { centerX: 0, centerY: 0, scale: 0.0036 },
      color: withGradient(2)
    }),
    ["burning-ship-julia"]
  ),
  preset(
    "Newton Basins",
    makeScene({
      fractalType: "newton-z3",
      params: { maxIter: 40, tolerance: 1e-6, parameter: 0 },
      viewport: { centerX: 0, centerY: 0, scale: 0.005 },
      color: withGradient(1)
    }),
    ["newton-z3"]
  ),
  preset(
    "Newton Petals",
    makeScene({
      fractalType: "newton-z3",
      params: { maxIter: 50, tolerance: 1e-6, parameter: 0 },
      viewport: { centerX: 0.25, centerY: 0.15, scale: 0.0025 },
      color: withGradient(0)
    }),
    ["newton-z3"]
  ),
  preset(
    "Halley Basins",
    makeScene({
      fractalType: "halley-z3",
      params: { maxIter: 40, tolerance: 1e-6, parameter: 0 },
      viewport: { centerX: 0, centerY: 0, scale: 0.005 },
      color: withGradient(2)
    }),
    ["halley-z3"]
  ),
  preset(
    "Halley Filigree",
    makeScene({
      fractalType: "halley-z3",
      params: { maxIter: 50, tolerance: 1e-6, parameter: 0 },
      viewport: { centerX: -0.2, centerY: 0.1, scale: 0.0024 },
      color: withGradient(3)
    }),
    ["halley-z3"]
  ),
  preset(
    "Newton sin z",
    makeScene({
      fractalType: "newton-sin",
      params: { maxIter: 42, tolerance: 1e-6, parameter: 0 },
      viewport: { centerX: 0, centerY: 0, scale: 0.006 },
      color: withGradient(1)
    }),
    ["newton-sin"]
  ),
  preset(
    "Newton sin z Lattice",
    makeScene({
      fractalType: "newton-sin",
      params: { maxIter: 48, tolerance: 1e-6, parameter: 0 },
      viewport: { centerX: 1.2, centerY: 0, scale: 0.0032 },
      color: withGradient(0)
    }),
    ["newton-sin"]
  )
];
