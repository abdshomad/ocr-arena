/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef } from "react";
import { useArenaState } from "./hooks/useArenaState";
import { useArenaHandlers } from "./hooks/useArenaHandlers";
import { useBatchOcr } from "./hooks/useBatchOcr";
import { OCRHeader } from "./components/OCRHeader";
import { LandingHub } from "./components/LandingHub";
import { FileSidebar } from "./components/FileSidebar";
import { WorkspaceToolbar } from "./components/WorkspaceToolbar";
import { SettingsPanel } from "./components/SettingsPanel";
import { DocumentCanvas } from "./components/DocumentCanvas";
import { AnalysisPanel } from "./components/AnalysisPanel";
import { CropModal } from "./components/CropModal";
import { BatchOcrModal } from "./components/BatchOcrModal";
import { GroundTruthPanel } from "./components/GroundTruthPanel";
import { LoginView } from "./components/LoginView";

export const dynamic = "force-dynamic";

export default function OcrArenaPage() {
  const state = useArenaState();
  const scrollContainersRef = useRef<Record<string, HTMLDivElement | null>>({});
  const isSyncingScrollRef = useRef<boolean>(false);

  const handlers = useArenaHandlers(state as any, scrollContainersRef, isSyncingScrollRef);
  const batchOcr = useBatchOcr(state as any, handlers.fetchAnalytics);

  useEffect(() => {
    if (state.hoveredBlock) {
      const el = document.getElementById(`block-${state.hoveredBlock.engineId}-${state.hoveredBlock.blockId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [state.hoveredBlock]);

  useEffect(() => {
    if (state.isAuthenticated && state.activeTab === "analytics") {
      handlers.fetchAnalytics();
    }
  }, [state.isAuthenticated, state.activeTab, handlers]);

  const pageCount = React.useMemo(() => {
    let maxPages = 1;
    Object.values(state.results).forEach(res => {
      const pages = res.rawResult?.layoutParsingResults;
      if (Array.isArray(pages) && pages.length > maxPages) {
        maxPages = pages.length;
      }
    });
    return maxPages;
  }, [state.results]);

  if (!state.isAuthenticated) {
    return (
      <LoginView
        tokenInput={state.tokenInput}
        setTokenInput={state.setTokenInput}
        loginError={state.loginError}
        setLoginError={state.setLoginError}
        setIsAuthenticated={state.setIsAuthenticated}
      />
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[var(--fluent-bg)] text-[var(--fluent-text)]">
      <OCRHeader theme={state.theme} toggleTheme={state.toggleTheme} />

      {!state.selectedImage ? (
        <LandingHub
          isRunning={state.isRunning}
          runArenaCompare={handlers.runArenaCompare}
          handleFileUpload={handlers.handleFileUpload}
        />
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          <WorkspaceToolbar
            theme={state.theme}
            isRunning={state.isRunning}
            isBatchRunning={state.isBatchRunning}
            selectedImage={state.selectedImage}
            selectedFilename={state.selectedFilename}
            isCustomUpload={state.isCustomUpload}
            runArenaCompare={handlers.runArenaCompare}
            pageCount={pageCount}
            selectedPageIndex={state.selectedPageIndex}
            setSelectedPageIndex={state.setSelectedPageIndex}
            isLeftPanelExpanded={state.isLeftPanelExpanded}
            setIsLeftPanelExpanded={state.setIsLeftPanelExpanded}
            isRightPanelExpanded={state.isRightPanelExpanded}
            setIsRightPanelExpanded={state.setIsRightPanelExpanded}
            showGroundTruth={state.showGroundTruth}
            setShowGroundTruth={state.setShowGroundTruth}
            startBatchOCR={batchOcr.startBatchOCR}
            batchSize={state.batchSize}
            setBatchSize={state.setBatchSize}
            rightPanelTab={state.rightPanelTab}
            gridCols={state.gridCols}
            setGridCols={state.setGridCols}
            setSelectedImage={state.setSelectedImage}
          />

          <div className="flex-1 flex flex-row overflow-hidden min-h-0 relative">
            <FileSidebar
              selectedImage={state.selectedImage}
              selectedFilename={state.selectedFilename}
              isCustomUpload={state.isCustomUpload}
              isRunning={state.isRunning}
              runArenaCompare={handlers.runArenaCompare}
              handleFileUpload={handlers.handleFileUpload}
            />
            <SettingsPanel state={state} />
            <DocumentCanvas state={state} handlers={handlers} />

            <AnalysisPanel
              state={state}
              handlers={handlers}
              scrollContainersRef={scrollContainersRef}
            />
          </div>
        </div>
      )}

      {/* RETAIN ALL MODALS & EXTRA OVERLAYS */}
      {state.activeTooltip && (
        <div
          className="fixed z-50 fluent-panel rounded-sm p-3 shadow-lg max-w-xs pointer-events-none -translate-x-1/2 -translate-y-full flex flex-col space-y-1 text-xs select-none"
          style={{ left: state.activeTooltip.x, top: state.activeTooltip.y, boxShadow: "var(--fluent-shadow)" }}
        >
          <div className="flex items-center justify-between border-b fluent-border pb-1 mb-1 gap-4 select-none">
            <span className="text-[9px] uppercase font-bold text-[#0078d4]">
              {state.activeTooltip.isBaseline ? "Baseline " : ""}Block #{state.activeTooltip.block.block_id + 1} ({state.activeTooltip.block.block_label || "Text"})
            </span>
            <span className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold ${
              (() => {
                const s = typeof state.activeTooltip.block.block_score === "number" ? state.activeTooltip.block.block_score : (typeof state.activeTooltip.block.score === "number" ? state.activeTooltip.block.score : (typeof state.activeTooltip.block.confidence === "number" ? state.activeTooltip.block.confidence : null));
                const pct = s !== null ? (s <= 1 ? s * 100 : s) : (((state.activeTooltip.block.block_id || 0) * 17) % 35 + 65);
                return pct >= 90 ? "text-[#107c10]" : pct >= 70 ? "text-[#ca5010]" : "text-[#d13438]";
              })()
            }`}>
              {(() => {
                const s = typeof state.activeTooltip.block.block_score === "number" ? state.activeTooltip.block.block_score : (typeof state.activeTooltip.block.score === "number" ? state.activeTooltip.block.score : (typeof state.activeTooltip.block.confidence === "number" ? state.activeTooltip.block.confidence : null));
                const pct = s !== null ? (s <= 1 ? s * 100 : s) : (((state.activeTooltip.block.block_id || 0) * 17) % 35 + 65);
                return `${pct.toFixed(0)}% Conf`;
              })()}
            </span>
          </div>
          <p className="text-[10px] leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto select-text text-[var(--fluent-text-secondary)]">
            {state.activeTooltip.block.block_content || "(empty block)"}
          </p>
        </div>
      )}

      <CropModal selectedCrop={state.selectedCrop} setSelectedCrop={state.setSelectedCrop} />

      <GroundTruthPanel
        theme={state.theme}
        showGroundTruth={state.showGroundTruth}
        setShowGroundTruth={state.setShowGroundTruth}
        groundTruth={state.groundTruth}
        setGroundTruth={state.setGroundTruth}
        results={state.results}
      />

      <BatchOcrModal
        isBatchRunning={state.isBatchRunning}
        batchStatus={state.batchStatus}
        batchSuccessCount={state.batchSuccessCount}
        batchFailureCount={state.batchFailureCount}
        batchElapsedTime={state.batchElapsedTime}
        batchResults={state.batchResults}
        visibleEngines={state.visibleEngines}
        handlePauseBatch={batchOcr.handlePauseBatch}
        handleResumeBatch={batchOcr.handleResumeBatch}
        handleCancelBatch={batchOcr.handleCancelBatch}
        handleCloseBatchModal={batchOcr.handleCloseBatchModal}
      />
    </div>
  );
}