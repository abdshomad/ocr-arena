import { engines, ENGINE_PRICING, ZipFile, ResultsMap } from "./ocrConstants";
import { getFilteredText } from "./ocrHelpers";
import { createZipBlob } from "./zipUtils";

export function handleExportSingle(
  engineId: string,
  format: "md" | "json" | "html" | "txt",
  rawResult: any,
  defaultText: string,
  selectedPageIndex: number,
  selectedFilename: string,
  visibleLabels: string[]
) {
  const engine = engines.find(e => e.id === engineId);
  if (!engine) return;

  const pageTextRaw = rawResult?.layoutParsingResults?.[selectedPageIndex]?.markdown?.text || defaultText || "";
  const pageText = getFilteredText(rawResult, pageTextRaw, visibleLabels, selectedPageIndex);
  const latencySec = (rawResult?.time_elapsed_ms || 0) > 0 ? (rawResult.time_elapsed_ms / 1000).toFixed(3) : "0.000";

  let content = "";
  let mimeType = "text/plain";
  const extension = format;

  if (format === "md") {
    mimeType = "text/markdown";
    content = `# OCR Output - ${engine.name} (Page ${selectedPageIndex + 1})\n` +
      `- **Source File**: ${selectedFilename || "Uploaded Image"}\n` +
      `- **Engine**: ${engine.name}\n` +
      `- **Latency**: ${latencySec}s\n\n` +
      `---\n\n` +
      `${pageText}\n`;
  } else if (format === "json") {
    mimeType = "application/json";
    content = JSON.stringify(rawResult || {}, null, 2);
  } else if (format === "html") {
    mimeType = "text/html";
    content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OCR Output - ${engine.name} (Page ${selectedPageIndex + 1})</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 40px auto;
      padding: 0 20px;
      background-color: #f8fafc;
    }
    .container {
      background: #ffffff;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      border: 1px solid #e2e8f0;
    }
    h1 {
      font-size: 24px;
      color: #0f172a;
      margin-top: 0;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 12px;
    }
    .metadata {
      font-size: 13px;
      color: #64748b;
      margin-bottom: 24px;
      background: #f1f5f9;
      padding: 12px;
      border-radius: 8px;
    }
    .metadata p {
      margin: 4px 0;
    }
    .content {
      font-family: inherit;
      white-space: pre-wrap;
      word-break: break-word;
      color: #1e293b;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>OCR Output - ${engine.name}</h1>
    <div class="metadata">
      <p><strong>Source File:</strong> ${selectedFilename || "Uploaded Image"}</p>
      <p><strong>Page:</strong> ${selectedPageIndex + 1}</p>
      <p><strong>Engine:</strong> ${engine.name}</p>
      <p><strong>Latency:</strong> ${latencySec}s</p>
    </div>
    <div class="content">${pageText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
  </div>
</body>
</html>`;
  } else {
    mimeType = "text/plain";
    content = pageText;
  }

  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const baseName = selectedFilename ? selectedFilename.replace(/\.[^/.]+$/, "") : "ocr_output";
  link.href = url;
  link.download = `${baseName}_${engineId}_page${selectedPageIndex + 1}.${extension}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function handleExportZip(
  results: ResultsMap,
  selectedFilename: string,
  selectedPageIndex: number,
  visibleLabels: string[]
) {
  const zipFiles: ZipFile[] = [];
  let csvContent = "Engine ID,Engine Name,Status,Latency (s),Character Count\n";
  
  engines.forEach((engine) => {
    const res = results[engine.id];
    const hasText = res.status === "done";
    const latencySec = res.time > 0 ? (res.time / 1000).toFixed(3) : "0.000";
    const charCount = res.text ? res.text.length : 0;
    
    csvContent += `"${engine.id}","${engine.name}","${res.status}",${latencySec},${charCount}\n`;
    
    if (hasText) {
      const pageTextRaw = res.rawResult?.layoutParsingResults?.[selectedPageIndex]?.markdown?.text || res.text || "";
      const pageText = getFilteredText(res.rawResult, pageTextRaw, visibleLabels, selectedPageIndex);
      
      const fileContent = `# OCR Output for ${engine.name}\n` +
        `* Source Image: ${selectedFilename || "unknown"}\n` +
        `* Status: ${res.status}\n` +
        `* Latency: ${latencySec}s\n` +
        `* Character Count: ${charCount}\n\n` +
        `---\n\n` +
        `${pageText}\n`;
      zipFiles.push({
        name: `${engine.id}_ocr_output.md`,
        content: fileContent
      });
    }
  });
  
  zipFiles.push({
    name: "comparison_summary.csv",
    content: csvContent
  });
  
  const zipBlob = createZipBlob(zipFiles);
  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement("a");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  link.href = url;
  link.download = `ocr_arena_export_${timestamp}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
