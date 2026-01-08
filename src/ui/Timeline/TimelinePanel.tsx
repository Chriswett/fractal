import { useEffect, useRef, useState } from "react";
import { actions, useStore } from "../../state/store";
import { Journey, Keyframe, Viewport } from "../../state/types";
import { createId } from "../../utils/id";
import { deepClone } from "../../utils/clone";
import { interpolateViewport } from "../../utils/viewport";
import { PlayIcon, PauseIcon } from "../common/Icons";

export function TimelinePanel() {
  const timeline = useStore((state) => state.timeline);
  const viewport = useStore((state) => state.scene.viewport);
  const scene = useStore((state) => state.scene);
  const journeys = useStore((state) => state.journeys.users);
  const [isPlaying, setIsPlaying] = useState(false);
  const rafRef = useRef<number | null>(null);
  const playingRef = useRef(false);
  const autoPlayRef = useRef(false);

  useEffect(() => {
    playingRef.current = isPlaying;
    actions.setTimelinePlaying(isPlaying);
    if (!isPlaying && rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      actions.triggerRender("final");
    }
    return () => {
      actions.setTimelinePlaying(false);
    };
  }, [isPlaying]);

  const startPlayback = () => {
    if (timeline.keyframes.length < 2) {
      return;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    playingRef.current = true;
    setIsPlaying(true);

    const start = performance.now();

    const step = (now: number) => {
      if (!playingRef.current) {
        return;
      }
      const elapsed = now - start;
      const timeMs = Math.min(timeline.durationMs, elapsed);
      const viewportNext = sampleViewport(timeline.keyframes, timeMs);
      actions.updateViewport(viewportNext, "interactive");

      if (timeMs < timeline.durationMs) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setIsPlaying(false);
      }
    };

    rafRef.current = requestAnimationFrame(step);
  };

  const handlePlayToggle = () => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    startPlayback();
  };

  useEffect(() => {
    if (autoPlayRef.current) {
      autoPlayRef.current = false;
      startPlayback();
    }
  }, [timeline]);

  const handleSaveJourney = async () => {
    const name = window.prompt("Journey name");
    if (!name) {
      return;
    }
    const timelineCopy = deepClone(timeline);
    const sceneCopy = deepClone(scene);
    const startViewport = timelineCopy.keyframes[0]?.viewport;
    if (startViewport) {
      sceneCopy.viewport = startViewport;
    }
    const journey: Journey = {
      id: createId("journey"),
      name,
      kind: "user",
      scene: sceneCopy,
      timeline: timelineCopy
    };
    actions.addJourney(journey);
  };

  const handleSelectJourney = (journey: Journey) => {
    actions.loadJourney(deepClone(journey), "final");
    autoPlayRef.current = true;
  };

  const handleRenameJourney = (journey: Journey) => {
    const name = window.prompt("Rename journey", journey.name);
    if (!name || name.trim() === journey.name) {
      return;
    }
    actions.renameJourney(journey.id, name.trim());
  };

  return (
    <div className="panel-section">
      <h3>Timeline</h3>
      <div className="field">
        <label htmlFor="duration" title="Total length of the zoom journey in milliseconds.">
          Duration (ms)
        </label>
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
            <span>
              Keyframe {index + 1}
              {index === 0 ? " (Start)" : ""}
              {index === timeline.keyframes.length - 1 && index !== 0 ? " (End)" : ""}
            </span>
            <input
              type="number"
              min={0}
              max={timeline.durationMs}
              step={100}
              value={Math.round(keyframe.t)}
              title={
                index === 0
                  ? "Snapped to the start of the journey."
                  : index === timeline.keyframes.length - 1
                    ? "Snapped to the end of the journey."
                    : "Time along the journey in milliseconds."
              }
              onChange={(event) => {
                const value = Number(event.target.value);
                const next = [...timeline.keyframes];
                next[index] = { ...keyframe, t: value };
                actions.updateTimeline({ ...timeline, keyframes: next.sort((a, b) => a.t - b.t) });
              }}
              disabled={index === 0 || index === timeline.keyframes.length - 1}
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
            const stepMs = Math.max(500, Math.round(timeline.durationMs * 0.1));
            const nextT = Math.min(timeline.durationMs, (last?.t ?? 0) + stepMs);
            actions.addKeyframe(viewport, nextT);
          }}
        >
          Add keyframe
        </button>
        <button type="button" className="button" onClick={handlePlayToggle}>
          {isPlaying ? <PauseIcon /> : <PlayIcon />} {isPlaying ? "Pause" : "Play"}
        </button>
      </div>

      <div className="panel-section">
        <h3>Saved journeys</h3>
        <div className="list">
          {journeys.length === 0 && <div className="list-item">No saved journeys.</div>}
          {journeys.map((journey) => (
            <div key={journey.id} className="list-item">
              <button
                type="button"
                className="button"
                onClick={() => handleSelectJourney(journey)}
              >
                {journey.name}
              </button>
              <span className="badge">{journey.scene.fractalType}</span>
              <button type="button" className="button" onClick={() => handleRenameJourney(journey)}>
                Rename
              </button>
              <button
                type="button"
                className="button"
                onClick={() => actions.removeJourney(journey.id)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
        <button type="button" className="button" onClick={handleSaveJourney}>
          Save journey
        </button>
      </div>
    </div>
  );
}

function sampleViewport(keyframes: Keyframe[], timeMs: number): Viewport {
  if (keyframes.length === 0) {
    return { centerX: 0, centerY: 0, scale: 0.005 };
  }
  const sorted = [...keyframes].sort((a, b) => a.t - b.t);
  if (timeMs <= sorted[0].t) {
    return sorted[0].viewport;
  }
  if (timeMs >= sorted[sorted.length - 1].t) {
    return sorted[sorted.length - 1].viewport;
  }

  for (let i = 0; i < sorted.length - 1; i += 1) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (timeMs >= a.t && timeMs <= b.t) {
      const localT = (timeMs - a.t) / Math.max(1, b.t - a.t);
      return interpolateViewport(a.viewport, b.viewport, localT);
    }
  }
  return sorted[0].viewport;
}
