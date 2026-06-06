import React from "react";
import { engines, SAMPLE_FILES } from "../utils/ocrConstants";

interface BatchOcrModalProps {
  isBatchRunning: boolean;
  batchStatus: 'idle' | 'running' | 'paused' | 'completed' | 'cancelled';
  batchSuccessCount: number;
  batchFailureCount: number;
  batchElapsedTime: number;
  batchResults: Record<string, Record<string, 'pending' | 'processing' | 'done' | 'failed'>>;
  visibleEngines: string[];
  handlePauseBatch: () => void;
  handleResumeBatch: () => void;
  handleCancelBatch: () => void;
  handleCloseBatchModal: () => void;
}

export const BatchOcrModal: React.FC<BatchOcrModalProps> = ({
  isBatchRunning,
  batchStatus,
  batchSuccessCount,
  batchFailureCount,
  batchElapsedTime,
  batchResults,
  visibleEngines,
  handlePauseBatch,
  handleResumeBatch,
  handleCancelBatch,
  handleCloseBatchModal
}) => {
  if (!isBatchRunning) return null;

  const enginesToRun = engines.filter(e => visibleEngines.includes(e.id));
  const totalTasks = SAMPLE_FILES.length * enginesToRun.length;
  const completedTasks = batchSuccessCount + batchFailureCount;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const activeRuns: { filename: string; engineName: string }[] = [];
  SAMPLE_FILES.forEach(filename => {
    const fileResults = batchResults[filename] || {};
    enginesToRun.forEach(eng => {
      if (fileResults[eng.id] === "processing") {
        activeRuns.push({ filename, engineName: eng.name });
      }
    });
  });

  let etaText = "Calculating...";
  if (completedTasks > 0) {
    const avgTimePerTask = batchElapsedTime / completedTasks;
    const tasksRemaining = totalTasks - completedTasks;
    const etaSeconds = Math.round(tasksRemaining * avgTimePerTask);
    if (etaSeconds <= 0) {
      etaText = "Finishing...";
    } else {
      const mins = Math.floor(etaSeconds / 60);
      const secs = etaSeconds % 60;
      etaText = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    }
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/65 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-white dark:bg-[#111625] border border-slate-200 dark:border-[#1f2943] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-250 dark:border-[#1f2943] flex items-center justify-between flex-none bg-slate-50 dark:bg-[#0c0f18]/45">
          <div className="flex items-center gap-2">
            <span className="text-xl animate-bounce">⚡</span>
            <div>
              <h3 className="font-extrabold text-base text-slate-805 dark:text-slate-100">
                Batch OCR Runner
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                Running comparison on all {SAMPLE_FILES.length} sample images
              </p>
            </div>
          </div>
          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
            batchStatus === "completed"
              ? "bg-emerald-500/10 text-emerald-400"
              : batchStatus === "cancelled"
              ? "bg-rose-500/10 text-rose-455"
              : batchStatus === "paused"
              ? "bg-amber-500/10 text-amber-400"
              : "bg-teal-500/10 text-teal-405 animate-pulse"
          }`}>
            {batchStatus}
          </span>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 pr-4">
          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400 select-none uppercase tracking-wide">
              <span>Total Progress</span>
              <span>{completedTasks} / {totalTasks} Requests ({progressPercentage}%)</span>
            </div>
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-[#2d3a5a]/40 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200 dark:border-[#2d3a5a]/20">
              <span className="text-slate-500 dark:text-slate-400 block text-[9px] uppercase tracking-wide font-bold mb-0.5">Successes</span>
              <span className="text-base font-mono font-bold text-emerald-500 dark:text-emerald-400">{batchSuccessCount}</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200 dark:border-[#2d3a5a]/20">
              <span className="text-slate-500 dark:text-slate-400 block text-[9px] uppercase tracking-wide font-bold mb-0.5">Failures</span>
              <span className="text-base font-mono font-bold text-rose-500 dark:text-rose-455">{batchFailureCount}</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200 dark:border-[#2d3a5a]/20">
              <span className="text-slate-500 dark:text-slate-400 block text-[9px] uppercase tracking-wide font-bold mb-0.5">Elapsed</span>
              <span className="text-base font-mono font-bold text-slate-805 dark:text-slate-200">{formatTime(batchElapsedTime)}</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200 dark:border-[#2d3a5a]/20">
              <span className="text-slate-500 dark:text-slate-400 block text-[9px] uppercase tracking-wide font-bold mb-0.5">ETA</span>
              <span className="text-base font-mono font-bold text-teal-605 dark:text-teal-405">{etaText}</span>
            </div>
          </div>

          {/* Current Operation Info */}
          {batchStatus === "running" && activeRuns.length > 0 && (
            <div className="bg-teal-500/5 border border-teal-500/10 rounded-2xl p-4 flex flex-col gap-1.5 animate-pulse">
              <span className="text-[9px] font-extrabold text-teal-400 uppercase tracking-wider block">
                Current Actions ({activeRuns.length})
              </span>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-250 flex flex-col gap-1.5 max-h-24 overflow-y-auto pr-1">
                {activeRuns.map((run, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[10.5px] border-b border-slate-200 dark:border-slate-800 pb-1 last:border-0 last:pb-0">
                    <span className="font-mono text-teal-600 dark:text-teal-400 truncate max-w-[65%]">{run.filename}</span>
                    <span className="text-slate-500 dark:text-slate-400 font-medium">{run.engineName}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Live Log */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Operation Log
            </span>
            <div className="h-44 overflow-y-auto bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 font-mono text-[9.5px] leading-relaxed text-slate-800 dark:text-slate-300 space-y-1.5 scrollbar-thin select-text">
              {SAMPLE_FILES.map((filename, fileIdx) => {
                const fileResults = batchResults[filename] || {};
                const isFileProcessing = Object.values(fileResults).includes("processing");
                
                return (
                  <div key={filename} className="border-b border-slate-200 dark:border-slate-900 pb-1.5 last:border-0">
                    <div className="flex justify-between items-center font-bold text-slate-905 dark:text-slate-200 mb-1">
                      <span>{fileIdx + 1}. {filename}</span>
                      {isFileProcessing && batchStatus === "running" && (
                        <span className="text-[8px] bg-teal-500/15 text-teal-400 px-1.5 py-0.2 rounded font-bold uppercase animate-pulse">Processing</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 pl-3">
                      {enginesToRun.map(eng => {
                        const status = fileResults[eng.id] || "pending";
                        const colors = 
                          status === "done"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                            : status === "failed"
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-455 border-rose-500/25"
                            : status === "processing"
                            ? "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/35 animate-pulse font-bold"
                            : "bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800";
                        
                        return (
                          <span
                            key={eng.id}
                            className={`text-[8px] px-1.5 py-0.5 rounded border transition-all ${colors}`}
                          >
                            {eng.logo} {eng.name}: {status}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-250 dark:border-[#1f2943] bg-slate-50 dark:bg-[#0c0f18]/45 flex items-center justify-end gap-3 flex-none text-slate-800 dark:text-white">
          {batchStatus === "running" && (
            <button
              onClick={handlePauseBatch}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 font-bold text-xs text-white transition-all cursor-pointer shadow-md select-none"
              id="batch-pause-btn"
            >
              ⏸ Pause
            </button>
          )}
          {batchStatus === "paused" && (
            <button
              onClick={handleResumeBatch}
              className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 font-bold text-xs text-white transition-all cursor-pointer shadow-md select-none"
              id="batch-resume-btn"
            >
              ▶ Resume
            </button>
          )}
          {(batchStatus === "running" || batchStatus === "paused") && (
            <button
              onClick={handleCancelBatch}
              className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 font-bold text-xs text-white transition-all cursor-pointer shadow-md select-none"
              id="batch-cancel-btn"
            >
              ⏹ Cancel
            </button>
          )}
          {(batchStatus === "completed" || batchStatus === "cancelled") && (
            <button
              onClick={handleCloseBatchModal}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all cursor-pointer select-none"
              id="batch-close-btn"
            >
              Close & View Summary
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
