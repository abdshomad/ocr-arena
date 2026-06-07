import asyncio
import os
import sys
from playwright.async_api import async_playwright

# Allow importing helpers from the tests folder
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from tests.helpers import setup_browser, ensure_screenshots_dir, setup_history_api_mock

async def run_history_tests():
    ensure_screenshots_dir()
    async with async_playwright() as p:
        browser, context, page = await setup_browser(p)
        
        # Setup dialog listener to auto-accept confirmation dialogs
        page.on("dialog", lambda dialog: dialog.accept())
        
        # Set up mock history responses
        await setup_history_api_mock(page)
        
        # Step 6: Navigate to History Page
        print("Navigating to http://localhost:7890/history...")
        await page.goto("http://localhost:7890/history")
        await page.wait_for_timeout(3000)
        
        print("Taking screenshot 06-step6-history-page.jpg...")
        await page.screenshot(path="./screenshots/06-step6-history-page.jpg")
        
        # Test Export CSV (Feature 24)
        print("Clicking Export CSV button...")
        async with page.expect_download() as download_info:
            await page.locator("#export-csv-btn").click(force=True)
        download = await download_info.value
        dl_path = await download.path()
        print(f"CSV file successfully downloaded to path: {dl_path}")
        await page.wait_for_timeout(1000)
        
        # Step 6-lightbox: Open Lightbox Preview modal
        print("Clicking row Preview button to open Lightbox...")
        await page.locator("[id^='preview-btn-']").first.click(force=True)
        await page.wait_for_selector("#history-lightbox-modal", state="attached")
        await page.wait_for_timeout(2500)
        
        print("Taking screenshot 06-step6-lightbox-modal.jpg...")
        await page.screenshot(path="./screenshots/06-step6-lightbox-modal.jpg")
        
        # Close Lightbox modal
        print("Closing Lightbox modal...")
        await page.locator("#close-lightbox-btn").click(force=True)
        await page.wait_for_selector("#history-lightbox-modal", state="hidden")
        await page.wait_for_timeout(1000)
        
        # Step 6b: Test Batch Selection
        print("Toggling Select All checkbox on History Page...")
        await page.locator("#select-all-history-checkbox").click(force=True)
        await page.wait_for_timeout(1500)
        
        print("Taking screenshot 06-step6b-batch-selection.jpg...")
        await page.screenshot(path="./screenshots/06-step6b-batch-selection.jpg")
        
        # Test Batch Export Selected runs as ZIP
        print("Clicking Export Selected ZIP button...")
        async with page.expect_download() as download_info:
            await page.locator("#export-zip-btn").click(force=True)
        download = await download_info.value
        dl_path = await download.path()
        print(f"Batch ZIP file downloaded to: {dl_path}")
        await page.wait_for_timeout(1000)
        
        # Untoggle Select All checkbox to restore state
        print("Untoggling Select All checkbox...")
        await page.locator("#select-all-history-checkbox").click(force=True)
        await page.wait_for_timeout(1000)
        
        # Step 6c: Test Date Range and File Size Filters
        print("Setting Start Date to 2026-06-01...")
        await page.locator("#start-date-filter").fill("2026-06-01")
        await page.wait_for_timeout(1000)
        
        print("Dragging Max Size slider down to 1MB...")
        await page.locator("#max-size-slider").fill("1000000")
        await page.wait_for_timeout(1500)
        
        print("Taking screenshot 06-step6c-filters-applied.jpg...")
        await page.screenshot(path="./screenshots/06-step6c-filters-applied.jpg")
        
        # Reset filters
        print("Resetting filters...")
        await page.locator("#start-date-filter").fill("")
        await page.locator("#max-size-slider").fill("5000000")
        await page.wait_for_timeout(1000)
        
        # Test Search Scan Outputs and Metadata (Feature 28)
        print("Testing history search box (normal query)...")
        await page.locator("#history-search-input").fill("Acme")
        await page.wait_for_timeout(1000)
        print("Taking screenshot 06-step6e-search-normal.jpg...")
        await page.screenshot(path="./screenshots/06-step6e-search-normal.jpg")
        
        # Test Advanced Search with Regular Expressions (Regex) (Feature 31)
        print("Toggling regex search mode...")
        await page.locator("#regex-toggle-btn").click(force=True)
        await page.wait_for_timeout(500)
        print("Searching with regex pattern...")
        await page.locator("#history-search-input").fill("Acme\\s+Global")
        await page.wait_for_timeout(1000)
        print("Taking screenshot 06-step6f-search-regex.jpg...")
        await page.screenshot(path="./screenshots/06-step6f-search-regex.jpg")
        
        # Reset search
        await page.locator("#history-search-input").fill("")
        await page.locator("#regex-toggle-btn").click(force=True)
        await page.wait_for_timeout(1000)
        
        # Test Multi-Column History Sorting (Feature 32)
        print("Sorting by Name...")
        await page.locator("span:has-text('Name')").first.click(force=True)
        await page.wait_for_timeout(1000)
        print("Sorting by Size with Shift key...")
        await page.locator("span:has-text('Size')").first.click(modifiers=["Shift"], force=True)
        await page.wait_for_timeout(1000)
        print("Taking screenshot 06-step6g-multi-column-sorted.jpg...")
        await page.screenshot(path="./screenshots/06-step6g-multi-column-sorted.jpg")
        
        # Reset sort by clicking Date again
        await page.locator("span:has-text('Date')").first.click(force=True)
        await page.wait_for_timeout(1000)
        
        # Test Metadata Expandable Tree Viewer (Feature 25)
        print("Toggling a metadata tree node (Items)...")
        items_tree_node = page.locator("span:has-text('Items')").first
        if await items_tree_node.count() > 0:
            await items_tree_node.click(force=True)
            await page.wait_for_timeout(1000)
            print("Taking screenshot 06-step6h-tree-node-toggled.jpg...")
            await page.screenshot(path="./screenshots/06-step6h-tree-node-toggled.jpg")
            
            # Collapse it back
            await items_tree_node.click(force=True)
            await page.wait_for_timeout(500)
        
        # Test Batch Deletion of Log History (Feature 22)
        print("Selecting first document row checkbox...")
        await page.locator("input[type='checkbox']").nth(1).click(force=True)
        await page.wait_for_timeout(500)
        
        print("Clicking delete selected button...")
        await page.locator("#delete-selected-btn").click(force=True)
        await page.wait_for_timeout(2000)
        
        # Step 6d: Test Export Backup
        print("Clicking Export Backup button...")
        async with page.expect_download() as download_info:
            await page.locator("text=Export Backup").click(force=True)
        download = await download_info.value
        dl_path = await download.path()
        print(f"Backup JSON file downloaded to: {dl_path}")
        await page.wait_for_timeout(1000)
        
        await browser.close()
        print("History tests finished successfully!")

if __name__ == "__main__":
    asyncio.run(run_history_tests())
