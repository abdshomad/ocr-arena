/* eslint-disable @typescript-eslint/no-explicit-any */
import { DocumentHistoryItem } from "../utils/historyHelpers";

export function useHistoryMetadata(state: any) {
  const {
    setHistoryList, previewItem, setPreviewItem,
    selectedItems, setSelectedItems, setSavingBulkTags,
    bulkCustomTag, setBulkCustomTag,
    setIsBulkEditOpen
  } = state;

  const handleSaveBulkTags = async () => {
    if (selectedItems.length === 0) return;
    setSavingBulkTags(true);
    try {
      const metadataUpdates: Record<string, any> = {};
      if (bulkCustomTag) {
        metadataUpdates.tags = bulkCustomTag.split(",").map((t: string) => t.trim()).filter(Boolean);
      }

      const res = await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filenames: selectedItems,
          metadataUpdates
        })
      });

      if (res.ok) {
        setHistoryList((prev: any[]) => prev.map(item => {
          if (selectedItems.includes(item.filename)) {
            const oldMetadata = item.metadata || {};
            const newTags = metadataUpdates.tags !== undefined 
              ? metadataUpdates.tags 
              : oldMetadata.tags;
              
            return {
              ...item,
              metadata: {
                ...oldMetadata,
                ...metadataUpdates,
                ...(newTags !== undefined ? { tags: newTags } : {})
              }
            };
          }
          return item;
        }));
        
        setIsBulkEditOpen(false);
        setBulkCustomTag("");
        setSelectedItems([]); // Clear selection
      } else {
        const err = await res.json();
        alert(`Failed to save bulk tags: ${err.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Error saving bulk tags:", err);
      alert("Failed to connect to server.");
    } finally {
      setSavingBulkTags(false);
    }
  };

  const onSubmitFeedback = async (
    filename: string,
    engine: string,
    updates: {
      isAccurate?: boolean | null;
      isLoved?: boolean | null;
      ratingStars?: number | null;
      ocrRemarks?: string | null;
      isFast?: boolean | null;
    }
  ) => {
    // 1. Optimistic UI update in the list
    setHistoryList((prev: any[]) => prev.map(item => {
      if (item.filename === filename && item.engine === engine) {
        const nextItem = { ...item };
        if (updates.isAccurate !== undefined) nextItem.isAccurate = updates.isAccurate;
        if (updates.isLoved !== undefined) nextItem.isLoved = updates.isLoved;
        if (updates.ratingStars !== undefined) nextItem.ratingStars = updates.ratingStars;
        if (updates.ocrRemarks !== undefined) nextItem.ocrRemarks = updates.ocrRemarks;
        if (updates.isFast !== undefined) nextItem.isFast = updates.isFast;
        return nextItem;
      }
      return item;
    }));

    // 2. Optimistic UI update for the preview item
    setPreviewItem((prev: any) => {
      if (prev && prev.filename === filename && prev.engine === engine) {
        const nextItem = { ...prev };
        if (updates.isAccurate !== undefined) nextItem.isAccurate = updates.isAccurate;
        if (updates.isLoved !== undefined) nextItem.isLoved = updates.isLoved;
        if (updates.ratingStars !== undefined) nextItem.ratingStars = updates.ratingStars;
        if (updates.ocrRemarks !== undefined) nextItem.ocrRemarks = updates.ocrRemarks;
        if (updates.isFast !== undefined) nextItem.isFast = updates.isFast;
        return nextItem;
      }
      return prev;
    });

    try {
      await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "feedback",
          filename,
          engine,
          ...updates
        })
      });
    } catch (err) {
      console.error("Failed to submit feedback:", err);
    }
  };

  return {
    handleSaveBulkTags,
    onSubmitFeedback
  };
}
