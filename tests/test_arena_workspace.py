import asyncio
import os
import sys
from playwright.async_api import async_playwright

# Allow importing helpers from the tests folder
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from tests.helpers import setup_browser, ensure_screenshots_dir, setup_arena_api_mock

async def run_workspace_tests():
    ensure_screenshots_dir()
    async with async_playwright() as p:
        browser, context, page = await setup_browser(p)
        await setup_arena_api_mock(page)
        
        # Step 1: Navigate to Arena Page
        print("Navigating to http://localhost:7890/arena...")
        await page.goto("http://localhost:7890/arena")
        await page.wait_for_timeout(3000)
        
        print("Taking screenshot 01-step1-initial-arena-load.jpg...")
        await page.screenshot(path="./screenshots/01-step1-initial-arena-load.jpg")
        
        # Step 2: Click on Sample Image #1
        print("Clicking first sample thumbnail...")
        sample_btn = page.locator("button:has-text('Sample 1')").first
        await sample_btn.click(force=True)
        await page.wait_for_timeout(1500)
        
        print("Taking screenshot 02-step2-processing-comparison.jpg...")
        await page.screenshot(path="./screenshots/02-step2-processing-comparison.jpg")
        
        # Step 3: Wait for OCR to complete
        print("Waiting for OCR processing to complete...")
        await page.wait_for_selector("button:has-text('Run analysis')", timeout=180000)
        await page.wait_for_timeout(2000)
        
        print("Taking screenshot 03-step3-default-results.jpg...")
        await page.screenshot(path="./screenshots/03-step3-default-results.jpg")
        
        # Test PDF Multi-page Dropdown Selection & Rendering (Feature 18)
        print("Toggling PDF Multi-page navigation (Forward)...")
        await page.locator("button:has-text('▶')").first.click(force=True)
        await page.wait_for_timeout(1000)
        
        print("Taking screenshot 03-step3m-multi-page-navigated.jpg...")
        await page.screenshot(path="./screenshots/03-step3m-multi-page-navigated.jpg")
        
        # Toggle back to Page 1
        print("Toggling PDF Multi-page navigation (Backward)...")
        await page.locator("button:has-text('◀')").first.click(force=True)
        await page.wait_for_timeout(1000)

        # Test Bounding Box Type Filtering (Feature 4)
        print("Unchecking table entity category checkbox...")
        await page.locator("label:has-text('table') input[type='checkbox']").click(force=True)
        await page.wait_for_timeout(1000)
        print("Taking screenshot 03-step3n-entity-filtered.jpg...")
        await page.screenshot(path="./screenshots/03-step3n-entity-filtered.jpg")
        
        # Restore table checkbox
        await page.locator("label:has-text('table') input[type='checkbox']").click(force=True)
        await page.wait_for_timeout(1000)

        # Test Side-by-Side Bounding Box Visual Diff Overlay (Feature 20)
        print("Activating multi-engine layout overlays (Paddle VL 1.6)...")
        await page.locator("button:has-text('Paddle VL 1.6')").first.click(force=True)
        await page.wait_for_timeout(1000)
        print("Activating multi-engine layout overlays (GLM-OCR)...")
        await page.locator("button:has-text('GLM-OCR')").first.click(force=True)
        await page.wait_for_timeout(1500)
        print("Taking screenshot 03-step3p-multi-engine-overlay.jpg...")
        await page.screenshot(path="./screenshots/03-step3p-multi-engine-overlay.jpg")
        
        # Reset visual overlay selection by unchecking them
        print("Deactivating Paddle VL 1.6 overlay on canvas...")
        await page.locator("button:has-text('Paddle VL 1.6')").first.click(force=True)
        await page.wait_for_timeout(500)
        print("Deactivating GLM-OCR overlay on canvas...")
        await page.locator("button:has-text('GLM-OCR')").first.click(force=True)
        await page.wait_for_timeout(1000)
        
        # Step 3b: Click the "Diff" checkbox
        print("Toggling Diff checkbox...")
        await page.locator("#show-diffs-checkbox").click(force=True)
        await page.wait_for_timeout(2000)
        
        print("Taking screenshot 03-step3b-diff-mode-results.jpg...")
        await page.screenshot(path="./screenshots/03-step3b-diff-mode-results.jpg")
        
        # Toggle Split View off (to test Combined view)
        print("Toggling Split View checkbox off...")
        await page.locator("#split-diff-checkbox").click(force=True)
        await page.wait_for_timeout(1500)
        
        print("Taking screenshot 03-step3b2-combined-diff-mode.jpg...")
        await page.screenshot(path="./screenshots/03-step3b2-combined-diff-mode.jpg")
        
        # Toggle Split View back on
        print("Toggling Split View checkbox back on...")
        await page.locator("#split-diff-checkbox").click(force=True)
        await page.wait_for_timeout(1000)
        
        # Untoggle Diff checkbox
        print("Untoggling Diff checkbox...")
        await page.locator("#show-diffs-checkbox").click(force=True)
        await page.wait_for_timeout(1000)
        
        # Step 3e: Toggle Ground Truth Benchmarking
        print("Toggling Ground Truth checkbox...")
        await page.locator("button:has-text('Ground truth')").click(force=True)
        await page.wait_for_timeout(2000)
        
        print("Taking screenshot 03-step3e-ground-truth-benchmarking.jpg...")
        await page.screenshot(path="./screenshots/03-step3e-ground-truth-benchmarking.jpg")
        
        # Step 3f: Click auto-fill button for Nemotron
        print("Clicking Auto-fill from Nemotron...")
        await page.locator("button:has-text('🟢 Nemotron')").click(force=True)
        await page.wait_for_timeout(2000)
        
        print("Taking screenshot 03-step3f-ground-truth-autofilled.jpg...")
        await page.screenshot(path="./screenshots/03-step3f-ground-truth-autofilled.jpg")
        
        # Untoggle Ground Truth
        print("Untoggling Ground Truth...")
        await page.locator("button:has-text('Ground truth')").click(force=True)
        await page.wait_for_timeout(1000)
        
        # Step 3c: Type in the global search box
        print("Typing 'product' in the highlight search input...")
        await page.locator("input[placeholder='Highlight text...']").fill("product")
        await page.wait_for_timeout(2000)
        
        print("Taking screenshot 03-step3c-highlight-search-results.jpg...")
        await page.screenshot(path="./screenshots/03-step3c-highlight-search-results.jpg")
        
        print("Clearing search box...")
        await page.locator("input[placeholder='Highlight text...']").fill("")
        await page.wait_for_timeout(1000)
        
        # Step 3g: Customize typography options (Font Size: Large) on the first card
        print("Selecting font size Large (Aa+) for the first engine card...")
        await page.locator("[id^='engine-card-'] select").first.select_option("lg")
        await page.wait_for_timeout(1000)
        
        print("Taking screenshot 03-step3g-typography-customized.jpg...")
        await page.screenshot(path="./screenshots/03-step3g-typography-customized.jpg")
        
        print("Resetting typography options on the first card...")
        await page.locator("[id^='engine-card-'] select").first.select_option("sm")
        await page.wait_for_timeout(1000)
        
        # Step 3h: Toggle Sync and scroll the first card container
        print("Toggling Sync checkbox...")
        await page.locator("label:has-text('Sync') input[type='checkbox']").click(force=True)
        await page.wait_for_timeout(1000)
        
        print("Scrolling the first engine card container...")
        scrollable_container = page.locator("div.font-mono.whitespace-pre-wrap").first
        await scrollable_container.evaluate("el => el.scrollTop = 200")
        await page.wait_for_timeout(1500)
        
        print("Taking screenshot 03-step3h-scroll-synchronized.jpg...")
        await page.screenshot(path="./screenshots/03-step3h-scroll-synchronized.jpg")
        
        # Reset scroll position and untoggle Sync
        print("Resetting scroll position and untoggling Sync...")
        await scrollable_container.evaluate("el => el.scrollTop = 0")
        await page.locator("label:has-text('Sync') input[type='checkbox']").click(force=True)
        await page.wait_for_timeout(1000)
        
        # Step 3i: Select 1 Column grid layout and take screenshot
        print("Selecting 1 Column layout...")
        await page.locator("button:has-text('1 col')").click(force=True)
        await page.wait_for_timeout(1500)
        print("Taking screenshot 03-step3i-grid-1col.jpg...")
        await page.screenshot(path="./screenshots/03-step3i-grid-1col.jpg")
        
        # Step 3j: Select 2 Column grid layout and take screenshot
        print("Selecting 2 Column layout...")
        await page.locator("button:has-text('2 col')").click(force=True)
        await page.wait_for_timeout(1500)
        print("Taking screenshot 03-step3j-grid-2col.jpg...")
        await page.screenshot(path="./screenshots/03-step3j-grid-2col.jpg")
        
        # Reset to 3 Column layout
        print("Resetting to 3 Column layout...")
        await page.locator("button:has-text('3 col')").click(force=True)
        await page.wait_for_timeout(1000)
        
        # Step 3k: Test Engine Visibility toggle
        print("Unchecking Paddle OCR VL 1.6 checkbox...")
        await page.locator("label:has-text('Paddle OCR VL 1.6') input[type='checkbox']").click(force=True)
        await page.wait_for_timeout(1500)
        
        print("Taking screenshot 03-step3l-card-hidden.jpg...")
        await page.screenshot(path="./screenshots/03-step3l-card-hidden.jpg")
        
        print("Restoring Paddle OCR VL 1.6...")
        await page.locator("label:has-text('Paddle OCR VL 1.6') input[type='checkbox']").click(force=True)
        # Test individual engine export formats (Feature 21)
        print("Clicking individual engine Export button...")
        await page.locator("[id^='export-container-'] button").first.click(force=True)
        await page.wait_for_timeout(500)
        
        print("Exporting individual JSON format...")
        async with page.expect_download() as download_info:
            await page.locator("[id^='export-container-'] button:has-text('JSON')").first.click(force=True)
        download = await download_info.value
        dl_path = await download.path()
        print(f"Individual output file downloaded to: {dl_path}")
        await page.wait_for_timeout(1000)

        # Step 3d: Export ZIP
        print("Clicking Export ZIP button...")
        async with page.expect_download() as download_info:
            await page.locator("text=Export ZIP").click(force=True)
        download = await download_info.value
        dl_path = await download.path()
        print(f"ZIP file successfully downloaded to path: {dl_path}")
        await page.wait_for_timeout(1000)
        
        await browser.close()
        print("Workspace tests finished successfully!")

if __name__ == "__main__":
    asyncio.run(run_workspace_tests())
