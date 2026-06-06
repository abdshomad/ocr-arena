# OCR Arena Feature List

This document lists all fully implemented features in the OCR Arena web application, grouped by application section.

---

## Completed Features

### Compare Workspace

1. **Parse Grounding Box Coordinates from DeepSeek OCR 2** (Plan 2 Task 1)
   - Extracts bounding coordinates from DeepSeek OCR 2's custom grounding tokens (`<|det|>[[ymin, xmin, ymax, xmax]]`) to map layout entities.
2. **Interactive SVG Bounding Box Overlay** (Plan 2 Task 2)
   - Renders interactive SVG polygons on top of the original uploaded document, featuring hover tooltips that display the block's OCR content.
3. **Bounding Box Label and Confidence Highlights** (Plan 2 Task 3)
   - Color-codes bounding boxes by classification label or OCR confidence ranges.
4. **Bounding Box Type Filtering** (Plan 3 Task 1)
   - Provides checkboxes to filter the display of bounding box categories (e.g., text, table, formula, image).
5. **Interactive Zoom and Pan** (Plan 3 Task 2)
   - Enables mouse-wheel zoom, drag-to-pan, and control buttons on the original document visual overlay canvas.
6. **Side-by-Side OCR Comparison & Character Diffing** (Plan 3 Task 3)
   - Highlights character-level discrepancies between selected OCR engines' output text side-by-side.
7. **Synchronized Multi-Model Text Search & Highlighting** (Plan 4 Task 1)
   - Real-time search highlighting terms or patterns across all active model outputs simultaneously.
8. **Editable Ground Truth Pane** (Plan 4 Task 3)
   - Allows users to enter reference ground truth text to automatically measure Levenshtein-based OCR accuracy in real-time.
9. **Interactive Font Size and Line Height Controls** (Plan 5 Task 1)
   - Local typography styling overrides (font scale, cozy/compact line heights) for engine cards.
10. **Synchronized Scroll Toggle** (Plan 5 Task 2)
    - Synchronizes the vertical scroll position across all active model markdown containers.
11. **Dynamic Layout Grid Columns Selector** (Plan 5 Task 3)
    - Toggles workspace grid structures dynamically between 1-column, 2-column, or 3-column views.
12. **Engine Column Show/Hide Filters** (Plan 6 Task 1)
    - Allows users to show or hide specific engine comparison cards in the workspace grid.
13. **Interactive Bounding Box Zoom-to-Crop Panel** (Plan 6 Task 2)
    - Double-clicking an SVG box opens a crop window showing the exact image region next to its recognized text.
14. **Dedicated Side-by-Side Aligned Split Diff View** (Plan 6 Task 3)
    - Aligns and highlights deletions/additions between baseline and comparative model outputs in split view panels.
15. **Character/Word Error Rate Benchmarking** (Plan 7 Task 1)
    - Computes and displays Character Error Rate (CER) and Word Error Rate (WER) percentages on engine cards when Ground Truth is active.
16. **Interactive Bounding Box Highlight Hover Sync** (Plan 7 Task 2)
    - Synchronizes mouse hovering between layout boxes in the overlay image and lines in the parsed output text.
17. **Dynamic Word-level Inline Diff Mode** (Plan 7 Task 3)
    - Highlights word-level modifications inline within compare panels.
18. **PDF Multi-page Dropdown Selection & Rendering** (Plan 8 Task 1)
    - Supports multi-page PDF document uploads with pagination to view and compare specific pages.
19. **Interactive Bounding Box Click-to-Scroll & Focus** (Plan 9 Task 1)
    - Clicking an SVG bounding box scrolls the corresponding card's text panel directly to the matching content and flashes a temporary highlight.
20. **Side-by-Side Bounding Box Visual Diff Overlay** (Plan 9 Task 2)
    - Overlays bounding boxes from two different engines simultaneously in contrasting colors to check layout parsing discrepancies.
21. **Dynamic OCR Output Export Formats** (Plan 9 Task 3)
    - Adds export actions (Markdown, JSON, HTML, Plain Text) to save individual engine outputs.

### Scan History

22. **Batch Deletion of Log History** (Plan 5 Task 4)
    - Deletes multiple selected historical scans from the database in a single action.
23. **Date Range and File Size Filters** (Plan 5 Task 5)
    - Filters history logs dynamically using start/end date selectors and a file size threshold slider.
24. **Export History Log to CSV** (Plan 5 Task 6)
    - Downloads the history table metadata as a structured CSV file.
25. **Metadata Expandable Tree Viewer** (Plan 6 Task 4)
    - Renders structured receipt/invoice JSON logs in an interactive collapsible tree layout.
26. **Categorical Tag Filters and Grouping Badges** (Plan 6 Task 5)
    - Quick-filters history logs by currency, invoice vendor, or document type badges.
27. **Image and Text Side-by-Side Lightbox** (Plan 6 Task 6)
    - Interactive comparison lightbox displaying the source document image on the left and parsed Markdown output on the right.
28. **Search Scan Outputs and Metadata** (Plan 7 Task 4)
    - Real-time text filter across raw OCR text and metadata keys/values.
29. **Batch Export of Selected Runs as ZIP** (Plan 7 Task 5)
    - Combines selected runs into a download ZIP containing source images, Markdown text, and JSON metadata.
30. **Edit Document Tags and Category Metadata** (Plan 7 Task 6)
    - Supports inline tag editing for historical entries, writing directly to the database.
31. **Advanced Search with Regular Expressions (Regex)** (Plan 9 Task 4)
    - Upgrades history searching to support complex pattern matching queries.
32. **Multi-Column History Sorting** (Plan 9 Task 5)
    - Multi-column sort capabilities by holding Shift key on column headers.
33. **Database Backup & Restore (JSON Import/Export)** (Plan 9 Task 6)
    - Compiles all history records into a JSON backup file and supports JSON uploads to restore data.

### Telemetry & Analytics

34. **Error Categorization and Diagnostic Breakdown** (Plan 6 Task 7)
    - Groups and displays failed runs categorized by error categories (OOM, Timeout, Network, General) per engine model.
35. **Interactive Side-by-Side Run Comparison Inspector** (Plan 6 Task 8)
    - Compares execution profiles, latencies, sizes, and outputs of two selected runs side-by-side in a modal.
36. **Latency Percentile Cards (p50, p90, p99)** (Plan 6 Task 9)
    - Computes and displays latency stability metrics across the database.
37. **Latency vs. Output Size Scatter Plot** (Plan 7 Task 7)
    - Custom SVG scatter plot representing performance scaling across document length.
38. **Telemetry Log Search and Filter by Status/Engine** (Plan 7 Task 8)
    - Searchable logs table with model and status filters in the Telemetry view.
39. **Detailed Cost Estimation and Token Analytics** (Plan 7 Task 9)
    - Tracks and projects cumulative pricing based on modeled per-character rates.
40. **Comparative PDF Page-Count Latency Breakdown** (Plan 9 Task 7)
    - Scatter plot tracking processing speeds relative to document page volume.
41. **Custom Date Range & Custom Segment Filters** (Plan 9 Task 8)
    - Recalculates all telemetry statistics and percentile lists dynamically based on filter selections.
42. **Error Rate Trend Chart over Time** (Plan 9 Task 9)
    - Interactive SVG time-series stacked area chart representing error frequency and rate trends.

### Other / Shared

43. **Unified Export Tool** (Plan 4 Task 2)
    - Exports workspace runs comparison as a ZIP package containing Markdown files and a summary CSV.
