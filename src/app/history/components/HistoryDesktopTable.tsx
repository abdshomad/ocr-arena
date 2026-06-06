/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { 
  DocumentHistoryItem, 
  highlightText, 
  getVendor, 
  getDocType, 
  formatBytes, 
  formatDate,
} from "../utils/historyHelpers";

interface HistoryDesktopTableProps {
  filteredHistory: DocumentHistoryItem[];
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
  handleOpenInlineEdit: (item: DocumentHistoryItem) => void;
  sortColumns: { id: string; desc: boolean }[];
  handleSort: (columnId: string, event: React.MouseEvent) => void;
  getEngineDisplay: (engineId: string) => string;
  renderSortIndicator: (columnId: string) => React.ReactNode;
  renderMetadata: (metadata: Record<string, any> | null) => React.ReactNode;
}

export const HistoryDesktopTable: React.FC<HistoryDesktopTableProps> = ({
  filteredHistory,
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
  handleOpenInlineEdit,
  handleSort,
  getEngineDisplay,
  renderSortIndicator,
  renderMetadata
}) => {
  return (
    <div className="hidden sm:block overflow-x-auto">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="bg-slate-50/60 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-505 dark:text-slate-400 font-bold tracking-wider uppercase text-[10px]">
            <th className="p-4 w-12 text-center">
              <input
                type="checkbox"
                id="select-all-history-checkbox"
                checked={filteredHistory.length > 0 && selectedItems.length === filteredHistory.length}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedItems(filteredHistory.map(item => item.filename));
                  } else {
                    setSelectedItems([]);
                  }
                }}
                className="rounded border-slate-300 dark:border-slate-700 bg-slate-105 dark:bg-slate-955 text-[#0078d4] focus:ring-[#0078d4] w-3.5 h-3.5 cursor-pointer"
              />
            </th>
            <th className="p-4 w-60 select-none">
              <div className="flex flex-col gap-1">
                <span>Document Details</span>
                <div className="flex items-center gap-2 text-[9px] font-bold text-slate-405 dark:text-slate-505 normal-case">
                  <span onClick={(e) => handleSort('uploadTime', e)} className="hover:text-[#0078d4] cursor-pointer flex items-center transition-colors">
                    Date {renderSortIndicator('uploadTime')}
                  </span>
                  <span>•</span>
                  <span onClick={(e) => handleSort('filename', e)} className="hover:text-[#0078d4] cursor-pointer flex items-center transition-colors">
                    Name {renderSortIndicator('filename')}
                  </span>
                  <span>•</span>
                  <span onClick={(e) => handleSort('size', e)} className="hover:text-[#0078d4] cursor-pointer flex items-center transition-colors">
                    Size {renderSortIndicator('size')}
                  </span>
                </div>
              </div>
            </th>
            <th onClick={(e) => handleSort('engine', e)} className="p-4 w-48 hover:bg-slate-100/30 dark:hover:bg-slate-800/30 transition-colors cursor-pointer select-none group">
              <div className="flex items-center">
                <span>OCR Engine</span>
                {renderSortIndicator('engine')}
              </div>
            </th>
            <th className="p-4 select-none">
              <div className="flex items-center justify-between">
                <span>Parsed Metadata</span>
                <span onClick={(e) => handleSort('latency', e)} className="hover:text-[#0078d4] cursor-pointer flex items-center transition-colors text-[9px] font-bold text-slate-400 dark:text-slate-500 normal-case mr-4" title="Sort by processing latency">
                  ⏱️ Sort by Latency {renderSortIndicator('latency')}
                </span>
              </div>
            </th>
            <th onClick={(e) => handleSort('parsed', e)} className="p-4 w-24 hover:bg-slate-100/30 dark:hover:bg-slate-800/30 transition-colors cursor-pointer select-none group text-center">
              <div className="flex items-center justify-center">
                <span>Status</span>
                {renderSortIndicator('parsed')}
              </div>
            </th>
            <th className="p-4 w-40 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/50 dark:divide-slate-850">
          {groupKeys.map((groupName) => {
            const items = groupedHistory[groupName] || [];
            if (items.length === 0) return null;
            const isCollapsed = collapsedGroups[groupName];
            return (
              <React.Fragment key={groupName}>
                <tr className="bg-slate-105/30 dark:bg-slate-900/40 cursor-pointer hover:bg-slate-150/40 dark:hover:bg-slate-800/40 select-none group/row border-y border-slate-200 dark:border-slate-800" onClick={() => toggleGroup(groupName)}>
                  <td colSpan={6} className="p-3 align-middle">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-bold w-4 text-center">
                        {isCollapsed ? "▶" : "▼"}
                      </span>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0078d4] dark:text-[#0078d4]">
                        {groupName}
                      </span>
                      <span className="text-[9px] font-bold bg-slate-200/60 dark:bg-slate-800/80 text-slate-605 dark:text-slate-400 px-2 py-0.2 rounded-full">
                        {items.length} {items.length === 1 ? "scan" : "scans"}
                      </span>
                    </div>
                  </td>
                </tr>
                {!isCollapsed && items.map((item) => {
                  const cleanName = item.filename.length > 13 ? item.filename.substring(13) : item.filename;
                  const isSelected = selectedItems.includes(item.filename);
                  return (
                    <tr key={item.id} className={`hover:bg-slate-100/50 dark:hover:bg-slate-900/30 transition-colors duration-150 ${isSelected ? "bg-slate-100/20 dark:bg-slate-900/20" : ""}`}>
                      <td className="p-4 align-middle text-center">
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
                          className="rounded border-slate-305 dark:border-slate-700 bg-slate-100 dark:bg-slate-955 text-[#0078d4] focus:ring-[#0078d4] w-3.5 h-3.5 cursor-pointer item-select-checkbox"
                        />
                      </td>
                      <td className="p-4 align-top">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {formatDate(item.uploadTime)}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400 truncate max-w-[200px]" title={item.filename}>
                            {highlightText(cleanName, searchQuery, isRegexSearch)}
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-805 text-slate-505 border border-slate-200 dark:border-slate-700 select-none">
                              {formatBytes(item.size)}
                            </span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border select-none ${
                              item.isSample 
                                ? "bg-blue-500/10 text-blue-500 border-blue-500/20" 
                                : "bg-purple-500/10 text-purple-500 border-purple-500/20"
                            }`}>
                              {item.isSample ? "Sample" : "Upload"}
                            </span>
                            <span onClick={() => handleOpenInlineEdit(item)} className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-[#0078d4]/10 text-[#0078d4] border border-[#0078d4]/20 flex items-center gap-0.5 hover:bg-[#0078d4]/20 cursor-pointer transition-colors tag-badge-vendor" title="Click to edit Vendor tag">
                              🏷️ {highlightText(getVendor(item), searchQuery, isRegexSearch)}
                            </span>
                            <span onClick={() => handleOpenInlineEdit(item)} className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-indigo-500/10 text-indigo-655 dark:text-indigo-400 border border-indigo-500/20 flex items-center gap-0.5 hover:bg-indigo-500/20 cursor-pointer transition-colors tag-badge-doctype" title="Click to edit Document Type tag">
                              📄 {highlightText(getDocType(item), searchQuery, isRegexSearch)}
                            </span>
                            {item.metadata?.currency && (
                              <span onClick={() => handleOpenInlineEdit(item)} className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-amber-550/10 text-amber-655 dark:text-amber-400 border border-amber-500/20 flex items-center gap-0.5 hover:bg-amber-500/20 cursor-pointer transition-colors tag-badge-currency" title="Click to edit Currency tag">
                                💵 {highlightText(item.metadata.currency, searchQuery, isRegexSearch)}
                              </span>
                            )}
                            {Array.isArray(item.metadata?.tags || item.metadata?.Tags) && 
                              (item.metadata?.tags || item.metadata?.Tags).map((tag: string) => (
                                <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-0.5">
                                  🏷️ {highlightText(tag, searchQuery, isRegexSearch)}
                                </span>
                              ))
                            }
                          </div>
                        </div>
                      </td>
                      <td className="p-4 align-top">
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200 bg-slate-105 dark:bg-slate-955 px-2 py-1 rounded border border-slate-200/50 dark:border-slate-800/50">
                          {highlightText(getEngineDisplay(item.engine), searchQuery, isRegexSearch)}
                        </span>
                      </td>
                      <td className="p-4 align-top">
                        {renderMetadata(item.metadata)}
                      </td>
                      <td className="p-4 align-top text-center">
                        <div className="flex flex-col gap-1 items-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${item.parsed ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                            {item.parsed ? "parsed" : "failed"}
                          </span>
                          {item.latency !== undefined && item.latency !== null && (
                            <span className="text-[10px] text-slate-405 dark:text-slate-500 font-mono" title="Processing latency">
                              ⏱️ {(item.latency / 1000).toFixed(2)}s
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 align-middle text-center">
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                          <button onClick={() => setPreviewItem(item)} id={`preview-btn-${item.id}`} className="w-full sm:w-auto inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl font-bold bg-slate-105 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs transition-colors cursor-pointer">
                            👁️ Preview
                          </button>
                          <a href={`/arena?doc=${encodeURIComponent(item.filename)}`} className="w-full sm:w-auto inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl font-bold bg-[#0078d4] hover:bg-[#106ebe] dark:bg-[#0078d4] dark:hover:bg-[#106ebe] text-white text-xs transition-colors shadow-md shadow-[#0078d4]/10 cursor-pointer">
                            Open in Arena
                          </a>
                          <button onClick={() => handleDelete(item.filename)} className="w-full sm:w-auto inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl font-bold bg-rose-500/10 hover:bg-rose-500 text-rose-505 hover:text-white border border-rose-500/25 hover:border-transparent text-xs transition-colors cursor-pointer">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
