import React from "react";
import { DocumentHistoryItem, highlightText, ENGINES } from "../utils/historyHelpers";
import { HistoryLightboxFeedback } from "./HistoryLightboxFeedback";


interface HistoryLightboxProps {
  previewItem: DocumentHistoryItem;
  setPreviewItem: (item: DocumentHistoryItem | null) => void;
  previewMarkdown: string;
  previewRawResult: any;
  loadingPreview: boolean;
  searchQuery: string;
  isRegexSearch: boolean;
  onSubmitFeedback: (
    filename: string,
    engine: string,
    updates: {
      isAccurate?: boolean | null;
      isLoved?: boolean | null;
      ratingStars?: number | null;
    }
  ) => void;
}

const labelColors: Record<string, { stroke: string; fill: string }> = {
  text: { stroke: "#10b981", fill: "rgba(16, 185, 129, 0.08)" },
  header: { stroke: "#3b82f6", fill: "rgba(59, 130, 246, 0.08)" },
  display_formula: { stroke: "#a855f7", fill: "rgba(168, 85, 247, 0.08)" },
  inline_formula: { stroke: "#c084fc", fill: "rgba(192, 132, 252, 0.08)" },
  table: { stroke: "#f59e0b", fill: "rgba(245, 158, 11, 0.08)" },
  image: { stroke: "#ec4899", fill: "rgba(236, 72, 153, 0.08)" },
  number: { stroke: "#64748b", fill: "rgba(100, 116, 139, 0.08)" },
  footer: { stroke: "#06b6d4", fill: "rgba(6, 182, 212, 0.08)" }
};

const defaultColor = { stroke: "#14b8a6", fill: "rgba(20, 184, 166, 0.08)" };

export const HistoryLightbox: React.FC<HistoryLightboxProps> = ({
  previewItem,
  setPreviewItem,
  previewMarkdown,
  previewRawResult,
  loadingPreview,
  searchQuery,
  isRegexSearch,
  onSubmitFeedback
}) => {
  const [imageDimensions, setImageDimensions] = React.useState<{ width: number; height: number } | null>(null);

  React.useEffect(() => {
    setImageDimensions(null);
  }, [previewItem.filename]);

  const getEngineDisplay = (engineId: string) => {
    const found = ENGINES.find((e) => e.id === engineId);
    return found ? `${found.logo} ${found.name}` : `🤖 ${engineId}`;
  };

  const imageSrc = previewItem.isSample 
    ? `/arena/${previewItem.filename}` 
    : `/api/files?file=${encodeURIComponent(previewItem.filename)}`;

  const pageResult = previewRawResult?.layoutParsingResults?.[0] || previewRawResult || {};
  const rawBlocks = pageResult.prunedResult?.parsing_res_list || pageResult.parsing_res_list || [];
  const blocks = Array.isArray(rawBlocks) ? rawBlocks : [];

  return (
    <div 
      id="history-lightbox-modal" 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="w-full max-w-6xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[80vh] min-h-[400px] max-h-[700px] animate-in slide-in-from-bottom-4 duration-300">
        
        {/* Left Column: Original Document Image */}
        <div className="flex-1 bg-slate-950 flex flex-col items-center justify-center p-6 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 relative min-h-[250px] md:min-h-0">
          <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-slate-900/80 border border-slate-800 text-[9px] font-bold text-slate-400 select-none uppercase tracking-wider z-10">
            Document Image
          </span>
          <div className="relative inline-block max-w-full max-h-full">
            <img
              src={imageSrc}
              alt="Original document preview"
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg border border-slate-800"
              onLoad={(e) => {
                const img = e.currentTarget;
                setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
              }}
            />
            {!loadingPreview && previewRawResult && blocks.length > 0 && (
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox={
                  previewItem.engine === "deepseek"
                    ? "0 0 1000 1000"
                    : imageDimensions
                    ? `0 0 ${imageDimensions.width} ${imageDimensions.height}`
                    : "0 0 1000 1000"
                }
                preserveAspectRatio="none"
              >
                {blocks.map((block: any, bIdx: number) => {
                  const [xmin, ymin, xmax, ymax] = block.block_bbox || [0, 0, 0, 0];
                  const label = block.block_label || "text";
                  const color = labelColors[label] || defaultColor;
                  return (
                    <rect
                      key={`preview-overlay-${bIdx}`}
                      x={xmin}
                      y={ymin}
                      width={xmax - xmin}
                      height={ymax - ymin}
                      style={{
                        fill: color.fill,
                        stroke: color.stroke,
                        strokeWidth: "1.5px",
                      }}
                    />
                  );
                })}
              </svg>
            )}
          </div>
        </div>

        {/* Right Column: Parsed Markdown Text */}
        <div className="flex-1 p-6 flex flex-col min-h-0 relative">
          <button
            onClick={() => setPreviewItem(null)}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-505 hover:text-slate-805 dark:text-slate-400 dark:hover:text-white transition-all text-xs font-bold cursor-pointer"
            id="close-lightbox-btn"
          >
            ✕ Close
          </button>

          <div className="space-y-4 flex-1 flex flex-col min-h-0">
            <div>
              <span className="text-[9px] font-bold text-[#0078d4] uppercase tracking-wider block mb-0.5">
                {getEngineDisplay(previewItem.engine)}
              </span>
              <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-105 truncate pr-16" title={previewItem.filename}>
                {highlightText(previewItem.filename.length > 13 ? previewItem.filename.substring(13) : previewItem.filename, searchQuery, isRegexSearch)}
              </h3>
            </div>

            {/* Feedback & Rating Section */}
            <HistoryLightboxFeedback
              previewItem={previewItem}
              onSubmitFeedback={onSubmitFeedback}
            />

            <div className="space-y-1.5 flex-1 flex flex-col min-h-0">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">
                Parsed Markdown Text Output
              </span>
              
              <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800/85 rounded-2xl p-4 font-mono text-[11px] leading-relaxed text-slate-900 dark:text-slate-300 whitespace-pre-wrap select-text">
                {loadingPreview ? (
                  <div className="flex flex-col items-center justify-center h-full space-y-2 py-12">
                    <div className="w-6 h-6 border-2 border-[#0078d4] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs text-slate-400 font-bold">Loading OCR text...</span>
                  </div>
                ) : (
                  previewMarkdown ? highlightText(previewMarkdown, searchQuery, isRegexSearch) : <span className="text-slate-500 italic">No parsed text output found.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
