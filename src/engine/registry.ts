import { FractalType, Preset, Scene } from "../state/types";
import { IFractalRenderer } from "./types";

export type FractalDefinition = {
  type: FractalType;
  label: string;
  createRenderer: () => IFractalRenderer;
  defaultScene: Scene;
  presets: Preset[];
};

class FractalRegistry {
  private defs = new Map<FractalType, FractalDefinition>();

  register(definition: FractalDefinition) {
    this.defs.set(definition.type, definition);
  }

  get(type: FractalType) {
    const def = this.defs.get(type);
    if (!def) {
      throw new Error(`Fractal type not registered: ${type}`);
    }
    return def;
  }

  list() {
    return Array.from(this.defs.values());
  }
}

export const fractalRegistry = new FractalRegistry();
