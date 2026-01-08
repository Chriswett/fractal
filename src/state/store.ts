import { useSyncExternalStore } from "react";
import { defaultScene } from "./defaults";
import {
  AppState,
  ColorProfile,
  FractalType,
  Journey,
  Keyframe,
  Preset,
  RenderQualityHint,
  Scene,
  Timeline,
  UiPreferences,
  Viewport
} from "./types";
import { createId } from "../utils/id";
import { saveUserJourney, deleteUserJourney } from "../persistence/presetsDb";

type TimeoutHandle = ReturnType<typeof setTimeout>;

const JOURNEY_SAVE_DEBOUNCE_MS = 250;
const journeySaveTimers = new Map<string, TimeoutHandle>();

function scheduleJourneySave(journey: Journey) {
  const existing = journeySaveTimers.get(journey.id);
  if (existing) {
    clearTimeout(existing);
  }
  const timer = setTimeout(() => {
    saveUserJourney(journey).catch(() => {
      // ignore persistence errors
    });
    journeySaveTimers.delete(journey.id);
  }, JOURNEY_SAVE_DEBOUNCE_MS);
  journeySaveTimers.set(journey.id, timer);
}

const defaultTimeline: Timeline = {
  durationMs: 20000,
  keyframes: [{ t: 0, viewport: defaultScene.viewport }]
};

const defaultState: AppState = {
  scene: defaultScene,
  presets: { builtins: [], users: [] },
  timeline: defaultTimeline,
  journeys: { users: [] },
  ui: {
    activePanel: "gallery",
    showAdvancedColor: false,
    timelinePlaying: false,
    activeJourneyId: null
  },
  renderRequestId: 0,
  renderHint: "final"
};

type Listener = () => void;

type Store = {
  getState: () => AppState;
  setState: (updater: (state: AppState) => AppState) => void;
  subscribe: (listener: Listener) => () => void;
};

const listeners = new Set<Listener>();
let state = defaultState;

function normalizeKeyframes(keyframes: Keyframe[], durationMs: number): Keyframe[] {
  if (keyframes.length === 0) {
    return [];
  }
  const maxT = Math.max(...keyframes.map((keyframe) => keyframe.t));
  const needsMsConversion = maxT > 0 && maxT <= 1;
  const scale = needsMsConversion ? durationMs : 1;
  const clamped = keyframes
    .map((keyframe) => ({
      ...keyframe,
      t: Math.max(0, Math.min(durationMs, keyframe.t * scale))
    }))
    .sort((a, b) => a.t - b.t);

  if (clamped.length === 1) {
    return [{ ...clamped[0], t: 0 }];
  }

  clamped[0] = { ...clamped[0], t: 0 };
  clamped[clamped.length - 1] = { ...clamped[clamped.length - 1], t: durationMs };
  return clamped;
}

function updateJourneyList(
  journeys: Journey[],
  journeyId: string,
  updater: (journey: Journey) => Journey
): { next: Journey[]; updated: Journey | null } {
  const index = journeys.findIndex((journey) => journey.id === journeyId);
  if (index === -1) {
    return { next: journeys, updated: null };
  }
  const updated = updater(journeys[index]);
  const next = journeys.slice();
  next[index] = updated;
  return { next, updated };
}

const store: Store = {
  getState: () => state,
  setState: (updater) => {
    state = updater(state);
    listeners.forEach((listener) => listener());
  },
  subscribe: (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }
};

export function useStore<T>(selector: (state: AppState) => T): T {
  return useSyncExternalStore(store.subscribe, () => selector(store.getState()));
}

function requestRender(current: AppState, hint: RenderQualityHint): AppState {
  return {
    ...current,
    scene: {
      ...current.scene,
      render: { ...current.scene.render, qualityHint: hint }
    },
    renderRequestId: current.renderRequestId + 1,
    renderHint: hint
  };
}

