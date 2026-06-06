import React from "react";

interface SlaSettingsProps {
  confidenceThreshold: number;
  setConfidenceThreshold: (t: number) => void;
  latencyTarget: number;
  setLatencyTarget: (t: number) => void;
  accuracyTarget: number;
  setAccuracyTarget: (t: number) => void;
}

export const SlaSettings: React.FC<SlaSettingsProps> = ({
  confidenceThreshold,
  setConfidenceThreshold,
  latencyTarget,
  setLatencyTarget,
  accuracyTarget,
  setAccuracyTarget
}) => {
  return (
    <div className="space-y-3">
      {/* Confidence Threshold Slider */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-[10px] font-bold text-slate-650 dark:text-slate-350">
          <span>Min Confidence Box filter</span>
          <span className="font-mono text-[#0078d4] font-extrabold">{confidenceThreshold}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={confidenceThreshold}
          onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
          className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#0078d4]"
        />
        <span className="text-[8.5px] text-slate-500 block leading-tight">Blocks with confidence below this threshold are marked red.</span>
      </div>

      {/* Latency SLA target */}
      <div className="space-y-1">
        <label className="text-[9px] font-bold text-slate-500 uppercase block">Latency Target SLA (s)</label>
        <input
          type="number"
          step="0.1"
          min="0.1"
          value={latencyTarget}
          onChange={(e) => setLatencyTarget(Math.max(0.1, Number(e.target.value)))}
          className="w-full bg-slate-100 dark:bg-[#1a2135]/40 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs font-bold font-mono outline-none focus:border-[#0078d4] text-slate-850 dark:text-slate-200"
        />
      </div>

      {/* Accuracy SLA target */}
      <div className="space-y-1">
        <label className="text-[9px] font-bold text-slate-500 uppercase block">Accuracy Target SLA (%)</label>
        <input
          type="number"
          step="0.5"
          min="1"
          max="100"
          value={accuracyTarget}
          onChange={(e) => setAccuracyTarget(Math.min(100, Math.max(1, Number(e.target.value))))}
          className="w-full bg-slate-100 dark:bg-[#1a2135]/40 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs font-bold font-mono outline-none focus:border-[#0078d4] text-slate-850 dark:text-slate-200"
        />
      </div>
    </div>
  );
};
export default SlaSettings;
