"use client";

import React from "react";
import { useHistoryState } from "./hooks/useHistoryState";
import { useHistoryHandlers } from "./hooks/useHistoryHandlers";
import { useHistoryExport } from "./hooks/useHistoryExport";
import { useHistoryMetadata } from "./hooks/useHistoryMetadata";
import { useHistoryFilters } from "./hooks/useHistoryFilters";

import { HistoryHeader } from "./components/HistoryHeader";
import { HistoryHeatmap } from "./components/HistoryHeatmap";
import { HistorySidebar } from "./components/HistorySidebar";
import { HistoryTable } from "./components/HistoryTable";
import { HistoryLightbox } from "./components/HistoryLightbox";
import { HistoryBulkEditModal } from "./components/HistoryBulkEditModal";
import { HistoryLoginView } from "./components/HistoryLoginView";
import { HistorySearchToolbar } from "./components/HistorySearchToolbar";

export const dynamic = "force-dynamic";

export default function HistoryPage() {
  const state = useHistoryState();
  const handlers = useHistoryHandlers(state);
  const exportHandlers = useHistoryExport(state, handlers.fetchHistory);
  const metadataHandlers = useHistoryMetadata(state);
  const filters = useHistoryFilters(state);

  if (!state.isAuthenticated) {
    return (
      <HistoryLoginView
        tokenInput={state.tokenInput}
        setTokenInput={state.setTokenInput}
        loginError={state.loginError}
        setLoginError={state.setLoginError}
        handleLogin={handlers.handleLogin}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[var(--fluent-bg)] text-[var(--fluent-text)] flex flex-col font-sans transition-colors duration-200">
      <HistoryHeader
        theme={state.theme}
        toggleTheme={handlers.toggleTheme}
        restoringBackup={state.restoringBackup}
        fileInputRef={state.fileInputRef}
        handleRestoreImport={exportHandlers.handleRestoreImport}
        handleBackupExport={exportHandlers.handleBackupExport}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-6 overflow-y-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">Scan History Log</h2>
            <p className="text-xs text-slate-550 dark:text-slate-400">
              {filters.filteredHistory.length === state.historyList.length
                ? `Total ${state.historyList.length} scans found in database`
                : `Showing ${filters.filteredHistory.length} of ${state.historyList.length} scans`}
            </p>
          </div>
          
          <HistoryHeatmap
            runsPerDay={filters.runsPerDay}
            startDate={state.startDate}
            endDate={state.endDate}
            setStartDate={state.setStartDate}
            setEndDate={state.setEndDate}
            heatmapScrollRef={state.heatmapScrollRef}
          />
        </div>

        <HistorySearchToolbar
          searchQuery={state.searchQuery}
          setSearchQuery={state.setSearchQuery}
          isRegexSearch={state.isRegexSearch}
          setIsRegexSearch={state.setIsRegexSearch}
          isRegexValid={filters.isRegexValid}
          typeFilter={state.typeFilter}
          setTypeFilter={state.setTypeFilter}
          startDate={state.startDate}
          setStartDate={state.setStartDate}
          endDate={state.endDate}
          setEndDate={state.setEndDate}
          maxSizeFilter={state.maxSizeFilter}
          setMaxSizeFilter={state.setMaxSizeFilter}
          selectedItems={state.selectedItems}
          exportingZip={state.exportingZip}
          handleExportSelectedZIP={exportHandlers.handleExportSelectedZIP}
          handleDeleteSelected={handlers.handleDeleteSelected}
          setBulkCustomTag={state.setBulkCustomTag}
          setIsBulkEditOpen={state.setIsBulkEditOpen}
          handleExportHTMLReport={exportHandlers.handleExportHTMLReport}
          handleExportCSV={() => exportHandlers.handleExportCSV(filters.filteredHistory)}
          sortColumns={state.sortColumns}
          setSortColumns={state.setSortColumns}
        />

        <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
          {!state.loading && state.historyList.length > 0 && (
            <HistorySidebar
              historyList={state.historyList}
              loading={state.loading}
              selectedTags={state.selectedTags}
              setSelectedTags={state.setSelectedTags}
              statusFilter={state.statusFilter}
              setStatusFilter={state.setStatusFilter}
              loveFilter={state.loveFilter}
              setLoveFilter={state.setLoveFilter}
              likeFilter={state.likeFilter}
              setLikeFilter={state.setLikeFilter}
              starsFilter={state.starsFilter}
              setStarsFilter={state.setStarsFilter}
              fastFilter={state.fastFilter}
              setFastFilter={state.setFastFilter}
            />
          )}

          <div className="flex-1 min-w-0 w-full">
            {state.loading ? (
              <div className="space-y-4 py-12 animate-pulse">
                <div className="h-10 bg-slate-200 dark:bg-slate-900 rounded-xl"></div>
                <div className="h-16 bg-slate-200 dark:bg-slate-900 rounded-xl"></div>
              </div>
            ) : filters.filteredHistory.length === 0 ? (
              <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center flex flex-col items-center justify-center shadow-lg text-slate-400">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-300">No History Found</h3>
                <p className="text-xs text-slate-550 mt-1">
                  There are no documents matching the filter.
                </p>
              </div>
            ) : (
              <HistoryTable
                filteredHistory={filters.filteredHistory}
                sortedHistory={filters.sortedHistory}
                groupedHistory={filters.groupedHistory}
                groupKeys={filters.groupKeys}
                selectedItems={state.selectedItems}
                setSelectedItems={state.setSelectedItems}
                collapsedGroups={state.collapsedGroups}
                toggleGroup={filters.toggleGroup}
                searchQuery={state.searchQuery}
                isRegexSearch={state.isRegexSearch}
                setPreviewItem={state.setPreviewItem}
                handleDelete={handlers.handleDelete}
                sortColumns={state.sortColumns}
                handleSort={filters.handleSort}
              />
            )}
          </div>
        </div>
      </main>

      {state.previewItem && (
        <HistoryLightbox
          previewItem={state.previewItem}
          setPreviewItem={state.setPreviewItem}
          previewMarkdown={state.previewMarkdown}
          previewRawResult={state.previewRawResult}
          loadingPreview={state.loadingPreview}
          searchQuery={state.searchQuery}
          isRegexSearch={state.isRegexSearch}
          onSubmitFeedback={metadataHandlers.onSubmitFeedback}
        />
      )}

      {state.isBulkEditOpen && (
        <HistoryBulkEditModal
          selectedItems={state.selectedItems}
          setIsBulkEditOpen={state.setIsBulkEditOpen}
          bulkCustomTag={state.bulkCustomTag}
          setBulkCustomTag={state.setBulkCustomTag}
          handleSaveBulkTags={metadataHandlers.handleSaveBulkTags}
          savingBulkTags={state.savingBulkTags}
        />
      )}
    </div>
  );
}
