import { useEffect, useMemo } from "react";
import { RenderBridge } from "./RenderBridge";
import { RenderContext } from "./RenderContext";
import { TopBar } from "../ui/TopBar/TopBar";
import { SidePanel } from "../ui/SidePanel/SidePanel";
import { Canvas } from "../ui/Canvas/Canvas";
import { actions, store } from "../state/store";
import { loadUiPreferences, saveUiPreferences } from "../persistence/uiPrefs";
import { saveLastScene } from "../persistence/sceneStorage";

export function App() {
  const renderBridge = useMemo(() => new RenderBridge(), []);

  useEffect(() => {
    const prefs = loadUiPreferences();
    if (Object.keys(prefs).length > 0) {
      actions.updateUiPreferences(prefs);
    }
    const unsubscribe = store.subscribe(() => {
      saveUiPreferences(store.getState().ui);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    let timer: number | null = null;
    const unsubscribe = store.subscribe(() => {
      if (timer) {
        window.clearTimeout(timer);
      }
      const nextScene = store.getState().scene;
      timer = window.setTimeout(() => {
        saveLastScene(nextScene);
      }, 400);
    });
    return () => {
      if (timer) {
        window.clearTimeout(timer);
      }
      unsubscribe();
    };
  }, []);

  return (
    <RenderContext.Provider value={renderBridge}>
      <div className="app">
        <TopBar />
        <div className="content">
          <div className="canvas-wrap">
            <Canvas />
            <div className="canvas-overlay" />
          </div>
          <SidePanel />
        </div>
      </div>
    </RenderContext.Provider>
  );
}
