import { useState, useEffect, useRef } from "react";
import { ResultsMap, engines } from "../utils/ocrConstants";

export function useArenaState() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [tokenInput, setTokenInput] = useState<string>("");
  const [loginError, setLoginError] = useState<string>("");
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFilename, setSelectedFilename] = useState<string>("");
  const [isCustomUpload, setIsCustomUpload] = useState<boolean>(false);
  const [selectedPageIndex, setSelectedPageIndex] = useState<number>(0);

  const [showGallery, setShowGallery] = useState<boolean>(true);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [results, setResults] = useState<ResultsMap>(() => {
    const res: any = {};
    engines.forEach(e => {
      res[e.id] = { status: "pending", text: "", time: 0 };
    });
    return res as ResultsMap;
  });

  const [activeCompareTab, setActiveCompareTab] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"compare" | "analytics">("compare");
  const [compareMode, setCompareMode] = useState<"visual" | "parsed" | "json">("parsed");
  const [showDiffs, setShowDiffs] = useState<boolean>(false);
  const [splitDiff, setSplitDiff] = useState<boolean>(true);
  const [diffBaseline, setDiffBaseline] = useState<string>("nemotron");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showGroundTruth, setShowGroundTruth] = useState<boolean>(false);
  const [groundTruth, setGroundTruth] = useState<string>(
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
  );
  const [visualColorMode, setVisualColorMode] = useState<"label" | "confidence" | "heatmap">("label");
  const [heatmapMetric, setHeatmapMetric] = useState<"latency" | "confidence">("latency");
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0);
  const [globalFontSize, setGlobalFontSize] = useState<"sm" | "md" | "lg">("sm");
  const [globalWordWrap, setGlobalWordWrap] = useState<boolean>(true);
  const [cardWordWrap, setCardWordWrap] = useState<Record<string, boolean>>({});
  const [showPerformanceMatrix, setShowPerformanceMatrix] = useState<boolean>(false);
  const [cardFontSizes, setCardFontSizes] = useState<Record<string, "sm" | "md" | "lg">>({});
  const [cardLineHeights, setCardLineHeights] = useState<Record<string, "compact" | "cozy">>({});
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredBlock, setHoveredBlock] = useState<{ engineId: string; blockId: number } | null>(null);
  const [highlightedBlock, setHighlightedBlock] = useState<{ engineId: string; blockId: number } | null>(null);
  const [syncScroll, setSyncScroll] = useState<boolean>(false);
  const [compareLayouts, setCompareLayouts] = useState<boolean>(false);
  const [gridCols, setGridCols] = useState<1 | 2 | 3>(3);
  const [visibleEngines, setVisibleEngines] = useState<string[]>(() =>
    engines.map(e => e.id as string)
  );
  const [selectedCrop, setSelectedCrop] = useState<{ engineId: string; block: any; cropUrl: string } | null>(null);
  const [cropModeActive, setCropModeActive] = useState<boolean>(false);
  const [cropSelection, setCropSelection] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [showEngineFilter, setShowEngineFilter] = useState<boolean>(false);
  const [showLayoutFilter, setShowLayoutFilter] = useState<boolean>(false);
  const [activeExportDropdown, setActiveExportDropdown] = useState<string | null>(null);

  // Batch states
  const [isBatchRunning, setIsBatchRunning] = useState<boolean>(false);
  const [batchStatus, setBatchStatus] = useState<'idle' | 'running' | 'paused' | 'completed' | 'cancelled'>('idle');
  const [batchCurrentIndex, setBatchCurrentIndex] = useState<number>(0);
  const [batchCurrentEngineIndex, setBatchCurrentEngineIndex] = useState<number>(0);
  const [batchSuccessCount, setBatchSuccessCount] = useState<number>(0);
  const [batchFailureCount, setBatchFailureCount] = useState<number>(0);
  const [batchStartTime, setBatchStartTime] = useState<number>(0);
  const [batchElapsedTime, setBatchElapsedTime] = useState<number>(0);
  const [batchResults, setBatchResults] = useState<Record<string, Record<string, 'pending' | 'processing' | 'done' | 'failed'>>>({});
  const [batchSize, setBatchSize] = useState<number>(1);
  const batchStatusRef = useRef<'idle' | 'running' | 'paused' | 'completed' | 'cancelled'>('idle');

  const engineFilterRef = useRef<HTMLDivElement>(null);
  const layoutFilterRef = useRef<HTMLDivElement>(null);

  // Redesign states
  const [selectedOverlayEngine, setSelectedOverlayEngine] = useState<string>("nemotron");
  const [overlayEngines, setOverlayEngines] = useState<string[]>(["nemotron"]);
  const [isLeftPanelExpanded, setIsLeftPanelExpanded] = useState<boolean>(true);
  const [isRightPanelExpanded, setIsRightPanelExpanded] = useState<boolean>(true);
  const [rightPanelTab, setRightPanelTab] = useState<"fields" | "markdown" | "json" | "metadata" | "arena" | "performance">("arena");
  const [latencyTarget, setLatencyTarget] = useState<number>(3.0);
  const [accuracyTarget, setAccuracyTarget] = useState<number>(90.0);

  // Analytics
  const [runs, setRuns] = useState<any[]>([]);
  const [backendStats, setBackendStats] = useState<any[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState<boolean>(false);
  const [selectedRunDetail, setSelectedRunDetail] = useState<any | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<any | null>(null);
  const [visibleLabels, setVisibleLabels] = useState<string[]>([
    "text", "header", "display_formula", "inline_formula", "table", "image", "number", "footer"
  ]);

  // Click outside handling
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (engineFilterRef.current && !engineFilterRef.current.contains(event.target as Node)) {
        setShowEngineFilter(false);
      }
      if (layoutFilterRef.current && !layoutFilterRef.current.contains(event.target as Node)) {
        setShowLayoutFilter(false);
      }
      const target = event.target as HTMLElement;
      if (target && typeof target.closest === "function" && !target.closest('[id^="export-container-"]')) {
        setActiveExportDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Theme & token load on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const initialTheme = savedTheme || "light";
    setTheme(initialTheme);
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    if (sessionStorage.getItem("do_pfm_token") === "demo") {
      setIsAuthenticated(true);
    } else {
      const params = new URLSearchParams(window.location.search);
      if (params.get("token") === "demo") {
        setIsAuthenticated(true);
        sessionStorage.setItem("do_pfm_token", "demo");
      }
    }
  }, []);

  // Load image dimensions
  useEffect(() => {
    if (selectedImage) {
      const img = new window.Image();
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height });
      };
      img.src = selectedImage;
    } else {
      setImageDimensions(null);
    }
  }, [selectedImage]);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return {
    isAuthenticated, setIsAuthenticated,
    tokenInput, setTokenInput,
    loginError, setLoginError,
    theme, setTheme,
    selectedImage, setSelectedImage,
    selectedFilename, setSelectedFilename,
    isCustomUpload, setIsCustomUpload,
    selectedPageIndex, setSelectedPageIndex,
    showGallery, setShowGallery,
    isRunning, setIsRunning,
    results, setResults,
    activeCompareTab, setActiveCompareTab,
    activeTab, setActiveTab,
    compareMode, setCompareMode,
    showDiffs, setShowDiffs,
    splitDiff, setSplitDiff,
    diffBaseline, setDiffBaseline,
    searchQuery, setSearchQuery,
    showGroundTruth, setShowGroundTruth,
    groundTruth, setGroundTruth,
    visualColorMode, setVisualColorMode,
    heatmapMetric, setHeatmapMetric,
    confidenceThreshold, setConfidenceThreshold,
    globalFontSize, setGlobalFontSize,
    globalWordWrap, setGlobalWordWrap,
    cardWordWrap, setCardWordWrap,
    showPerformanceMatrix, setShowPerformanceMatrix,
    cardFontSizes, setCardFontSizes,
    cardLineHeights, setCardLineHeights,
    zoom, setZoom,
    pan, setPan,
    isDragging, setIsDragging,
    dragStart, setDragStart,
    hoveredBlock, setHoveredBlock,
    highlightedBlock, setHighlightedBlock,
    syncScroll, setSyncScroll,
    compareLayouts, setCompareLayouts,
    gridCols, setGridCols,
    visibleEngines, setVisibleEngines,
    selectedCrop, setSelectedCrop,
    cropModeActive, setCropModeActive,
    cropSelection, setCropSelection,
    showEngineFilter, setShowEngineFilter,
    showLayoutFilter, setShowLayoutFilter,
    activeExportDropdown, setActiveExportDropdown,
    isBatchRunning, setIsBatchRunning,
    batchStatus, setBatchStatus,
    batchCurrentIndex, setBatchCurrentIndex,
    batchCurrentEngineIndex, setBatchCurrentEngineIndex,
    batchSuccessCount, setBatchSuccessCount,
    batchFailureCount, setBatchFailureCount,
    batchStartTime, setBatchStartTime,
    batchElapsedTime, setBatchElapsedTime,
    batchResults, setBatchResults,
    batchSize, setBatchSize,
    batchStatusRef,
    engineFilterRef,
    layoutFilterRef,
    selectedOverlayEngine, setSelectedOverlayEngine,
    overlayEngines, setOverlayEngines,
    isLeftPanelExpanded, setIsLeftPanelExpanded,
    isRightPanelExpanded, setIsRightPanelExpanded,
    rightPanelTab, setRightPanelTab,
    latencyTarget, setLatencyTarget,
    accuracyTarget, setAccuracyTarget,
    runs, setRuns,
    backendStats, setBackendStats,
    loadingAnalytics, setLoadingAnalytics,
    selectedRunDetail, setSelectedRunDetail,
    imageDimensions, setImageDimensions,
    activeTooltip, setActiveTooltip,
    visibleLabels, setVisibleLabels,
    toggleTheme
  };
}
