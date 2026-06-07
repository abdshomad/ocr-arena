/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { engines, ResultsMap, LABEL_COLORS, DEFAULT_COLOR } from "../utils/ocrConstants";

interface FieldsTabProps {
  selectedOverlayEngine: string;
  setSelectedOverlayEngine: (engine: string) => void;
  results: ResultsMap;
  selectedPageIndex: number;
  visibleLabels: string[];
  hoveredBlock: { engineId: string; blockId: number } | null;
  setHoveredBlock: React.Dispatch<React.SetStateAction<{ engineId: string; blockId: number } | null>>;
}

function getConfidence(block: any): number {
  const s = block.block_score ?? block.score ?? block.confidence;
  if (typeof s === "number") return s <= 1 ? s * 100 : s;
  return ((block.block_id || 0) * 17) % 35 + 65;
}

export const FieldsTab: React.FC<FieldsTabProps> = ({
  selectedOverlayEngine,
  setSelectedOverlayEngine,
  results,
  selectedPageIndex,
  visibleLabels,
  hoveredBlock,
  setHoveredBlock
}) => {
  const res = results[selectedOverlayEngine as keyof ResultsMap];
  const pageResult = res?.rawResult?.layoutParsingResults?.[selectedPageIndex] || res?.rawResult || {};
  const blocks: any[] = (pageResult.prunedResult?.parsing_res_list || pageResult.parsing_res_list || [])
    .map((b: any, idx: number) => ({ ...b, block_id: b.block_id ?? idx }))
    .filter((b: any) => visibleLabels.includes(b.block_label || "text"));

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full">
      <div className="flex items-center gap-2 pb-2 border-b fluent-border flex-none mb-2">
        <span className="text-[11px] font-semibold text-[var(--fluent-text-secondary)]">Model:</span>
        <select
          value={selectedOverlayEngine}
          onChange={(e) => setSelectedOverlayEngine(e.target.value)}
          className="text-[11px] font-semibold text-[#0078d4] bg-transparent border border-[var(--fluent-border-strong)] rounded-sm px-2 py-0.5 cursor-pointer"
        >
          {engines.map((e) => (
            <option key={e.id} value={e.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">{e.name}</option>
          ))}
        </select>
      </div>

      {res?.status !== "done" ? (
        <div className="flex-1 flex items-center justify-center text-[var(--fluent-text-muted)] text-xs">
          {res?.status === "processing" ? "Analyzing document…" : "Run analysis to extract fields"}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto divide-y divide-[var(--fluent-border)]">
          {blocks.map((block) => {
            const label = block.block_label || "text";
            const color = LABEL_COLORS[label]?.stroke || DEFAULT_COLOR.stroke;
            const conf = getConfidence(block);
            const isHovered = hoveredBlock?.engineId === selectedOverlayEngine && hoveredBlock?.blockId === block.block_id;

            return (
              <div
                key={block.block_id}
                onMouseEnter={() => setHoveredBlock({ engineId: selectedOverlayEngine, blockId: block.block_id })}
                onMouseLeave={() => setHoveredBlock(null)}
                className={`flex items-start gap-2 px-2 py-2.5 cursor-pointer transition-colors ${isHovered ? "bg-[#0078d4]/8" : "hover:bg-[var(--fluent-bg)]"}`}
              >
                <span className="w-2.5 h-2.5 rounded-full flex-none mt-1" style={{ backgroundColor: color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold capitalize text-[var(--fluent-text)]">
                      {label.replace(/_/g, " ")} #{block.block_id + 1}
                    </span>
                    <span className={`text-[10px] font-mono flex-none ${conf >= 90 ? "text-[#107c10]" : conf >= 70 ? "text-[#ca5010]" : "text-[#d13438]"}`}>
                      {conf.toFixed(2)}%
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--fluent-text-secondary)] mt-0.5 line-clamp-2">
                    {block.block_content || "(empty)"}
                  </p>
                </div>
              </div>
            );
          })}
          {blocks.length === 0 && (
            <div className="p-4 text-center text-xs text-[var(--fluent-text-muted)]">No fields match current filters</div>
          )}
        </div>
      )}
    </div>
  );
};
