import React from "react";
import { allLabels } from "../utils/ocrConstants";
import { EngineOverlayList } from "./EngineOverlayList";
import { SlaSettings } from "./SlaSettings";

interface SettingsPanelProps {
  state: any;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ state }) => {
  const {
    isLeftPanelExpanded,
    selectedFilename,
    isCustomUpload,
    results,
    visibleEngines,
    setVisibleEngines,
    selectedOverlayEngine,
    setSelectedOverlayEngine,
    showGroundTruth,
    groundTruth,
    selectedPageIndex,
    latencyTarget,
    setLatencyTarget,
    accuracyTarget,
    setAccuracyTarget,
    visualColorMode,
    setVisualColorMode,
    heatmapMetric,
    setHeatmapMetric,
    visibleLabels,
    setVisibleLabels,
    confidenceThreshold,
    setConfidenceThreshold,
    overlayEngines,
    setOverlayEngines,
    isRightPanelExpanded,
    setIsRightPanelExpanded,
    rightPanelTab,
    setRightPanelTab
  } = state;

  return (
    <div className={`h-full flex-none flex flex-col overflow-hidden border-r fluent-border transition-all duration-200 ${isLeftPanelExpanded ? "w-64" : "w-0 border-r-0"}`} style={{ contentVisibility: isLeftPanelExpanded ? "auto" : "hidden" }}>
      <div className="flex-1 overflow-y-auto p-3 space-y-4 select-none fluent-surface">
        <div className="fluent-panel rounded-sm p-2.5">
          <span className="text-[9px] font-bold text-[var(--fluent-text-muted)] uppercase tracking-wider block">Document</span>
          <div className="text-xs font-semibold truncate text-[#0078d4] mt-0.5" title={selectedFilename}>{selectedFilename}</div>
          <span className="text-[10px] text-[var(--fluent-text-secondary)]">{isCustomUpload ? "Custom upload" : "Sample template"}</span>
        </div>

        <div className="space-y-2">
          <h4 className="text-[10px] font-bold text-[var(--fluent-text-secondary)] uppercase tracking-wider border-b fluent-border pb-1">
            OCR engines
          </h4>
          <EngineOverlayList
            results={results}
            visibleEngines={visibleEngines}
            setVisibleEngines={setVisibleEngines}
            selectedOverlayEngine={selectedOverlayEngine}
            setSelectedOverlayEngine={setSelectedOverlayEngine}
            showGroundTruth={showGroundTruth}
            groundTruth={groundTruth}
            selectedPageIndex={selectedPageIndex}
            visibleLabels={visibleLabels}
            latencyTarget={latencyTarget}
            accuracyTarget={accuracyTarget}
            overlayEngines={overlayEngines}
            setOverlayEngines={setOverlayEngines}
            isRightPanelExpanded={isRightPanelExpanded}
            setIsRightPanelExpanded={setIsRightPanelExpanded}
            rightPanelTab={rightPanelTab}
            setRightPanelTab={setRightPanelTab}
          />
        </div>

        <div className="space-y-2">
          <h4 className="text-[10px] font-bold text-[var(--fluent-text-secondary)] uppercase tracking-wider border-b fluent-border pb-1">
            Visual layers
          </h4>
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-0.5 border fluent-border rounded-sm p-0.5 bg-[var(--fluent-bg)]">
              {(["label", "confidence", "heatmap"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setVisualColorMode(mode)}
                  className={`py-1 rounded-sm text-[9px] font-semibold capitalize ${visualColorMode === mode ? "bg-[#0078d4] text-white" : "text-[var(--fluent-text-secondary)]"}`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {visualColorMode === "heatmap" && (
              <div className="grid grid-cols-2 gap-0.5 border fluent-border rounded-sm p-0.5 bg-[var(--fluent-bg)]">
                {(["latency", "confidence"] as const).map((metric) => (
                  <button
                    key={metric}
                    onClick={() => setHeatmapMetric(metric)}
                    className={`py-0.5 rounded-sm text-[9px] font-semibold capitalize ${heatmapMetric === metric ? "bg-[#0078d4] text-white" : "text-[var(--fluent-text-secondary)]"}`}
                  >
                    {metric}
                  </button>
                ))}
              </div>
            )}

            <div className="border-t fluent-border pt-2">
              <div className="flex justify-between items-center text-[9px] font-bold text-[var(--fluent-text-muted)] uppercase mb-1">
                <span>Entities</span>
                <button
                  onClick={() => setVisibleLabels(visibleLabels.length === allLabels.length ? [] : [...allLabels])}
                  className="text-[#0078d4] hover:underline normal-case"
                >
                  {visibleLabels.length === allLabels.length ? "Clear" : "All"}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1 max-h-36 overflow-y-auto">
                {allLabels.map((lbl) => (
                  <label key={lbl} className="flex items-center gap-1.5 cursor-pointer p-1 rounded-sm hover:bg-[var(--fluent-bg)] text-[9px] text-[var(--fluent-text-secondary)]">
                    <input
                      type="checkbox"
                      checked={visibleLabels.includes(lbl)}
                      onChange={() => setVisibleLabels((prev: string[]) => prev.includes(lbl) ? prev.filter((x) => x !== lbl) : [...prev, lbl])}
                      className="rounded text-[#0078d4] w-3 h-3"
                    />
                    <span className="capitalize truncate">{lbl.replace("_", " ")}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-[10px] font-bold text-[var(--fluent-text-secondary)] uppercase tracking-wider border-b fluent-border pb-1">
            SLA thresholds
          </h4>
          <SlaSettings
            confidenceThreshold={confidenceThreshold}
            setConfidenceThreshold={setConfidenceThreshold}
            latencyTarget={latencyTarget}
            setLatencyTarget={setLatencyTarget}
            accuracyTarget={accuracyTarget}
            setAccuracyTarget={setAccuracyTarget}
          />
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
