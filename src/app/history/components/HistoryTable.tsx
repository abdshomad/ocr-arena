/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { DocumentHistoryItem, ENGINES } from "../utils/historyHelpers";
import { JsonTreeNode } from "./JsonTreeNode";
import { HistoryDesktopTable } from "./HistoryDesktopTable";
import { HistoryMobileTable } from "./HistoryMobileTable";

interface HistoryTableProps {
  filteredHistory: DocumentHistoryItem[];
  sortedHistory: DocumentHistoryItem[];
  groupedHistory: Record<string, DocumentHistoryItem[]>;
  groupKeys: string[];
  selectedItems: string[];
  setSelectedItems: React.Dispatch<React.SetStateAction<string[]>>;
  collapsedGroups: Record<string, boolean>;
  toggleGroup: (groupName: string) => void;
  searchQuery: string;
  isRegexSearch: boolean;
  setPreviewItem: (item: DocumentHistoryItem | null) => void;
  handleDelete: (filename: string) => void;
  sortColumns: { id: string; desc: boolean }[];
  handleSort: (columnId: string, event: React.MouseEvent) => void;
}

export const HistoryTable: React.FC<HistoryTableProps> = (props) => {
  const getEngineDisplay = (engineId: string) => {
    const found = ENGINES.find((e) => e.id === engineId);
    return found ? `${found.logo} ${found.name}` : `🤖 ${engineId}`;
  };

  const renderSortIndicator = (columnId: string) => {
    const idx = props.sortColumns.findIndex((col) => col.id === columnId);
    if (idx === -1) {
      return (
        <span className="text-slate-350 dark:text-slate-600 ml-1 opacity-60 group-hover:opacity-100 transition-opacity select-none cursor-pointer">
          ↕
        </span>
      );
    }
    const col = props.sortColumns[idx];
    return (
      <span className="inline-flex items-center gap-0.5 ml-1 text-[#0078d4] font-extrabold select-none cursor-pointer">
        {col.desc ? "▼" : "▲"}
        {props.sortColumns.length > 1 && (
          <span className="text-[7.5px] bg-[#0078d4]/10 text-[#0078d4] dark:text-[#0078d4] px-1 py-0.2 rounded-full font-extrabold leading-none">
            {idx + 1}
          </span>
        )}
      </span>
    );
  };

  const renderMetadata = (metadata: Record<string, any> | null) => {
    if (!metadata || typeof metadata !== "object" || Object.keys(metadata).length === 0) {
      return <span className="text-slate-500 italic text-[10px]">No metadata parsed</span>;
    }

    const keys = Object.keys(metadata).filter((key) => {
      const val = metadata[key];
      if (val === null || val === undefined) return false;
      if (typeof val === "object") {
        return Object.keys(val).length > 0;
      }
      const strVal = String(val).trim().toLowerCase();
      return strVal !== "not found" && strVal !== "not_found" && strVal !== "notfound" && strVal !== "";
    });

    if (keys.length === 0) {
      return <span className="text-slate-500 italic text-[10px]">No metadata parsed</span>;
    }

    return (
      <div className="flex flex-col gap-1 text-[11px] max-w-md">
        {keys.map((key) => (
          <JsonTreeNode 
            key={key} 
            label={key} 
            value={metadata[key]} 
            searchQuery={props.searchQuery} 
            isRegex={props.isRegexSearch} 
          />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-850 shadow-xl overflow-hidden transition-all duration-200">
      <HistoryDesktopTable
        {...props}
        getEngineDisplay={getEngineDisplay}
        renderSortIndicator={renderSortIndicator}
        renderMetadata={renderMetadata}
      />
      <HistoryMobileTable
        {...props}
        getEngineDisplay={getEngineDisplay}
        renderMetadata={renderMetadata}
      />
    </div>
  );
};
