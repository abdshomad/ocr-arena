import React from "react";

interface WorkspaceToolbarProps {
  theme: "light" | "dark";
  isRunning: boolean;
  isBatchRunning: boolean;
  selectedImage: string | null;
  selectedFilename: string;
  isCustomUpload: boolean;
  runArenaCompare: (imageSource: string, filename: string, customUpload?: boolean) => Promise<void>;
  pageCount: number;
  selectedPageIndex: number;
  setSelectedPageIndex: React.Dispatch<React.SetStateAction<number>>;
  isLeftPanelExpanded: boolean;
  setIsLeftPanelExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  isRightPanelExpanded: boolean;
  setIsRightPanelExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  showGroundTruth: boolean;
  setShowGroundTruth: React.Dispatch<React.SetStateAction<boolean>>;
  startBatchOCR: () => Promise<void>;
  batchSize: number;
  setBatchSize: (size: number) => void;
  rightPanelTab: string;
  gridCols: 1 | 2 | 3;
  setGridCols: (cols: 1 | 2 | 3) => void;
  setSelectedImage: React.Dispatch<React.SetStateAction<string | null>>;
}

export const WorkspaceToolbar: React.FC<WorkspaceToolbarProps> = ({
  isRunning,
  isBatchRunning,
  selectedImage,
  selectedFilename,
  isCustomUpload,
  runArenaCompare,
  pageCount,
  selectedPageIndex,
  setSelectedPageIndex,
  isLeftPanelExpanded,
  setIsLeftPanelExpanded,
  isRightPanelExpanded,
  setIsRightPanelExpanded,
  showGroundTruth,
  setShowGroundTruth,
  startBatchOCR,
  batchSize,
  setBatchSize,
  rightPanelTab,
  gridCols,
  setGridCols,
  setSelectedImage
}) => {
  return (
    <div className="flex-none border-b fluent-border bg-[var(--fluent-subheader)]">
      <div className="h-9 px-4 flex items-center gap-2 text-[11px] text-[var(--fluent-text-secondary)] border-b fluent-border">
        <span>Prebuilt</span>
        <span className="text-[var(--fluent-text-muted)]">&gt;</span>
        <span className="font-semibold text-[var(--fluent-text)]">OCR Arena</span>
        <span className="text-[var(--fluent-text-muted)]">&gt;</span>
        <span className="truncate max-w-[200px]" title={selectedFilename}>{selectedFilename}</span>
      </div>

      <div className="h-11 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => selectedImage && runArenaCompare(selectedImage, selectedFilename, isCustomUpload)}
            disabled={isRunning}
            className="fluent-btn-primary px-4 py-1.5 text-xs flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Running…
              </>
            ) : (
              "Run analysis"
            )}
          </button>

          {pageCount > 1 && (
            <div className="flex items-center gap-1 text-xs border fluent-border rounded-sm px-2 py-1 bg-[var(--fluent-surface)]">
              <button disabled={selectedPageIndex === 0} onClick={() => setSelectedPageIndex((p) => Math.max(0, p - 1))} className="px-1 disabled:opacity-30">◀</button>
              <select
                value={selectedPageIndex}
                onChange={(e) => setSelectedPageIndex(parseInt(e.target.value))}
                className="bg-transparent text-[#0078d4] font-semibold text-xs focus:outline-none cursor-pointer"
              >
                {Array.from({ length: pageCount }).map((_, i) => (
                  <option key={i} value={i}>Page {i + 1} of {pageCount}</option>
                ))}
              </select>
              <button disabled={selectedPageIndex >= pageCount - 1} onClick={() => setSelectedPageIndex((p) => Math.min(pageCount - 1, p + 1))} className="px-1 disabled:opacity-30">▶</button>
            </div>
          )}

          <button
            onClick={() => setIsLeftPanelExpanded(!isLeftPanelExpanded)}
            className={`fluent-btn-secondary px-2 py-1 text-[11px] ${isLeftPanelExpanded ? "border-[#0078d4] text-[#0078d4]" : ""}`}
          >
            {isLeftPanelExpanded ? "Hide options" : "Show options"}
          </button>

          <button
            onClick={() => setShowGroundTruth(!showGroundTruth)}
            className={`fluent-btn-secondary px-2 py-1 text-[11px] ${showGroundTruth ? "border-[#0078d4] text-[#0078d4]" : ""}`}
          >
            Ground truth
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={startBatchOCR} disabled={isRunning || isBatchRunning} className="fluent-btn-secondary px-3 py-1 text-[11px] disabled:opacity-40">
            Batch run
          </button>
          <select
            value={batchSize}
            onChange={(e) => setBatchSize(Number(e.target.value))}
            disabled={isRunning || isBatchRunning}
            className="text-[11px] border fluent-border rounded-sm px-2 py-1 bg-[var(--fluent-surface)]"
          >
            {[1, 2, 3, 4, 6, 12].map((n) => <option key={n} value={n}>{n === 1 ? "Sequential" : `${n} parallel`}</option>)}
          </select>

          {rightPanelTab === "arena" && (
            <div className="flex items-center border fluent-border rounded-sm overflow-hidden text-[11px]">
              {([1, 2, 3] as const).map((cols) => (
                <button key={cols} onClick={() => setGridCols(cols)} className={`px-2 py-1 ${gridCols === cols ? "bg-[#0078d4] text-white" : "bg-[var(--fluent-surface)] text-[var(--fluent-text-secondary)]"}`}>
                  {cols} col
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => setIsRightPanelExpanded(!isRightPanelExpanded)}
            className={`fluent-btn-secondary px-2 py-1 text-[11px] ${isRightPanelExpanded ? "border-[#0078d4] text-[#0078d4]" : ""}`}
          >
            {isRightPanelExpanded ? "Hide results" : "Show results"}
          </button>

          <button onClick={() => setSelectedImage(null)} className="fluent-btn-secondary px-2 py-1 text-[11px] text-[#d13438] border-[#d13438]/30">
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};
