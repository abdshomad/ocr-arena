import React from "react";
import { getLocalDateString } from "../utils/historyHelpers";

interface HistoryHeatmapProps {
  runsPerDay: Record<string, number>;
  startDate: string;
  endDate: string;
  setStartDate: (s: string) => void;
  setEndDate: (s: string) => void;
  heatmapScrollRef: React.RefObject<HTMLDivElement | null>;
}

export const HistoryHeatmap: React.FC<HistoryHeatmapProps> = ({
  runsPerDay,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  heatmapScrollRef
}) => {
  const generateHeatmapGrid = React.useCallback(() => {
    const grid: Date[][] = [];
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - 364); // 52 weeks ago
    
    // Align to Sunday
    const startDay = start.getDay();
    start.setDate(start.getDate() - startDay);
    start.setHours(0, 0, 0, 0);
    
    const current = new Date(start);
    for (let w = 0; w < 53; w++) {
      const week: Date[] = [];
      for (let d = 0; d < 7; d++) {
        week.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      grid.push(week);
    }
    return grid;
  }, []);

  const getMonthLabels = React.useCallback((grid: Date[][]) => {
    const labels: { text: string; colIndex: number }[] = [];
    let lastMonth = -1;
    grid.forEach((week, colIndex) => {
      const firstDayOfWeek = week[0];
      const month = firstDayOfWeek.getMonth();
      if (month !== lastMonth) {
        if (labels.length === 0 || colIndex - labels[labels.length - 1].colIndex >= 3) {
          const monthName = firstDayOfWeek.toLocaleDateString("en-US", { month: "short" });
          labels.push({ text: monthName, colIndex });
          lastMonth = month;
        }
      }
    });
    return labels;
  }, []);

  const getHeatmapColorClass = React.useCallback((count: number) => {
    if (count === 0) return "bg-slate-100 dark:bg-slate-800/40 hover:bg-slate-200 dark:hover:bg-slate-800/70 border border-slate-200/10 dark:border-slate-800/20";
    if (count <= 2) return "bg-emerald-100 dark:bg-emerald-950/40 hover:bg-emerald-200 dark:hover:bg-emerald-950/70 border border-emerald-200/20 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-300";
    if (count <= 5) return "bg-emerald-300 dark:bg-emerald-700/60 hover:bg-emerald-400 dark:hover:bg-emerald-600 border border-emerald-300/20 dark:border-emerald-700/40 text-emerald-900 dark:text-emerald-100";
    if (count <= 10) return "bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-500/80 dark:hover:bg-emerald-500 text-white";
    return "bg-emerald-700 dark:bg-emerald-400 hover:bg-emerald-800 dark:hover:bg-emerald-300 text-white dark:text-slate-950 font-bold";
  }, []);

  const handleCellClick = React.useCallback((dStr: string) => {
    if (startDate === dStr && endDate === dStr) {
      setStartDate("");
      setEndDate("");
    } else {
      setStartDate(dStr);
      setEndDate(dStr);
    }
  }, [startDate, endDate, setStartDate, setEndDate]);

  const gridData = React.useMemo(() => generateHeatmapGrid(), [generateHeatmapGrid]);
  const monthLabels = React.useMemo(() => getMonthLabels(gridData), [gridData, getMonthLabels]);
  const totalScans = React.useMemo(() => Object.values(runsPerDay).reduce((a, b) => a + b, 0), [runsPerDay]);

  return (
    <div id="activity-heatmap-container" className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm select-none">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Activity Heatmap</span>
          <span className="text-[10px] text-slate-400 font-medium">({totalScans} total scans)</span>
        </div>
        {startDate === endDate && startDate !== "" && (
          <button
            onClick={() => {
              setStartDate("");
              setEndDate("");
            }}
            id="clear-heatmap-filter-btn"
            className="text-[10px] font-bold text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer"
          >
            Clear Date Filter ({startDate})
          </button>
        )}
      </div>
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex-1 w-full overflow-x-auto scrollbar-none pb-1" ref={heatmapScrollRef}>
          <div className="min-w-[720px] select-none">
            <div className="flex text-[9px] text-slate-400 h-4 relative pl-6">
              {monthLabels.map((label, idx) => (
                <span 
                  key={idx} 
                  className="absolute"
                  style={{ left: `${24 + label.colIndex * 13}px` }}
                >
                  {label.text}
                </span>
              ))}
            </div>
            
            <div className="flex">
              <div className="flex flex-col justify-between text-[9px] text-slate-400 w-6 pr-2 h-[82px] pt-1">
                <span>Sun</span>
                <span>Tue</span>
                <span>Thu</span>
                <span>Sat</span>
              </div>
              
              <div className="flex gap-[3px]">
                {gridData.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-[3px]">
                    {week.map((day, dIdx) => {
                      const dStr = getLocalDateString(day.toISOString());
                      const count = runsPerDay[dStr] || 0;
                      const isSelected = startDate === dStr && endDate === dStr;
                      return (
                        <button
                          key={dIdx}
                          onClick={() => handleCellClick(dStr)}
                          className={`w-[10px] h-[10px] rounded-[2px] transition-all cursor-pointer relative ${getHeatmapColorClass(count)} ${
                            isSelected ? "ring-2 ring-[#0078d4] scale-125 z-10" : ""
                          }`}
                          title={`${dStr}: ${count} scan${count === 1 ? "" : "s"}`}
                          aria-label={`${dStr}: ${count} scan${count === 1 ? "" : "s"}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 self-end text-[10px] text-slate-400 select-none">
          <span>Less</span>
          <div className="flex gap-[3px]">
            <div className="w-[10px] h-[10px] rounded-[2px] bg-slate-100 dark:bg-slate-800/40" title="0 scans" />
            <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-200/20 dark:border-emerald-900/30" title="1-2 scans" />
            <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald-300 dark:bg-emerald-700/60 border border-emerald-300/20 dark:border-emerald-700/40" title="3-5 scans" />
            <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald-505 dark:bg-emerald-500/80" title="6-10 scans" />
            <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald-705 dark:bg-emerald-400" title="11+ scans" />
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
};
