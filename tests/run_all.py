import asyncio
import sys
import os

# Allow importing helper modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tests.test_arena_workspace import run_workspace_tests
from tests.test_arena_canvas import run_canvas_tests
from tests.test_history_panel import run_history_tests
from tests.test_telemetry_api import run_telemetry_api_tests

async def main():
    print("==========================================")
    print("STARTING ALL E2E PLAYWRIGHT TESTS SEQUENTIALLY")
    print("==========================================")
    
    print("\n--- Running PART 1: Compare Workspace Tests ---")
    await run_workspace_tests()
    
    print("\n--- Running PART 2: Document Canvas & Tabs Tests ---")
    await run_canvas_tests()
    
    print("\n--- Running PART 3: Scan History Page Tests ---")
    await run_history_tests()
    
    print("\n--- Running PART 4: Telemetry & Analytics API Tests ---")
    await run_telemetry_api_tests()
    
    print("\n==========================================")
    print("ALL E2E SUITE TESTS PASSED AND COMPLETED SUCCESSFULLY!")
    print("==========================================")

if __name__ == "__main__":
    asyncio.run(main())
