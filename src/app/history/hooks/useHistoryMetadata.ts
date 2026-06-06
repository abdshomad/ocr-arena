/* eslint-disable @typescript-eslint/no-explicit-any */
import { DocumentHistoryItem, getVendor, getDocType } from "../utils/historyHelpers";

export function useHistoryMetadata(state: any) {
  const {
    setInlineEditItem,
    inlineEditItem,
    setInlineVendor,
    inlineVendor,
    setInlineDocType,
    inlineDocType,
    setInlineCurrency,
    inlineCurrency,
    setSavingInlineTags,
    setHistoryList,
    previewItem,
    setPreviewItem,
    setSavingTags,
    editVendor,
    editDocType,
    editCurrency,
    selectedItems,
    setSelectedItems,
    setSavingBulkTags,
    bulkVendor,
    setBulkVendor,
    bulkDocType,
    setBulkDocType,
    bulkCurrency,
    setBulkCurrency,
    bulkCustomTag,
    setBulkCustomTag,
    setIsBulkEditOpen
  } = state;

  const handleOpenInlineEdit = (item: DocumentHistoryItem) => {
    setInlineEditItem(item);
    const currentVendor = getVendor(item);
    const currentDocType = getDocType(item);
    const currentCurrency = item.metadata?.currency || item.metadata?.Currency || "";
    setInlineVendor(currentVendor === "Unknown" ? "" : currentVendor);
    setInlineDocType(currentDocType === "Unknown" ? "Invoice" : currentDocType);
    setInlineCurrency(currentCurrency);
  };

  const handleSaveInlineTags = async () => {
    if (!inlineEditItem) return;
    setSavingInlineTags(true);
    try {
      const metadataUpdates = {
        vendorInfo: inlineVendor,
        documentType: inlineDocType,
        currency: inlineCurrency
      };

      const res = await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: inlineEditItem.filename,
          metadataUpdates
        })
      });

      if (res.ok) {
        setHistoryList((prev: any[]) => prev.map(item => {
          if (item.filename === inlineEditItem.filename) {
            return {
              ...item,
              metadata: {
                ...(item.metadata || {}),
                ...metadataUpdates
              }
            };
          }
          return item;
        }));
        setInlineEditItem(null);
      } else {
        const err = await res.json();
        alert(`Failed to save tags: ${err.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Error saving tags:", err);
      alert("Failed to connect to server.");
    } finally {
      setSavingInlineTags(false);
    }
  };

  const handleSaveTags = async () => {
    if (!previewItem) return;
    setSavingTags(true);
    try {
      const metadataUpdates = {
        vendorInfo: editVendor,
        documentType: editDocType,
        currency: editCurrency
      };

      const res = await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: previewItem.filename,
          metadataUpdates
        })
      });

      if (res.ok) {
        setHistoryList((prev: any[]) => prev.map(item => {
          if (item.filename === previewItem.filename) {
            return {
              ...item,
              metadata: {
                ...(item.metadata || {}),
                ...metadataUpdates
              }
            };
          }
          return item;
        }));
        setPreviewItem((prev: any) => prev ? {
          ...prev,
          metadata: {
            ...(prev.metadata || {}),
            ...metadataUpdates
          }
        } : null);
      } else {
        const err = await res.json();
        alert(`Failed to save tags: ${err.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Error saving tags:", err);
      alert("Failed to connect to server.");
    } finally {
      setSavingTags(false);
    }
  };

  const handleSaveBulkTags = async () => {
    if (selectedItems.length === 0) return;
    setSavingBulkTags(true);
    try {
      const metadataUpdates: Record<string, any> = {};
      if (bulkVendor) metadataUpdates.vendorInfo = bulkVendor;
      if (bulkDocType && bulkDocType !== "Keep") metadataUpdates.documentType = bulkDocType;
      if (bulkCurrency) metadataUpdates.currency = bulkCurrency;
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
        setBulkVendor("");
        setBulkDocType("Keep");
        setBulkCurrency("");
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

  return {
    handleOpenInlineEdit,
    handleSaveInlineTags,
    handleSaveTags,
    handleSaveBulkTags
  };
}
