# OCR Arena Next Enhancements Plan

This document lists all remaining pending enhancement tasks for the OCR Arena application, consolidated from all prior plan cycles.

---

## Tasks

### Section 1: Compare Workspace

- [DONE] **Task 1**: Structural Layout Entity Filtering
  - **Objective**: Introduce checklist filters to toggle rendering of specific structural entity categories (e.g. text blocks, inline formulas, tables, figures) in both the Visual Overlay and parsed markdown views.
  - **Verification**: Toggling structural checklist items hides or displays corresponding blocks in the output tabs.

- [DONE] **Task 2**: OCR Performance Profile Heatmap Overlay
  - **Objective**: Render a heat-mapped visual overlay option on the original document to highlight bounding boxes by local latency or confidence density.
  - **Verification**: Activating the performance heatmap colors boxes red-to-green indicating relative processing time or confidence ranges.

- [DONE] **Task 3**: Bounding Box Confidence Score Filtering Slider
  - **Objective**: Add a confidence threshold slider in the Compare Workspace Visual Overlay options. When adjusted, bounding boxes with OCR confidence below the threshold are highlighted in red or isolated, while those above are dimmed/hidden, helping users quickly target low-confidence segments.
  - **Verification**: Dragging the slider dynamically hides or changes styling for bounding boxes on the overlay based on their confidence values.

- [DONE] **Task 4**: Unified OCR Font Size & Line Wrap Control
  - **Objective**: Add a global typography toolbar in the Compare Workspace that dynamically changes the font size and toggles word-wrap synchronously across all active OCR output cards.
  - **Verification**: Changing the font size slider or toggling the wrap button updates the text display on all cards instantly.

- [DONE] **Task 5**: Engine Performance Metric Matrix Drawer
  - **Objective**: Introduce a side-by-side performance matrix drawer comparing OCR metrics (latency, character count, estimated cost, and average word confidence) for the current active scan.
  - **Verification**: Clicking "View Performance Matrix" opens a drawer with a clear tabular breakdown of these metrics, highlighting the fastest and most confident engines.

- [DONE] **Task 18**: Interactive Visual Document Cropper & Dynamic Regional Re-Analysis
  - **Objective**: Introduce a cropping/selection tool directly on the Interactive Document Canvas. Clicking and dragging on the canvas allows selecting a custom rectangular region of the image, then clicking "Analyze Region" triggers a regional OCR comparison for just that cropped bounding box.
  - **Verification**: Toggling crop mode, selecting a region on the image canvas, and running analysis updates the output tabs with text parsed only from that cropped region.

- [DONE] **Task 19**: Unified Multi-Engine Side-by-Side SVG Bounding Box Comparison Overlay
  - **Objective**: Allow users to display bounding boxes from multiple selected engines simultaneously on the document canvas, utilizing distinct color hues per engine (rather than just selecting one overlay engine). Add a legend toggle to easily show/hide specific models' box layers.
  - **Verification**: Activating multiple overlay checkbox layers displays bounding boxes from different engines overlaying each other, with color-coded borders matching the engine palette.

- [PENDING] **Task 20**: Direct Annotation & Correction of Ground Truth from Bounding Box Crops
  - **Objective**: Enable users to edit/override the parsed OCR text directly inside the selected crop inspector modal. Submitting these corrections will automatically populate them into the Ground Truth Reference text block corresponding to that section, recalculating CER/WER metrics instantly.
  - **Verification**: Double-clicking a bounding box to open the inspector, editing the parsed text, and clicking "Save to Reference" updates the Ground Truth Reference text and recalculates accuracy.

