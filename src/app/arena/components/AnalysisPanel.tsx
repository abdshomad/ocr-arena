/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { ResultsMap } from "../utils/ocrConstants";
import { FieldsTab } from "./FieldsTab";
import { MarkdownTab } from "./MarkdownTab";
import { JsonTab } from "./JsonTab";
import { MetadataTab } from "./MetadataTab";
import { ArenaTab } from "./ArenaTab";
import { PerformanceTab } from "./PerformanceTab";
import { handleExportSingle, handleExportZip } from "../utils/exportUtils";

interface AnalysisPanelProps {
  state: any;
  handlers: any;
  scrollContainersRef: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
}

const TABS = [
  { id: "fields", label: "Fields" },
  { id: "markdown", label: "Content" },
  { id: "arena", label: "Result" },
  { id: "json", label: "Code" },
  { id: "metadata", label: "Metadata" },
  { id: "performance", label: "Metrics" }
] as const;

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  state,
  handlers,
  scrollContainersRef
}) => {
  const {
    isRightPanelExpanded,
    rightPanelTab,
    setRightPanelTab,
    selectedOverlayEngine,
    setSelectedOverlayEngine,
    searchQuery,
    setSearchQuery,
    globalFontSize,
    globalWordWrap,
    cardFontSizes,
    setCardFontSizes,
    cardWordWrap,
    setCardWordWrap,
    results,
    selectedPageIndex,
    visibleLabels,
    visibleEngines,
    latencyTarget,
    accuracyTarget,
    showGroundTruth,
    groundTruth,
    diffBaseline,
    setDiffBaseline,
    showDiffs,
    setShowDiffs,
    splitDiff,
    setSplitDiff,
    syncScroll,
    setSyncScroll,
    activeExportDropdown,
    setActiveExportDropdown,
    gridCols,
    selectedFilename,
    hoveredBlock,
    setHoveredBlock
  } = state;

  const { handleCopy, handleScroll } = handlers;

  return (
    <div className={`h-full flex-none flex flex-col overflow-hidden border-l fluent-border transition-all duration-200 ${isRightPanelExpanded ? "w-[400px] xl:w-[480px]" : "w-0 border-l-0"}`} style={{ contentVisibility: isRightPanelExpanded ? "auto" : "hidden" }}>
      <div className="flex-1 flex flex-col overflow-hidden fluent-surface">
        <div className="h-10 border-b fluent-border bg-[var(--fluent-subheader)] px-3 flex items-end gap-0 select-none flex-none overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setRightPanelTab(t.id)}
              className={`px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${rightPanelTab === t.id ? "fluent-tab-active text-[#0078d4]" : "text-[var(--fluent-text-secondary)] hover:text-[var(--fluent-text)]"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0 p-3 select-text">
          {rightPanelTab === "fields" && (
            <FieldsTab
              selectedOverlayEngine={selectedOverlayEngine}
              setSelectedOverlayEngine={setSelectedOverlayEngine}
              results={results}
              selectedPageIndex={selectedPageIndex}
              visibleLabels={visibleLabels}
              hoveredBlock={hoveredBlock}
              setHoveredBlock={setHoveredBlock}
            />
          )}

          {rightPanelTab === "markdown" && (
            <MarkdownTab
              selectedOverlayEngine={selectedOverlayEngine}
              setSelectedOverlayEngine={setSelectedOverlayEngine}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              globalFontSize={globalFontSize}
              globalWordWrap={globalWordWrap}
              cardFontSizes={cardFontSizes}
              setCardFontSizes={setCardFontSizes}
              cardWordWrap={cardWordWrap}
              setCardWordWrap={setCardWordWrap}
              results={results}
              selectedPageIndex={selectedPageIndex}
              visibleLabels={visibleLabels}
              handleCopy={handleCopy}
              scrollContainersRef={scrollContainersRef}
              handleScroll={handleScroll}
            />
          )}

          {rightPanelTab === "json" && (
            <JsonTab
              selectedOverlayEngine={selectedOverlayEngine}
              setSelectedOverlayEngine={setSelectedOverlayEngine}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              results={results}
              handleCopy={handleCopy}
            />
          )}

          {rightPanelTab === "metadata" && (
            <MetadataTab
              selectedOverlayEngine={selectedOverlayEngine}
              setSelectedOverlayEngine={setSelectedOverlayEngine}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              results={results}
            />
          )}

          {rightPanelTab === "arena" && (
            <ArenaTab
              visibleEngines={visibleEngines}
              results={results}
              selectedPageIndex={selectedPageIndex}
              visibleLabels={visibleLabels}
              latencyTarget={latencyTarget}
              accuracyTarget={accuracyTarget}
              showGroundTruth={showGroundTruth}
              groundTruth={groundTruth}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              diffBaseline={diffBaseline}
              setDiffBaseline={setDiffBaseline}
              showDiffs={showDiffs}
              setShowDiffs={setShowDiffs}
              splitDiff={splitDiff}
              setSplitDiff={setSplitDiff}
              syncScroll={syncScroll}
              setSyncScroll={setSyncScroll}
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
              handleExportSingle={(engineId, format) => {
                const res = results[engineId as keyof ResultsMap];
                handleExportSingle(engineId, format, res.rawResult, res.text, selectedPageIndex, selectedFilename, visibleLabels);
              }}
              handleExportZip={() => handleExportZip(results, selectedFilename, selectedPageIndex, visibleLabels)}
              gridCols={gridCols}
            />
          )}

          {rightPanelTab === "performance" && (
            <PerformanceTab
              results={results}
              visibleEngines={visibleEngines}
              selectedPageIndex={selectedPageIndex}
              latencyTarget={latencyTarget}
              accuracyTarget={accuracyTarget}
              showGroundTruth={showGroundTruth}
              groundTruth={groundTruth}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisPanel;
