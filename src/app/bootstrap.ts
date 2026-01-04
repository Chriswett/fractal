import { builtinPresets } from "../data/presets";
import { registerFractals } from "../engine/registerFractals";
import { actions } from "../state/store";
import { deepClone } from "../utils/clone";
import { getUserPresets } from "../persistence/presetsDb";
import { loadLastScene } from "../persistence/sceneStorage";

let bootstrapped = false;

export function bootstrapApp() {
  if (bootstrapped) {
    return;
  }
  registerFractals();
  const builtins = builtinPresets.map((preset) => ({ ...preset, scene: deepClone(preset.scene) }));
  actions.setPresets(builtins, []);
  if (builtins.length > 0) {
    actions.setScene(deepClone(builtins[0].scene), "final");
  }
  getUserPresets()
    .then((users) => actions.setPresets(builtins, users))
    .catch(() => {
      actions.setPresets(builtins, []);
    });
  loadLastScene()
    .then((scene) => {
      if (scene) {
        actions.setScene(scene, "final");
      }
    })
    .catch(() => {
      // ignore failures
    });
  bootstrapped = true;
}
