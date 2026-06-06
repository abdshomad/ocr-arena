import React from "react";
import { engines, ResultsMap } from "../utils/ocrConstants";

export function useArenaHandlers(
  state: {
    isAuthenticated: boolean;
    activeTab: string;
    setLoadingAnalytics: (l: boolean) => void;
    setRuns: (runs: any[]) => void;
    setBackendStats: (stats: any[]) => void;
    setSelectedRunDetail: (run: any) => void;
    setActiveTab: (tab: string) => void;
    setShowGallery: (show: boolean) => void;
    isRunning: boolean;
    setIsRunning: (run: boolean) => void;
    setSelectedImage: (img: string | null) => void;
    setSelectedFilename: (fn: string) => void;
    setIsCustomUpload: (custom: boolean) => void;
    setSelectedPageIndex: (idx: number) => void;
    setResults: React.Dispatch<React.SetStateAction<ResultsMap>>;
    selectedImage: string | null;
    imageDimensions: { width: number; height: number } | null;
    setSelectedCrop: (crop: any) => void;
    syncScroll: boolean;
  },
  scrollContainersRef: React.MutableRefObject<Record<string, HTMLDivElement | null>>,
  isSyncingScrollRef: React.MutableRefObject<boolean>
) {
  const fetchAnalytics = async () => {
    state.setLoadingAnalytics(true);
    try {
      const [runsRes, statsRes] = await Promise.all([
        fetch("/api/arena?limit=100"),
        fetch("/api/arena?action=stats")
      ]);
      if (runsRes.ok && statsRes.ok) {
        const runsData = await runsRes.json();
        const statsData = await statsRes.json();
        state.setRuns(runsData.runs || []);
        state.setBackendStats(statsData.stats || []);
      }
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      state.setLoadingAnalytics(false);
    }
  };

  const fetchRunDetail = async (runId: number) => {
    try {
      const res = await fetch(`/api/arena?runId=${runId}`);
      if (res.ok) {
        const data = await res.json();
        state.setSelectedRunDetail(data.run);
      }
    } catch (err) {
      console.error("Failed to load run detail:", err);
    }
  };

  const runArenaCompare = async (imageSource: string, filename: string, customUpload = false) => {
    state.setActiveTab("compare");
    state.setShowGallery(false);
    if (state.isRunning) return;
    state.setIsRunning(true);
    state.setSelectedImage(imageSource);
    state.setSelectedFilename(filename);
    state.setIsCustomUpload(customUpload);
    state.setSelectedPageIndex(0);

    const initialResults = engines.reduce((acc, e) => {
      acc[e.id] = { status: "pending", text: "", time: 0 };
      return acc;
    }, {} as any) as ResultsMap;
    state.setResults(initialResults);

    for (const engine of engines) {
      state.setResults(prev => ({
        ...prev,
        [engine.id]: { ...prev[engine.id], status: "processing" }
      }));

      try {
        const res = await fetch("/api/arena", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ engine: engine.id, image: imageSource })
        });
        
        if (!res.ok) {
          throw new Error(`Status ${res.status}`);
        }
        
        const data = await res.json();
        
        if (data.success) {
          state.setResults(prev => ({
            ...prev,
            [engine.id]: {
              status: "done",
              text: data.text,
              time: data.elapsedMs,
              rawResult: data.rawResult
            }
          }));
        } else {
          state.setResults(prev => ({
            ...prev,
            [engine.id]: {
              status: "failed",
              text: data.error || "Failed to process",
              time: 0
            }
          }));
        }
      } catch (err: any) {
        state.setResults(prev => ({
          ...prev,
          [engine.id]: {
            status: "failed",
            text: err.message || "Network error",
            time: 0
          }
        }));
      }
    }
    state.setIsRunning(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64Str = reader.result as string;
      runArenaCompare(base64Str, file.name, true);
    };
    reader.readAsDataURL(file);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    const btn = document.getElementById(`copy-btn-${id}`);
    if (btn) {
      const origText = btn.innerHTML;
      btn.innerHTML = "Copied! ✓";
      btn.classList.add("text-emerald-400");
      setTimeout(() => {
        btn.innerHTML = origText;
        btn.classList.remove("text-emerald-400");
      }, 2000);
    }
  };

  const handleBlockClick = (engineId: string, block: any, rectCoords: [number, number, number, number]) => {
    if (!state.selectedImage) return;

    const targetId = `block-${engineId}-${block.block_id}`;
    const blockElement = document.getElementById(targetId);
    if (blockElement) {
      blockElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    
    const [xmin, ymin, xmax, ymax] = rectCoords;
    const width = xmax - xmin;
    const height = ymax - ymin;
    
    if (width <= 0 || height <= 0) return;

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        let actualX = xmin;
        let actualY = ymin;
        let actualW = width;
        let actualH = height;
        
        if (engineId === "deepseek") {
          const scaleX = img.naturalWidth / 1000;
          const scaleY = img.naturalHeight / 1000;
          actualX = xmin * scaleX;
          actualY = ymin * scaleY;
          actualW = width * scaleX;
          actualH = height * scaleY;
        } else if (state.imageDimensions) {
          const scaleX = img.naturalWidth / state.imageDimensions.width;
          const scaleY = img.naturalHeight / state.imageDimensions.height;
          actualX = xmin * scaleX;
          actualY = ymin * scaleY;
          actualW = width * scaleX;
          actualH = height * scaleY;
        }
        
        ctx.drawImage(img, actualX, actualY, actualW, actualH, 0, 0, width, height);
        try {
          const cropUrl = canvas.toDataURL();
          state.setSelectedCrop({
            engineId,
            block,
            cropUrl
          });
        } catch (e) {
          console.error("Canvas toDataURL failed:", e);
        }
      }
    };
    img.src = state.selectedImage;
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>, engineId: string) => {
    if (!state.syncScroll) return;
    if (isSyncingScrollRef.current) return;

    isSyncingScrollRef.current = true;
    const target = e.currentTarget;
    const scrollTop = target.scrollTop;

    Object.entries(scrollContainersRef.current).forEach(([id, container]) => {
      if (id !== engineId && container) {
        container.scrollTop = scrollTop;
      }
    });

    window.requestAnimationFrame(() => {
      isSyncingScrollRef.current = false;
    });
  };

  return {
    fetchAnalytics,
    fetchRunDetail,
    runArenaCompare,
    handleFileUpload,
    handleCopy,
    handleBlockClick,
    handleScroll
  };
}
