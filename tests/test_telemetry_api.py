import asyncio
import os
import sys
from playwright.async_api import async_playwright

# Allow importing helpers from the tests folder
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from tests.helpers import setup_browser, ensure_screenshots_dir

async def run_telemetry_api_tests():
    ensure_screenshots_dir()
    async with async_playwright() as p:
        browser, context, page = await setup_browser(p)
        
        # Navigate to history first to ensure sessions/cookies are set if needed
        print("Navigating to http://localhost:7890/history to initialize session...")
        await page.goto("http://localhost:7890/history")
        await page.wait_for_timeout(2000)
        
        # Fetch stats directly using page.request
        print("Fetching Telemetry & Analytics stats via /api/arena?action=stats...")
        response = await page.request.get("http://localhost:7890/api/arena?action=stats")
        assert response.ok, f"Failed to fetch telemetry stats: {response.status} {response.status_text}"
        
        data = await response.json()
        print(f"Stats response received: {data}")
        
        assert data.get("success") is True, "Response success field is not True"
        stats = data.get("stats")
        assert isinstance(stats, list), "Response stats field is not a list"
        
        print(f"Verified telemetry data for {len(stats)} engines.")
        for item in stats:
            engine = item.get("engine")
            total = item.get("total_runs")
            success = item.get("success_runs")
            failed = item.get("failed_runs")
            avg = item.get("avg_time_ms")
            p50 = item.get("p50_time_ms")
            p90 = item.get("p90_time_ms")
            p99 = item.get("p99_time_ms")
            
            print(f"Engine: {engine} | Total Runs: {total} | Success: {success} | Failed: {failed} | Avg: {avg}ms | p50: {p50}ms | p90: {p90}ms | p99: {p99}ms")
            
            assert engine is not None, "Engine name is missing"
            assert isinstance(total, int), "Total runs must be an integer"
            assert isinstance(success, int), "Success runs must be an integer"
            assert isinstance(failed, int), "Failed runs must be an integer"
            if total > 0:
                if success > 0:
                    assert avg is None or isinstance(avg, int), "Avg time must be integer or None"
                    assert p50 is None or isinstance(p50, int), "p50 time must be integer or None"
                    assert p90 is None or isinstance(p90, int), "p90 time must be integer or None"
                    assert p99 is None or isinstance(p99, int), "p99 time must be integer or None"
                    
        # Fetch individual runs data
        print("Fetching run logs via /api/arena...")
        runs_response = await page.request.get("http://localhost:7890/api/arena?limit=10")
        assert runs_response.ok, f"Failed to fetch runs log: {runs_response.status}"
        runs_data = await runs_response.json()
        runs = runs_data.get("runs", [])
        assert isinstance(runs, list), "Runs field must be a list"
        print(f"Successfully fetched and verified {len(runs)} individual run records from database.")
        
        await browser.close()
        print("Telemetry & Analytics API verification passed successfully!")

if __name__ == "__main__":
    asyncio.run(run_telemetry_api_tests())
