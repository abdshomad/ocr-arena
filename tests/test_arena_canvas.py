import asyncio
import os
import sys
from playwright.async_api import async_playwright

# Allow importing helpers from the tests folder
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from tests.helpers import setup_browser, ensure_screenshots_dir

async def run_canvas_tests():
    ensure_screenshots_dir()
    async with async_playwright() as p:
        browser, context, page = await setup_browser(p)
        
        # Navigate to Arena Page
        print("Navigating to http://localhost:7890/arena...")
        await page.goto("http://localhost:7890/arena")
        await page.wait_for_timeout(3000)
        
        # Click on Sample Image #1
        print("Clicking first sample thumbnail...")
        sample_btn = page.locator("button:has-text('Sample 1')").first
        await sample_btn.click(force=True)
        await page.wait_for_timeout(1500)
        
        # Wait for OCR processing to complete
        print("Waiting for OCR processing to complete...")
        await page.wait_for_selector("span:has-text('done')", timeout=90000)
        await page.wait_for_timeout(2000)
        
        # Step 4: Switch right panel tab to Result
        print("Switching right panel tab to Result...")
        await page.locator("button:has-text('Result')").first.evaluate("el => el.click()")
        await page.wait_for_timeout(1500)
        
        print("Taking screenshot 04-step4-result-grid.jpg...")
        await page.screenshot(path="./screenshots/04-step4-result-grid.jpg")
        
        # Step 4b: Zoom in on the Visual Canvas
        print("Zooming in twice...")
        await page.locator("button:has-text('+')").first.click(force=True)
        await page.wait_for_timeout(500)
        await page.locator("button:has-text('+')").first.click(force=True)
        await page.wait_for_timeout(1000)
        
        print("Taking screenshot 04-step4b-zoomed-canvas.jpg...")
        await page.screenshot(path="./screenshots/04-step4b-zoomed-canvas.jpg")
        
        # Reset Zoom and Pan
        print("Resetting zoom and pan...")
        await page.locator("button:has-text('Reset')").first.click(force=True)
        await page.wait_for_timeout(1000)
        
        # Step 4c: Toggle Confidence Color Mode in Visual Overlay
        print("Toggling Confidence Color Mode...")
        await page.locator("button:has-text('confidence')").click(force=True)
        await page.wait_for_timeout(1500)
        
        # Hover over first bounding box
        print("Hovering over a layout bounding box to display tooltip...")
        first_bbox = page.locator("svg rect").first
        await first_bbox.hover(force=True)
        await page.wait_for_timeout(1500)
        
        print("Taking screenshot 04-step4c-confidence-overlay.jpg...")
        await page.screenshot(path="./screenshots/04-step4c-confidence-overlay.jpg")
        
        # Toggle back to label color mode
        print("Toggling back to Label Color Mode...")
        await page.locator("button:has-text('label')").click(force=True)
        await page.wait_for_timeout(1000)
        
        # Step 4e: Test Bounding Box Zoom-to-Crop Modal
        print("Clicking a layout bounding box to open Crop Inspector modal...")
        await first_bbox.click(force=True)
        await page.wait_for_timeout(1000)
        
        print("Taking screenshot 04d-step4d-zoom-to-crop-modal.jpg...")
        await page.screenshot(path="./screenshots/04d-step4d-zoom-to-crop-modal.jpg")
        
        # Close the Crop Inspector modal
        print("Closing Crop Inspector modal...")
        await page.locator("#close-crop-modal-btn").click(force=True)
        await page.wait_for_timeout(1000)
        
        # Step 5b: Switch right panel tab to Metrics
        print("Switching right panel tab to Metrics...")
        await page.evaluate("window.scrollTo(0, 0)")
        await page.wait_for_timeout(500)
        await page.locator("button:has-text('Metrics')").first.evaluate("el => el.click()")
        await page.wait_for_timeout(2500)
        
        # Verify active SLABenchmarks and Winner cards exist
        print("Verifying metrics elements...")
        await page.wait_for_selector("text=Active SLA Benchmarks", state="attached")
        await page.wait_for_selector("text=Latency Winner", state="attached")
        await page.wait_for_selector("text=Cost Winner", state="attached")
        
        print("Taking screenshot 05b-step5b-metrics.jpg...")
        await page.screenshot(path="./screenshots/05b-step5b-metrics.jpg")
        
        # Step 5: Switch right panel tab to Code (Raw JSON)
        print("Switching tab to Code...")
        await page.evaluate("window.scrollTo(0, 0)")
        await page.wait_for_timeout(500)
        await page.locator("button:has-text('Code')").first.evaluate("el => el.click()")
        await page.wait_for_timeout(1500)
        
        print("Taking screenshot 05-step5-raw-json.jpg...")
        await page.screenshot(path="./screenshots/05-step5-raw-json.jpg")
        
        await browser.close()
        print("Canvas and overlay tests finished successfully!")

if __name__ == "__main__":
    asyncio.run(run_canvas_tests())
