import { builtinPresets } from "../data/presets";
import { FractalType, Preset, Scene } from "../state/types";
import { deepClone } from "../utils/clone";
import { fractalRegistry } from "./registry";
import { WebGLRenderer } from "./webgl/WebGLRenderer";
import { SierpinskiRenderer } from "./cpu/SierpinskiRenderer";
import { KochRenderer } from "./cpu/KochRenderer";

function pickPreset(type: FractalType): { scene: Scene; presets: Preset[] } {
  const presets = builtinPresets.filter((preset) => preset.scene.fractalType === type);
  if (presets.length === 0) {
    throw new Error(`Missing presets for ${type}`);
  }
  return { scene: presets[0].scene, presets };
}

export function registerFractals() {
  const mandelbrot = pickPreset("mandelbrot");
  const julia = pickPreset("julia");
  const sierpinski = pickPreset("sierpinski");
  const koch = pickPreset("koch");

  fractalRegistry.register({
    type: "mandelbrot",
    label: "Mandelbrot",
    createRenderer: () => new WebGLRenderer(),
    defaultScene: deepClone(mandelbrot.scene),
    presets: mandelbrot.presets
  });

  fractalRegistry.register({
    type: "julia",
    label: "Julia",
    createRenderer: () => new WebGLRenderer(),
    defaultScene: deepClone(julia.scene),
    presets: julia.presets
  });

  fractalRegistry.register({
    type: "sierpinski",
    label: "Sierpinski",
    createRenderer: () => new SierpinskiRenderer(),
    defaultScene: deepClone(sierpinski.scene),
    presets: sierpinski.presets
  });

  fractalRegistry.register({
    type: "koch",
    label: "Koch",
    createRenderer: () => new KochRenderer(),
    defaultScene: deepClone(koch.scene),
    presets: koch.presets
  });
}
