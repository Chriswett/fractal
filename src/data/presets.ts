import { gradients } from "./gradients";
import { createId } from "../utils/id";
import { defaultRenderSettings } from "../state/defaults";
import { Preset, Scene } from "../state/types";

function makeScene(partial: Partial<Scene>): Scene {
  return {
    id: createId("scene"),
    fractalType: "mandelbrot",
    params: { maxIter: 300, escapeRadius: 4 },
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

export const builtinPresets: Preset[] = [
  preset(
    "Mandelbrot Classic",
    makeScene({
      fractalType: "mandelbrot",
      params: { maxIter: 320, escapeRadius: 4 },
      viewport: { centerX: -0.5, centerY: 0, scale: 0.005 },
      color: { ...makeScene({}).color, gradientStops: cloneStops(gradients[0].stops) }
    }),
    ["mandelbrot"]
  ),
  preset(
    "Seahorse Valley",
    makeScene({
      fractalType: "mandelbrot",
      params: { maxIter: 480, escapeRadius: 4 },
      viewport: { centerX: -0.75, centerY: 0.1, scale: 0.0009 },
      color: { ...makeScene({}).color, gradientStops: cloneStops(gradients[1].stops) }
    }),
    ["mandelbrot"]
  ),
  preset(
    "Julia Bloom",
    makeScene({
      fractalType: "julia",
      params: { maxIter: 320, escapeRadius: 4, cRe: -0.70176, cIm: -0.3842 },
      viewport: { centerX: 0, centerY: 0, scale: 0.004 },
      color: { ...makeScene({}).color, gradientStops: cloneStops(gradients[2].stops) }
    }),
    ["julia"]
  ),
  preset(
    "Julia Spiral",
    makeScene({
      fractalType: "julia",
      params: { maxIter: 340, escapeRadius: 4, cRe: 0.285, cIm: 0.01 },
      viewport: { centerX: 0, centerY: 0, scale: 0.0038 },
      color: { ...makeScene({}).color, gradientStops: cloneStops(gradients[3].stops) }
    }),
    ["julia"]
  ),
  preset(
    "Sierpinski Light",
    makeScene({
      fractalType: "sierpinski",
      params: { depth: 6 },
      viewport: { centerX: 0, centerY: 0, scale: 0.005 },
      color: { ...makeScene({}).color, gradientStops: cloneStops(gradients[2].stops) }
    }),
    ["sierpinski"]
  ),
  preset(
    "Koch Curve",
    makeScene({
      fractalType: "koch",
      params: { depth: 5, variant: "curve" },
      viewport: { centerX: 0, centerY: 0, scale: 0.005 },
      color: { ...makeScene({}).color, gradientStops: cloneStops(gradients[0].stops) }
    }),
    ["koch"]
  ),
  preset(
    "Koch Snowflake",
    makeScene({
      fractalType: "koch",
      params: { depth: 4, variant: "snowflake" },
      viewport: { centerX: 0, centerY: 0, scale: 0.005 },
      color: { ...makeScene({}).color, gradientStops: cloneStops(gradients[1].stops) }
    }),
    ["koch"]
  )
];
