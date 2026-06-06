/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { highlightText } from "../utils/historyHelpers";

interface JsonNodeProps {
  label: string;
  value: any;
  level?: number;
  searchQuery?: string;
  isRegex?: boolean;
}

export const JsonTreeNode: React.FC<JsonNodeProps> = ({
  label,
  value,
  level = 0,
  searchQuery = "",
  isRegex = false
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const isObject = value !== null && typeof value === "object";
  const indent = level * 12; // 12px indent per level

  const formatLabel = (key: string) => {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase());
  };

  if (!isObject) {
    const strVal = String(value).trim();
    if (
      !strVal ||
      strVal.toLowerCase() === "not found" ||
      strVal.toLowerCase() === "not_found" ||
      strVal.toLowerCase() === "notfound"
    ) {
      return null;
    }
    return (
      <div 
        style={{ paddingLeft: `${indent}px` }} 
        className="flex items-start gap-1.5 py-0.5 border-b border-slate-100/10 dark:border-slate-800/10 text-[11px]"
      >
        <span className="text-slate-400 dark:text-slate-500 font-semibold select-none">
          {highlightText(formatLabel(label), searchQuery, isRegex)}:
        </span>
        <span className="text-slate-700 dark:text-slate-300 font-medium break-all select-text">
          {highlightText(strVal, searchQuery, isRegex)}
        </span>
      </div>
    );
  }

  const keys = Object.keys(value);
  if (keys.length === 0) return null;

  const isArray = Array.isArray(value);
  const displayLabel = isArray ? `${formatLabel(label)} [${keys.length}]` : formatLabel(label);

  return (
    <div className="flex flex-col">
      <div 
        style={{ paddingLeft: `${indent}px` }}
        className="flex items-center gap-1 py-1 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/30 rounded transition-colors text-[11px]"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="text-[8px] text-slate-400 font-bold select-none w-3 text-center">
          {isExpanded ? "▼" : "▶"}
        </span>
        <span className="text-[#0078d4] dark:text-[#0078d4] font-bold select-none">
          {highlightText(displayLabel, searchQuery, isRegex)}
        </span>
      </div>
      {isExpanded && (
        <div className="flex flex-col space-y-0.5">
          {keys.map((key) => (
            <JsonTreeNode 
              key={key} 
              label={isArray ? `#${key}` : key} 
              value={value[key]} 
              level={level + 1} 
              searchQuery={searchQuery}
              isRegex={isRegex}
            />
          ))}
        </div>
      )}
    </div>
  );
};
