import React from "react";
import { SAMPLE_FILES } from "../utils/ocrConstants";

interface LandingHubProps {
  isRunning: boolean;
  runArenaCompare: (imageSource: string, filename: string, customUpload?: boolean) => Promise<void>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const DOC_TYPES = [
  "Invoice Document", "Receipt / Voucher", "Financial Statement", "Academic Paper",
  "Legal Contract", "Corporate Report", "Tax Form W-2", "Medical Record",
  "Purchase Order", "Bill of Lading", "Technical Blueprint", "Resume / CV"
];

export const LandingHub: React.FC<LandingHubProps> = ({
  isRunning,
  runArenaCompare,
  handleFileUpload
}) => {
  return (
    <div className="flex-1 flex overflow-hidden min-h-0">
      <div className="w-52 flex-none border-r fluent-border fluent-surface p-3 flex flex-col">
        <label className="flex flex-col items-center justify-center border border-dashed border-[#0078d4]/50 hover:border-[#0078d4] bg-[#0078d4]/5 rounded-sm p-4 cursor-pointer text-center transition-colors flex-none">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-[#0078d4] mb-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
          </svg>
          <span className="text-xs font-semibold text-[#0078d4]">Browse for files</span>
          <span className="text-[10px] text-[var(--fluent-text-muted)] mt-1">or drop files here</span>
          <input type="file" accept="image/*,application/pdf" onChange={handleFileUpload} className="hidden" disabled={isRunning} />
        </label>
        <p className="text-[10px] text-[var(--fluent-text-muted)] mt-3 text-center">PDF, PNG, JPG, JPEG</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-[var(--fluent-bg)]">
        <div className="max-w-4xl mb-6">
          <p className="text-[11px] text-[var(--fluent-text-secondary)] mb-1">Prebuilt &gt; OCR Arena</p>
          <h1 className="text-xl font-semibold text-[var(--fluent-text)]">Try Document Intelligence features</h1>
          <p className="text-sm text-[var(--fluent-text-secondary)] mt-2 leading-relaxed">
            Upload a document or select a sample to compare six OCR engines side-by-side. Analyze layout structures, tables, and text accuracy in real time.
          </p>
        </div>

        <h3 className="text-xs font-semibold text-[var(--fluent-text-secondary)] uppercase tracking-wider mb-3">
          Sample documents
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {SAMPLE_FILES.map((filename, idx) => (
            <button
              key={filename}
              onClick={() => runArenaCompare(`/arena/${filename}`, filename)}
              disabled={isRunning}
              className="group fluent-panel rounded-sm overflow-hidden text-left hover:border-[#0078d4]/50 transition-colors"
            >
              <div className="aspect-[3/4] overflow-hidden bg-[var(--fluent-bg)]">
                <img src={`/arena/thumbs/${filename}`} alt={DOC_TYPES[idx]} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
              <div className="p-2 border-t fluent-border">
                <span className="text-[9px] font-bold text-[#0078d4] uppercase">Sample {idx + 1}</span>
                <p className="text-[10px] font-semibold truncate text-[var(--fluent-text)]" title={DOC_TYPES[idx]}>{DOC_TYPES[idx]}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="w-72 flex-none border-l fluent-border fluent-surface p-4 hidden lg:block">
        <h3 className="text-xs font-semibold text-[var(--fluent-text)] mb-3">Getting started</h3>
        <ol className="text-[11px] text-[var(--fluent-text-secondary)] space-y-2 list-decimal list-inside">
          <li>Upload or select a sample document</li>
          <li>Click <strong className="text-[#0078d4]">Run analysis</strong></li>
          <li>Review extracted fields and compare engines</li>
        </ol>
      </div>
    </div>
  );
};
