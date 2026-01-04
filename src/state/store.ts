import { useSyncExternalStore } from "react";
import { defaultScene } from "./defaults";
import {
  AppState,
  ColorProfile,
  FractalType,
  Preset,
  RenderQualityHint,
  Scene,
  Timeline,
  UiPreferences,
  Viewport
} from "./types";
import { createId } from "../utils/id";

const defaultState: AppState = {
  scene: defaultScene,
  presets: { builtins: [], users: [] },
  timeline: {
    durationMs: 12000,
    keyframes: [{ t: 0, viewport: defaultScene.viewport }]
  },
  ui: {
    activePanel: "gallery",
    showAdvancedColor: false
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
    store.setState((current) => requestRender({ ...current, scene: nextScene }, hint));
  },
  updateScene(partial: Partial<Scene>, hint: RenderQualityHint = "final") {
    store.setState((current) => {
      const nextScene = { ...current.scene, ...partial };
      return requestRender({ ...current, scene: nextScene }, hint);
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
      return requestRender({ ...current, scene: nextScene }, "final");
    });
  },
  updateColor(color: ColorProfile, hint: RenderQualityHint = "final") {
    store.setState((current) => {
      const nextScene = { ...current.scene, color };
      return requestRender({ ...current, scene: nextScene }, hint);
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
  updateTimeline(timeline: Timeline) {
    store.setState((current) => ({ ...current, timeline }));
  },
  addKeyframe(viewport: Viewport, t: number) {
    store.setState((current) => {
      const keyframes = [...current.timeline.keyframes, { t, viewport: { ...viewport } }].sort(
        (a, b) => a.t - b.t
      );
      return { ...current, timeline: { ...current.timeline, keyframes } };
    });
  },
  removeKeyframe(index: number) {
    store.setState((current) => {
      const keyframes = current.timeline.keyframes.filter((_, i) => i !== index);
      return { ...current, timeline: { ...current.timeline, keyframes } };
    });
  },
  updateUiPreferences(partial: Partial<UiPreferences>) {
    store.setState((current) => ({
      ...current,
      ui: { ...current.ui, ...partial }
    }));
  },
  resetScene() {
    store.setState((current) => {
      const resetScene: Scene = { ...defaultScene, id: createId("scene") };
      return requestRender({ ...current, scene: resetScene }, "final");
    });
  }
};

export { store };
