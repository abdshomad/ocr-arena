/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { LABEL_COLORS, DEFAULT_COLOR, ENGINE_COLORS, ENGINE_DEFAULT_COLOR } from "../utils/ocrConstants";

interface SvgOverlaysProps {
  overlayEngines: string[];
  results: any;
  selectedOverlayEngine: string;
  diffBaseline: string;
  compareLayouts: boolean;
  selectedPageIndex: number;
  visibleLabels: string[];
  imageDimensions: { width: number; height: number } | null;
  confidenceThreshold: number;
  visualColorMode: "label" | "confidence" | "heatmap";
  heatmapMetric: "latency" | "confidence";
  hoveredBlock: { engineId: string; blockId: number } | null;
  setHoveredBlock: React.Dispatch<React.SetStateAction<{ engineId: string; blockId: number } | null>>;
  setActiveTooltip: React.Dispatch<React.SetStateAction<any>>;
  handleBlockClick: (engineId: string, block: any, rectCoords: [number, number, number, number]) => void;
}

export const SvgOverlays: React.FC<SvgOverlaysProps> = ({
  overlayEngines,
  results,
  selectedOverlayEngine,
  diffBaseline,
  compareLayouts,
  selectedPageIndex,
  visibleLabels,
  imageDimensions,
  confidenceThreshold,
  visualColorMode,
  heatmapMetric,
  hoveredBlock,
  setHoveredBlock,
  setActiveTooltip,
  handleBlockClick
}) => {
  // Render Baseline Blocks first if Compare Layouts is active
  const baselineRes = results[diffBaseline];
  const baselinePageResult = baselineRes?.rawResult?.layoutParsingResults?.[selectedPageIndex] || baselineRes?.rawResult || {};
  const baselineRawBlocks = baselinePageResult.prunedResult?.parsing_res_list || baselinePageResult.parsing_res_list || [];
  const filteredBaselineBlocks = (compareLayouts && selectedOverlayEngine !== diffBaseline && baselineRes?.status === "done")
    ? baselineRawBlocks.map((b: any, idx: number) => ({ ...b, block_id: b.block_id ?? idx }))
        .filter((b: any) => visibleLabels.includes(b.block_label || "text"))
    : [];

  const isMultiOverlay = overlayEngines.length > 1;

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-auto"
      viewBox={selectedOverlayEngine === "deepseek" ? "0 0 1000 1000" : (imageDimensions ? `0 0 ${imageDimensions.width} ${imageDimensions.height}` : "0 0 1000 1000")}
      preserveAspectRatio="none"
    >
      {/* Baseline Overlay */}
      {compareLayouts && filteredBaselineBlocks.map((block: any, bIdx: number) => {
        const [xmin, ymin, xmax, ymax] = block.block_bbox || [0, 0, 0, 0];
        const isHovered = hoveredBlock?.engineId === `${diffBaseline}-baseline` && hoveredBlock?.blockId === block.block_id;
        return (
          <rect
            key={`base-overlay-${bIdx}`}
            x={xmin}
            y={ymin}
            width={xmax - xmin}
            height={ymax - ymin}
            style={{
              fill: isHovered ? "rgba(59, 130, 246, 0.15)" : "rgba(59, 130, 246, 0.04)",
              stroke: isHovered ? "#3b82f6" : "#3b82f6",
              strokeWidth: isHovered ? "3px" : "1.2px",
              strokeDasharray: "4 2"
            }}
            className="hover:opacity-85 cursor-pointer transition-all duration-150"
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setActiveTooltip({
                engineId: diffBaseline,
                block,
                x: rect.left + window.scrollX,
                y: rect.top + window.scrollY - 8,
                isBaseline: true
              });
              setHoveredBlock({ engineId: `${diffBaseline}-baseline`, blockId: block.block_id });
            }}
            onMouseLeave={() => {
              setActiveTooltip(null);
              setHoveredBlock(null);
            }}
            onClick={() => handleBlockClick(diffBaseline, block, block.block_bbox)}
          />
        );
      })}

      {/* Selected Engines Overlays */}
      {overlayEngines.map((engineId) => {
        const res = results[engineId];
        if (res?.status !== "done") return null;

        const pageResult = res?.rawResult?.layoutParsingResults?.[selectedPageIndex] || res?.rawResult || {};
        const rawBlocks = pageResult.prunedResult?.parsing_res_list || pageResult.parsing_res_list || [];
        const blocks = rawBlocks.map((b: any, idx: number) => ({ ...b, block_id: b.block_id ?? idx }));
        const filteredBlocks = blocks.filter((b: any) => visibleLabels.includes(b.block_label || "text"));

        const resTime = res?.time || 0;
        const totalLength = blocks.reduce((acc: number, b: any) => acc + (b.block_content || "").length, 0) || 1;

        return filteredBlocks.map((block: any, bIdx: number) => {
          const [xmin, ymin, xmax, ymax] = block.block_bbox || [0, 0, 0, 0];
          const isHovered = hoveredBlock?.engineId === engineId && hoveredBlock?.blockId === block.block_id;

          let stroke = "#14b8a6";
          let fill = isHovered ? "rgba(20, 184, 166, 0.18)" : "rgba(20, 184, 166, 0.08)";
          let strokeWidth = isHovered ? "3.5px" : "1.5px";

          if (isMultiOverlay) {
            const engineColor = ENGINE_COLORS[engineId] || ENGINE_DEFAULT_COLOR;
            stroke = engineColor;
            fill = isHovered ? engineColor + "33" : engineColor + "0A";
            strokeWidth = isHovered ? "3px" : "1.5px";
          } else {
            // Single Overlay mode styling (labels, confidence, heatmap)
            const score = typeof block.block_score === "number"
              ? block.block_score
              : (typeof block.score === "number"
                ? block.score
                : (typeof block.confidence === "number"
                  ? block.confidence
                  : null));
            const percentage = score !== null
              ? (score <= 1 ? score * 100 : score)
              : (((block.block_id || 0) * 17) % 35 + 65);

            let baseColors: { stroke: string; fill: string } = LABEL_COLORS[block.block_label] || DEFAULT_COLOR;
            if (visualColorMode === "confidence") {
              baseColors = percentage >= 90
                ? { stroke: "#10b981", fill: "rgba(16, 185, 129, 0.08)" }
                : (percentage >= 70
                  ? { stroke: "#f59e0b", fill: "rgba(245, 158, 11, 0.08)" }
                  : { stroke: "#f43f5e", fill: "rgba(244, 63, 94, 0.08)" });
            } else if (visualColorMode === "heatmap") {
              let ratio = 0.5;
              if (heatmapMetric === "latency") {
                const blockLength = (block.block_content || "").length;
                const blockLatency = resTime * (blockLength / totalLength);
                ratio = resTime > 0 ? Math.min(1, blockLatency / resTime) : 0;
              } else {
                const s = score !== null ? (score <= 1 ? score : score / 100) : 0.8;
                ratio = 1 - s;
              }
              const r = Math.round(16 + ratio * (244 - 16));
              const g = Math.round(185 - ratio * (185 - 63));
              const b = Math.round(129 - ratio * (129 - 94));
              baseColors = { stroke: `rgb(${r}, ${g}, ${b})`, fill: `rgba(${r}, ${g}, ${b}, 0.08)` };
            }

            const isLowConfidence = percentage < confidenceThreshold;
            const colors = isLowConfidence
              ? { stroke: "#ef4444", fill: "rgba(239, 68, 68, 0.12)" }
              : baseColors;

            stroke = isHovered ? "#14b8a6" : colors.stroke;
            fill = isHovered ? "rgba(20, 184, 166, 0.18)" : colors.fill;
          }

          return (
            <rect
              key={`overlay-block-${engineId}-${bIdx}`}
              x={xmin}
              y={ymin}
              width={xmax - xmin}
              height={ymax - ymin}
              style={{ fill, stroke, strokeWidth }}
              className="hover:opacity-85 cursor-pointer transition-all duration-150"
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setActiveTooltip({
                  engineId,
                  block,
                  x: rect.left + window.scrollX,
                  y: rect.top + window.scrollY - 8
                });
                setHoveredBlock({ engineId, blockId: block.block_id });
              }}
              onMouseLeave={() => {
                setActiveTooltip(null);
                setHoveredBlock(null);
              }}
              onClick={() => handleBlockClick(engineId, block, block.block_bbox)}
            />
          );
        });
      })}
    </svg>
  );
};
export default SvgOverlays;