- [PENDING] **Task 27**: Custom Character/Word Regex Exclusion Filters for CER/WER Benchmarking
  - **Objective**: Allow users to define a list of regex or character patterns (e.g. whitespace, punctuation, specific metadata fields) to ignore during CER/WER calculations in the Ground Truth comparison.
  - **Verification**: Inputting a pattern like `\s+` or `[.,\/#!$%\^&\*;:{}=\-_`~()]` recalculates the CER/WER metrics instantly, ignoring those matching segments in both the OCR results and ground truth text.

- [PENDING] **Task 28**: Interactive Visual Block Merger & Regional Re-OCR
  - **Objective**: Allow users to select multiple adjacent bounding boxes on the Document Canvas and click "Merge & Re-OCR" to analyze the combined rectangular region as a single block across all engines.
  - **Verification**: Selecting multiple blocks, clicking merge, and running re-analysis displays the combined recognized text in the overlay tooltips and comparison cards.

- [PENDING] **Task 29**: Live PDF Interactive Page-by-Page Comparison Layout
  - **Objective**: Provide a split/grid view option that renders two different pages of a multi-page PDF side-by-side (or same page from different engine perspectives) with synchronized zooming/panning.
  - **Verification**: Activating "Page Compare Mode" allows selecting different page numbers for the left/right viewer frames and synchronously zooms both.


### Section 2: Scan History

- [DONE] **Task 6**: Interactive Timeline Grouping
  - **Objective**: Group scan logs in the history table by chronological milestones ("Today", "Yesterday", "Last 7 Days", etc.) inside expandable/collapsible sections.
  - **Verification**: The history table displays headers for each time group, allowing sections to be collapsed.

- [DONE] **Task 7**: Categorical Metadata Distribution Filters
  - **Objective**: Add an interactive sidebar summarizing metadata distributions (e.g. top vendors, file categories, currencies) that can be clicked to quickly filter the history logs.
  - **Verification**: Clicking a summary tag updates the table query parameters and displays only matching rows.

- [DONE] **Task 8**: Bulk Metadata Tagging & Update Operations
  - **Objective**: Support batch metadata editing where checking multiple rows in the history table displays a toolbar to update tags or vendor categories simultaneously.
  - **Verification**: Selecting multiple logs and setting a vendor category updates all selected database entries.

- [DONE] **Task 9**: Activity Heatmap Calendar View
  - **Objective**: Add a GitHub-style activity calendar heatmap at the top of the Scan History page showing the frequency of OCR runs per day. Clicking on any date cell filters the history table below to that specific date.
  - **Verification**: The calendar heatmap displays color-coded run frequencies, and clicking a date correctly applies a date filter to the history list.

- [DONE] **Task 10**: Batch History Tagging and Tag Filter
  - **Objective**: Allow users to select multiple records in the history table and apply custom tags in bulk. Integrate a multi-select tag filter in the history page header.
  - **Verification**: Selecting three runs, applying a tag "Q2-Invoices", and then filtering by "Q2-Invoices" returns only those three runs.

- [DONE] **Task 11**: History List Export to HTML Report
  - **Objective**: Provide an option to export selected history runs as a standalone, styled HTML comparison report that users can open locally to view side-by-side text, latency, and accuracy metrics offline.
  - **Verification**: Selecting runs and clicking "Export HTML Report" downloads a self-contained `.html` file with CSS styles and side-by-side comparison tables.

- [PENDING] **Task 21**: Advanced Semantic & Regex Search Query Builder for OCR Text
  - **Objective**: Introduce a query builder in the Scan History sidebar allowing users to search not only filenames but also the parsed OCR outputs using advanced rules (regex, case-sensitivity, or semantic distance/Levenshtein matching thresholds).
  - **Verification**: Entering a regex query like `Invoice\s#\d+` filters the history list to display only scans containing matching strings.

- [PENDING] **Task 22**: Multi-Run Compare Dashboard Launcher from History Selection
  - **Objective**: Allow users to select any two historical runs in the history table (even if they were done on different images or at different times) and launch them directly in a Compare Workspace tab, allowing text diffs and metadata tree comparison.
  - **Verification**: Selecting two items in the history table and clicking "Compare Selected Runs" redirects the user to the Arena workspace with both runs loaded side-by-side.

- [PENDING] **Task 23**: Automated OCR Performance Regression Alert & History Compare Report
  - **Objective**: Integrate a regression reporting tool that compares a selected run against a historical run baseline of the same image, automatically highlighting if the new run shows regression in accuracy (CER/WER) or latency.
  - **Verification**: Selecting a run, choosing a baseline run of the same file, and clicking "Check regression" displays a summary report highlighting changes in metrics (e.g. latency increase or accuracy drop).

- [PENDING] **Task 30**: Scan History Tag-Based Analytics Summary Drawer
  - **Objective**: Build an interactive drawer/sidebar inside Scan History that dynamically plots distributions, avg latency, and error rates of historical runs matching the currently selected tags.
  - **Verification**: Toggling the analytics drawer shows charts and metrics that update dynamically as tags are selected/deselected in the filter header.

- [PENDING] **Task 31**: Scan History Export to Excel / CSV with Embedded Text Diff
  - **Objective**: Enhance the CSV/Excel export tool in the history table to include character and word error metrics against reference ground truths (where available) as well as the raw text.
  - **Verification**: Triggering export downloads a file containing detailed metrics, file sizes, processing details, and accuracy benchmarks.

- [PENDING] **Task 32**: History Runs Auto-Grouping & Duplicate Detection
  - **Objective**: Implement automatic detection of scans performed on identical or highly similar images (using file hashing or visual similarity), offering an option to collapse duplicates into a single run history node.
  - **Verification**: Performing multiple scans of the same file shows them grouped under a single parent entry in the history list, with an expandable history of versions.


### Section 3: Telemetry & Analytics

