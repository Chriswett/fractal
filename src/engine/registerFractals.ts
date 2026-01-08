import { builtinPresets } from "../data/presets";
import { FractalType, Preset, Scene } from "../state/types";
import { deepClone } from "../utils/clone";
import { fractalRegistry } from "./registry";
import { WebGLRenderer } from "./webgl/WebGLRenderer";
import { WebGLNewtonRenderer } from "./webgl/WebGLNewtonRenderer";

function pickPreset(type: FractalType): { scene: Scene; presets: Preset[] } {
  const presets = builtinPresets.filter((preset) => preset.scene.fractalType === type);
  if (presets.length === 0) {
    throw new Error(`Missing presets for ${type}`);
  }
  return { scene: presets[0].scene, presets };
}

export function registerFractals() {
  const mandelbrot = pickPreset("mandelbrot");
  const multibrot3 = pickPreset("multibrot3");
  const tricorn = pickPreset("tricorn");
  const burningShip = pickPreset("burning-ship");
  const julia = pickPreset("julia");
  const tricornJulia = pickPreset("tricorn-julia");
  const burningShipJulia = pickPreset("burning-ship-julia");
  const newtonZ3 = pickPreset("newton-z3");
  const halleyZ3 = pickPreset("halley-z3");
  const newtonSin = pickPreset("newton-sin");

  fractalRegistry.register({
    type: "mandelbrot",
    label: "Mandelbrot",
    createRenderer: () => new WebGLRenderer(),
    defaultScene: deepClone(mandelbrot.scene),
    presets: mandelbrot.presets
  });

  fractalRegistry.register({
    type: "multibrot3",
    label: "Multibrot d=3",
    createRenderer: () => new WebGLRenderer(),
    defaultScene: deepClone(multibrot3.scene),
    presets: multibrot3.presets
  });

  fractalRegistry.register({
    type: "tricorn",
    label: "Tricorn",
    createRenderer: () => new WebGLRenderer(),
    defaultScene: deepClone(tricorn.scene),
    presets: tricorn.presets
  });

  fractalRegistry.register({
    type: "burning-ship",
    label: "Burning Ship",
    createRenderer: () => new WebGLRenderer(),
    defaultScene: deepClone(burningShip.scene),
    presets: burningShip.presets
  });

  fractalRegistry.register({
    type: "julia",
    label: "Julia",
    createRenderer: () => new WebGLRenderer(),
    defaultScene: deepClone(julia.scene),
    presets: julia.presets
  });

  fractalRegistry.register({
    type: "tricorn-julia",
    label: "Tricorn Julia",
    createRenderer: () => new WebGLRenderer(),
    defaultScene: deepClone(tricornJulia.scene),
    presets: tricornJulia.presets
  });

  fractalRegistry.register({
    type: "burning-ship-julia",
    label: "Burning Ship Julia",
    createRenderer: () => new WebGLRenderer(),
    defaultScene: deepClone(burningShipJulia.scene),
    presets: burningShipJulia.presets
  });

  fractalRegistry.register({
    type: "newton-z3",
    label: "Newton z^3-1",
    createRenderer: () => new WebGLNewtonRenderer(),
    defaultScene: deepClone(newtonZ3.scene),
    presets: newtonZ3.presets
  });

  fractalRegistry.register({
    type: "halley-z3",
    label: "Halley z^3-1",
    createRenderer: () => new WebGLNewtonRenderer(),
    defaultScene: deepClone(halleyZ3.scene),
    presets: halleyZ3.presets
  });

  fractalRegistry.register({
    type: "newton-sin",
    label: "Newton sin z",
    createRenderer: () => new WebGLNewtonRenderer(),
    defaultScene: deepClone(newtonSin.scene),
    presets: newtonSin.presets
  });
}
