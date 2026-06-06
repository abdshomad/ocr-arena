import React from "react";
import { diffWords } from "../utils/diffUtils";
import { highlightText } from "../utils/highlightUtils";

interface ArenaSplitDiffProps {
  engineId: string;
  baselineText: string;
  pageText: string;
  searchQuery: string;
  fontSizeClass: string;
  wrapClass: string;
}

export const ArenaSplitDiff: React.FC<ArenaSplitDiffProps> = ({
  engineId,
  baselineText,
  pageText,
  searchQuery,
  fontSizeClass,
  wrapClass
}) => {
  const diffParts = diffWords(baselineText, pageText);

  return (
    <div className="flex-1 flex gap-1.5 min-h-0 h-full overflow-hidden text-[9px]">
      <div
        id={`split-left-${engineId}`}
        onScroll={(e) => {
          const target = document.getElementById(`split-right-${engineId}`) as HTMLDivElement;
          if (target) target.scrollTop = e.currentTarget.scrollTop;
        }}
        className={`flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0c0f18]/40 border border-slate-200 dark:border-slate-900 rounded p-2 font-mono ${fontSizeClass} text-slate-900 dark:text-slate-300 ${wrapClass}`}
      >
        <div className="text-[7px] font-bold text-rose-400 border-b border-rose-500/10 pb-0.5 mb-1 uppercase select-none">Deletions</div>
        {diffParts.map((part, pIdx) => {
          if (part.type === "removed") {
            return (
              <span key={pIdx} className="bg-rose-500/20 text-rose-355 line-through font-bold">
                {highlightText(part.value, searchQuery)}
              </span>
            );
          }
          if (part.type === "equal") {
            return <span key={pIdx}>{highlightText(part.value, searchQuery)}</span>;
          }
          return null;
        })}
      </div>

      <div
        id={`split-right-${engineId}`}
        onScroll={(e) => {
          const target = document.getElementById(`split-left-${engineId}`) as HTMLDivElement;
          if (target) target.scrollTop = e.currentTarget.scrollTop;
        }}
        className={`flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0c0f18]/40 border border-slate-200 dark:border-slate-900 rounded p-2 font-mono ${fontSizeClass} text-slate-900 dark:text-slate-300 ${wrapClass}`}
      >
        <div className="text-[7px] font-bold text-emerald-450 border-b border-emerald-500/10 pb-0.5 mb-1 uppercase select-none">Additions</div>
        {diffParts.map((part, pIdx) => {
          if (part.type === "added") {
            return (
              <span key={pIdx} className="bg-emerald-500/20 text-emerald-355 font-bold">
                {highlightText(part.value, searchQuery)}
              </span>
            );
          }
          if (part.type === "equal") {
            return <span key={pIdx}>{highlightText(part.value, searchQuery)}</span>;
          }
          return null;
        })}
      </div>
    </div>
  );
};
export default ArenaSplitDiff;
