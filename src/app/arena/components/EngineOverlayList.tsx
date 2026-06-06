import React from "react";
import { engines, ENGINE_PRICING, ResultsMap } from "../utils/ocrConstants";
import { calculateCER } from "../utils/metricUtils";
import { getFilteredText } from "../utils/ocrHelpers";

interface EngineOverlayListProps {
  results: ResultsMap;
  visibleEngines: string[];
  setVisibleEngines: React.Dispatch<React.SetStateAction<string[]>>;
  selectedOverlayEngine: string;
  setSelectedOverlayEngine: (engine: string) => void;
  showGroundTruth: boolean;
  groundTruth: string;
  selectedPageIndex: number;
  visibleLabels: string[];
  latencyTarget: number;
  accuracyTarget: number;
  overlayEngines?: string[];
  setOverlayEngines?: React.Dispatch<React.SetStateAction<string[]>>;
  isRightPanelExpanded?: boolean;
  setIsRightPanelExpanded?: React.Dispatch<React.SetStateAction<boolean>>;
  rightPanelTab?: string;
  setRightPanelTab?: React.Dispatch<React.SetStateAction<any>>;
}

export const EngineOverlayList: React.FC<EngineOverlayListProps> = ({
  results,
  visibleEngines,
  setVisibleEngines,
  selectedOverlayEngine,
  setSelectedOverlayEngine,
  showGroundTruth,
  groundTruth,
  selectedPageIndex,
  visibleLabels,
  latencyTarget,
  accuracyTarget,
  overlayEngines,
  setOverlayEngines,
  isRightPanelExpanded,
  setIsRightPanelExpanded,
  rightPanelTab,
  setRightPanelTab
}) => {
  return (
    <div className="space-y-1.5">
      {engines.map((eng) => {
        const res = results[eng.id];
        const isVisible = visibleEngines.includes(eng.id);
        const isOverlayActive = selectedOverlayEngine === eng.id;
        const hasText = res?.status === "done";

        const satisfiesLatency = res?.time > 0 ? res.time / 1000 <= latencyTarget : true;
        let satisfiesAccuracy = true;
        let charAcc: number | null = null;
        if (showGroundTruth && groundTruth && hasText) {
          const pageTextFiltered = getFilteredText(
            res.rawResult,
            res.rawResult?.layoutParsingResults?.[selectedPageIndex]?.markdown?.text || res.text || "",
            visibleLabels,
            selectedPageIndex
          );
          const cerErr = calculateCER(groundTruth, pageTextFiltered);
          charAcc = Math.max(0, 100 - cerErr * 100);
          satisfiesAccuracy = charAcc >= accuracyTarget;
        }
        const hasSlaViolations = !satisfiesLatency || !satisfiesAccuracy;

        return (
          <div
            key={eng.id}
            onClick={() => {
              setSelectedOverlayEngine(eng.id);
              if (setOverlayEngines) {
                setOverlayEngines([eng.id]);
              }
              if (setIsRightPanelExpanded) {
                setIsRightPanelExpanded(true);
              }
              if (!visibleEngines.includes(eng.id)) {
                setVisibleEngines((prev) => [...prev, eng.id]);
              }
              setTimeout(() => {
                const el = document.getElementById(`engine-card-${eng.id}`);
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "center" });
                }
              }, 100);
            }}
            className={`p-2 rounded-sm border flex flex-col gap-1 transition-all cursor-pointer hover:border-[#0078d4]/30 ${isOverlayActive ? "border-[#0078d4]/50 bg-[#0078d4]/5" : "fluent-border bg-[var(--fluent-bg)]"}`}
          >
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                <input
                  type="checkbox"
                  checked={isVisible}
                  disabled={isVisible && visibleEngines.length === 1}
                  onChange={() => setVisibleEngines((prev) => isVisible ? prev.filter((id) => id !== eng.id) : [...prev, eng.id])}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded text-[#0078d4] w-3.5 h-3.5"
                />
                <span className="text-[11px] font-semibold text-[var(--fluent-text)] truncate">{eng.name}</span>
              </label>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedOverlayEngine(eng.id);
                  if (setOverlayEngines) {
                    setOverlayEngines([eng.id]);
                  }
                  if (setIsRightPanelExpanded) {
                    setIsRightPanelExpanded(true);
                  }
                  if (!visibleEngines.includes(eng.id)) {
                    setVisibleEngines((prev) => [...prev, eng.id]);
                  }
                  setTimeout(() => {
                    const el = document.getElementById(`engine-card-${eng.id}`);
                    if (el) {
                      el.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                  }, 100);
                }}
                className={`px-1.5 py-0.5 rounded-sm text-[9px] font-semibold border ${isOverlayActive ? "bg-[#0078d4] border-[#0078d4] text-white" : "fluent-border text-[var(--fluent-text-secondary)]"}`}
              >
                Overlay
              </button>
            </div>
            <div className="flex items-center justify-between text-[9px] text-[var(--fluent-text-muted)] border-t fluent-border pt-1">
              <span className={`font-semibold uppercase ${res?.status === "done" ? "text-[#107c10]" : res?.status === "failed" ? "text-[#d13438]" : ""}`}>
                {res?.status || "pending"}
              </span>
              {res?.time > 0 && (
                <span className={`font-mono ${!satisfiesLatency ? "text-[#d13438]" : ""}`}>{(res.time / 1000).toFixed(2)}s</span>
              )}
            </div>
            {hasSlaViolations && hasText && (
              <div className="text-[8px] text-[#d13438] bg-[#fde7e9] rounded-sm px-1.5 py-0.5">
                SLA breach detected
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default EngineOverlayList;
