import { actions, useStore } from "../../state/store";
import { Preset } from "../../state/types";
import { createId } from "../../utils/id";
import { deepClone } from "../../utils/clone";
import { saveUserPreset, deleteUserPreset } from "../../persistence/presetsDb";

export function GalleryPanel() {
  const presets = useStore((state) => state.presets);
  const scene = useStore((state) => state.scene);

  const handleSelect = (preset: Preset) => {
    actions.setScene(deepClone(preset.scene), "final");
  };

  const handleSave = async () => {
    const name = window.prompt("Preset name");
    if (!name) {
      return;
    }
    const preset: Preset = {
      id: createId("preset"),
      name,
      kind: "user",
      scene: deepClone(scene)
    };
    actions.addUserPreset(preset);
    await saveUserPreset(preset);
  };

  const handleDelete = async (presetId: string) => {
    actions.removeUserPreset(presetId);
    await deleteUserPreset(presetId);
  };

  return (
    <div className="panel-section">
      <h3>Presets</h3>
      <div className="list">
        {presets.builtins.map((preset) => (
          <button
            key={preset.id}
            className="list-item"
            type="button"
            onClick={() => handleSelect(preset)}
          >
            <span>{preset.name}</span>
            <span className="badge">{preset.scene.fractalType}</span>
          </button>
        ))}
      </div>

      <div className="panel-section">
        <h3>Your presets</h3>
        <div className="list">
          {presets.users.length === 0 && <div className="list-item">No saved presets.</div>}
          {presets.users.map((preset) => (
            <div key={preset.id} className="list-item">
              <button type="button" onClick={() => handleSelect(preset)} className="button">
                {preset.name}
              </button>
              <button type="button" onClick={() => handleDelete(preset.id)} className="button">
                Delete
              </button>
            </div>
          ))}
        </div>
        <button type="button" className="button" onClick={handleSave}>
          Save current view
        </button>
      </div>
    </div>
  );
}
