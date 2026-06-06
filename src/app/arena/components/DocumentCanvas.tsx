/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { engines, ENGINE_COLORS, ENGINE_DEFAULT_COLOR } from "../utils/ocrConstants";
import { extractLayoutVisUrl } from "../../../utils/layoutVisualization";
import { SvgOverlays } from "./SvgOverlays";
import { useCanvasDragCrop } from "../hooks/useCanvasDragCrop";

interface DocumentCanvasProps {
  state: any;
  handlers: any;
}

export const DocumentCanvas: React.FC<DocumentCanvasProps> = ({ state, handlers }) => {
  const {
    results, selectedOverlayEngine, setSelectedOverlayEngine,
    compareLayouts, setCompareLayouts, diffBaseline,
    zoom, setZoom, pan, setPan, selectedImage,
    selectedPageIndex, visibleLabels, imageDimensions,
    confidenceThreshold, visualColorMode, heatmapMetric,
    isDragging, hoveredBlock, setHoveredBlock,
    setActiveTooltip, cropModeActive, setCropModeActive,
    cropSelection, setCropSelection, overlayEngines, setOverlayEngines
  } = state;

  const { handleBlockClick, runArenaCompare } = handlers;

  const res = results[selectedOverlayEngine] || results[overlayEngines[0]];
  const visUrl = extractLayoutVisUrl(res?.rawResult?.layoutParsingResults?.[selectedPageIndex]);
  const displayImage = visUrl || selectedImage;
  const showOverlay = overlayEngines.some((id: string) => results[id]?.status === "done") || (compareLayouts && results[diffBaseline]?.status === "done");

  const {
    imageWrapperRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    handleCropAndAnalyze
  } = useCanvasDragCrop(state, runArenaCompare);

  return (
    <div className="flex-1 h-full fluent-surface flex flex-col overflow-hidden relative min-w-0 border-x fluent-border">
      <div className="h-9 border-b fluent-border bg-[var(--fluent-subheader)] px-3 flex items-center justify-between flex-none select-none text-xs">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="text-[10px] font-semibold text-[var(--fluent-text-secondary)]">Overlays:</span>
          <div className="flex items-center gap-1 flex-wrap">
            {engines.map((e) => {
              const isActive = overlayEngines.includes(e.id);
              const color = ENGINE_COLORS[e.id] || ENGINE_DEFAULT_COLOR;
              return (
                <button
                  key={e.id}
                  onClick={() => {
                    if (isActive) {
                      if (overlayEngines.length > 1) {
                        const next = overlayEngines.filter((id: string) => id !== e.id);
                        setOverlayEngines(next);
                        if (selectedOverlayEngine === e.id) setSelectedOverlayEngine(next[0]);
                      }
                    } else {
                      setOverlayEngines([...overlayEngines, e.id]);
                      setSelectedOverlayEngine(e.id);
                    }
                  }}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded-sm border text-[10px] transition-all ${isActive ? "bg-[var(--fluent-surface)] border-[var(--fluent-border-strong)]" : "border-transparent text-[var(--fluent-text-muted)] hover:text-[var(--fluent-text)]"}`}
                  style={{ borderLeftWidth: isActive ? "3px" : undefined, borderLeftColor: isActive ? color : undefined }}
                >
                  <span style={{ color: isActive ? color : undefined }}>{isActive ? "●" : "○"}</span>
                  <span className="font-semibold text-[9px] truncate max-w-[72px]">{e.name.replace(" OCR", "")}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {displayImage && !displayImage.startsWith("data:application/pdf") && (
            <>
              <button
                onClick={() => { setCropModeActive(!cropModeActive); setCropSelection(null); }}
                className={`fluent-btn-secondary px-2 py-0.5 text-[10px] ${cropModeActive ? "border-[#0078d4] text-[#0078d4]" : ""}`}
              >
                {cropModeActive ? "Exit crop" : "Crop region"}
              </button>
              {cropModeActive && cropSelection && cropSelection.w > 5 && cropSelection.h > 5 && (
                <button onClick={handleCropAndAnalyze} className="fluent-btn-primary px-2 py-0.5 text-[10px]">
                  Analyze region
                </button>
              )}
            </>
          )}

          <label className="flex items-center gap-1 cursor-pointer text-[10px] text-[var(--fluent-text-secondary)]">
            <input type="checkbox" checked={compareLayouts} onChange={(e) => setCompareLayouts(e.target.checked)} className="rounded text-[#0078d4] h-3 w-3" />
            Compare baseline
          </label>

          <div className="flex items-center border fluent-border rounded-sm text-[10px] overflow-hidden">
            <button onClick={() => setZoom((p: number) => Math.max(p - 0.25, 0.5))} className="px-1.5 py-0.5 hover:bg-[var(--fluent-bg)]">−</button>
            <span className="px-1 font-mono font-semibold text-[var(--fluent-text-secondary)]">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((p: number) => Math.min(p + 0.25, 4))} className="px-1.5 py-0.5 hover:bg-[var(--fluent-bg)]">+</button>
            <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="px-1.5 py-0.5 text-[#0078d4] font-semibold border-l fluent-border">Reset</button>
          </div>
        </div>
      </div>

      <div
        className={`flex-1 overflow-hidden relative flex items-center justify-center p-6 min-h-0 min-w-0 bg-[#faf9f8] ${cropModeActive ? "cursor-crosshair" : "cursor-grab active:cursor-grabbing"}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {displayImage ? (
          <div
            ref={imageWrapperRef}
            className="relative inline-block select-none max-w-full max-h-full"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "center center",
              transition: isDragging ? "none" : "transform 0.15s ease-out"
            }}
          >
            {displayImage.startsWith("data:application/pdf") ? (
              <div className="flex flex-col items-center justify-center text-[var(--fluent-text-muted)] space-y-2 p-6 fluent-panel h-[500px] w-[350px]">
                <span className="text-xs font-semibold">PDF page {selectedPageIndex + 1}</span>
                <span className="text-[10px]">Run analysis to parse layout.</span>
              </div>
            ) : (
              <img
                src={displayImage}
                alt="Document preview"
                className="max-h-[80vh] max-w-[85vw] object-contain border fluent-border shadow-sm select-none bg-white"
                onDragStart={(e) => e.preventDefault()}
              />
            )}

            {showOverlay && (
              <SvgOverlays
                overlayEngines={overlayEngines}
                results={results}
                selectedOverlayEngine={selectedOverlayEngine}
                diffBaseline={diffBaseline}
                compareLayouts={compareLayouts}
                selectedPageIndex={selectedPageIndex}
                visibleLabels={visibleLabels}
                imageDimensions={imageDimensions}
                confidenceThreshold={confidenceThreshold}
                visualColorMode={visualColorMode}
                heatmapMetric={heatmapMetric}
                hoveredBlock={hoveredBlock}
                setHoveredBlock={setHoveredBlock}
                setActiveTooltip={setActiveTooltip}
                handleBlockClick={handleBlockClick}
              />
            )}

            {cropModeActive && cropSelection && cropSelection.w > 1 && cropSelection.h > 1 && (
              <div
                className="absolute border-2 border-dashed border-[#0078d4] bg-[#0078d4]/15 pointer-events-none z-50"
                style={{ left: cropSelection.x, top: cropSelection.y, width: cropSelection.w, height: cropSelection.h }}
              />
            )}
          </div>
        ) : (
          <div className="text-[var(--fluent-text-muted)] text-center text-xs">No document loaded</div>
        )}
      </div>
    </div>
  );
};

export default DocumentCanvas;
