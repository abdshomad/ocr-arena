import React from "react";
import { EngineResult, ResultsMap, engines } from "../utils/ocrConstants";
import { calculateCER } from "../utils/metricUtils";
import { getFilteredText } from "../utils/ocrHelpers";
import { diffWords } from "../utils/diffUtils";
import { highlightText } from "../utils/highlightUtils";
import { ArenaSplitDiff } from "./ArenaSplitDiff";

interface ArenaEngineCardProps {
  engine: typeof engines[number];
  res: EngineResult;
  selectedPageIndex: number;
  visibleLabels: string[];
  latencyTarget: number;
  accuracyTarget: number;
  showGroundTruth: boolean;
  groundTruth: string;
  searchQuery: string;
  diffBaseline: string;
  baselineRes: EngineResult | undefined;
  showDiffs: boolean;
  splitDiff: boolean;
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
  results: ResultsMap;
}

export const ArenaEngineCard: React.FC<ArenaEngineCardProps> = ({
  engine,
  res,
  selectedPageIndex,
  visibleLabels,
  latencyTarget,
  accuracyTarget,
  showGroundTruth,
  groundTruth,
  searchQuery,
  diffBaseline,
  baselineRes,
  showDiffs,
  splitDiff,
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
  results
}) => {
  const latency = res.time > 0 ? `${(res.time / 1000).toFixed(3)}s` : "-";
  const pageTextRaw = res.rawResult?.layoutParsingResults?.[selectedPageIndex]?.markdown?.text || res.text || "";
  const pageText = getFilteredText(res.rawResult, pageTextRaw, visibleLabels, selectedPageIndex);
  
  const baselineTextRaw = baselineRes?.rawResult?.layoutParsingResults?.[selectedPageIndex]?.markdown?.text || baselineRes?.text || "";
  const baselineText = getFilteredText(baselineRes?.rawResult, baselineTextRaw, visibleLabels, selectedPageIndex);
  
  const satisfiesLatency = res.time > 0 ? (res.time / 1000 <= latencyTarget) : true;
  let satisfiesAccuracy = true;
  let charAcc: number | null = null;
  if (showGroundTruth && groundTruth && res.status === "done") {
    const cerErr = calculateCER(groundTruth, pageText);
    charAcc = Math.max(0, 100 - cerErr * 100);
    satisfiesAccuracy = charAcc >= accuracyTarget;
  }
  const hasSlaViolations = !satisfiesLatency || !satisfiesAccuracy;

  return (
    <div
      id={`engine-card-${engine.id}`}
      className={`w-full bg-white dark:bg-[#151b2c] border rounded-2xl flex flex-col h-[400px] shadow-sm relative overflow-hidden transition-all ${res.status === "processing" ? "border-teal-500 shadow-md ring-1 ring-teal-500/20" : "border-slate-200 dark:border-slate-800"}`}
    >
      {/* Card Header */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/55 dark:bg-slate-955/20">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-base flex-none">{engine.logo}</span>
          <div className="min-w-0">
            <h4 className="font-bold text-[11px] leading-tight text-slate-805 dark:text-slate-200 truncate">
              {engine.name}
            </h4>
          </div>
        </div>

        <div className="text-right flex flex-col items-end flex-none">
          <span className={`text-[8px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider block mb-0.5 ${res.status === "done" ? "bg-emerald-500/10 text-emerald-400" : res.status === "processing" ? "bg-teal-500/10 text-teal-400" : res.status === "failed" ? "bg-rose-500/10 text-rose-455" : "bg-slate-500/10 text-slate-400"}`}>
            {res.status}
          </span>
        </div>
      </div>

      {/* Custom typography bar */}
      <div className="px-3 py-1 bg-slate-900/10 dark:bg-slate-955/20 border-b border-slate-200 dark:border-slate-800/40 flex items-center justify-between text-[9px] font-bold text-slate-500">
        <div className="flex items-center gap-1.5">
          <select
            value={cardFontSizes[engine.id] || "sm"}
            onChange={(e) => setCardFontSizes(prev => ({ ...prev, [engine.id]: e.target.value as "sm" | "md" | "lg" }))}
            className="bg-transparent border-none text-[9px] p-0 font-bold focus:ring-0 cursor-pointer text-[#0078d4]"
          >
            <option value="sm" className="bg-[#111625] text-slate-350">Aa-</option>
            <option value="md" className="bg-[#111625] text-slate-350">Aa</option>
            <option value="lg" className="bg-[#111625] text-slate-350">Aa+</option>
          </select>
          <button
            onClick={() => setCardWordWrap(prev => ({ ...prev, [engine.id]: !(prev[engine.id] !== undefined ? prev[engine.id] : globalWordWrap) }))}
            className="hover:text-slate-700 dark:hover:text-slate-300"
          >
            Wrap: {(cardWordWrap[engine.id] !== undefined ? cardWordWrap[engine.id] : globalWordWrap) ? "ON" : "OFF"}
          </button>
        </div>

        {/* Single engine export */}
        {res.status === "done" && (
          <div className="relative" id={`export-container-${engine.id}`}>
            <button
              onClick={() => setActiveExportDropdown(activeExportDropdown === engine.id ? null : engine.id)}
              className="text-[9px] hover:text-[#0078d4] font-bold cursor-pointer"
            >
              📤 Export
            </button>
            {activeExportDropdown === engine.id && (
              <div className="absolute right-0 mt-1 w-28 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-20 p-1 space-y-0.5 text-left">
                {(["md", "json", "html", "txt"] as const).map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => {
                      handleExportSingle(engine.id, fmt);
                      setActiveExportDropdown(null);
                    }}
                    className="w-full text-left px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-[9px] font-semibold text-slate-700 dark:text-slate-300 block"
                  >
                    {fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content text box */}
      <div className="p-3 flex-1 flex flex-col min-h-0">
        {res.status === "pending" ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-center text-[10px] space-y-1">
            <span>⌛</span>
            <span>Awaiting run</span>
          </div>
        ) : res.status === "processing" ? (
          <div className="flex-1 flex flex-col items-center justify-center text-[#0078d4] text-center text-[10px] space-y-2 animate-pulse">
            <div className="w-5 h-5 border-2 border-[#0078d4] border-t-transparent rounded-full animate-spin" />
            <span>Inference...</span>
          </div>
        ) : res.status === "failed" ? (
          <div className="flex-1 flex flex-col items-center justify-center text-rose-455 text-center text-[9px] font-mono break-all p-4">
            <span>✕ Failed</span>
            <span className="opacity-60">{res.text}</span>
          </div>
        ) : (() => {
          const activeFontSize = cardFontSizes[engine.id] || globalFontSize;
          const fontSizeClass = activeFontSize === "lg" ? "text-[12px]" : (activeFontSize === "md" ? "text-[10px]" : "text-[8.5px]");
          const activeWordWrap = cardWordWrap[engine.id] !== undefined ? cardWordWrap[engine.id] : globalWordWrap;
          const wrapClass = activeWordWrap ? "whitespace-pre-wrap animate-fade-in" : "whitespace-pre overflow-x-auto animate-fade-in";
          const isDiffActive = showDiffs && engine.id !== diffBaseline && results[diffBaseline as keyof ResultsMap]?.status === "done";
          const isSplit = isDiffActive && splitDiff;

          if (isSplit) {
            return (
              <ArenaSplitDiff
                engineId={engine.id}
                baselineText={baselineText}
                pageText={pageText}
                searchQuery={searchQuery}
                fontSizeClass={fontSizeClass}
                wrapClass={wrapClass}
              />
            );
          }

          return (
            <div
              ref={(el) => {
                if (el) {
                  scrollContainersRef.current[engine.id] = el;
                } else {
                  delete scrollContainersRef.current[engine.id];
                }
              }}
              onScroll={(e) => handleScroll(e, engine.id)}
              className={`flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0c0f18]/40 border border-slate-200 dark:border-slate-900 rounded p-2.5 font-mono ${fontSizeClass} text-slate-900 dark:text-slate-300 ${wrapClass} h-full min-h-0`}
            >
              {isDiffActive ? (
                diffWords(baselineText, pageText).map((part, pIdx) => {
                  if (part.type === "added") {
                    return <span key={pIdx} className="bg-emerald-500/20 text-emerald-355 font-bold">{highlightText(part.value, searchQuery)}</span>;
                  }
                  if (part.type === "removed") {
                    return <span key={pIdx} className="bg-rose-500/25 text-rose-350 line-through opacity-70">{highlightText(part.value, searchQuery)}</span>;
                  }
                  return <span key={pIdx}>{highlightText(part.value, searchQuery)}</span>;
                })
              ) : (
                highlightText(pageText || "*No text returned*", searchQuery)
              )}
            </div>
          );
        })()}
      </div>
      {hasSlaViolations && res.status === "done" && (
        <div className="px-3 py-1 bg-rose-500/10 border-t border-rose-500/20 text-[8px] font-bold text-rose-455 flex items-center gap-1 select-none flex-none">
          <span>⚠️ SLA exceeded:</span>
          {!satisfiesLatency && <span>⏱ Latency ({latency} &gt; {latencyTarget}s)</span>}
          {!satisfiesLatency && !satisfiesAccuracy && <span>&amp;</span>}
          {!satisfiesAccuracy && charAcc !== null && <span>🎯 Accuracy ({charAcc.toFixed(1)}% &lt; {accuracyTarget}%)</span>}
        </div>
      )}
    </div>
  );
};
export default ArenaEngineCard;
