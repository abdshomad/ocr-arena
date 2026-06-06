import React from "react";
import { SAMPLE_FILES } from "../utils/ocrConstants";

const DOC_LABELS = [
  "Invoice", "Receipt", "Statement", "Paper", "Contract",
  "Report", "Tax Form", "Medical", "PO", "Bill of Lading",
  "Blueprint", "Resume"
];

interface FileSidebarProps {
  selectedImage: string | null;
  selectedFilename: string;
  isCustomUpload: boolean;
  isRunning: boolean;
  runArenaCompare: (src: string, filename: string, custom?: boolean) => Promise<void>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const FileSidebar: React.FC<FileSidebarProps> = ({
  selectedImage,
  selectedFilename,
  isCustomUpload,
  isRunning,
  runArenaCompare,
  handleFileUpload
}) => {
  const thumbSrc = selectedImage?.startsWith("data:")
    ? selectedImage
    : selectedFilename
      ? `/arena/thumbs/${selectedFilename}`
      : null;

  return (
    <div className="w-52 flex-none flex flex-col border-r fluent-border fluent-surface overflow-hidden">
      <div className="p-3 border-b fluent-border">
        <label className="flex flex-col items-center justify-center border border-dashed border-[#0078d4]/50 hover:border-[#0078d4] bg-[#0078d4]/5 rounded-sm p-3 cursor-pointer text-center transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-[#0078d4] mb-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
          </svg>
          <span className="text-[11px] font-semibold text-[#0078d4]">Browse for files</span>
          <span className="text-[9px] text-[var(--fluent-text-muted)] mt-0.5">or drop files here</span>
          <input type="file" accept="image/*,application/pdf" onChange={handleFileUpload} className="hidden" disabled={isRunning} />
        </label>
      </div>

      {selectedImage && (
        <div className="p-2 border-b fluent-border bg-[#0078d4]/5">
          <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--fluent-text-muted)] px-1">Current</span>
          <div className="mt-1 p-1.5 rounded-sm border-2 border-[#0078d4] bg-white">
            {thumbSrc && !selectedImage.startsWith("data:application/pdf") ? (
              <img src={thumbSrc} alt="Current" className="w-full aspect-[3/4] object-cover rounded-sm" />
            ) : (
              <div className="w-full aspect-[3/4] bg-[var(--fluent-bg)] flex items-center justify-center text-[10px] text-[var(--fluent-text-muted)]">PDF</div>
            )}
            <p className="text-[10px] font-semibold truncate mt-1 text-[var(--fluent-text)]" title={selectedFilename}>
              {isCustomUpload ? selectedFilename : DOC_LABELS[SAMPLE_FILES.indexOf(selectedFilename)] || selectedFilename}
            </p>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--fluent-text-muted)] px-1 block mb-1">Samples</span>
        {SAMPLE_FILES.map((filename, idx) => {
          const active = selectedFilename === filename && !isCustomUpload;
          return (
            <button
              key={filename}
              onClick={() => runArenaCompare(`/arena/${filename}`, filename)}
              disabled={isRunning}
              className={`w-full flex items-center gap-2 p-1.5 rounded-sm text-left transition-colors ${active ? "bg-[#0078d4]/10 border border-[#0078d4]/40" : "hover:bg-[var(--fluent-bg)] border border-transparent"}`}
            >
              <img src={`/arena/thumbs/${filename}`} alt="" className="w-8 h-10 object-cover rounded-sm border fluent-border flex-none" />
              <div className="min-w-0">
                <span className="text-[10px] font-semibold block truncate text-[var(--fluent-text)]">{DOC_LABELS[idx]}</span>
                <span className="text-[9px] text-[var(--fluent-text-muted)]">{idx + 1}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