- [DONE] **Task 12**: Latency Percentile Performance Breakdown (Radar/Polar Area Chart)
  - **Objective**: Render an interactive SVG Radar / Polar Area diagram comparing p50, p90, p99 latencies for each engine model to visualize responsiveness profile.
  - **Verification**: The Telemetry page displays a radar chart with SVG paths mapping each model's latencies.

- [DONE] **Task 13**: Throughput and Concurrency Analytics (Runs per hour/day line chart)
  - **Objective**: Display a historical volume line chart showing processing throughput (runs count) grouped by hour/day with toggle filters to see usage trends over time.
  - **Verification**: A line chart is rendered mapping logs count across selected date ranges.

- [DONE] **Task 14**: Advanced Error Breakdown & Success Rate Heatmap Matrix
  - **Objective**: Render a success-vs-failure breakdown grid/matrix visual showing error rate percentages grouped by file size brackets (e.g. <500KB, 500KB-1MB, 1MB-2MB, >2MB) and engine model.
  - **Verification**: The Telemetry tab displays a grid showing error densities for each model and file size range.

- [DONE] **Task 15**: SVG Cost vs. Latency Trade-off Scatter Plot (Pareto Frontier)
  - **Objective**: Implement an SVG scatter plot mapping the average cost per page on the Y-axis against average latency on the X-axis for each engine, drawing a Pareto frontier line highlighting the most optimal models.
  - **Verification**: A chart is rendered in the Telemetry tab displaying each engine's position and a line indicating the efficiency frontier.

- [DONE] **Task 16**: Service Level Agreement (SLA) Threshold Visual Indicators
  - **Objective**: Allow users to specify target SLA thresholds (e.g. latency target, success rate target) via simple input fields, rendering horizontal dotted threshold lines across latency/error charts and displaying "SLA Pass/Fail" indicators next to each engine card.
  - **Verification**: Modifying SLA inputs updates the threshold lines on the charts and correctly recalculates/displays the SLA status for all engines.

- [DONE] **Task 17**: SVG Radar Chart for Multi-Dimensional Engine Comparison
  - **Objective**: Add an SVG radar (spider) chart to the Telemetry page comparing selected engines across five dimensions: Speed, Accuracy (CER/WER), Cost Efficiency, Success Rate, and Document Variety (diversity of format/languages processed).
  - **Verification**: The radar chart renders overlapping colored polygons representing each engine's multi-dimensional performance score.

- [PENDING] **Task 24**: Interactive Pareto Frontier Optimizer Slider
  - **Objective**: On the Cost vs. Latency Pareto Scatter Plot, add an interactive slider allowing users to input a custom weights preference (e.g., 70% weight on speed, 30% weight on cost). The chart dynamically highlights the single most optimal engine matching that preference profile.
  - **Verification**: Dragging the preference slider recalculates the multi-objective utility score for each model and highlights the winning engine on the scatter plot.

- [PENDING] **Task 25**: Advanced SLA Breaches Time-Series Breakdown & Heatmap Matrix
  - **Objective**: Render a temporal area chart or daily success heatmap displaying SLA breach rates (violations of the latency or accuracy targets) over time. This helps track when specific OCR servers had resource contention or API failures.
  - **Verification**: The chart displays daily counts of runs that failed to satisfy the active SLA targets, filterable by engine.

- [PENDING] **Task 26**: Telemetry Comparison Export to CSV & JSON Reports
  - **Objective**: Provide an option to export aggregated telemetry statistics (averages, percentiles, SLA breach rates, and cost calculations for each model) as downloadable CSV or JSON files.
  - **Verification**: Clicking "Export Telemetry Summary" downloads a file containing the calculated metrics.

- [PENDING] **Task 33**: Real-time Engine Latency & Error Rate Alerts Configurator
  - **Objective**: Allow administrators to configure alert thresholds (e.g. error rate > 5% in 5 min, latency > 5s) directly inside the Telemetry panel, showing alert flags next to the affected engine models.
  - **Verification**: Setting a latency alert to 2.0s triggers visual alert badges on the Telemetry page for any engine exceeding that SLA limit in recent history.

- [PENDING] **Task 34**: Telemetry Historical Comparison Baseline & Drift Analysis
  - **Objective**: Enable comparing telemetry metrics between two timeframes (e.g. this week vs. last week) to detect engine performance degradation, server drift, or response time anomalies.
  - **Verification**: Selecting date range baseline and comparison range displays delta percentages (+/- %) for latency, success rate, and cost on each engine card.

- [PENDING] **Task 35**: Engine Cost Projection & Budget Allocation Simulator
  - **Objective**: Create an interactive simulator in the Telemetry tab where users can input expected monthly document volume and average document sizes to project total monthly cost across different engine combinations.
  - **Verification**: Adjusting the monthly document volume slider recalculates and displays the cost projections side-by-side for each engine model, recommending the most cost-efficient configuration.
