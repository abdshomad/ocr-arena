import React, { useEffect, useState } from "react";
import Link from "next/link";

interface OCRHeaderProps {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

export const OCRHeader: React.FC<OCRHeaderProps> = ({ theme, toggleTheme }) => {
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

      <div className="flex items-center gap-5">
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/arena" className="text-white font-semibold border-b-2 border-white pb-0.5">
            OCR Arena
          </Link>
          <Link href="/history" className="text-white/80 hover:text-white transition-colors">
            Scan History
          </Link>
        </nav>
        <button
          onClick={toggleTheme}
          className="px-2 py-1 rounded-sm bg-white/10 hover:bg-white/20 text-xs font-semibold transition-colors"
          title="Toggle theme"
        >
          {mounted ? (theme === "dark" ? "Light" : "Dark") : "Theme"}
        </button>
      </div>
    </header>
  );
};
