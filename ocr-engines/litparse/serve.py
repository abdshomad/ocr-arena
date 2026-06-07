import base64
import io
import os
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import uvicorn
from liteparse import LiteParse

app = FastAPI()

ENGINE_NAME = "LiteParse"
parser = None

def get_parser():
    global parser
    if parser is None:
        print(f"==> Initializing {ENGINE_NAME} parser...")
        parser = LiteParse(ocr_enabled=True)
    return parser

@app.post("/layout-parsing")
@app.post("/v1/layout-parsing")
async def layout_parsing(request: Request):
    try:
        body = await request.json()
        file_data = body.get("file")
        if not file_data:
            return JSONResponse(status_code=400, content={"error": "No file data provided"})

        if "," in file_data:
            file_data = file_data.split(",")[1]

        img_bytes = base64.b64decode(file_data)
        
        p = get_parser()
        res = p.parse(img_bytes)
        
        text_content = []
        for page_num in range(1, res.num_pages + 1):
            page = res.get_page(page_num)
            if page and page.text:
                text_content.append(page.text)
                
        output_text = "\n\n".join(text_content)
        
        return {
            "errorCode": 0,
            "errorMsg": "",
            "result": {
                "layoutParsingResults": [
                    {
                        "markdown": {
                            "text": output_text.strip()
                        },
                        "outputImages": {}
                    }
                ]
            }
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"errorCode": 500, "errorMsg": str(e), "result": {}})

if __name__ == "__main__":
    host = os.environ.get("GENAI_HOST", "0.0.0.0")
    port = int(os.environ.get("GENAI_PORT", "8129"))
    uvicorn.run(app, host=host, port=port)
