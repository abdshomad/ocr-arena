import React from "react";
import { engines, ResultsMap } from "../utils/ocrConstants";
import { highlightText } from "../utils/highlightUtils";

interface JsonTabProps {
  selectedOverlayEngine: string;
  setSelectedOverlayEngine: (engine: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  results: ResultsMap;
  handleCopy: (text: string, id: string) => void;
}

export const JsonTab: React.FC<JsonTabProps> = ({
  selectedOverlayEngine,
  setSelectedOverlayEngine,
  searchQuery,
  setSearchQuery,
  results,
  handleCopy
}) => {
  const res = results[selectedOverlayEngine as keyof ResultsMap];

  const handleCopyAction = () => {
    const jsonStr = res?.rawResult ? JSON.stringify(res.rawResult, null, 2) : "{}";
    handleCopy(jsonStr, `${selectedOverlayEngine}-json`);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-3 h-full">
      {/* Controls header */}
      <div className="flex justify-between items-center text-xs pb-2 border-b border-[#1f2943]/60 select-none flex-none">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider">Engine:</span>
          <select
            value={selectedOverlayEngine}
            onChange={(e) => setSelectedOverlayEngine(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs font-bold text-[#0078d4] cursor-pointer"
          >
            {engines.map(e => (
              <option key={e.id} value={e.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                {e.logo} {e.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Find JSON node..."
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs placeholder-slate-400 dark:placeholder-slate-550 focus:outline-none w-28 text-slate-800 dark:text-slate-200"
          />
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
            </div>
          );
        }
        if (res.status === "processing") {
          return (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-center space-y-3">
              <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
          );
        }

        const jsonContent = res.rawResult ? JSON.stringify(res.rawResult, null, 2) : "{\n  \"message\": \"No raw result parsed\"\n}";

        return (
          <div
            className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-955/40 border border-slate-200 dark:border-[#1f2943]/60 rounded-xl p-4 font-mono text-[9.5px] leading-tight text-teal-600 dark:text-teal-400 whitespace-pre overflow-x-auto min-h-0 h-full select-text"
          >
            {highlightText(jsonContent, searchQuery)}
          </div>
        );
      })()}
    </div>
  );
};
