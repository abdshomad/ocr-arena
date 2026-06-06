import { DocumentHistoryItem, formatBytes, getDocType, getVendor, escapeHtml } from "./historyHelpers";
import { reportStyles } from "./htmlReportStyles";

export function handleExportHTMLReport(selectedItems: string[], historyList: DocumentHistoryItem[]) {
  if (selectedItems.length === 0) return;

  const selectedRuns = historyList.filter(item => selectedItems.includes(item.filename));

  const grouped: Record<string, DocumentHistoryItem[]> = {};
  selectedRuns.forEach(run => {
    if (!grouped[run.filename]) {
      grouped[run.filename] = [];
    }
    grouped[run.filename].push(run);
  });

  const docEntries = Object.entries(grouped);

  let htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OCR Arena - Standalone Comparison Report</title>
  <style>
    ${reportStyles}
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>OCR Arena - Offline Comparison Report</h1>
      <div class="subtitle">Generated on ${new Date().toLocaleString()} | Standalone offline comparison of selected OCR processing runs.</div>
      <div class="stats-bar">
        <span class="stats-item">Selected Documents: <strong>${docEntries.length}</strong></span>
        <span class="stats-item">Total Engine Runs: <strong>${selectedRuns.length}</strong></span>
      </div>
    </header>

    <main>
`;

  docEntries.forEach(([filename, runs]) => {
    const cleanName = filename.length > 13 ? filename.substring(13) : filename;
    const firstRun = runs[0];
    const fileSizeStr = formatBytes(firstRun.size);
    const docType = getDocType(firstRun);
    const vendor = getVendor(firstRun);
    const currency = firstRun.metadata?.currency || firstRun.metadata?.Currency || "N/A";
    const tags: string[] = firstRun.metadata?.tags || firstRun.metadata?.Tags || [];

    htmlContent += `
    <!-- Document Card -->
    <div class="document-card">
      <div class="document-header">
        <div>
          <h2 class="document-title">${cleanName}</h2>
          <div class="document-meta">
            <span>Size: <strong>${fileSizeStr}</strong></span>
            <span>Type: <strong>${docType}</strong></span>
            <span>Vendor: <strong>${vendor}</strong></span>
            <span>Currency: <strong>${currency}</strong></span>
            <span>Uploaded: <strong>${new Date(firstRun.uploadTime).toLocaleString()}</strong></span>
          </div>
          ${tags.length > 0 ? `
          <div style="margin-top: 10px;">
            ${tags.map(t => `<span class="badge badge-teal" style="margin-right: 6px;">${t}</span>`).join("")}
          </div>` : ""}
        </div>
      </div>

      <h3 style="font-size: 0.95rem; font-weight: 700; color: var(--text-muted); margin-bottom: 12px;">Metrics Overview</h3>
      <div class="summary-table-wrapper">
        <table class="summary-table">
          <thead>
            <tr>
              <th>Engine</th>
              <th>Status</th>
              <th>Latency (ms)</th>
              <th>Estimated Cost ($)</th>
              <th>Word Count</th>
            </tr>
          </thead>
          <tbody>
    `;

    runs.forEach(run => {
      const latencyStr = run.latency ? `${run.latency} ms` : "N/A";
      const isSuccess = run.parsed;
      const statusBadge = isSuccess 
        ? `<span class="badge badge-emerald">Success</span>`
        : `<span class="badge badge-rose">Failed</span>`;
      
      let costStr = "N/A";
      const text = run.ocrText || "";
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      
      if (run.engine === "paddleocr") costStr = "$0.0000";
      else if (run.engine === "nemotron") costStr = "$0.0015";
      else if (run.engine === "deepseek-ocr-2") costStr = "$0.0020";
      else if (run.engine === "lighton-ocr-2-1b") costStr = "$0.0010";
      else if (run.engine === "dots-ocr") costStr = "$0.0025";
      else if (run.engine === "glm-ocr") costStr = "$0.0018";
      else if (run.engine === "llama3-vision") costStr = "$0.0030";

      htmlContent += `
            <tr>
              <td style="font-weight: 700; color: #f1f5f9;">${run.engine}</td>
              <td>${statusBadge}</td>
              <td style="font-family: monospace;">${latencyStr}</td>
              <td style="font-family: monospace;">${costStr}</td>
              <td style="font-family: monospace;">${wordCount}</td>
            </tr>
      `;
    });

    htmlContent += `
          </tbody>
        </table>
      </div>

      <h3 style="font-size: 0.95rem; font-weight: 700; color: var(--text-muted); margin-bottom: 16px;">OCR Text Comparison</h3>
      <div class="comparison-grid">
    `;

    runs.forEach(run => {
      const textContent = run.ocrText || "(No OCR text parsed or run failed)";
      const words = textContent.split(/\s+/).filter(Boolean).length;
      
      htmlContent += `
        <div class="engine-card">
          <div class="engine-header">
            <span class="engine-name">${run.engine}</span>
            <span class="engine-badge">${words} words</span>
          </div>
          <div class="engine-metrics">
            <span class="metric-item">Latency: <strong>${run.latency ? `${run.latency} ms` : "N/A"}</strong></span>
          </div>
          <div class="ocr-output-container">${escapeHtml(textContent)}</div>
        </div>
      `;
    });

    htmlContent += `
      </div>
    </div>
    `;
  });

  htmlContent += `
    </main>
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ocr_arena_comparison_report_${new Date().toISOString().split("T")[0]}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
