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

async def setup_history_api_mock(page):
    async def mock_history_api(route, request):
        if request.method == "DELETE":
            print("Mocking delete history request...")
            await route.fulfill(status=200, json={"success": True})
        elif request.method == "POST":
            print("Mocking save tag history request...")
            await route.fulfill(status=200, json={"success": True})
        elif "backup=true" in request.url:
            print("Mocking backup JSON download...")
            await route.fulfill(
                status=200,
                content_type="application/json",
                headers={"Content-Disposition": 'attachment; filename="backup.json"'},
                json=[{
                    "filename": "1716912345-doc.jpg",
                    "upload_time": "2026-06-06T12:00:00.000Z",
                    "size": 500000,
                    "parsed": True,
                    "is_sample": False,
                    "metadata": {
                        "vendor": "Acme Global",
                        "customer": "PT. PRIMAFOOD INTERNATIONAL",
                        "items": [
                            {
                                "kodeBarang": "SKU-001",
                                "namaBarang": "Item 1",
                                "banyak": "10",
                                "jumlah": "100"
                            }
                        ]
                    },
                    "layout_parsing_result": {},
                    "file_hash": "abcdef123456",
                    "engine": "paddleocr",
                    "items": []
                }]
            )
        elif "file=" in request.url:
            print("Mocking history file details/preview request...")
            await route.fulfill(
                status=200,
                content_type="application/json",
                json={
                    "errorCode": 0,
                    "errorMsg": "Success",
                    "result": {
                        "layoutParsingResults": [
                            {
                                "markdown": { "text": "This is sample ocrText containing Acme Global and some items." },
                                "parsing_res_list": [
                                    {
                                        "block_id": 1,
                                        "block_label": "text",
                                        "block_bbox": [10, 10, 100, 100],
                                        "block_content": "DeepSeek Page 1 text block"
                                    }
                                ]
                            }
                        ]
                    },
                    "items": [
                        {
                            "kodeBarang": "SKU-001",
                            "namaBarang": "Item 1",
                            "banyak": "10",
                            "jumlah": "100"
                        }
                    ],
                    "flagged": {},
                    "remarks": {},
                    "headerRemark": ""
                }
            )
        else:
            print("Mocking history list request...")
            await route.fulfill(
                status=200,
                content_type="application/json",
                json={
                    "history": [
                        {
                            "id": 1,
                            "filename": "1716912345-doc.jpg",
                            "uploadTime": "2026-06-06T12:00:00.000Z",
                            "size": 500000,
                            "parsed": True,
                            "isSample": False,
                            "metadata": {
                                "vendor": "Acme Global",
                                "customer": "PT. PRIMAFOOD INTERNATIONAL",
                                "items": [
                                    {
                                        "kodeBarang": "SKU-001",
                                        "namaBarang": "Item 1",
                                        "banyak": "10",
                                        "jumlah": "100"
                                    }
                                ]
                            },
                            "engine": "paddleocr",
                            "ocrText": "This is sample ocrText containing Acme Global and some items.",
                            "latency": 1500
                        }
                    ]
                }
            )

    await page.route("**/api/history*", mock_history_api)
