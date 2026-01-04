import { gradients } from "../../data/gradients";
import { actions, useStore } from "../../state/store";
import { ColorProfile, GradientStop } from "../../state/types";
import { clamp, hexToRgba, rgbaToHex } from "../../utils/color";

export function ColorStudioPanel() {
  const color = useStore((state) => state.scene.color);
  const uiPrefs = useStore((state) => state.ui);

  const updateColor = (next: Partial<ColorProfile>) => {
    actions.updateColor({ ...color, ...next }, "final");
  };

  const updateStops = (stops: GradientStop[]) => {
    const sorted = [...stops]
      .map((stop) => ({ ...stop, t: clamp(stop.t) }))
      .sort((a, b) => a.t - b.t);
    updateColor({ gradientStops: sorted });
  };

  const selectedGradientId = gradients.find((grad) =>
    grad.stops.every((stop, index) => {
      const current = color.gradientStops[index];
      return current && current.t === stop.t && current.color.r === stop.color.r;
    })
  )?.id;

  return (
    <div className="panel-section">
      <h3>Color Studio</h3>
      <div className="field">
        <label htmlFor="gradient">Gradient</label>
        <select
          id="gradient"
          value={selectedGradientId ?? "custom"}
          onChange={(event) => {
            const next = gradients.find((grad) => grad.id === event.target.value);
            if (next) {
              updateColor({ gradientStops: next.stops });
            }
          }}
        >
          {gradients.map((gradient) => (
            <option key={gradient.id} value={gradient.id}>
              {gradient.name}
            </option>
          ))}
          <option value="custom">Custom</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="smooth">Smooth coloring</label>
        <input
          id="smooth"
          type="checkbox"
          checked={color.smoothColoring}
          onChange={(event) => updateColor({ smoothColoring: event.target.checked })}
        />
      </div>

      <div className="field">
        <label htmlFor="gamma">Gamma</label>
        <input
          id="gamma"
          type="range"
          min={0.6}
          max={2.2}
          step={0.05}
          value={color.gamma}
          onChange={(event) => updateColor({ gamma: Number(event.target.value) })}
        />
      </div>

      <div className="field">
        <label htmlFor="black">Levels black</label>
        <input
          id="black"
          type="range"
          min={0}
          max={0.9}
          step={0.01}
          value={color.levels.black}
          onChange={(event) => updateColor({ levels: { ...color.levels, black: Number(event.target.value) } })}
        />
      </div>

      <div className="field">
        <label htmlFor="white">Levels white</label>
        <input
          id="white"
          type="range"
          min={0.1}
          max={1}
          step={0.01}
          value={color.levels.white}
          onChange={(event) => updateColor({ levels: { ...color.levels, white: Number(event.target.value) } })}
        />
      </div>

      <button
        type="button"
        className="button"
        onClick={() => actions.updateUiPreferences({ showAdvancedColor: !uiPrefs.showAdvancedColor })}
      >
        {uiPrefs.showAdvancedColor ? "Hide" : "Show"} advanced
      </button>

      {uiPrefs.showAdvancedColor && (
        <div className="panel-section">
          <h3>Advanced</h3>
          <div className="list">
            {color.gradientStops.map((stop, index) => (
              <div key={`${stop.t}-${index}`} className="list-item">
                <input
                  type="color"
                  value={rgbaToHex(stop.color)}
                  onChange={(event) => {
                    const nextStops = [...color.gradientStops];
                    nextStops[index] = { ...stop, color: hexToRgba(event.target.value) };
                    updateStops(nextStops);
                  }}
                />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={stop.t}
                  onChange={(event) => {
                    const nextStops = [...color.gradientStops];
                    nextStops[index] = { ...stop, t: Number(event.target.value) };
                    updateStops(nextStops);
                  }}
                />
                <button
                  type="button"
                  className="button"
                  onClick={() => updateStops(color.gradientStops.filter((_, i) => i !== index))}
                  disabled={color.gradientStops.length <= 2}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="button"
            onClick={() => {
              const last = color.gradientStops[color.gradientStops.length - 1];
              const nextStop = {
                t: clamp(last.t + 0.1),
                color: last.color
              };
              updateStops([...color.gradientStops, nextStop]);
            }}
          >
            Add stop
          </button>

          <div className="field">
            <label htmlFor="hue">Hue shift</label>
            <input
              id="hue"
              type="range"
              min={-180}
              max={180}
              step={1}
              value={color.hueShift}
              onChange={(event) => updateColor({ hueShift: Number(event.target.value) })}
            />
          </div>

          <div className="field">
            <label htmlFor="sat">Saturation</label>
            <input
              id="sat"
              type="range"
              min={0}
              max={2}
              step={0.05}
              value={color.saturation}
              onChange={(event) => updateColor({ saturation: Number(event.target.value) })}
            />
          </div>

          <div className="field">
            <label htmlFor="exp">Exposure</label>
            <input
              id="exp"
              type="range"
              min={-2}
              max={2}
              step={0.1}
              value={color.exposure ?? 0}
              onChange={(event) => updateColor({ exposure: Number(event.target.value) })}
            />
          </div>

          <div className="field">
            <label htmlFor="dither">Dither</label>
            <input
              id="dither"
              type="checkbox"
              checked={Boolean(color.dither)}
              onChange={(event) => updateColor({ dither: event.target.checked })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
