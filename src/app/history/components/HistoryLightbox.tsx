import React from "react";
import { DocumentHistoryItem, highlightText, ENGINES } from "../utils/historyHelpers";

interface HistoryLightboxProps {
  previewItem: DocumentHistoryItem;
  setPreviewItem: (item: DocumentHistoryItem | null) => void;
  previewMarkdown: string;
  loadingPreview: boolean;
  editVendor: string;
  setEditVendor: (v: string) => void;
  editDocType: string;
  setEditDocType: (t: string) => void;
  editCurrency: string;
  setEditCurrency: (c: string) => void;
  handleSaveTags: () => void;
  savingTags: boolean;
  searchQuery: string;
  isRegexSearch: boolean;
}

export const HistoryLightbox: React.FC<HistoryLightboxProps> = ({
  previewItem,
  setPreviewItem,
  previewMarkdown,
  loadingPreview,
  editVendor,
  setEditVendor,
  editDocType,
  setEditDocType,
  editCurrency,
  setEditCurrency,
  handleSaveTags,
  savingTags,
  searchQuery,
  isRegexSearch
}) => {
  const getEngineDisplay = (engineId: string) => {
    const found = ENGINES.find((e) => e.id === engineId);
    return found ? `${found.logo} ${found.name}` : `🤖 ${engineId}`;
  };

  const imageSrc = previewItem.isSample 
    ? `/arena/${previewItem.filename}` 
    : `/api/files?file=${encodeURIComponent(previewItem.filename)}`;

  return (
    <div 
      id="history-lightbox-modal" 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="w-full max-w-6xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[80vh] min-h-[400px] max-h-[700px] animate-in slide-in-from-bottom-4 duration-300">
        
        {/* Left Column: Original Document Image */}
        <div className="flex-1 bg-slate-950 flex flex-col items-center justify-center p-6 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 relative min-h-[250px] md:min-h-0">
          <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-slate-900/80 border border-slate-800 text-[9px] font-bold text-slate-400 select-none uppercase tracking-wider">
            Document Image
          </span>
          <img
            src={imageSrc}
            alt="Original document preview"
            className="max-w-full max-h-full object-contain rounded-lg shadow-lg border border-slate-800"
          />
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

            {/* Editable Tags Section */}
            <div className="bg-slate-55 dark:bg-slate-955 border border-slate-200 dark:border-slate-800/85 rounded-2xl p-4 space-y-3">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block select-none">
                Categorical Metadata Tags
              </span>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-450 select-none">Vendor</label>
                  <input
                    type="text"
                    value={editVendor}
                    onChange={(e) => setEditVendor(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0078d4]/50"
                    placeholder="Vendor..."
                    id="lightbox-vendor-input"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-450 select-none">Doc Type</label>
                  <select
                    value={editDocType}
                    onChange={(e) => setEditDocType(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0078d4]/50 cursor-pointer"
                    id="lightbox-doctype-select"
                  >
                    <option value="Invoice">Invoice</option>
                    <option value="Receipt">Receipt</option>
                    <option value="Purchase Order">Purchase Order</option>
                    <option value="Delivery Order">Delivery Order</option>
                    <option value="Sales Order">Sales Order</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-450 select-none">Currency</label>
                  <input
                    type="text"
                    value={editCurrency}
                    onChange={(e) => setEditCurrency(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0078d4]/50"
                    placeholder="Currency..."
                    id="lightbox-currency-input"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1 border-t border-slate-150/50 dark:border-slate-800/30">
                <button
                  onClick={handleSaveTags}
                  disabled={savingTags}
                  id="lightbox-save-tags-btn"
                  className="px-3.5 py-1.5 rounded-xl bg-[#0078d4] hover:bg-[#106ebe] text-white text-[10px] font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingTags ? "Saving..." : "Save Tags"}
                </button>
              </div>
            </div>

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
