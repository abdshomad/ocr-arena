import React from "react";
import { engines, ResultsMap } from "../utils/ocrConstants";
import { getFilteredText } from "../utils/ocrHelpers";
import { highlightText } from "../utils/highlightUtils";

interface MarkdownTabProps {
  selectedOverlayEngine: string;
  setSelectedOverlayEngine: (engine: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  globalFontSize: "sm" | "md" | "lg";
  globalWordWrap: boolean;
  cardFontSizes: Record<string, "sm" | "md" | "lg">;
  setCardFontSizes: React.Dispatch<React.SetStateAction<Record<string, "sm" | "md" | "lg">>>;
  cardWordWrap: Record<string, boolean>;
  setCardWordWrap: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  results: ResultsMap;
  selectedPageIndex: number;
  visibleLabels: string[];
  handleCopy: (text: string, id: string) => void;
  scrollContainersRef: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  handleScroll: (e: React.UIEvent<HTMLDivElement>, engineId: string) => void;
}

export const MarkdownTab: React.FC<MarkdownTabProps> = ({
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
  handleCopy,
  scrollContainersRef,
  handleScroll
}) => {
  const res = results[selectedOverlayEngine as keyof ResultsMap];
  
  const handleCopyAction = () => {
    const pageTextRaw = res?.rawResult?.layoutParsingResults?.[selectedPageIndex]?.markdown?.text || res?.text || "";
    handleCopy(pageTextRaw, selectedOverlayEngine);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-3 h-full">
      {/* Controls header */}
      <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center text-xs pb-2 border-b border-[#1f2943]/60 select-none flex-none">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider">Engine:</span>
          <select
            value={selectedOverlayEngine}
            onChange={(e) => setSelectedOverlayEngine(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs font-bold text-[#0078d4] cursor-pointer"
          >
            {engines.map(e => (
              <option key={e.id} value={e.id} className="bg-[#111625] text-slate-200">
                {e.logo} {e.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Text highlight input */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Find text..."
            className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs placeholder-slate-550 focus:outline-none focus:border-[#0078d4] w-28 text-slate-200"
          />
          
          {/* Typography controls */}
          <select
            value={cardFontSizes[selectedOverlayEngine] || globalFontSize}
            onChange={(e) => setCardFontSizes(prev => ({ ...prev, [selectedOverlayEngine]: e.target.value as "sm" | "md" | "lg" }))}
            className="bg-slate-950 border border-slate-800 rounded-lg px-1.5 py-1 text-[10px] font-bold text-[#0078d4] focus:outline-none cursor-pointer"
            title="Font Size"
          >
            <option value="sm" className="bg-[#111625]">Aa-</option>
            <option value="md" className="bg-[#111625]">Aa</option>
            <option value="lg" className="bg-[#111625]">Aa+</option>
          </select>

          <button
            onClick={() => setCardWordWrap(prev => ({ ...prev, [selectedOverlayEngine]: !(prev[selectedOverlayEngine] !== undefined ? prev[selectedOverlayEngine] : globalWordWrap) }))}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ${
              (cardWordWrap[selectedOverlayEngine] !== undefined ? cardWordWrap[selectedOverlayEngine] : globalWordWrap)
                ? "bg-[#0078d4]/10 text-[#0078d4] border-[#0078d4]/20"
                : "bg-slate-955 text-slate-500 border-slate-800"
            }`}
            title="Toggle Wrap"
          >
            Wrap
          </button>

          <button
            onClick={handleCopyAction}
            className="px-2.5 py-1 rounded bg-[#0078d4] hover:bg-[#106ebe] text-white font-bold text-[10px] transition-all"
          >
            Copy
          </button>
        </div>
      </div>

      {/* Content panel */}
      {(() => {
        if (!res || res.status === "pending") {
          return (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-center space-y-1">
              <span>⌛</span>
              <span className="text-xs font-semibold">Awaiting OCR Run</span>
              <span className="text-[10px] text-slate-500">Analyze the document to parse its markdown content.</span>
            </div>
          );
        }
        if (res.status === "processing") {
          return (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-center space-y-3">
              <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-bold text-teal-400 animate-pulse">Processing Document Model...</span>
            </div>
          );
        }
        if (res.status === "failed") {
          return (
            <div className="flex-1 flex flex-col items-center justify-center text-rose-455 text-center space-y-1">
              <span>✕</span>
              <span className="text-xs font-semibold">Inference failed</span>
              <span className="text-[10px] text-rose-505 font-mono bg-rose-500/5 p-2 rounded max-w-xs">{res.text || "Unknown API server error"}</span>
            </div>
          );
        }

        const pageTextRaw = res.rawResult?.layoutParsingResults?.[selectedPageIndex]?.markdown?.text || res.text || "";
        const pageText = getFilteredText(res.rawResult, pageTextRaw, visibleLabels, selectedPageIndex);
        const activeFontSize = cardFontSizes[selectedOverlayEngine] || globalFontSize;
        const fontSizeClass = activeFontSize === "lg" ? "text-[14px]" : (activeFontSize === "md" ? "text-[12px]" : "text-[10px]");
        const activeWordWrap = cardWordWrap[selectedOverlayEngine] !== undefined ? cardWordWrap[selectedOverlayEngine] : globalWordWrap;
        const wrapClass = activeWordWrap ? "whitespace-pre-wrap" : "whitespace-pre overflow-x-auto";

        return (
          <div
            ref={(el) => {
              if (el) {
                scrollContainersRef.current[selectedOverlayEngine] = el;
              } else {
                delete scrollContainersRef.current[selectedOverlayEngine];
              }
            }}
            onScroll={(e) => handleScroll(e, selectedOverlayEngine)}
            className={`flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-955/40 border border-slate-200 dark:border-[#1f2943]/60 rounded-xl p-4 font-mono ${fontSizeClass} leading-relaxed text-slate-905 dark:text-slate-200 ${wrapClass} min-h-0 h-full`}
          >
            {highlightText(pageText || "*No text returned*", searchQuery)}
          </div>
        );
      })()}
    </div>
  );
};
