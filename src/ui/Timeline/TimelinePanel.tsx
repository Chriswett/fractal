import { useEffect, useRef, useState } from "react";
import { actions, useStore } from "../../state/store";
import { Keyframe, Viewport } from "../../state/types";
import { interpolateViewport } from "../../utils/viewport";
import { PlayIcon, PauseIcon } from "../common/Icons";

export function TimelinePanel() {
  const timeline = useStore((state) => state.timeline);
  const viewport = useStore((state) => state.scene.viewport);
  const [isPlaying, setIsPlaying] = useState(false);
  const rafRef = useRef<number | null>(null);
  const playingRef = useRef(false);

  useEffect(() => {
    playingRef.current = isPlaying;
    if (!isPlaying && rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      actions.triggerRender("final");
    }
  }, [isPlaying]);

  const handlePlayToggle = () => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    if (timeline.keyframes.length < 2) {
      return;
    }

    setIsPlaying(true);
    const start = performance.now();

    const step = (now: number) => {
      if (!playingRef.current) {
        return;
      }
      const elapsed = now - start;
      const t = Math.min(1, elapsed / timeline.durationMs);
      const viewportNext = sampleViewport(timeline.keyframes, t);
      actions.updateViewport(viewportNext, "interactive");

      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setIsPlaying(false);
      }
    };

    rafRef.current = requestAnimationFrame(step);
  };

  return (
    <div className="panel-section">
      <h3>Timeline</h3>
      <div className="field">
        <label htmlFor="duration">Duration (ms)</label>
        <input
          id="duration"
          type="number"
          min={1000}
          step={500}
          value={timeline.durationMs}
          onChange={(event) =>
            actions.updateTimeline({
              ...timeline,
              durationMs: Math.max(1000, Number(event.target.value))
            })
          }
        />
      </div>

      <div className="list">
        {timeline.keyframes.map((keyframe, index) => (
          <div className="list-item" key={`${keyframe.t}-${index}`}>
            <span>Keyframe {index + 1}</span>
            <input
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={keyframe.t}
              onChange={(event) => {
                const next = [...timeline.keyframes];
                next[index] = { ...keyframe, t: Number(event.target.value) };
                actions.updateTimeline({ ...timeline, keyframes: next.sort((a, b) => a.t - b.t) });
              }}
            />
            <button type="button" className="button" onClick={() => actions.removeKeyframe(index)}>
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="field">
        <button
          type="button"
          className="button"
          onClick={() => {
            const last = timeline.keyframes[timeline.keyframes.length - 1];
            const nextT = Math.min(1, (last?.t ?? 0) + 0.1);
            actions.addKeyframe(viewport, nextT);
          }}
        >
          Add keyframe
        </button>
        <button type="button" className="button" onClick={handlePlayToggle}>
          {isPlaying ? <PauseIcon /> : <PlayIcon />} {isPlaying ? "Pause" : "Play"}
        </button>
      </div>
    </div>
  );
}

function sampleViewport(keyframes: Keyframe[], t: number): Viewport {
  if (keyframes.length === 0) {
    return { centerX: 0, centerY: 0, scale: 0.005 };
  }
  const sorted = [...keyframes].sort((a, b) => a.t - b.t);
  if (t <= sorted[0].t) {
    return sorted[0].viewport;
  }
  if (t >= sorted[sorted.length - 1].t) {
    return sorted[sorted.length - 1].viewport;
  }

  for (let i = 0; i < sorted.length - 1; i += 1) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (t >= a.t && t <= b.t) {
      const localT = (t - a.t) / Math.max(0.0001, b.t - a.t);
      return interpolateViewport(a.viewport, b.viewport, localT);
    }
  }
  return sorted[0].viewport;
}
