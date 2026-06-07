import { useState, useRef } from "react";
import { DocumentHistoryItem } from "../utils/historyHelpers";

export function useHistoryState() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [tokenInput, setTokenInput] = useState<string>("");
  const [loginError, setLoginError] = useState<string>("");
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const [historyList, setHistoryList] = useState<DocumentHistoryItem[]>([]);
  const [sortColumns, setSortColumns] = useState<{ id: string; desc: boolean }[]>([
    { id: "uploadTime", desc: true }
  ]);
  const [loading, setLoading] = useState<boolean>(true);
  const [restoringBackup, setRestoringBackup] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const heatmapScrollRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isRegexSearch, setIsRegexSearch] = useState<boolean>(false);
  const [typeFilter, setTypeFilter] = useState<"all" | "upload" | "sample">("all");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [maxSizeFilter, setMaxSizeFilter] = useState<number>(5000000);
  const [previewItem, setPreviewItem] = useState<DocumentHistoryItem | null>(null);
  const [previewMarkdown, setPreviewMarkdown] = useState<string>("");
  const [previewRawResult, setPreviewRawResult] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);
  const [exportingZip, setExportingZip] = useState<boolean>(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const [isBulkEditOpen, setIsBulkEditOpen] = useState<boolean>(false);
  const [bulkCustomTag, setBulkCustomTag] = useState<string>("");
  const [savingBulkTags, setSavingBulkTags] = useState<boolean>(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "failed">("all");
  const [loveFilter, setLoveFilter] = useState<"all" | "loved" | "hated" | "neutral">("all");
  const [likeFilter, setLikeFilter] = useState<"all" | "liked" | "disliked" | "unrated">("all");
  const [starsFilter, setStarsFilter] = useState<"all" | "1" | "2" | "3" | "4" | "5">("all");
  const [fastFilter, setFastFilter] = useState<"all" | "fast" | "slow" | "unrated">("all");

  return {
    isAuthenticated,
    setIsAuthenticated,
    tokenInput,
    setTokenInput,
    loginError,
    setLoginError,
    theme,
    setTheme,
    historyList,
    setHistoryList,
    sortColumns,
    setSortColumns,
    loading,
    setLoading,
    restoringBackup,
    setRestoringBackup,
    fileInputRef,
    heatmapScrollRef,
    searchQuery,
    setSearchQuery,
    isRegexSearch,
    setIsRegexSearch,
    typeFilter,
    setTypeFilter,
    selectedItems,
    setSelectedItems,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    maxSizeFilter,
    setMaxSizeFilter,
    previewItem,
    setPreviewItem,
    previewMarkdown,
    setPreviewMarkdown,
    previewRawResult,
    setPreviewRawResult,
    loadingPreview,
    setLoadingPreview,
    exportingZip,
    setExportingZip,
    collapsedGroups,
    setCollapsedGroups,
    isBulkEditOpen,
    setIsBulkEditOpen,
    bulkCustomTag,
    setBulkCustomTag,
    savingBulkTags,
    setSavingBulkTags,
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
  };
}
