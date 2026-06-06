import base64
import io
import os
import json
import uuid
import tempfile
import shutil
from PIL import Image
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import uvicorn

import sys
# Dynamically add the submodule path to import dots_ocr
sys.path.append("/app/dots.ocr-demo-2026/dots.ocr")

from dots_ocr.parser import DotsOCRParser

app = FastAPI()

# Lazy load parser
parser = None

def get_parser():
    global parser
    if parser is None:
        vllm_host = os.environ.get("VLLM_SERVER_HOST", "ocr-dotsocr-vllm-server")
        vllm_port = int(os.environ.get("VLLM_SERVER_PORT", "8000"))
        print(f"==> Loading Dots.OCR parser pointing to {vllm_host}:{vllm_port}...")
        parser = DotsOCRParser(
            ip=vllm_host,
            port=vllm_port,
            dpi=200,
            min_pixels=100000,
            max_pixels=1254400,
            max_completion_tokens=2048
        )
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
        image = Image.open(io.BytesIO(img_bytes)).convert("RGB")

        p = get_parser()
        temp_dir = tempfile.mkdtemp()
        filename = f"api_{uuid.uuid4().hex[:8]}"

        results = p.parse_image(
            input_path=image,
            filename=filename,
            prompt_mode="prompt_layout_all_en",
            save_dir=temp_dir,
            fitz_preprocess=True
        )

        layout_parsing_results = []
        for res in results:
            layout_img_b64 = ""
            if "layout_image_path" in res and os.path.exists(res["layout_image_path"]):
                with open(res["layout_image_path"], "rb") as f:
                    layout_img_b64 = f"data:image/jpeg;base64,{base64.b64encode(f.read()).decode('utf-8')}"

            md_text = ""
            if "md_content_path" in res and os.path.exists(res["md_content_path"]):
                with open(res["md_content_path"], "r", encoding="utf-8") as f:
                    md_text = f.read()

            output_images = {
                "original": f"data:image/jpeg;base64,{file_data}",
                "visualization": layout_img_b64 if layout_img_b64 else f"data:image/jpeg;base64,{file_data}"
            }

            page_res = {
                "markdown": {
                    "text": md_text,
                    "images": {}
                },
                "outputImages": output_images
            }
            layout_parsing_results.append(page_res)

        shutil.rmtree(temp_dir, ignore_errors=True)

        return {
            "errorCode": 0,
            "errorMsg": "",
            "result": {
                "layoutParsingResults": layout_parsing_results
            }
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"errorCode": 500, "errorMsg": str(e), "result": {}})

if __name__ == "__main__":
    host = os.environ.get("GENAI_HOST", "0.0.0.0")
    port = int(os.environ.get("GENAI_PORT", "8124"))
    uvicorn.run(app, host=host, port=port)
