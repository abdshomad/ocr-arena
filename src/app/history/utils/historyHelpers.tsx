/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";

export interface DocumentHistoryItem {
  id: number;
  filename: string;
  uploadTime: string;
  size: number;
  parsed: boolean;
  isSample: boolean;
  metadata: Record<string, any> | null;
  engine: string;
  ocrText?: string;
  latency?: number | null;
}

export const ENGINES = [
  { id: "paddleocr", name: "PaddleOCR-VL-1.6 (0.9B)", logo: "🏓" },
  { id: "nemotron", name: "NVIDIA Nemotron OCR v2", logo: "🟢" },
  { id: "deepseek-ocr-2", name: "DeepSeek-OCR-2", logo: "🐳" },
  { id: "lighton-ocr-2-1b", name: "LightOnOCR-2-1B", logo: "⚡" },
  { id: "dots-ocr", name: "Dots.OCR", logo: "⚫" },
  { id: "glm-ocr", name: "GLM-OCR", logo: "🧠" },
  { id: "llama3-vision", name: "Llama-3.2-Vision (11B)", logo: "🦙" },
  { id: "deepseek-vl2", name: "DeepSeek-VL2 (Tiny)", logo: "🐠" }
];

export function highlightText(text: string, query: string, isRegex = false): React.ReactNode | string {
  if (!query) return text;
  
  let regex: RegExp;
  if (isRegex) {
    try {
      regex = new RegExp(`(${query})`, "gi");
    } catch {
      const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      regex = new RegExp(`(${escapedQuery})`, "gi");
    }
  } else {
    const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    regex = new RegExp(`(${escapedQuery})`, "gi");
  }

  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, index) => 
        regex.test(part) ? (
          <mark key={index} className="bg-yellow-500/35 text-slate-900 dark:text-slate-105 px-0.5 rounded font-semibold dark:bg-yellow-500/25">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export function formatBytes(bytes: number, decimals = 2) {
  if (!bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return dateStr;
  }
}

export const getVendor = (item: DocumentHistoryItem) => {
  if (!item.metadata || typeof item.metadata !== "object") return "Unknown";
  const meta = item.metadata;
  const raw = meta.vendorInfo || meta["Vendor Info"] || meta.vendor || meta["Vendor"] || "";
  const clean = String(raw).trim();
  if (!clean || clean.toLowerCase() === "not found" || clean.toLowerCase() === "not_found") {
    return "Unknown";
  }
  return clean.replace(/\b\w/g, (c) => c.toUpperCase());
};

export const getDocType = (item: DocumentHistoryItem) => {
  if (!item.metadata || typeof item.metadata !== "object") return "Unknown";
  const meta = item.metadata;
  
  if (meta.documentType || meta["Document Type"] || meta.docType) {
    const raw = meta.documentType || meta["Document Type"] || meta.docType;
    return String(raw).trim().replace(/\b\w/g, (c) => c.toUpperCase());
  }

  const hasDo = !!(meta.noDo || meta["No DO"] || meta.deliveryOrder || meta.doNumber);
  const hasPo = !!(meta.noPo || meta["No PO"] || meta.purchaseOrder || meta.poNumber);
  const hasSo = !!(meta.noSo || meta["No SO"] || meta.salesOrder || meta.soNumber);
  if (hasPo) return "Purchase Order";
  if (hasDo) return "Delivery Order";
  if (hasSo) return "Sales Order";
  
  const name = item.filename.toLowerCase();
  if (name.includes("invoice") || name.includes("faktur") || name.includes("inv")) return "Invoice";
  if (name.includes("receipt") || name.includes("struk") || name.includes("rcpt")) return "Receipt";
  
  return "Receipt";
};

export const getLocalDateString = (dateStr: string) => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function escapeHtml(unsafe: string) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
