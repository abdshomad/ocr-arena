export const reportStyles = `
  :root {
    --bg-color: #0b0f19;
    --card-bg: #111827;
    --text-main: #f9fafb;
    --text-muted: #9ca3af;
    --border-color: #1f2937;
    --teal-primary: #0d9488;
    --teal-hover: #0f766e;
    --emerald-badge: #064e3b;
    --emerald-text: #34d399;
    --badge-bg: #1f2937;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    background-color: var(--bg-color);
    color: var(--text-main);
    margin: 0;
    padding: 40px 20px;
    line-height: 1.6;
  }
  .container {
    max-width: 1280px;
    margin: 0 auto;
  }
  header {
    margin-bottom: 40px;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 24px;
  }
  h1 {
    font-size: 2.25rem;
    font-weight: 850;
    margin: 0 0 8px 0;
    letter-spacing: -0.025em;
    background: linear-gradient(to right, #06b6d4, #10b981);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .subtitle {
    color: var(--text-muted);
    font-size: 0.95rem;
    margin: 0;
  }
  .stats-bar {
    display: flex;
    gap: 24px;
    margin-top: 16px;
    font-size: 0.85rem;
    color: var(--text-muted);
  }
  .stats-item strong {
    color: var(--text-main);
  }
  .document-card {
    background-color: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    padding: 28px;
    margin-bottom: 36px;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.3);
  }
  .document-header {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 24px;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 20px;
  }
  .document-title {
    font-size: 1.25rem;
    font-weight: 800;
    margin: 0;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    color: #38bdf8;
    word-break: break-all;
  }
  .document-meta {
    font-size: 0.85rem;
    color: var(--text-muted);
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-top: 8px;
  }
  .document-meta span strong {
    color: var(--text-main);
  }
  .summary-table-wrapper {
    overflow-x: auto;
    margin-bottom: 24px;
  }
  .summary-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
    text-align: left;
  }
  .summary-table th, .summary-table td {
    border: 1px solid var(--border-color);
    padding: 10px 14px;
  }
  .summary-table th {
    background-color: #0f172a;
    font-weight: 700;
    color: #94a3b8;
  }
  .summary-table tr:nth-child(even) {
    background-color: rgba(30, 41, 59, 0.2);
  }
  .comparison-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
    gap: 24px;
  }
  .engine-card {
    background-color: #070a13;
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.05);
  }
  .engine-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
  }
  .engine-name {
    font-weight: 800;
    font-size: 1rem;
    color: #2dd4bf;
  }
  .engine-badge {
    background-color: #1e293b;
    color: #cbd5e1;
    padding: 4px 10px;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    border: 1px solid #334155;
  }
  .engine-metrics {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    font-size: 0.8rem;
    color: var(--text-muted);
    margin-bottom: 14px;
    background-color: #111827;
    padding: 8px 14px;
    border-radius: 8px;
    border: 1px solid #1f2937;
  }
  .metric-item strong {
    color: var(--text-main);
  }
  .ocr-output-container {
    flex: 1;
    background-color: #02040a;
    border: 1px solid #1f2937;
    border-radius: 8px;
    padding: 16px;
    overflow-y: auto;
    max-height: 450px;
    white-space: pre-wrap;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.8rem;
    line-height: 1.5;
    color: #e2e8f0;
  }
  .badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
  }
  .badge-teal {
    background-color: rgba(20, 184, 166, 0.1);
    color: #2dd4bf;
    border: 1px solid rgba(20, 184, 166, 0.2);
  }
  .badge-emerald {
    background-color: rgba(16, 185, 129, 0.1);
    color: #34d399;
    border: 1px solid rgba(16, 185, 129, 0.2);
  }
  .badge-rose {
    background-color: rgba(244, 63, 94, 0.1);
    color: #fb7185;
    border: 1px solid rgba(244, 63, 94, 0.2);
  }
  .badge-indigo {
    background-color: rgba(99, 102, 241, 0.1);
    color: #818cf8;
    border: 1px solid rgba(99, 102, 241, 0.2);
  }
`;
