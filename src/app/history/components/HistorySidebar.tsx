import React from "react";
import { DocumentHistoryItem, getVendor, getDocType } from "../utils/historyHelpers";

interface HistorySidebarProps {
  historyList: DocumentHistoryItem[];
  loading: boolean;
  selectedVendor: string;
  setSelectedVendor: (v: string) => void;
  selectedDocType: string;
  setSelectedDocType: (t: string) => void;
  selectedCurrency: string;
  setSelectedCurrency: (c: string) => void;
  selectedTags: string[];
  setSelectedTags: React.Dispatch<React.SetStateAction<string[]>>;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  historyList,
  loading,
  selectedVendor,
  setSelectedVendor,
  selectedDocType,
  setSelectedDocType,
  selectedCurrency,
  setSelectedCurrency,
  selectedTags,
  setSelectedTags
}) => {
  const vendorCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    historyList.forEach((item) => {
      const v = getVendor(item);
      counts[v] = (counts[v] || 0) + 1;
    });
    return counts;
  }, [historyList]);

  const docTypeCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    historyList.forEach((item) => {
      const t = getDocType(item);
      counts[t] = (counts[t] || 0) + 1;
    });
    return counts;
  }, [historyList]);

  const currencyCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    historyList.forEach((item) => {
      const c = item.metadata?.currency || item.metadata?.Currency || "";
      const clean = String(c).trim();
      if (clean && clean.toLowerCase() !== "not found" && clean.toLowerCase() !== "not_found") {
        counts[clean] = (counts[clean] || 0) + 1;
      }
    });
    return counts;
  }, [historyList]);

  const allTags = React.useMemo(() => {
    const tagsSet = new Set<string>();
    historyList.forEach((item) => {
      const tags = item.metadata?.tags || item.metadata?.Tags;
      if (Array.isArray(tags)) {
        tags.forEach(t => {
          if (typeof t === "string" && t.trim()) {
            tagsSet.add(t.trim());
          }
        });
      }
    });
    return Array.from(tagsSet);
  }, [historyList]);

  if (loading || historyList.length === 0) return null;

  return (
    <aside className="w-full lg:w-64 flex-shrink-0 space-y-4">
      <div className="bg-white dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-5 shadow-sm select-none">
        
        {/* Vendors */}
        <div>
          <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-3 select-none">
            Filter by Vendor
          </h3>
          <div className="flex flex-wrap lg:flex-col gap-1.5">
            <button
              onClick={() => setSelectedVendor("all")}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex justify-between items-center ${
                selectedVendor === "all"
                  ? "bg-[#0078d4] text-white font-extrabold shadow-sm shadow-[#0078d4]/10"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
              id="vendor-filter-all"
            >
              <span>All Vendors</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${selectedVendor === 'all' ? 'bg-[#106ebe] text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                {historyList.length}
              </span>
            </button>
            {Object.entries(vendorCounts).map(([vendor, count]) => (
              <button
                key={vendor}
                onClick={() => setSelectedVendor(vendor)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex justify-between items-center ${
                  selectedVendor === vendor
                    ? "bg-[#0078d4] text-white font-extrabold shadow-sm shadow-[#0078d4]/10"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
                id={`vendor-filter-${vendor.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <span className="truncate pr-2">{vendor}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${selectedVendor === vendor ? 'bg-[#106ebe] text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Doc Type */}
        <div className="border-t border-slate-100/10 dark:border-slate-800/30 pt-4">
          <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-3 select-none">
            Document Type
          </h3>
          <div className="flex flex-wrap lg:flex-col gap-1.5">
            <button
              onClick={() => setSelectedDocType("all")}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex justify-between items-center ${
                selectedDocType === "all"
                  ? "bg-[#0078d4] text-white font-extrabold shadow-sm shadow-[#0078d4]/10"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
              id="doctype-filter-all"
            >
              <span>All Types</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${selectedDocType === 'all' ? 'bg-[#106ebe] text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                {historyList.length}
              </span>
            </button>
            {Object.entries(docTypeCounts).map(([docType, count]) => (
              <button
                key={docType}
                onClick={() => setSelectedDocType(docType)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex justify-between items-center ${
                  selectedDocType === docType
                    ? "bg-[#0078d4] text-white font-extrabold shadow-sm shadow-[#0078d4]/10"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
                id={`doctype-filter-${docType.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <span className="truncate pr-2">{docType}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${selectedDocType === docType ? 'bg-[#106ebe] text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Currency */}
        <div className="border-t border-slate-100/10 dark:border-slate-800/30 pt-4">
          <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-3 select-none">
            Currencies
          </h3>
          <div className="flex flex-wrap lg:flex-col gap-1.5">
            <button
              onClick={() => setSelectedCurrency("all")}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex justify-between items-center ${
                selectedCurrency === "all"
                  ? "bg-[#0078d4] text-white font-extrabold shadow-sm shadow-[#0078d4]/10"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
              id="currency-filter-all"
            >
              <span>All Currencies</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${selectedCurrency === 'all' ? 'bg-[#106ebe] text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                {historyList.length}
              </span>
            </button>
            {Object.entries(currencyCounts).map(([currency, count]) => (
              <button
                key={currency}
                onClick={() => setSelectedCurrency(currency)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex justify-between items-center ${
                  selectedCurrency === currency
                    ? "bg-[#0078d4] text-white font-extrabold shadow-sm shadow-[#0078d4]/10"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
                id={`currency-filter-${currency.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <span className="truncate pr-2">{currency}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${selectedCurrency === currency ? 'bg-[#106ebe] text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="border-t border-slate-100/10 dark:border-slate-800/30 pt-4">
          <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-3 select-none">
            Filter by Tags
          </h3>
          <div className="flex flex-wrap lg:flex-col gap-1.5">
            {allTags.length === 0 ? (
              <span className="text-[10px] text-slate-500 italic">No tags applied yet</span>
            ) : (
              <>
                {allTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedTags(prev => prev.filter(t => t !== tag));
                        } else {
                          setSelectedTags(prev => [...prev, tag]);
                        }
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex justify-between items-center ${
                        isSelected
                          ? "bg-[#0078d4] text-white font-extrabold shadow-sm shadow-[#0078d4]/10"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                      id={`tag-filter-${tag.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <span className="truncate pr-2">{tag}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-[#106ebe] text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                        {historyList.filter(item => {
                          const t = item.metadata?.tags || item.metadata?.Tags || [];
                          return t.includes(tag);
                        }).length}
                      </span>
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </div>

      </div>
    </aside>
  );
};
export default HistorySidebar;
