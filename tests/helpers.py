import os
from playwright.async_api import async_playwright

async def setup_browser(playwright_instance, headless=True):
    print("Launching Chromium browser...")
    browser = await playwright_instance.chromium.launch(headless=headless)
    context = await browser.new_context(viewport={"width": 1600, "height": 1000})
    page = await context.new_page()
    page.on("console", lambda msg: print(f"BROWSER CONSOLE: {msg.text}"))
    return browser, context, page

async def setup_arena_api_mock(page):
    async def mock_arena_api(route, request):
        if request.method == "POST" and "/api/arena" in request.url:
            try:
                body = request.post_data_json
                engine = body.get("engine")
            except:
                engine = None
            
            if engine == "deepseek":
                print("Mocking multi-page PDF OCR response for DeepSeek...")
                await route.fulfill(
                    status=200,
                    content_type="application/json",
                    json={
                        "success": True,
                        "text": "DeepSeek Page 1 Text: This is first page content.",
                        "elapsedMs": 500,
                        "rawResult": {
                            "layoutParsingResults": [
                                {
                                    "markdown": { "text": "DeepSeek Page 1 Text: This is first page content." },
                                    "parsing_res_list": [
                                        {
                                            "block_id": 1,
                                            "block_label": "text",
                                            "block_bbox": [10, 10, 100, 100],
                                            "block_content": "DeepSeek Page 1 text block"
                                        }
                                    ]
                                },
                                {
                                    "markdown": { "text": "DeepSeek Page 2 Text: This is second page content." },
                                    "parsing_res_list": [
                                        {
                                            "block_id": 1,
                                            "block_label": "header",
                                            "block_bbox": [20, 20, 200, 50],
                                            "block_content": "DeepSeek Page 2 header block"
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                )
            else:
                await route.continue_()
        else:
            await route.continue_()

    await page.route("**/api/arena", mock_arena_api)

def ensure_screenshots_dir():
    os.makedirs("./screenshots", exist_ok=True)
