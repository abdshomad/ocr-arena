/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { 
  DocumentHistoryItem, 
  getLocalDateString,
  ENGINES
} from "../utils/historyHelpers";

export function useHistoryFilters(state: any) {
  const runsPerDay = React.useMemo(() => {
    const counts: Record<string, number> = {};
    state.historyList.forEach((item: DocumentHistoryItem) => {
      const dStr = getLocalDateString(item.uploadTime);
      if (dStr) counts[dStr] = (counts[dStr] || 0) + 1;
    });
    return counts;
  }, [state.historyList]);

  const stats = React.useMemo(() => {
    const tagsSet = new Set<string>();

    state.historyList.forEach((item: DocumentHistoryItem) => {
      const tags = item.metadata?.tags || item.metadata?.Tags;
      if (Array.isArray(tags)) {
        tags.forEach(tag => {
          if (typeof tag === "string" && tag.trim()) tagsSet.add(tag.trim());
        });
      }
    });

    return { tags: Array.from(tagsSet) };
  }, [state.historyList]);

  const isRegexValid = React.useMemo(() => {
    if (!state.isRegexSearch || !state.searchQuery) return true;
    try {
      new RegExp(state.searchQuery);
      return true;
    } catch {
      return false;
    }
  }, [state.isRegexSearch, state.searchQuery]);

  const filteredHistory = React.useMemo(() => {
    return state.historyList.filter((item: DocumentHistoryItem) => {
      if (state.typeFilter === "upload" && item.isSample) return false;
      if (state.typeFilter === "sample" && !item.isSample) return false;

      if (state.startDate) {
        const start = new Date(state.startDate + "T00:00:00");
        if (new Date(item.uploadTime) < start) return false;
      }
      if (state.endDate) {
        const end = new Date(state.endDate + "T23:59:59");
        if (new Date(item.uploadTime) > end) return false;
      }

      if (item.size > state.maxSizeFilter) return false;

      if (state.selectedTags.length > 0) {
        const itemTags: string[] = item.metadata?.tags || item.metadata?.Tags || [];
        const hasAll = state.selectedTags.every((t: string) => itemTags.includes(t));
        if (!hasAll) return false;
      }

      if (state.statusFilter && state.statusFilter !== "all") {
        const wantsSuccess = state.statusFilter === "success";
        if (item.parsed !== wantsSuccess) return false;
      }

      if (state.loveFilter && state.loveFilter !== "all") {
        if (state.loveFilter === "loved" && item.isLoved !== true) return false;
        if (state.loveFilter === "hated" && item.isLoved !== false) return false;
        if (state.loveFilter === "neutral" && item.isLoved !== null && item.isLoved !== undefined) return false;
      }

      if (state.likeFilter && state.likeFilter !== "all") {
        if (state.likeFilter === "liked" && item.isAccurate !== true) return false;
        if (state.likeFilter === "disliked" && item.isAccurate !== false) return false;
        if (state.likeFilter === "unrated" && item.isAccurate !== null && item.isAccurate !== undefined) return false;
      }

      if (state.starsFilter && state.starsFilter !== "all") {
        const targetStars = Number(state.starsFilter);
        if (item.ratingStars !== targetStars) return false;
      }

      if (state.fastFilter && state.fastFilter !== "all") {
        if (state.fastFilter === "fast" && item.isFast !== true) return false;
        if (state.fastFilter === "slow" && item.isFast !== false) return false;
        if (state.fastFilter === "unrated" && item.isFast !== null && item.isFast !== undefined) return false;
      }

      if (!state.searchQuery) return true;

      let regex: RegExp | null = null;
      if (state.isRegexSearch) {
        try {
          regex = new RegExp(state.searchQuery, "i");
        } catch {
          return false;
        }
      }

      if (regex) {
        const fileMatch = regex.test(item.filename);
        const engineDisplay = ENGINES.find((e) => e.id === item.engine)?.name || item.engine || "";
        const engineMatch = regex.test(engineDisplay);
        const textMatch = item.ocrText ? regex.test(item.ocrText) : false;
        
        let metaMatch = false;
        if (item.metadata && typeof item.metadata === "object") {
          metaMatch = Object.entries(item.metadata).some(([key, val]) => {
            return regex!.test(key) || (val && typeof val !== "object" && regex!.test(String(val)));
          });
        }
        return fileMatch || engineMatch || textMatch || metaMatch;
      } else {
        const q = state.searchQuery.toLowerCase();
        const fileMatch = item.filename.toLowerCase().includes(q);
        const engineDisplay = ENGINES.find((e) => e.id === item.engine)?.name.toLowerCase() || item.engine?.toLowerCase() || "";
        const engineMatch = engineDisplay.includes(q);
        const textMatch = item.ocrText?.toLowerCase().includes(q) || false;
        
        let metaMatch = false;
        if (item.metadata && typeof item.metadata === "object") {
          metaMatch = Object.entries(item.metadata).some(([key, val]) => {
            return key.toLowerCase().includes(q) || (val && typeof val !== "object" && String(val).toLowerCase().includes(q));
          });
        }
        return fileMatch || engineMatch || textMatch || metaMatch;
      }
    });
  }, [
    state.historyList,
    state.typeFilter,
    state.startDate,
    state.endDate,
    state.maxSizeFilter,
    state.selectedTags,
    state.searchQuery,
    state.isRegexSearch,
    state.statusFilter,
    state.loveFilter,
    state.likeFilter,
    state.starsFilter,
    state.fastFilter
  ]);

  const handleSort = (columnId: string, event: React.MouseEvent) => {
    state.setSortColumns((prev: any[]) => {
      const isShift = event.shiftKey;
      const idx = prev.findIndex((col) => col.id === columnId);

      if (idx > -1) {
        const col = prev[idx];
        if (col.desc) {
          return isShift ? prev.filter((c) => c.id !== columnId) : [{ id: "uploadTime", desc: true }];
        }
        const updated = [...prev];
        updated[idx] = { id: columnId, desc: true };
        return isShift ? updated : [{ id: columnId, desc: true }];
      }
      return isShift ? [...prev, { id: columnId, desc: false }] : [{ id: columnId, desc: false }];
    });
  };

  const sortedHistory = React.useMemo(() => {
    return [...filteredHistory].sort((a, b) => {
      for (const col of state.sortColumns) {
        const valA = col.id === "latency" ? (a.latency ?? -1) : (a[col.id as keyof DocumentHistoryItem] ?? "");
        const valB = col.id === "latency" ? (b.latency ?? -1) : (b[col.id as keyof DocumentHistoryItem] ?? "");

        if (typeof valA === "string") {
          const cmp = valA.localeCompare(valB as string);
          if (cmp !== 0) return col.desc ? -cmp : cmp;
        } else {
          if (valA !== valB) return col.desc ? (valA < valB ? 1 : -1) : (valA > valB ? 1 : -1);
        }
      }
      return 0;
    });
  }, [filteredHistory, state.sortColumns]);

  const getTimeGroup = (uploadTimeStr: string) => {
    const uploadDate = new Date(uploadTimeStr);
    const now = new Date();
    const uploadDay = new Date(uploadDate.getFullYear(), uploadDate.getMonth(), uploadDate.getDate());
    const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.floor((nowDay.getTime() - uploadDay.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays <= 7) return "Last 7 Days";
    return "Older";
  };

  const groupedHistory = React.useMemo(() => {
    const groups: Record<string, DocumentHistoryItem[]> = {
      "Today": [],
      "Yesterday": [],
      "Last 7 Days": [],
      "Older": []
    };
    sortedHistory.forEach(item => {
      const grp = getTimeGroup(item.uploadTime);
      if (groups[grp]) groups[grp].push(item);
      else groups["Older"].push(item);
    });
    return groups;
  }, [sortedHistory]);

  const groupKeys = React.useMemo(() => {
    const keys = ["Today", "Yesterday", "Last 7 Days", "Older"];
    const isAsc = state.sortColumns.length > 0 && state.sortColumns[0].id === "uploadTime" && !state.sortColumns[0].desc;
    return isAsc ? [...keys].reverse() : keys;
  }, [state.sortColumns]);

  const toggleGroup = (groupName: string) => {
    state.setCollapsedGroups((prev: Record<string, boolean>) => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  return {
    runsPerDay,
    allTags: stats.tags,
    isRegexValid,
    filteredHistory,
    sortedHistory,
    groupedHistory,
    groupKeys,
    toggleGroup,
    handleSort
  };
}
