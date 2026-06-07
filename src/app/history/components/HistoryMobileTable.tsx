/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { 
  DocumentHistoryItem, 
  highlightText, 
  formatBytes, 
  formatDate,
} from "../utils/historyHelpers";

interface HistoryMobileTableProps {
  groupedHistory: Record<string, DocumentHistoryItem[]>;
  groupKeys: string[];
  selectedItems: string[];
  setSelectedItems: React.Dispatch<React.SetStateAction<string[]>>;
  collapsedGroups: Record<string, boolean>;
  toggleGroup: (groupName: string) => void;
  searchQuery: string;
  isRegexSearch: boolean;
  setPreviewItem: (item: DocumentHistoryItem | null) => void;
  handleDelete: (filename: string) => void;
  getEngineDisplay: (engineId: string) => string;
  renderMetadata: (metadata: Record<string, any> | null) => React.ReactNode;
}

export const HistoryMobileTable: React.FC<HistoryMobileTableProps> = ({
  groupedHistory,
  groupKeys,
  selectedItems,
  setSelectedItems,
  collapsedGroups,
  toggleGroup,
  searchQuery,
  isRegexSearch,
  setPreviewItem,
  handleDelete,
  getEngineDisplay,
  renderMetadata
}) => {
  return (
    <div className="block sm:hidden divide-y divide-slate-200/50 dark:divide-slate-855">
      {groupKeys.map((groupName) => {
        const items = groupedHistory[groupName] || [];
        if (items.length === 0) return null;
        const isCollapsed = collapsedGroups[groupName];
        return (
          <div key={groupName} className="flex flex-col">
            <div className="bg-slate-105/30 dark:bg-slate-900/40 px-4 py-3 cursor-pointer hover:bg-slate-150/40 dark:hover:bg-slate-800/40 select-none border-y border-slate-200 dark:border-slate-800 flex items-center justify-between" onClick={() => toggleGroup(groupName)}>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-450 font-bold w-3 text-center">
                  {isCollapsed ? "▶" : "▼"}
                </span>
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#0078d4] dark:text-[#0078d4]">
                  {groupName}
                </span>
              </div>
              <span className="text-[9px] font-bold bg-slate-200/60 dark:bg-slate-800/80 text-slate-605 dark:text-slate-400 px-2 py-0.2 rounded-full">
                {items.length}
              </span>
            </div>
            {!isCollapsed && items.map((item) => {
              const cleanName = item.filename.length > 13 ? item.filename.substring(13) : item.filename;
              const isSelected = selectedItems.includes(item.filename);
              return (
                <div key={item.id} className={`p-4 flex flex-col gap-3 hover:bg-slate-105/30 dark:hover:bg-slate-900/10 transition-colors ${isSelected ? "bg-slate-100/20 dark:bg-slate-900/20" : ""}`}>
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems(prev => [...prev, item.filename]);
                          } else {
                            setSelectedItems(prev => prev.filter(f => f !== item.filename));
                          }
                        }}
                        className="rounded border-slate-300 dark:border-slate-700 bg-slate-105 dark:bg-slate-950 text-[#0078d4] focus:ring-[#0078d4] w-3.5 h-3.5 cursor-pointer"
                      />
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                          {formatDate(item.uploadTime)}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 truncate max-w-[170px]" title={item.filename}>
                          {highlightText(cleanName, searchQuery, isRegexSearch)}
                        </span>
                      </div>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border select-none ${
                      item.isSample 
                        ? "bg-blue-500/10 text-blue-500 border-blue-500/20" 
                        : "bg-purple-500/10 text-purple-500 border-purple-500/20"
                    }`}>
                      {item.isSample ? "Sample" : "Upload"}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-505 font-medium">
                    File Size: <span className="text-slate-800 dark:text-slate-350">{formatBytes(item.size)}</span>
                  </div>

                  <div className="text-[10px] text-slate-550 font-medium flex flex-wrap items-center gap-1.5">
                    OCR Engine: <span className="text-slate-800 dark:text-slate-200 font-bold bg-slate-105 dark:bg-slate-955 px-2 py-0.5 rounded border border-slate-200/50 dark:border-slate-800/50">{highlightText(getEngineDisplay(item.engine), searchQuery, isRegexSearch)}</span>
                    {(item.isAccurate !== null && item.isAccurate !== undefined ||
                      item.isLoved !== null && item.isLoved !== undefined ||
                      item.ratingStars !== null && item.ratingStars !== undefined ||
                      item.isFast !== null && item.isFast !== undefined ||
                      item.ocrRemarks) && (
                      <span className="flex items-center gap-1 bg-slate-105 dark:bg-slate-955 px-1.5 py-0.5 rounded border border-slate-200/50 dark:border-slate-800/50 text-[9px] select-none text-slate-400">
                        {item.isAccurate === true && <span title="Accurate" className="text-emerald-500">👍</span>}
                        {item.isAccurate === false && <span title="Not Accurate" className="text-rose-500">👎</span>}
                        {item.ratingStars !== null && item.ratingStars !== undefined && item.ratingStars > 0 && (
                           <span className="text-amber-500 font-semibold">★{item.ratingStars}</span>
                        )}
                        {item.isLoved === true && <span title="Loved" className="text-rose-500">♥</span>}
                        {item.isLoved === false && <span title="Hated" className="text-slate-400">💔</span>}
                        {item.isFast === true && <span title="Fast" className="text-amber-500">⚡</span>}
                        {item.isFast === false && <span title="Slow" className="text-slate-400 text-[30px] inline-block align-middle leading-none">🐌</span>}
                        {item.ocrRemarks && <span title={item.ocrRemarks} className="text-slate-405">💬</span>}
                      </span>
                    )}
                  </div>

                  {Array.isArray(item.metadata?.tags || item.metadata?.Tags) && (item.metadata?.tags || item.metadata?.Tags).length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 mt-1">
                      {(item.metadata?.tags || item.metadata?.Tags).map((tag: string) => (
                        <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-0.5">
                          🏷️ {highlightText(tag, searchQuery, isRegexSearch)}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="bg-slate-50/50 dark:bg-slate-955/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850/60">
                    <span className="text-slate-450 block text-[8px] uppercase font-bold tracking-tight mb-1">Parsed Metadata</span>
                    {renderMetadata(item.metadata)}
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-850/60 pt-3 mt-1 gap-4">
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${item.parsed ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                        {item.parsed ? "parsed" : "failed"}
                      </span>
                      {item.latency !== undefined && item.latency !== null && (
                        <span
                          className="text-[10px] text-slate-405 dark:text-slate-500 font-mono cursor-help border-b border-dashed border-slate-300 dark:border-slate-700 pb-0.5"
                          title={`OCR Run Details:\nStart: ${item.ocrStartTime ? formatDate(item.ocrStartTime) : "N/A"}\nEnd: ${item.ocrEndTime ? formatDate(item.ocrEndTime) : "N/A"}\nElapsed: ${(item.latency / 1000).toFixed(2)}s`}
                        >
                          ⏱️ {(item.latency / 1000).toFixed(2)}s
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => setPreviewItem(item)} id={`preview-btn-mobile-${item.id}`} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold bg-slate-105 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[10px] transition-colors cursor-pointer">
                        Preview
                      </button>
                      <a href={`/arena?doc=${encodeURIComponent(item.filename)}`} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold bg-[#0078d4] hover:bg-[#106ebe] text-white text-[10px] transition-colors shadow-md">
                        Open
                      </a>
                      <button onClick={() => handleDelete(item.filename)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold bg-rose-500/10 hover:bg-rose-500 text-rose-505 hover:text-white border border-rose-500/25 hover:border-transparent text-[10px] transition-colors cursor-pointer">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
