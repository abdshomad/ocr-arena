import { Item, parseTableItems } from "./tableParser";

function cleanFinalValue(val: string, preserveNewlines = false): string {
  if (!val) return "Not Found";
  const cleaned = val.replace(/<[^>]*>/g, "");
  if (preserveNewlines) {
    return cleaned.split("\n").map(line => line.trim()).filter(Boolean).join("\n") || "Not Found";
  } else {
    return cleaned.replace(/\s+/g, " ").trim() || "Not Found";
  }
}

export function parseDOMetadata(markdown: string) {
  const metadata = {
    vendorInfo: "Not Found",
    customerInfo: "Not Found",
    tanggal: "Not Found",
    noSO: "Not Found",
    noDO: "Not Found",
    noPO: "Not Found",
    items: [] as Item[]
  };

  if (!markdown) return metadata;

  // Create a clean version of the markdown for text parsing
  const cleanMarkdown = markdown
    .replace(/<\/tr>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]*>/g, " ");

  const lines = cleanMarkdown.split("\n").map(l => l.trim()).filter(Boolean);

  // Extract Vendor Info (e.g., PT. CHAROEN ROKPHAND INDONESIA TBK, address lines, etc.)
  const vendorStop = /(?:no\.?\s*(?:so|do|po)|tanggal|date|Kepada|Yth|Customer|Deliver|Order\s+Untuk|#|\d{2}:\d{2}:\d{2})/i;
  const vendorStartIndex = lines.findIndex(line => 
    /PT\./i.test(line) && !/(?:Kepada|Yth|Customer|Deliver|Order\s+Untuk|Alamat|no\.?\s*(?:so|do|po)|tanggal|date)/i.test(line)
  );
  if (vendorStartIndex !== -1) {
    const vendorLines: string[] = [lines[vendorStartIndex]];
    for (let i = vendorStartIndex + 1; i < Math.min(lines.length, vendorStartIndex + 4); i++) {
      if (vendorStop.test(lines[i])) break;
      vendorLines.push(lines[i]);
    }
    metadata.vendorInfo = vendorLines.join("\n");
  } else {
    // Fallback using match if lines indexing didn't work
    const vendorMatch = cleanMarkdown.match(/(PT\.\s*CHAROEN[^\n]*)/i) || cleanMarkdown.match(/(PT\.[^\n]+)/i);
    if (vendorMatch) metadata.vendorInfo = vendorMatch[1].trim();
  }

  // Extract Customer Info (e.g., Kepada Yth : PT.PRIMAFOOD INTERNATIONAL)
  const customerStop = /(?:no\.?\s*(?:so|do|po)|tanggal|date|#|\d{2}:\d{2}:\d{2})/i;
  let customerStartIndex = lines.findIndex(line => 
    /(?:Kepada Yth|Yth|Customer|Deliver To)\s*[:\-]/i.test(line) || /PT\.\s*PRIMAFOOD/i.test(line)
  );
  if (customerStartIndex === -1) {
    // Fallback: search for a secondary PT. line
    const ptIndices = lines.map((l, idx) => l.toUpperCase().includes("PT.") ? idx : -1).filter(idx => idx !== -1);
    // Ensure the secondary PT line is not the vendor line
    const secondaryIndices = ptIndices.filter(idx => idx !== vendorStartIndex);
    if (secondaryIndices.length > 0) {
      customerStartIndex = secondaryIndices[0];
    }
  }

  if (customerStartIndex !== -1) {
    const customerLines: string[] = [lines[customerStartIndex]];
    for (let i = customerStartIndex + 1; i < Math.min(lines.length, customerStartIndex + 4); i++) {
      if (customerStop.test(lines[i])) break;
      customerLines.push(lines[i]);
    }
    metadata.customerInfo = customerLines.join("\n");
  } else {
    const customerMatch = cleanMarkdown.match(/(?:Kepada Yth|Yth|Customer|Deliver To)[ \t]*[:\-][ \t]*([^\n]+)/i) || cleanMarkdown.match(/(PT\.[ \t]*PRIMAFOOD[^\n]*)/i);
    if (customerMatch) metadata.customerInfo = customerMatch[1].trim();
  }

  // Extract Tanggal (Date)
  const tanggalMatch = cleanMarkdown.match(/Tanggal[ \t]*[:\-][ \t]*([^\n]+)/i) || cleanMarkdown.match(/(?:Date|D\.O\.[ \t]*Date)[ \t]*[:\- \t]*([\d\-\/A-Za-z \t]+)/i);
  if (tanggalMatch) metadata.tanggal = tanggalMatch[1].trim();

  // Extract No. SO
  const soMatch = cleanMarkdown.match(/(?:No\.?[ \t]*SO|SO[ \t]*No\.?)[ \t]*[:\-][ \t]*([A-Z0-9\-]+)/i);
  if (soMatch) metadata.noSO = soMatch[1].trim();

  // Extract No. DO
  const doMatch = cleanMarkdown.match(/(?:No\.?[ \t]*DO|Delivery Order[ \t]*No|D\.O\.[ \t]*No|Order[ \t]*No)[ \t]*[:\- \t]*([A-Z0-9\-]+)/i);
  if (doMatch) metadata.noDO = doMatch[1].trim();

  // Extract No. PO
  const poMatch = cleanMarkdown.match(/(?:No\.?[ \t]*PO|PO[ \t]*No\.?)[ \t]*[:\-][ \t]*([A-Z0-9\-\/]+)/i);
  if (poMatch) metadata.noPO = poMatch[1].trim();

  // Clean final values
  metadata.vendorInfo = cleanFinalValue(metadata.vendorInfo, true);
  metadata.customerInfo = cleanFinalValue(metadata.customerInfo, true);
  metadata.tanggal = cleanFinalValue(metadata.tanggal);
  metadata.noSO = cleanFinalValue(metadata.noSO);
  metadata.noDO = cleanFinalValue(metadata.noDO);
  metadata.noPO = cleanFinalValue(metadata.noPO);

  // Parse HTML tables for items
  metadata.items = parseTableItems(markdown);

  return metadata;
}
