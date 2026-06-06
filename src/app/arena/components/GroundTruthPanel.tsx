import React from "react";
import { engines, ResultsMap } from "../utils/ocrConstants";

interface GroundTruthPanelProps {
  theme: "light" | "dark";
  showGroundTruth: boolean;
  setShowGroundTruth: React.Dispatch<React.SetStateAction<boolean>>;
  groundTruth: string;
  setGroundTruth: (text: string) => void;
  results: ResultsMap;
}

export const GroundTruthPanel: React.FC<GroundTruthPanelProps> = ({
  theme,
  showGroundTruth,
  setShowGroundTruth,
  groundTruth,
  setGroundTruth,
  results
}) => {
  if (!showGroundTruth) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-30 p-4 border-t shadow-2xl animate-in slide-in-from-bottom-4 duration-300 flex flex-col gap-3 max-h-[25vh] ${theme === "dark" ? "bg-[#111625] border-[#1f2943]" : "bg-white border-slate-300"}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 select-none flex-none">
        <div className="flex items-center gap-2">
          <span className="text-sm">🎯</span>
          <div>
            <h4 className={`font-bold text-xs ${theme === "dark" ? "text-slate-200" : "text-slate-900"}`}>
              Ground Truth Reference Text Benchmarking
            </h4>
            <p className={`text-[9.5px] ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
              Calculates CER and WER accuracy thresholds in real-time.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-[8.5px] font-bold ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>Auto-fill:</span>
          {engines.map((eng) => {
            const hasText = results[eng.id]?.status === "done";
            return (
              <button
                key={eng.id}
                disabled={!hasText}
                onClick={() => setGroundTruth(results[eng.id].text || "")}
                className={`text-[9px] px-2 py-0.5 rounded font-bold transition-all cursor-pointer disabled:opacity-40 ${
                  theme === "dark"
                    ? "bg-[#1f2943] hover:bg-[#2d3a5a] border border-[#2d3a5a] text-slate-200"
                    : "bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700"
                }`}
              >
                {eng.logo} {eng.name.split(" ")[0]}
              </button>
            );
          })}
          <button
            onClick={() => setShowGroundTruth(false)}
            className={`text-xs text-rose-500 font-bold px-2 py-0.5 rounded ml-2 transition-all cursor-pointer ${
              theme === "dark"
                ? "bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20"
                : "bg-rose-50 hover:bg-rose-100 border border-rose-200"
            }`}
          >
            ✕ Close
          </button>
        </div>
      </div>
      <textarea
        value={groundTruth}
        onChange={(e) => setGroundTruth(e.target.value)}
        placeholder="Paste correct reference text here..."
        className={`w-full flex-1 min-h-0 border rounded-xl p-3 font-mono text-xs leading-relaxed focus:outline-none focus:border-[#0078d4]/50 transition-all ${
          theme === "dark"
            ? "bg-[#0c0f18] border-slate-800 text-slate-100 placeholder-slate-600"
            : "bg-slate-50 border-slate-200 text-slate-950 placeholder-slate-400"
        }`}
      />
    </div>
  );
};
export default GroundTruthPanel;
