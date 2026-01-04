import { useContext, useState } from "react";
import { RenderContext } from "../../app/RenderContext";
import { fractalRegistry } from "../../engine/registry";
import { actions, useStore } from "../../state/store";
import { downloadBlob } from "../../utils/download";
import { saveUserPreset } from "../../persistence/presetsDb";
import { createId } from "../../utils/id";

export function ExportPanel() {
  const renderBridge = useContext(RenderContext);
  const scene = useStore((state) => state.scene);
  const presets = useStore((state) => state.presets);
  const [scale, setScale] = useState(2);

  const exportPng = async () => {
    const canvas = renderBridge?.getActiveCanvas();
    if (!canvas) {
      return;
    }
    canvas.toBlob((blob) => {
      if (blob) {
        downloadBlob(blob, "fractal.png");
      }
    });
  };

  const exportHiRes = async () => {
    const canvas = renderBridge?.getActiveCanvas();
    if (!canvas) {
      return;
    }
    const width = Math.round(canvas.width * scale);
    const height = Math.round(canvas.height * scale);
    const offscreen = document.createElement("canvas");
    offscreen.width = Math.max(1, width);
    offscreen.height = Math.max(1, height);
    const renderer = fractalRegistry.get(scene.fractalType).createRenderer();
    await renderer.renderStill({ scene, canvas: offscreen, qualityHint: "final" });
    renderer.destroy?.();

    offscreen.toBlob((blob) => {
      if (blob) {
        downloadBlob(blob, "fractal-hires.png");
      }
    });
  };

  const exportSceneJson = () => {
    const payload = {
      version: 1,
      scene
    };
    downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }), "scene.json");
  };

  const exportPresetsJson = () => {
    const payload = {
      version: 1,
      presets: [...presets.builtins, ...presets.users]
    };
    downloadBlob(
      new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }),
      "presets.json"
    );
  };

  const importPresets = async (file: File) => {
    const text = await file.text();
    const parsed = JSON.parse(text) as { presets?: any[] } | null;
    if (!parsed?.presets) {
      return;
    }
    const imported = parsed.presets.map((preset) => ({
      ...preset,
      id: preset.id ?? createId("preset"),
      kind: "user"
    }));
    const nextUsers = [...presets.users, ...imported];
    actions.setPresets(presets.builtins, nextUsers);
    await Promise.all(imported.map((preset) => saveUserPreset(preset)));
  };

  const importScene = async (file: File) => {
    const text = await file.text();
    const parsed = JSON.parse(text) as { scene?: any } | null;
    if (!parsed?.scene) {
      return;
    }
    actions.setScene(parsed.scene, "final");
  };

  return (
    <div className="panel-section">
      <h3>Export</h3>
      <div className="field">
        <label htmlFor="scale">Hi-res scale</label>
        <input
          id="scale"
          type="number"
          min={1}
          max={6}
          step={1}
          value={scale}
          onChange={(event) => setScale(Math.max(1, Number(event.target.value)))}
        />
      </div>
      <div className="field">
        <button type="button" className="button" onClick={exportPng}>
          Export PNG
        </button>
        <button type="button" className="button" onClick={exportHiRes}>
          Export hi-res PNG
        </button>
      </div>
      <div className="field">
        <button type="button" className="button" onClick={exportSceneJson}>
          Export Scene JSON
        </button>
        <button type="button" className="button" onClick={exportPresetsJson}>
          Export Presets JSON
        </button>
      </div>
      <div className="field">
        <label htmlFor="import-scene">Import scene</label>
        <input
          id="import-scene"
          type="file"
          accept="application/json"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              importScene(file);
            }
            event.target.value = "";
          }}
        />
      </div>
      <div className="field">
        <label htmlFor="import-presets">Import presets</label>
        <input
          id="import-presets"
          type="file"
          accept="application/json"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              importPresets(file);
            }
            event.target.value = "";
          }}
        />
      </div>
      <button type="button" className="button" onClick={() => actions.updateScene(scene, "final")}>
        Refresh render
      </button>
    </div>
  );
}
