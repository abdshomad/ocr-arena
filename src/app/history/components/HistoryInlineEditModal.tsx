import React from "react";
import { DocumentHistoryItem } from "../utils/historyHelpers";

interface HistoryInlineEditModalProps {
  inlineEditItem: DocumentHistoryItem;
  setInlineEditItem: (item: DocumentHistoryItem | null) => void;
  inlineVendor: string;
  setInlineVendor: (v: string) => void;
  inlineDocType: string;
  setInlineDocType: (t: string) => void;
  inlineCurrency: string;
  setInlineCurrency: (c: string) => void;
  handleSaveInlineTags: () => void;
  savingInlineTags: boolean;
}

export const HistoryInlineEditModal: React.FC<HistoryInlineEditModalProps> = ({
  inlineEditItem,
  setInlineEditItem,
  inlineVendor,
  setInlineVendor,
  inlineDocType,
  setInlineDocType,
  inlineCurrency,
  setInlineCurrency,
  handleSaveInlineTags,
  savingInlineTags
}) => {
  const cleanName = inlineEditItem.filename.length > 13 
    ? inlineEditItem.filename.substring(13) 
    : inlineEditItem.filename;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        id="inline-edit-modal"
        className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-150"
      >
        <div className="flex justify-between items-center select-none">
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-105">
            Edit Tags
          </h3>
          <button 
            onClick={() => setInlineEditItem(null)}
            className="text-slate-400 hover:text-slate-805 dark:text-slate-500 dark:hover:text-white font-bold cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>
        
        <p className="text-[10px] text-slate-505 dark:text-slate-400 select-none truncate">
          File: {cleanName}
        </p>
        
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 select-none">Vendor</label>
            <input
              type="text"
              value={inlineVendor}
              onChange={(e) => setInlineVendor(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0078d4]/50"
              placeholder="Enter vendor name..."
              id="inline-vendor-input"
            />
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 select-none">Doc Type</label>
            <select
              value={inlineDocType}
              onChange={(e) => setInlineDocType(e.target.value)}
              className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0078d4]/50 cursor-pointer"
              id="inline-doctype-select"
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
            <label className="text-[10px] font-bold text-slate-400 select-none">Currency</label>
            <input
              type="text"
              value={inlineCurrency}
              onChange={(e) => setInlineCurrency(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0078d4]/50"
              placeholder="Enter currency (e.g. USD, IDR)..."
              id="inline-currency-input"
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/50">
          <button
            onClick={() => setInlineEditItem(null)}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-[10px] font-bold text-slate-605 dark:text-slate-305 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveInlineTags}
            disabled={savingInlineTags}
            id="inline-save-tags-btn"
            className="px-3.5 py-1.5 rounded-xl bg-[#0078d4] hover:bg-[#106ebe] text-white text-[10px] font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            {savingInlineTags ? "Saving..." : "Save Tags"}
          </button>
        </div>
      </div>
    </div>
  );
};
