import { useEffect, useState } from "react";
import { actions, useStore } from "../../state/store";
import { FractalType, Preset } from "../../state/types";
import { createId } from "../../utils/id";
import { deepClone } from "../../utils/clone";
import { saveUserPreset, deleteUserPreset } from "../../persistence/presetsDb";

const parameterSpecs: Record<
  FractalType,
  { name: string; min: number; max: number; step: number }
> = {
  mandelbrot: { name: "Phase", min: -180, max: 180, step: 1 },
  multibrot3: { name: "Phase", min: -180, max: 180, step: 1 },
  tricorn: { name: "Conjugation", min: 0, max: 1, step: 0.01 },
  "burning-ship": { name: "Fold", min: 0, max: 1, step: 0.01 },
  julia: { name: "C angle", min: -180, max: 180, step: 1 },
  "tricorn-julia": { name: "C angle", min: -180, max: 180, step: 1 },
  "burning-ship-julia": { name: "C angle", min: -180, max: 180, step: 1 },
  "newton-z3": { name: "Phase", min: -180, max: 180, step: 1 },
  "halley-z3": { name: "Phase", min: -180, max: 180, step: 1 },
  "newton-sin": { name: "Phase", min: -180, max: 180, step: 1 }
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function GalleryPanel() {
  const presets = useStore((state) => state.presets);
  const scene = useStore((state) => state.scene);
  const spec = parameterSpecs[scene.fractalType];
  const currentParameter = "parameter" in scene.params ? scene.params.parameter : 0;
  const [draftParameter, setDraftParameter] = useState(currentParameter);

  useEffect(() => {
    setDraftParameter(currentParameter);
  }, [scene.fractalType, currentParameter]);

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

  const commitParameter = (value: number) => {
    const nextValue = clamp(value, spec.min, spec.max);
    if ("parameter" in scene.params && scene.params.parameter === nextValue) {
      return;
    }
    actions.updateScene(
      {
        params: {
          ...scene.params,
          parameter: nextValue
        }
      },
      "interactive"
    );
  };

  return (
    <div className="panel-section">
      <div className="panel-section">
        <h3>{`Parameter - ${spec.name}`}</h3>
        <div className="field">
          <input
            type="range"
            min={spec.min}
            max={spec.max}
            step={spec.step}
            value={draftParameter}
            onChange={(event) => setDraftParameter(Number(event.target.value))}
            onPointerUp={() => commitParameter(draftParameter)}
            onKeyUp={() => commitParameter(draftParameter)}
            aria-label={`Parameter - ${spec.name}`}
          />
          <input
            type="number"
            min={spec.min}
            max={spec.max}
            step={spec.step}
            value={draftParameter}
            onChange={(event) => {
              const nextValue = Number(event.target.value);
              if (!Number.isNaN(nextValue)) {
                setDraftParameter(nextValue);
              }
            }}
            onBlur={() => commitParameter(draftParameter)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                commitParameter(draftParameter);
                event.currentTarget.blur();
              }
            }}
            aria-label={`Parameter - ${spec.name} value`}
          />
        </div>
      </div>

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
