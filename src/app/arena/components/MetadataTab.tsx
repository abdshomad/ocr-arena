import React from "react";
import { engines, ResultsMap } from "../utils/ocrConstants";
import { JsonTreeNode } from "./JsonTreeNode";

interface MetadataTabProps {
  selectedOverlayEngine: string;
  setSelectedOverlayEngine: (engine: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  results: ResultsMap;
}

export const MetadataTab: React.FC<MetadataTabProps> = ({
  selectedOverlayEngine,
  setSelectedOverlayEngine,
  searchQuery,
  setSearchQuery,
  results
}) => {
  const res = results[selectedOverlayEngine as keyof ResultsMap];

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
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search metadata..."
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs placeholder-slate-400 dark:placeholder-slate-550 focus:outline-none w-36 text-slate-800 dark:text-slate-200"
        />
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

        const metadataObj = res.rawResult?.prunedResult || res.rawResult || {};

        return (
          <div
            className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-955/40 border border-slate-200 dark:border-[#1f2943]/60 rounded-xl p-4 min-h-0 h-full space-y-1.5 scrollbar-thin select-none"
          >
            <JsonTreeNode
              label="Root Metadata Node"
              value={metadataObj}
              level={0}
              searchQuery={searchQuery}
            />
          </div>
        );
      })()}
    </div>
  );
};
