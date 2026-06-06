import { allLabels } from "./ocrConstants";

export const getFilteredText = (rawResult: any, defaultText: string, visibleLabels: string[], selectedPageIndex: number) => {
  const pageResult = rawResult?.layoutParsingResults?.[selectedPageIndex] || rawResult || {};
  const blocks = pageResult.prunedResult?.parsing_res_list || pageResult.parsing_res_list;
  if (Array.isArray(blocks) && blocks.length > 0) {
    return blocks
      .filter((b: any) => visibleLabels.includes(b.block_label || "text"))
      .map((b: any) => b.block_content || "")
      .join("\n\n");
  }
  return defaultText;
};

export const getVendor = (run: any) => {
  const meta = run.doc_metadata;
  if (!meta || typeof meta !== "object") return "Unknown";
  const raw = meta.vendorInfo || meta["Vendor Info"] || meta.vendor || meta["Vendor"] || "";
  const clean = String(raw).trim();
  if (!clean || clean.toLowerCase() === "not found" || clean.toLowerCase() === "not_found") {
    return "Unknown";
  }
  return clean.replace(/\b\w/g, (c) => c.toUpperCase());
};

export const getDocType = (run: any) => {
  const meta = run.doc_metadata;
  if (!meta || typeof meta !== "object") return "Unknown";
  
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
  
  const name = (run.image_path || "").toLowerCase();
  if (name.includes("invoice") || name.includes("faktur") || name.includes("inv")) return "Invoice";
  if (name.includes("receipt") || name.includes("struk") || name.includes("rcpt")) return "Receipt";
  
  return "Receipt";
};

export const getErrorCategory = (errorMsg: string): "OOM" | "Timeout" | "Network" | "General" => {
  const msg = (errorMsg || "").toLowerCase();
  if (msg.includes("oom") || msg.includes("out of memory") || msg.includes("allocation") || msg.includes("cuda")) {
    return "OOM";
  }
  if (msg.includes("timeout") || msg.includes("deadline") || msg.includes("timed out") || msg.includes("time out")) {
    return "Timeout";
  }
  if (msg.includes("network") || msg.includes("fetch") || msg.includes("connection") || msg.includes("connect") || msg.includes("status 500") || msg.includes("http") || msg.includes("bad gateway") || msg.includes("service unavailable") || msg.includes("socket") || msg.includes("proxy") || msg.includes("backend pipeline error")) {
    return "Network";
  }
  return "General";
};
