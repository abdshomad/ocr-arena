import React from "react";

interface HistoryBulkEditModalProps {
  selectedItems: string[];
  setIsBulkEditOpen: (open: boolean) => void;
  bulkVendor: string;
  setBulkVendor: (v: string) => void;
  bulkDocType: string;
  setBulkDocType: (t: string) => void;
  bulkCurrency: string;
  setBulkCurrency: (c: string) => void;
  bulkCustomTag: string;
  setBulkCustomTag: (tag: string) => void;
  handleSaveBulkTags: () => void;
  savingBulkTags: boolean;
}

export const HistoryBulkEditModal: React.FC<HistoryBulkEditModalProps> = ({
  selectedItems,
  setIsBulkEditOpen,
  bulkVendor,
  setBulkVendor,
  bulkDocType,
  setBulkDocType,
  bulkCurrency,
  setBulkCurrency,
  bulkCustomTag,
  setBulkCustomTag,
  handleSaveBulkTags,
  savingBulkTags
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        id="bulk-edit-modal"
        className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-150"
      >
        <div className="flex justify-between items-center select-none">
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-105">
            Bulk Edit Tags
          </h3>
          <button 
            onClick={() => setIsBulkEditOpen(false)}
            className="text-slate-400 hover:text-slate-800 dark:text-slate-505 dark:hover:text-white font-bold cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>
        
        <p className="text-[10px] text-slate-500 dark:text-slate-400 select-none">
          Apply changes to <span className="font-extrabold text-[#0078d4]">{selectedItems.length} selected documents</span>. Empty fields will not overwrite existing metadata values.
        </p>
        
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-405 select-none">Vendor</label>
            <input
              type="text"
              value={bulkVendor}
              onChange={(e) => setBulkVendor(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0078d4]/50"
              placeholder="Enter vendor name (leave empty to keep)..."
              id="bulk-vendor-input"
            />
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-405 select-none">Doc Type</label>
            <select
              value={bulkDocType}
              onChange={(e) => setBulkDocType(e.target.value)}
              className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0078d4]/50 cursor-pointer"
              id="bulk-doctype-select"
            >
              <option value="Keep">-- Keep Existing --</option>
              <option value="Invoice">Invoice</option>
              <option value="Receipt">Receipt</option>
              <option value="Purchase Order">Purchase Order</option>
              <option value="Delivery Order">Delivery Order</option>
              <option value="Sales Order">Sales Order</option>
              <option value="Unknown">Unknown</option>
            </select>
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-405 select-none">Currency</label>
            <input
              type="text"
              value={bulkCurrency}
              onChange={(e) => setBulkCurrency(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0078d4]/50"
              placeholder="Enter currency (leave empty to keep)..."
              id="bulk-currency-input"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-405 select-none">Custom Tags (Comma Separated)</label>
            <input
              type="text"
              value={bulkCustomTag}
              onChange={(e) => setBulkCustomTag(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0078d4]/50"
              placeholder="e.g. Q2-Invoices, Review, Verified"
              id="bulk-customtags-input"
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/50">
          <button
            onClick={() => setIsBulkEditOpen(false)}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-55 text-[10px] font-bold text-slate-605 dark:text-slate-305 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveBulkTags}
            disabled={savingBulkTags}
            id="bulk-save-tags-btn"
            className="px-3.5 py-1.5 rounded-xl bg-[#0078d4] hover:bg-[#106ebe] text-white text-[10px] font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            {savingBulkTags ? "Saving..." : "Apply Tag Updates"}
          </button>
        </div>
      </div>
    </div>
  );
};
