import React from "react";
import { engines, ENGINE_PRICING, ResultsMap } from "../utils/ocrConstants";
import { calculateCER } from "../utils/metricUtils";
import { getFilteredText } from "../utils/ocrHelpers";

interface PerformanceTabProps {
  results: ResultsMap;
  visibleEngines: string[];
  selectedPageIndex: number;
  latencyTarget: number;
  accuracyTarget: number;
  showGroundTruth: boolean;
  groundTruth: string;
}

export const PerformanceTab: React.FC<PerformanceTabProps> = ({
  results,
  visibleEngines,
  selectedPageIndex,
  latencyTarget,
  accuracyTarget,
  showGroundTruth,
  groundTruth
}) => {
  const completedEngines = engines.filter(e => results[e.id]?.status === "done" && visibleEngines.includes(e.id));
  
  if (completedEngines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center space-y-2 py-12 flex-1">
        <span>⌛</span>
        <span className="text-xs font-semibold">No finished engines to compare yet</span>
        <span className="text-[10px] text-slate-500">Run OCR analysis on the document to generate comparison metrics.</span>
      </div>
    );
  }

  const statsList = completedEngines.map(e => {
    const res = results[e.id];
    const pageTextRaw = res.rawResult?.layoutParsingResults?.[selectedPageIndex]?.markdown?.text || res.text || "";
    const charCount = pageTextRaw.length;
    
    // Cost
    const perMillionRate = ENGINE_PRICING[e.id] || 0.50;
    const cost = (charCount / 1000000) * perMillionRate;
    
    // Avg Confidence
    const pageResult = res.rawResult?.layoutParsingResults?.[selectedPageIndex] || res.rawResult || {};
    const rawBlocks = pageResult.prunedResult?.parsing_res_list || pageResult.parsing_res_list || [];
    const scores = rawBlocks.map((b: any) => {
      const score = typeof b.block_score === "number" ? b.block_score : (typeof b.score === "number" ? b.score : (typeof b.confidence === "number" ? b.confidence : null));
      return score !== null ? (score <= 1 ? score * 100 : score) : null;
    }).filter((s: any) => s !== null);
    const avgConf = scores.length > 0 ? (scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : null;

    // Latency
    const latencySec = res.time / 1000;

    // Char accuracy if Ground Truth active
    let charAcc = null;
    if (showGroundTruth && groundTruth) {
      const pageTextFiltered = getFilteredText(res.rawResult, pageTextRaw, [], selectedPageIndex);
      const cerErr = calculateCER(groundTruth, pageTextFiltered);
      charAcc = Math.max(0, 100 - cerErr * 100);
    }

    return {
      id: e.id,
      name: e.name,
      logo: e.logo,
      latency: latencySec,
      charCount,
      cost,
      confidence: avgConf,
      accuracy: charAcc,
      throughput: latencySec > 0 ? (charCount / latencySec) : 0
    };
  });
  const [sortConfig, setSortConfig] = React.useState<{
    key: "name" | "latency" | "confidence" | "accuracy" | "cost" | "throughput";
    desc: boolean;
  } | null>(null);

  const requestSort = (key: "name" | "latency" | "confidence" | "accuracy" | "cost" | "throughput") => {
    let desc = true;
    if (sortConfig && sortConfig.key === key) {
      desc = !sortConfig.desc;
    }
    setSortConfig({ key, desc });
  };

  const renderSortIndicator = (key: "name" | "latency" | "confidence" | "accuracy" | "cost" | "throughput") => {
    if (!sortConfig || sortConfig.key !== key) {
      return <span className="opacity-30 ml-1 select-none">↕</span>;
    }
    return <span className="text-[#0078d4] font-bold ml-1 select-none">{sortConfig.desc ? "▼" : "▲"}</span>;
  };

  const sortedStatsList = React.useMemo(() => {
    if (!sortConfig) return statsList;
    return [...statsList].sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];

      // Handle nulls in sorting so they stay at the bottom/top appropriately
      if (valA === null) valA = sortConfig.desc ? -Infinity : Infinity;
      if (valB === null) valB = sortConfig.desc ? -Infinity : Infinity;

      if (valA < valB) return sortConfig.desc ? 1 : -1;
      if (valA > valB) return sortConfig.desc ? -1 : 1;
      return 0;
    });
  }, [statsList, sortConfig]);

  // Find min/max winners
  const minLatency = Math.min(...statsList.map(s => s.latency));
  const maxConfidence = statsList.some(s => s.confidence !== null)
    ? Math.max(...statsList.map(s => s.confidence || 0))
    : -1;
  const maxAccuracy = statsList.some(s => s.accuracy !== null)
    ? Math.max(...statsList.map(s => s.accuracy || 0))
    : -1;
  const minCost = Math.min(...statsList.map(s => s.cost));

  return (
    <div className="space-y-4 flex-1">
      {/* SLA Target Metrics Panel */}
      <div className="p-3.5 bg-slate-955/20 dark:bg-slate-955/20 border border-slate-205 dark:border-slate-800 rounded-xl space-y-2 select-none">
        <h4 id="active-sla-benchmarks-header" className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Active SLA Benchmarks</h4>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[9.5px]">Latency Threshold:</span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-202">&lt;= {latencyTarget.toFixed(1)} seconds</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[9.5px]">Accuracy Threshold:</span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-202">&gt;= {accuracyTarget.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto border border-slate-250 dark:border-slate-800 rounded-xl bg-white dark:bg-[#0c0f18]/40">
        <table className="w-full border-collapse text-left text-[10.5px] leading-normal select-none">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-850 text-[8.5px] font-extrabold text-slate-400 uppercase tracking-wider">
              <th className="p-2 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors" onClick={() => requestSort("name")}>
                Engine {renderSortIndicator("name")}
              </th>
              <th className="p-2 text-right cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors" onClick={() => requestSort("latency")}>
                Latency {renderSortIndicator("latency")}
              </th>
              <th className="p-2 text-right cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors" onClick={() => requestSort("confidence")}>
                Confidence {renderSortIndicator("confidence")}
              </th>
              {showGroundTruth && (
                <th className="p-2 text-right cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors" onClick={() => requestSort("accuracy")}>
                  Accuracy {renderSortIndicator("accuracy")}
                </th>
              )}
              <th className="p-2 text-right cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors" onClick={() => requestSort("cost")}>
                Est. Cost {renderSortIndicator("cost")}
              </th>
              <th className="p-2 text-right cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors" onClick={() => requestSort("throughput")}>
                Speed {renderSortIndicator("throughput")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold text-slate-700 dark:text-slate-350">
            {sortedStatsList.map(s => {
              const isFastest = s.latency === minLatency && s.latency > 0;
              const isMostConfident = s.confidence !== null && s.confidence === maxConfidence;
              const isMostAccurate = s.accuracy !== null && s.accuracy === maxAccuracy;
              const isCheapest = s.cost === minCost;
              
              const meetsLatencySla = s.latency <= latencyTarget;
              const meetsAccuracySla = s.accuracy !== null ? s.accuracy >= accuracyTarget : true;

              return (
                <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-all">
                  <td className="p-2 flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-150">
                    <span className="text-xs">{s.logo}</span>
                    <span className="truncate max-w-[80px] sm:max-w-none">{s.name.split(" ")[0]}</span>
                  </td>
                  
                  <td className={`p-2 text-right font-mono ${!meetsLatencySla ? "text-rose-505 bg-rose-500/5 font-extrabold" : isFastest ? "text-emerald-450" : "text-slate-500"}`}>
                    {s.latency.toFixed(2)}s {isFastest && "🏆"}
                  </td>
                  
                  <td className={`p-2 text-right font-mono ${isMostConfident ? "text-[#0078d4]" : ""}`}>
                    {s.confidence !== null ? `${s.confidence.toFixed(0)}%` : "-"}
                  </td>
                  
                  {showGroundTruth && (
                    <td className={`p-2 text-right font-mono ${!meetsAccuracySla ? "text-rose-505 bg-rose-500/5 font-extrabold" : isMostAccurate ? "text-emerald-400 font-bold" : "text-slate-500"}`}>
                      {s.accuracy !== null ? `${s.accuracy.toFixed(1)}%` : "-"} {isMostAccurate && "🏆"}
                    </td>
                  )}
                  
                  <td className={`p-2 text-right font-mono ${isCheapest ? "text-amber-450" : ""}`}>
                    ${s.cost.toFixed(5)}
                  </td>
                  
                  <td className="p-2 text-right font-mono text-[9px] text-slate-500">
                    {Math.round(s.throughput)}c/s
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Diagnostic Champion Cards */}
      <div className="grid grid-cols-2 gap-3 text-xs select-none">
        <div id="latency-winner-card" className="bg-slate-950/20 border border-slate-205 dark:border-slate-800 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[8.5px] font-bold text-slate-500 uppercase">Latency Winner</span>
          {(() => {
            const winner = statsList.find(s => s.latency === minLatency);
            return winner ? (
              <div className="font-bold text-slate-200 flex items-center gap-1 mt-1">
                <span>{winner.logo}</span>
                <span className="truncate">{winner.name.split(" ")[0]}</span>
                <span className="text-[10px] text-emerald-400 font-mono">({winner.latency.toFixed(2)}s)</span>
              </div>
            ) : <span className="text-slate-500 mt-1">-</span>;
          })()}
        </div>

        <div id="cost-winner-card" className="bg-slate-950/20 border border-slate-205 dark:border-slate-800 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[8.5px] font-bold text-slate-550 uppercase">Cost Winner</span>
          {(() => {
            const winner = statsList.find(s => s.cost === minCost);
            return winner ? (
              <div className="font-bold text-slate-200 flex items-center gap-1 mt-1">
                <span>{winner.logo}</span>
                <span className="truncate">{winner.name.split(" ")[0]}</span>
                <span className="text-[10px] text-amber-455 font-mono">(${winner.cost.toFixed(5)})</span>
              </div>
            ) : <span className="text-slate-500 mt-1">-</span>;
          })()}
        </div>
      </div>
    </div>
  );
};
export default PerformanceTab;
