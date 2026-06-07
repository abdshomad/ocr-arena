import React from "react";
import { DocumentHistoryItem } from "../utils/historyHelpers";

interface HistorySidebarProps {
  historyList: DocumentHistoryItem[];
  loading: boolean;
  selectedTags: string[];
  setSelectedTags: React.Dispatch<React.SetStateAction<string[]>>;
  statusFilter: "all" | "success" | "failed";
  setStatusFilter: (f: "all" | "success" | "failed") => void;
  loveFilter: "all" | "loved" | "hated" | "neutral";
  setLoveFilter: (f: "all" | "loved" | "hated" | "neutral") => void;
  likeFilter: "all" | "liked" | "disliked" | "unrated";
  setLikeFilter: (f: "all" | "liked" | "disliked" | "unrated") => void;
  starsFilter: "all" | "1" | "2" | "3" | "4" | "5";
  setStarsFilter: (f: "all" | "1" | "2" | "3" | "4" | "5") => void;
  fastFilter: "all" | "fast" | "slow" | "unrated";
  setFastFilter: (f: "all" | "fast" | "slow" | "unrated") => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  historyList,
  loading,
  selectedTags,
  setSelectedTags,
  statusFilter,
  setStatusFilter,
  loveFilter,
  setLoveFilter,
  likeFilter,
  setLikeFilter,
  starsFilter,
  setStarsFilter,
  fastFilter,
  setFastFilter
}) => {
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
      <div className="bg-white dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-850 p-4 space-y-5 shadow-sm select-none">
        
        {/* Status Filter */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block select-none">
            OCR Status
          </label>
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-slate-705 dark:text-slate-300 focus:outline-none focus:border-[#0078d4]/50 cursor-pointer"
            id="status-filter-select"
          >
            <option value="all">All Statuses</option>
            <option value="success">Success Only</option>
            <option value="failed">Failed Only</option>
          </select>
        </div>

        {/* Love Filter */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block select-none">
            Love Rating
          </label>
          <select
            value={loveFilter}
            onChange={(e: any) => setLoveFilter(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-slate-705 dark:text-slate-300 focus:outline-none focus:border-[#0078d4]/50 cursor-pointer"
            id="love-filter-select"
          >
            <option value="all">All Documents</option>
            <option value="loved">Loved ♥</option>
            <option value="hated">Hated 💔</option>
            <option value="neutral">Neutral/Unrated</option>
          </select>
        </div>

        {/* Like Filter */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block select-none">
            Thumbs Rating
          </label>
          <select
            value={likeFilter}
            onChange={(e: any) => setLikeFilter(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-slate-705 dark:text-slate-300 focus:outline-none focus:border-[#0078d4]/50 cursor-pointer"
            id="like-filter-select"
          >
            <option value="all">All Feedback</option>
            <option value="liked">Thumbs Up 👍</option>
            <option value="disliked">Thumbs Down 👎</option>
            <option value="unrated">Unrated</option>
          </select>
        </div>

        {/* Stars Filter */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block select-none">
            Stars Rating
          </label>
          <select
            value={starsFilter}
            onChange={(e: any) => setStarsFilter(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-slate-705 dark:text-slate-300 focus:outline-none focus:border-[#0078d4]/50 cursor-pointer"
            id="stars-filter-select"
          >
            <option value="all">All Stars</option>
            <option value="5">★★★★★ 5 Stars</option>
            <option value="4">★★★★☆ 4 Stars</option>
            <option value="3">★★★☆☆ 3 Stars</option>
            <option value="2">★★☆☆☆ 2 Stars</option>
            <option value="1">★☆☆☆☆ 1 Star</option>
          </select>
        </div>

        {/* Speed Filter */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block select-none">
            Speed Rating
          </label>
          <select
            value={fastFilter}
            onChange={(e: any) => setFastFilter(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-slate-705 dark:text-slate-300 focus:outline-none focus:border-[#0078d4]/50 cursor-pointer"
            id="fast-filter-select"
          >
            <option value="all">All Speeds</option>
            <option value="fast">Fast ⚡</option>
            <option value="slow">Slow 🐌</option>
            <option value="unrated">Unrated</option>
          </select>
        </div>

        {/* Tags */}
        <div className="pt-2 border-t border-slate-150/40 dark:border-slate-800/50">
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