export const actions = {
  triggerRender(hint: RenderQualityHint = "final") {
    store.setState((current) => requestRender(current, hint));
  },
  setScene(nextScene: Scene, hint: RenderQualityHint = "final") {
    store.setState((current) => {
      const resetTimeline: Timeline = {
        ...current.timeline,
        keyframes: normalizeKeyframes([{ t: 0, viewport: nextScene.viewport }], current.timeline.durationMs)
      };
      const nextState = requestRender({ ...current, scene: nextScene, timeline: resetTimeline }, hint);
      return { ...nextState, ui: { ...nextState.ui, activeJourneyId: null } };
    });
  },
  updateScene(partial: Partial<Scene>, hint: RenderQualityHint = "final") {
    store.setState((current) => {
      const nextScene = { ...current.scene, ...partial };
      let nextState = requestRender({ ...current, scene: nextScene }, hint);
      const activeId = current.ui.activeJourneyId;
      if (activeId) {
        const { next, updated } = updateJourneyList(current.journeys.users, activeId, (journey) => ({
          ...journey,
          scene: nextScene
        }));
        if (updated) {
          scheduleJourneySave(updated);
          nextState = { ...nextState, journeys: { ...current.journeys, users: next } };
        }
      }
      return nextState;
    });
  },
  updateViewport(viewport: Viewport, hint: RenderQualityHint = "interactive") {
    store.setState((current) => {
      const nextScene = { ...current.scene, viewport };
      return requestRender({ ...current, scene: nextScene }, hint);
    });
  },
  setFractalType(type: FractalType, params: Scene["params"], viewport?: Viewport) {
    store.setState((current) => {
      const nextScene: Scene = {
        ...current.scene,
        fractalType: type,
        params,
        viewport: viewport ?? current.scene.viewport
      };
      let nextState = requestRender({ ...current, scene: nextScene }, "final");
      const activeId = current.ui.activeJourneyId;
      if (activeId) {
        const { next, updated } = updateJourneyList(current.journeys.users, activeId, (journey) => ({
          ...journey,
          scene: nextScene
        }));
        if (updated) {
          scheduleJourneySave(updated);
          nextState = { ...nextState, journeys: { ...current.journeys, users: next } };
        }
      }
      return nextState;
    });
  },
  updateColor(color: ColorProfile, hint: RenderQualityHint = "final") {
    store.setState((current) => {
      const nextScene = { ...current.scene, color };
      let nextState = requestRender({ ...current, scene: nextScene }, hint);
      const activeId = current.ui.activeJourneyId;
      if (activeId) {
        const { next, updated } = updateJourneyList(current.journeys.users, activeId, (journey) => ({
          ...journey,
          scene: nextScene
        }));
        if (updated) {
          scheduleJourneySave(updated);
          nextState = { ...nextState, journeys: { ...current.journeys, users: next } };
        }
      }
      return nextState;
    });
  },
  setPresets(builtins: Preset[], users: Preset[]) {
    store.setState((current) => ({ ...current, presets: { builtins, users } }));
  },
  addUserPreset(preset: Preset) {
    store.setState((current) => ({
      ...current,
      presets: { ...current.presets, users: [preset, ...current.presets.users] }
    }));
  },
  removeUserPreset(presetId: string) {
    store.setState((current) => ({
      ...current,
      presets: {
        ...current.presets,
        users: current.presets.users.filter((preset) => preset.id !== presetId)
      }
    }));
  },
  setTimeline(timeline: Timeline) {
    store.setState((current) => ({
      ...current,
      timeline: {
        ...timeline,
        keyframes: normalizeKeyframes(timeline.keyframes, timeline.durationMs)
      }
    }));
  },
  updateTimeline(timeline: Timeline) {
    store.setState((current) => {
      const normalized = {
        ...timeline,
        keyframes: normalizeKeyframes(timeline.keyframes, timeline.durationMs)
      };
      let nextState: AppState = { ...current, timeline: normalized };
      const activeId = current.ui.activeJourneyId;
      if (activeId) {
        const { next, updated } = updateJourneyList(current.journeys.users, activeId, (journey) => ({
          ...journey,
          timeline: normalized,
          scene: {
            ...journey.scene,
            viewport: normalized.keyframes[0]?.viewport ?? journey.scene.viewport
          }
        }));
        if (updated) {
          scheduleJourneySave(updated);
          nextState = { ...nextState, journeys: { ...current.journeys, users: next } };
        }
      }
      return nextState;
    });
  },
  addKeyframe(viewport: Viewport, t: number) {
    store.setState((current) => {
      const timeline = current.timeline;
      const keyframes = normalizeKeyframes(
        [...timeline.keyframes, { t, viewport: { ...viewport } }],
        timeline.durationMs
      );
      const normalized = { ...timeline, keyframes };
      let nextState: AppState = { ...current, timeline: normalized };
      const activeId = current.ui.activeJourneyId;
      if (activeId) {
        const { next, updated } = updateJourneyList(current.journeys.users, activeId, (journey) => ({
          ...journey,
          timeline: normalized,
          scene: { ...journey.scene, viewport: normalized.keyframes[0]?.viewport ?? journey.scene.viewport }
        }));
        if (updated) {
          scheduleJourneySave(updated);
          nextState = { ...nextState, journeys: { ...current.journeys, users: next } };
        }
      }
      return nextState;
    });
  },
  removeKeyframe(index: number) {
    store.setState((current) => {
      const timeline = current.timeline;
      const keyframes = normalizeKeyframes(
        timeline.keyframes.filter((_, i) => i !== index),
        timeline.durationMs
      );
      const normalized = { ...timeline, keyframes };
      let nextState: AppState = { ...current, timeline: normalized };
      const activeId = current.ui.activeJourneyId;
      if (activeId) {
        const { next, updated } = updateJourneyList(current.journeys.users, activeId, (journey) => ({
          ...journey,
          timeline: normalized,
          scene: { ...journey.scene, viewport: normalized.keyframes[0]?.viewport ?? journey.scene.viewport }
        }));
        if (updated) {
          scheduleJourneySave(updated);
          nextState = { ...nextState, journeys: { ...current.journeys, users: next } };
        }
      }
      return nextState;
    });
  },
  setJourneys(users: Journey[]) {
    store.setState((current) => ({
      ...current,
      journeys: {
        users: users.map((journey) => {
          const timeline = {
            ...journey.timeline,
            keyframes: normalizeKeyframes(journey.timeline.keyframes, journey.timeline.durationMs)
          };
          const startViewport = timeline.keyframes[0]?.viewport;
          return {
            ...journey,
            timeline,
            scene: startViewport ? { ...journey.scene, viewport: startViewport } : journey.scene
          };
        })
      },
      ui: {
        ...current.ui,
        activeJourneyId: users.some((journey) => journey.id === current.ui.activeJourneyId)
          ? current.ui.activeJourneyId
          : null
      }
    }));
  },
  addJourney(journey: Journey) {
    store.setState((current) => {
      const timeline = {
        ...journey.timeline,
        keyframes: normalizeKeyframes(journey.timeline.keyframes, journey.timeline.durationMs)
      };
      const startViewport = timeline.keyframes[0]?.viewport;
      const nextJourney: Journey = {
        ...journey,
        timeline,
        scene: startViewport ? { ...journey.scene, viewport: startViewport } : journey.scene
      };
      scheduleJourneySave(nextJourney);
      return {
        ...current,
        journeys: { users: [nextJourney, ...current.journeys.users] },
        ui: { ...current.ui, activeJourneyId: nextJourney.id }
      };
    });
  },
  renameJourney(journeyId: string, name: string) {
    store.setState((current) => {
      const { next, updated } = updateJourneyList(current.journeys.users, journeyId, (journey) => ({
        ...journey,
        name
      }));
      if (updated) {
        scheduleJourneySave(updated);
      }
      return { ...current, journeys: { users: next } };
    });
  },
  removeJourney(journeyId: string) {
    store.setState((current) => {
      deleteUserJourney(journeyId).catch(() => {
        // ignore persistence errors
      });
      const nextUsers = current.journeys.users.filter((journey) => journey.id !== journeyId);
      const nextActive = current.ui.activeJourneyId === journeyId ? null : current.ui.activeJourneyId;
      return {
        ...current,
        journeys: { users: nextUsers },
        ui: { ...current.ui, activeJourneyId: nextActive }
      };
    });
  },
  loadJourney(journey: Journey, hint: RenderQualityHint = "final") {
    store.setState((current) => {
      const nextTimeline = {
        ...journey.timeline,
        keyframes: normalizeKeyframes(journey.timeline.keyframes, journey.timeline.durationMs)
      };
      const nextState = requestRender({ ...current, scene: journey.scene, timeline: nextTimeline }, hint);
      return { ...nextState, ui: { ...nextState.ui, activeJourneyId: journey.id } };
    });
  },
  updateUiPreferences(partial: Partial<UiPreferences>) {
    store.setState((current) => ({
      ...current,
      ui: { ...current.ui, ...partial }
    }));
  },
  setTimelinePlaying(isPlaying: boolean) {
    store.setState((current) => ({
      ...current,
      ui: { ...current.ui, timelinePlaying: isPlaying }
    }));
  },
  resetScene() {
    store.setState((current) => {
      const resetScene: Scene = { ...defaultScene, id: createId("scene") };
      const resetTimeline: Timeline = {
        ...current.timeline,
        keyframes: normalizeKeyframes([{ t: 0, viewport: resetScene.viewport }], current.timeline.durationMs)
      };
      const nextState = requestRender({ ...current, scene: resetScene, timeline: resetTimeline }, "final");
      return { ...nextState, ui: { ...nextState.ui, activeJourneyId: null } };
    });
  }
};

export { store };
