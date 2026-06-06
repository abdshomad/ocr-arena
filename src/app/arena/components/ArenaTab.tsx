import React from "react";
import { engines, ResultsMap } from "../utils/ocrConstants";
import { ArenaEngineCard } from "./ArenaEngineCard";

interface ArenaTabProps {
  visibleEngines: string[];
  results: ResultsMap;
  selectedPageIndex: number;
  visibleLabels: string[];
  latencyTarget: number;
  accuracyTarget: number;
  showGroundTruth: boolean;
  groundTruth: string;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  diffBaseline: string;
  setDiffBaseline: (b: string) => void;
  showDiffs: boolean;
  setShowDiffs: (d: boolean) => void;
  splitDiff: boolean;
  setSplitDiff: (s: boolean) => void;
  syncScroll: boolean;
  setSyncScroll: (s: boolean) => void;
  cardFontSizes: Record<string, "sm" | "md" | "lg">;
  setCardFontSizes: React.Dispatch<React.SetStateAction<Record<string, "sm" | "md" | "lg">>>;
  cardWordWrap: Record<string, boolean>;
  setCardWordWrap: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  globalFontSize: "sm" | "md" | "lg";
  globalWordWrap: boolean;
  activeExportDropdown: string | null;
  setActiveExportDropdown: (id: string | null) => void;
  scrollContainersRef: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  handleScroll: (e: React.UIEvent<HTMLDivElement>, engineId: string) => void;
  handleCopy: (text: string, id: string) => void;
  handleExportSingle: (engineId: string, format: "md" | "json" | "html" | "txt") => void;
  handleExportZip: () => void;
  gridCols: 1 | 2 | 3;
}

export const ArenaTab: React.FC<ArenaTabProps> = ({
  visibleEngines,
  results,
  selectedPageIndex,
  visibleLabels,
  latencyTarget,
  accuracyTarget,
  showGroundTruth,
  groundTruth,
  searchQuery,
  setSearchQuery,
  diffBaseline,
  setDiffBaseline,
  showDiffs,
  setShowDiffs,
  splitDiff,
  setSplitDiff,
  syncScroll,
  setSyncScroll,
  cardFontSizes,
  setCardFontSizes,
  cardWordWrap,
  setCardWordWrap,
  globalFontSize,
  globalWordWrap,
  activeExportDropdown,
  setActiveExportDropdown,
  scrollContainersRef,
  handleScroll,
  handleCopy,
  handleExportSingle,
  handleExportZip,
  gridCols
}) => {
  const diffBaselineReady = results[diffBaseline as keyof ResultsMap]?.status === "done";

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full overflow-hidden">
      {/* Compare Arena Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center text-xs pb-2 border-b border-[#1f2943]/60 select-none flex-none mb-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search Text input */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Highlight text..."
            className="bg-slate-955 border border-slate-800 rounded-lg px-2 py-1 text-xs placeholder-slate-550 focus:outline-none w-28 text-slate-200"
          />

          {/* Diff Mode options */}
          <div className={`flex items-center gap-1.5 select-none ${!diffBaselineReady ? "opacity-50 cursor-not-allowed" : ""}`}>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                disabled={!diffBaselineReady}
                checked={showDiffs}
                onChange={(e) => setShowDiffs(e.target.checked)}
                className="rounded border-slate-700 text-[#0078d4] focus:ring-[#0078d4] w-3 h-3 cursor-pointer"
              />
              <span className="text-[10px] font-bold text-slate-400">
                Diff
              </span>
            </label>
            
            <select
              value={diffBaseline}
              onChange={(e) => {
                const val = e.target.value;
                setDiffBaseline(val);
                if (results[val as keyof ResultsMap]?.status !== "done") {
                  setShowDiffs(false);
                }
              }}
              className="bg-slate-950 border border-slate-800 rounded px-1 py-0.5 text-[9px] font-bold text-[#0078d4] focus:outline-none cursor-pointer"
            >
              {engines.map((eng) => (
                <option key={eng.id} value={eng.id} className="bg-[#111625] text-slate-205">
                  {eng.name}
                </option>
              ))}
            </select>
            
            {showDiffs && (
              <label className="flex items-center gap-1 cursor-pointer ml-1 select-none">
                <input
                  type="checkbox"
                  checked={splitDiff}
                  onChange={(e) => setSplitDiff(e.target.checked)}
                  className="rounded border-slate-700 text-[#0078d4] focus:ring-[#0078d4] w-3 h-3 cursor-pointer"
                  id="split-diff-checkbox"
                />
                <span className="text-[9px] font-bold text-slate-400">
                  Split
                </span>
              </label>
            )}
          </div>

          {/* Sync Scroll Toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={syncScroll}
              onChange={(e) => setSyncScroll(e.target.checked)}
              className="rounded border-slate-700 text-[#0078d4] focus:ring-[#0078d4] w-3 h-3 cursor-pointer"
            />
            <span className="text-[10px] font-bold text-slate-455 dark:text-slate-400">
              Sync
            </span>
          </label>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportZip}
            disabled={!Object.values(results).some(r => r.status === "done")}
            className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 hover:bg-slate-900 font-bold text-[9px] transition-all text-slate-350"
            title="Export all results as ZIP"
          >
            Export ZIP
          </button>
        </div>
      </div>

      {/* Main compare grid */}
      <div className="flex-1 overflow-y-auto pr-1 select-text h-full min-h-0">
        <div className={`grid gap-4 pb-4 ${
          gridCols === 1
            ? "grid-cols-1"
            : gridCols === 2
            ? "grid-cols-1 lg:grid-cols-2"
            : "grid-cols-1 xl:grid-cols-2"
        }`}>
          {engines.filter((e) => visibleEngines.includes(e.id)).map((engine) => (
            <ArenaEngineCard
              key={engine.id}
              engine={engine}
              res={results[engine.id]}
              selectedPageIndex={selectedPageIndex}
              visibleLabels={visibleLabels}
              latencyTarget={latencyTarget}
              accuracyTarget={accuracyTarget}
              showGroundTruth={showGroundTruth}
              groundTruth={groundTruth}
              searchQuery={searchQuery}
              diffBaseline={diffBaseline}
              baselineRes={results[diffBaseline as keyof ResultsMap]}
              showDiffs={showDiffs}
              splitDiff={splitDiff}
              cardFontSizes={cardFontSizes}
              setCardFontSizes={setCardFontSizes}
              cardWordWrap={cardWordWrap}
              setCardWordWrap={setCardWordWrap}
              globalFontSize={globalFontSize}
              globalWordWrap={globalWordWrap}
              activeExportDropdown={activeExportDropdown}
              setActiveExportDropdown={setActiveExportDropdown}
              scrollContainersRef={scrollContainersRef}
              handleScroll={handleScroll}
              handleCopy={handleCopy}
              handleExportSingle={handleExportSingle}
              results={results}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
export default ArenaTab;
