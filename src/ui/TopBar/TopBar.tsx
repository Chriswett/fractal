import { IconButton } from "../common/IconButton";
import { ExpandIcon, ExportIcon, ResetIcon } from "../common/Icons";
import { actions, useStore } from "../../state/store";
import { fractalRegistry } from "../../engine/registry";
import { deepClone } from "../../utils/clone";

export function TopBar() {
  const fractalType = useStore((state) => state.scene.fractalType);
  const handleReset = () => {
    const defaultScene = fractalRegistry.get(fractalType).defaultScene;
    actions.setScene(deepClone(defaultScene), "final");
  };
  const handleExport = () => actions.updateUiPreferences({ activePanel: "export" });
  const handleFullscreen = async () => {
    const target = document.querySelector(".canvas-wrap") as HTMLElement | null;
    if (!target) {
      return;
    }
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await target.requestFullscreen();
    }
  };

  return (
    <div className="topbar">
      <div className="topbar-title">Fraktaler</div>
      <div className="topbar-actions">
        <IconButton label="Reset view" onClick={handleReset}>
          <ResetIcon />
        </IconButton>
        <IconButton label="Fullscreen" onClick={handleFullscreen}>
          <ExpandIcon />
        </IconButton>
        <IconButton label="Export" onClick={handleExport}>
          <ExportIcon />
        </IconButton>
      </div>
    </div>
  );
}
