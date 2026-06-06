import React, { useEffect, useState } from "react";
import Link from "next/link";

interface HistoryHeaderProps {
  theme: "light" | "dark";
  toggleTheme: () => void;
  restoringBackup: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleRestoreImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBackupExport: () => void;
}

export const HistoryHeader: React.FC<HistoryHeaderProps> = ({
  theme,
  toggleTheme,
  restoringBackup,
  fileInputRef,
  handleRestoreImport,
  handleBackupExport
}) => {
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  return (
    <header className="h-12 w-full bg-[#0078d4] text-white flex items-center justify-between px-4 z-40 select-none flex-none shadow-sm">
      <div className="flex items-center gap-3">
        <svg viewBox="0 0 23 23" className="w-5 h-5" fill="currentColor" aria-hidden>
          <path d="M1 1h10v10H1zm12 0h10v10H13zM1 13h10v10H1zm12 0h10v10H13z" />
        </svg>
        <span className="font-semibold text-sm tracking-tight">OCR AI</span>
        <span className="text-white/60 text-xs">|</span>
        <span className="text-sm font-semibold">Document Intelligence</span>
      </div>

      <div className="flex items-center gap-4">
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/arena" className="text-white/80 hover:text-white transition-colors">
            OCR Arena
          </Link>
          <Link href="/history" className="text-white font-semibold border-b-2 border-white pb-0.5">
            Scan History
          </Link>
        </nav>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleRestoreImport}
          accept=".json"
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={restoringBackup}
          className="px-2.5 py-1 rounded-sm bg-white/10 hover:bg-white/20 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
        >
          📥 {restoringBackup ? "Restoring..." : "Restore Backup"}
        </button>
        <button
          onClick={handleBackupExport}
          className="px-2.5 py-1 rounded-sm bg-white/10 hover:bg-white/20 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
        >
          📤 Export Backup
        </button>

        <button
          onClick={toggleTheme}
          className="px-2 py-1 rounded-sm bg-white/10 hover:bg-white/20 text-xs font-semibold transition-colors flex items-center justify-center cursor-pointer select-none"
          title="Toggle theme"
        >
          {mounted ? (theme === "dark" ? "Light" : "Dark") : "Theme"}
        </button>
      </div>
    </header>
  );
};
