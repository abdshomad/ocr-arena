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
  const [selectedVendor, setSelectedVendor] = useState<string>("all");
  const [selectedDocType, setSelectedDocType] = useState<string>("all");
  const [selectedCurrency, setSelectedCurrency] = useState<string>("all");
  const [previewItem, setPreviewItem] = useState<DocumentHistoryItem | null>(null);
  const [previewMarkdown, setPreviewMarkdown] = useState<string>("");
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);
  const [exportingZip, setExportingZip] = useState<boolean>(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const [isBulkEditOpen, setIsBulkEditOpen] = useState<boolean>(false);
  const [bulkVendor, setBulkVendor] = useState<string>("");
  const [bulkDocType, setBulkDocType] = useState<string>("Keep");
  const [bulkCurrency, setBulkCurrency] = useState<string>("");
  const [bulkCustomTag, setBulkCustomTag] = useState<string>("");
  const [savingBulkTags, setSavingBulkTags] = useState<boolean>(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [inlineEditItem, setInlineEditItem] = useState<DocumentHistoryItem | null>(null);
  const [inlineVendor, setInlineVendor] = useState<string>("");
  const [inlineDocType, setInlineDocType] = useState<string>("");
  const [inlineCurrency, setInlineCurrency] = useState<string>("");
  const [savingInlineTags, setSavingInlineTags] = useState<boolean>(false);

  const [editVendor, setEditVendor] = useState<string>("");
  const [editDocType, setEditDocType] = useState<string>("");
  const [editCurrency, setEditCurrency] = useState<string>("");
  const [savingTags, setSavingTags] = useState<boolean>(false);

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
    selectedVendor,
    setSelectedVendor,
    selectedDocType,
    setSelectedDocType,
    selectedCurrency,
    setSelectedCurrency,
    previewItem,
    setPreviewItem,
    previewMarkdown,
    setPreviewMarkdown,
    loadingPreview,
    setLoadingPreview,
    exportingZip,
    setExportingZip,
    collapsedGroups,
    setCollapsedGroups,
    isBulkEditOpen,
    setIsBulkEditOpen,
    bulkVendor,
    setBulkVendor,
    bulkDocType,
    setBulkDocType,
    bulkCurrency,
    setBulkCurrency,
    bulkCustomTag,
    setBulkCustomTag,
    savingBulkTags,
    setSavingBulkTags,
    selectedTags,
    setSelectedTags,
    inlineEditItem,
    setInlineEditItem,
    inlineVendor,
    setInlineVendor,
    inlineDocType,
    setInlineDocType,
    inlineCurrency,
    setInlineCurrency,
    savingInlineTags,
    setSavingInlineTags,
    editVendor,
    setEditVendor,
    editDocType,
    setEditDocType,
    editCurrency,
    setEditCurrency,
    savingTags,
    setSavingTags
  };
}
