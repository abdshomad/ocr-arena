/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { formatDate } from "../utils/historyHelpers";
import { handleExportHTMLReport as exportHTMLReport } from "../utils/htmlReportExport";

export function useHistoryExport(state: any, fetchHistory: () => Promise<void>) {
  const {
    selectedItems,
    historyList,
    setRestoringBackup,
    fileInputRef,
    setExportingZip
  } = state;

  const handleExportCSV = (filteredHistory: any[]) => {
    let csvContent = "Scan Date,Filename,Size (bytes),Is Sample,OCR Engine,Parsed Status,Customer Info,Vendor Info,No DO,No PO,No SO\n";
    filteredHistory.forEach((item) => {
      const date = formatDate(item.uploadTime);
      const cleanFilename = item.filename;
      const size = item.size;
      const isSample = item.isSample ? "Sample" : "Upload";
      const engine = item.engine || "";
      const parsedStatus = item.parsed ? "parsed" : "failed";
      
      const meta = item.metadata || {};
      const customerInfo = meta.customerInfo || meta["Customer Info"] || "";
      const vendorInfo = meta.vendorInfo || meta["Vendor Info"] || "";
      const noDo = meta.noDo || meta["No DO"] || "";
      const noPo = meta.noPo || meta["No PO"] || "";
      const noSo = meta.noSo || meta["No SO"] || "";
      
      const row = [
        date,
        cleanFilename,
        size,
        isSample,
        engine,
        parsedStatus,
        customerInfo,
        vendorInfo,
        noDo,
        noPo,
        noSo
      ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(",");
      
      csvContent += row + "\n";
    });
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ocr_history_export_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBackupExport = async () => {
    try {
      const res = await fetch("/api/history?backup=true");
      if (!res.ok) throw new Error("Failed to export backup");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ocr_arena_backup_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      alert(`Failed to export backup: ${err.message}`);
    }
  };

  const handleRestoreImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmRestore = window.confirm(
      "Are you sure you want to restore scan history from this backup? Existing documents with matching names and engines will be updated."
    );
    if (!confirmRestore) {
      e.target.value = "";
      return;
    }

    setRestoringBackup(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const jsonText = event.target?.result as string;
          const backupData = JSON.parse(jsonText);

          const res = await fetch("/api/history", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "restore",
              backupData,
            }),
          });

          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || "Failed to restore backup");
          }

          const data = await res.json();
          alert(`Successfully restored ${data.count} database entries!`);
          
          await fetchHistory();
        } catch (err: any) {
          console.error(err);
          alert(`Error restoring backup: ${err.message}`);
        } finally {
          setRestoringBackup(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      };
      reader.readAsText(file);
    } catch (err: any) {
      console.error(err);
      alert(`Error reading backup file: ${err.message}`);
      setRestoringBackup(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleExportSelectedZIP = async () => {
    if (selectedItems.length === 0) return;
    setExportingZip(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      for (let idx = 0; idx < selectedItems.length; idx++) {
        const filename = selectedItems[idx];
        const item = historyList.find((h: any) => h.filename === filename);
        if (!item) continue;

        const folderName = `${idx + 1}_${filename.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_")}`;
        const folder = zip.folder(folderName);
        if (!folder) continue;

        folder.file("metadata.json", JSON.stringify(item.metadata || {}, null, 2));
        folder.file("ocr_result.md", item.ocrText || "");

        const imageUrl = item.isSample ? `/arena/${item.filename}` : `/api/files?file=${encodeURIComponent(item.filename)}`;
        try {
          const imgRes = await fetch(imageUrl);
          if (imgRes.ok) {
            const imgBlob = await imgRes.blob();
            folder.file(item.filename, imgBlob);
          } else {
            console.error(`Failed to fetch image for ${filename}`);
          }
        } catch (err) {
          console.error(`Error fetching image for ${filename}:`, err);
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ocr_arena_export_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export ZIP:", err);
      alert("Failed to generate ZIP archive.");
    } finally {
      setExportingZip(false);
    }
  };

  const handleExportHTMLReport = () => {
    exportHTMLReport(selectedItems, historyList);
  };

  return {
    handleExportCSV,
    handleBackupExport,
    handleRestoreImport,
    handleExportSelectedZIP,
    handleExportHTMLReport
  };
}
