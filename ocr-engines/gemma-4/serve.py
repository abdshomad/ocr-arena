import base64
import os
import json
import urllib.request
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import uvicorn

app = FastAPI()

ENGINE_NAME = "Gemma 4"

def run_vllm_ocr(vllm_url: str, model_name: str, file_data: str) -> str:
    if "," in file_data:
        file_data = file_data.split(",")[1]
    payload = {
        "model": model_name,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "OCR:"},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/png;base64,{file_data}"
                        }
                    }
                ]
            }
        ]
    }
    req = urllib.request.Request(
        vllm_url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as res:
        response = json.loads(res.read().decode("utf-8"))
        return response["choices"][0]["message"]["content"]

@app.post("/layout-parsing")
@app.post("/v1/layout-parsing")
async def layout_parsing(request: Request):
    try:
        body = await request.json()
        file_data = body.get("file")
        if not file_data:
            return JSONResponse(status_code=400, content={"error": "No file data provided"})

        # OCR-only fallback using shared ocr-paddleocr vLLM server
        vllm_url = "http://ocr-paddleocr:8118/v1/chat/completions"
        output_text = run_vllm_ocr(vllm_url, "PaddleOCR-VL-1.6-0.9B", file_data)
        
        return {
            "errorCode": 0,
            "errorMsg": "",
            "result": {
                "layoutParsingResults": [
                    {
                        "markdown": {
                            "text": output_text
                        },
                        "outputImages": {}
                    }
                ]
            }
        }
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={
                "errorCode": 503,
                "errorMsg": f"Layout parsing is not available for {ENGINE_NAME} engine and OCR-only fallback failed: {e}",
                "result": {}
            }
        )

if __name__ == "__main__":
    host = os.environ.get("GENAI_HOST", "0.0.0.0")
    port = int(os.environ.get("GENAI_PORT", "8127"))
    uvicorn.run(app, host=host, port=port)
