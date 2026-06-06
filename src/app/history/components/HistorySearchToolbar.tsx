import React from "react";
import { formatBytes } from "../utils/historyHelpers";

interface HistorySearchToolbarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isRegexSearch: boolean;
  setIsRegexSearch: (r: boolean) => void;
  isRegexValid: boolean;
  typeFilter: "all" | "upload" | "sample";
  setTypeFilter: (f: "all" | "upload" | "sample") => void;
  startDate: string;
  setStartDate: (d: string) => void;
  endDate: string;
  setEndDate: (d: string) => void;
  maxSizeFilter: number;
  setMaxSizeFilter: (s: number) => void;
  selectedItems: string[];
  exportingZip: boolean;
  handleExportSelectedZIP: () => void;
  handleDeleteSelected: () => void;
  setBulkVendor: (v: string) => void;
  setBulkDocType: (t: string) => void;
  setBulkCurrency: (c: string) => void;
  setBulkCustomTag: (t: string) => void;
  setIsBulkEditOpen: (open: boolean) => void;
  handleExportHTMLReport: () => void;
  handleExportCSV: () => void;
}

export const HistorySearchToolbar: React.FC<HistorySearchToolbarProps> = ({
  searchQuery,
  setSearchQuery,
  isRegexSearch,
  setIsRegexSearch,
  isRegexValid,
  typeFilter,
  setTypeFilter,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  maxSizeFilter,
  setMaxSizeFilter,
  selectedItems,
  exportingZip,
  handleExportSelectedZIP,
  handleDeleteSelected,
  setBulkVendor,
  setBulkDocType,
  setBulkCurrency,
  setBulkCustomTag,
  setIsBulkEditOpen,
  handleExportHTMLReport,
  handleExportCSV
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search Input */}
      <div className="relative flex items-center">
        <input
          type="text"
          placeholder="Search scans (filename, engine, metadata)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          id="history-search-input"
          className={`w-full sm:w-64 bg-white dark:bg-slate-900 border rounded-xl pl-9 pr-12 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none transition-all ${
            isRegexSearch && searchQuery && !isRegexValid
              ? "border-rose-500/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20"
              : isRegexSearch
              ? "border-[#0078d4]/50 focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4]/20"
              : "border-slate-200 dark:border-slate-800 focus:border-[#0078d4]/50"
          }`}
        />
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 absolute left-3 text-slate-400 select-none pointer-events-none">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.637 10.637Z" />
        </svg>
        <button
          type="button"
          onClick={() => setIsRegexSearch(!isRegexSearch)}
          className={`absolute right-2 px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase select-none transition-all cursor-pointer ${
            isRegexSearch
              ? "bg-[#0078d4]/10 text-[#0078d4] border border-[#0078d4]/30"
              : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 border border-slate-200 dark:border-slate-700/60"
          }`}
          title="Toggle Regular Expression (Regex) search"
          id="regex-toggle-btn"
        >
          .*
        </button>
      </div>

      {/* Filter Mode Selection */}
      <div className="flex bg-slate-100 dark:bg-slate-900 rounded-xl p-1 border border-slate-200/50 dark:border-slate-805/50 select-none">
        {(["all", "upload", "sample"] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setTypeFilter(filter)}
            className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
              typeFilter === filter
                ? "bg-white dark:bg-slate-800 text-[#0078d4] dark:text-[#0078d4] shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {filter === "all" ? "All" : filter === "upload" ? "Uploads" : "Samples"}
          </button>
        ))}
      </div>

      {/* Date Filters */}
      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50 select-none">
        <span className="text-[10px] font-bold text-slate-500">Date:</span>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="bg-transparent text-[10px] text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
          title="Start Date"
          id="start-date-filter"
        />
        <span className="text-[10px] text-slate-400 font-bold">to</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="bg-transparent text-[10px] text-slate-700 dark:text-slate-305 focus:outline-none cursor-pointer"
          title="End Date"
          id="end-date-filter"
        />
        {(startDate || endDate) && (
          <button
            onClick={() => {
              setStartDate("");
              setEndDate("");
            }}
            className="text-rose-505 hover:text-rose-600 text-[9px] font-bold ml-1 cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* Size Slider Filter */}
      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50 select-none">
        <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">
          Max Size: <span className="text-[#0078d4] font-mono">{formatBytes(maxSizeFilter, 0)}</span>
        </span>
        <input
          id="max-size-slider"
          type="range"
          min={0}
          max={5000000}
          step={50000}
          value={maxSizeFilter}
          onChange={(e) => setMaxSizeFilter(Number(e.target.value))}
        />
      </div>

      <button
        onClick={handleExportCSV}
        id="export-csv-btn"
        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm select-none"
      >
        📊 Export CSV
      </button>

      {/* Bulk Operations buttons */}
      {selectedItems.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleExportSelectedZIP}
            id="export-zip-btn"
            disabled={exportingZip}
            className={`px-3.5 py-2 rounded-xl bg-[#0078d4] hover:bg-[#106ebe] text-white text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-[#0078d4]/10 select-none ${exportingZip ? "opacity-50 pointer-events-none" : ""}`}
          >
            {exportingZip ? "📦 Exporting ZIP..." : `📦 ZIP (${selectedItems.length})`}
          </button>
          <button
            onClick={handleDeleteSelected}
            id="delete-selected-btn"
            className="px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-rose-500/10 select-none"
          >
            🗑️ Delete ({selectedItems.length})
          </button>
          <button
            onClick={() => {
              setBulkVendor("");
              setBulkDocType("Keep");
              setBulkCurrency("");
              setBulkCustomTag("");
              setIsBulkEditOpen(true);
            }}
            id="bulk-edit-tags-btn"
            className="px-3.5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-indigo-500/10 select-none"
          >
            🏷️ Bulk Edit ({selectedItems.length})
          </button>
          <button
            onClick={handleExportHTMLReport}
            id="export-html-report-btn"
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-amber-500/10 select-none"
          >
            📄 Report ({selectedItems.length})
          </button>
        </div>
      )}
    </div>
  );
};
