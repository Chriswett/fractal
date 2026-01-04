import { GalleryPanel } from "../Gallery/GalleryPanel";
import { ColorStudioPanel } from "../ColorStudio/ColorStudioPanel";
import { TimelinePanel } from "../Timeline/TimelinePanel";
import { ExportPanel } from "../Export/ExportPanel";
import { actions, useStore } from "../../state/store";

const tabs = [
  { id: "gallery", label: "Gallery" },
  { id: "color", label: "Color" },
  { id: "timeline", label: "Timeline" },
  { id: "export", label: "Export" }
] as const;

type TabId = (typeof tabs)[number]["id"];

export function SidePanel() {
  const activeTab = useStore((state) => state.ui.activePanel);

  return (
    <aside className="side-panel">
      <div className="panel-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`panel-tab${activeTab === tab.id ? " active" : ""}`}
            onClick={() => actions.updateUiPreferences({ activePanel: tab.id })}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="panel-content">
        {activeTab === "gallery" && <GalleryPanel />}
        {activeTab === "color" && <ColorStudioPanel />}
        {activeTab === "timeline" && <TimelinePanel />}
        {activeTab === "export" && <ExportPanel />}
      </div>
    </aside>
  );
}
