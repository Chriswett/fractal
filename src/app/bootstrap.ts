import { builtinPresets } from "../data/presets";
import { registerFractals } from "../engine/registerFractals";
import { fractalRegistry } from "../engine/registry";
import { actions } from "../state/store";
import { FractalType } from "../state/types";
import { deepClone } from "../utils/clone";
import { getUserJourneys, getUserPresets } from "../persistence/presetsDb";
import { loadLastScene } from "../persistence/sceneStorage";

let bootstrapped = false;

export function bootstrapApp() {
  if (bootstrapped) {
    return;
  }
  registerFractals();
  const registeredTypes = new Set(fractalRegistry.list().map((def) => def.type));
  const isKnownType = (type: string): type is FractalType => registeredTypes.has(type as FractalType);
  const builtins = builtinPresets.map((preset) => ({ ...preset, scene: deepClone(preset.scene) }));
  actions.setPresets(builtins, []);
  if (builtins.length > 0) {
    actions.setScene(deepClone(builtins[0].scene), "final");
  }
  getUserPresets()
    .then((users) => actions.setPresets(builtins, users.filter((preset) => isKnownType(preset.scene.fractalType))))
    .catch(() => {
      actions.setPresets(builtins, []);
    });
  getUserJourneys()
    .then((journeys) => actions.setJourneys(journeys.filter((journey) => isKnownType(journey.scene.fractalType))))
    .catch(() => {
      actions.setJourneys([]);
    });
  loadLastScene()
    .then((scene) => {
      if (scene && isKnownType(scene.fractalType)) {
        actions.setScene(scene, "final");
      }
    })
    .catch(() => {
      // ignore failures
    });
  bootstrapped = true;
}
