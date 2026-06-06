import base64
import tempfile
import os
import re
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import uvicorn

app = FastAPI()

# Lazy-load Nemotron OCR v2 when first request arrives to optimize memory
ocr_pipeline = None

def get_ocr_pipeline():
    global ocr_pipeline
    if ocr_pipeline is None:
        print("==> Initializing Nemotron OCR v2 pipeline...")
        from nemotron_ocr.inference.pipeline_v2 import NemotronOCRV2
        ocr_pipeline = NemotronOCRV2()
    return ocr_pipeline

def extract_base64_images(body):
    images = []
    # 1. Check messages format (OpenAI Chat Completions)
    if "messages" in body:
        for msg in body["messages"]:
            content = msg.get("content")
            if isinstance(content, list):
                for item in content:
                    if isinstance(item, dict) and item.get("type") == "image_url":
                        url = item.get("image_url", {}).get("url", "")
                        if "base64," in url:
                            images.append(url.split("base64,")[1])
                        elif url.startswith("data:image/"):
                            parts = url.split(",")
                            if len(parts) > 1:
                                images.append(parts[1])
            elif isinstance(content, str):
                matches = re.findall(r'data:image/[^;]+;base64,([A-Za-z0-9+/=]+)', content)
                images.extend(matches)
    # 2. Check direct images field
    if "images" in body and isinstance(body["images"], list):
        for img in body["images"]:
            if isinstance(img, str):
                if "base64," in img:
                    images.append(img.split("base64,")[1])
                else:
                    images.append(img)
    return images

@app.post("/v1/chat/completions")
async def chat_completions(request: Request):
    body = await request.json()
    images = extract_base64_images(body)
    if not images:
        return JSONResponse(status_code=400, content={"error": "No base64 image found in request"})
    
    ocr = get_ocr_pipeline()
    extracted_texts = []
    
    for img_b64 in images:
        img_data = base64.b64decode(img_b64)
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            tmp.write(img_data)
            tmp_path = tmp.name
        try:
            print(f"==> Running Nemotron OCR v2 on {tmp_path}")
            predictions = ocr(tmp_path)
            # nemotron-ocr-v2 returns list of dicts: [{'text': '...', 'confidence': ...}]
            text_lines = [p.get("text", "") for p in predictions if "text" in p]
            extracted_text = "\n".join(text_lines)
            extracted_texts.append(extracted_text)
        except Exception as e:
            print(f"Error during Nemotron inference: {e}")
            extracted_texts.append(f"Error during Nemotron inference: {e}")
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
                
    response_text = "\n".join(extracted_texts)
    
    return {
        "id": "chatcmpl-nemotron",
        "object": "chat.completion",
        "created": 1677652288,
        "model": body.get("model", "nvidia/nemotron-ocr-v2"),
        "choices": [{
            "index": 0,
            "message": {
                "role": "assistant",
                "content": response_text
            },
            "finish_reason": "stop"
        }],
        "usage": {
            "prompt_tokens": 10,
            "completion_tokens": len(response_text.split()),
            "total_tokens": 10 + len(response_text.split())
        }
    }

@app.post("/v1/completions")
async def completions(request: Request):
    # Fallback endpoint if some client uses legacy completions endpoint
    body = await request.json()
    images = extract_base64_images(body)
    if not images:
        return JSONResponse(status_code=400, content={"error": "No base64 image found in request"})
    
    ocr = get_ocr_pipeline()
    extracted_texts = []
    
    for img_b64 in images:
        img_data = base64.b64decode(img_b64)
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            tmp.write(img_data)
            tmp_path = tmp.name
        try:
            predictions = ocr(tmp_path)
            text_lines = [p.get("text", "") for p in predictions if "text" in p]
            extracted_text = "\n".join(text_lines)
            extracted_texts.append(extracted_text)
        except Exception as e:
            extracted_texts.append(f"Error: {e}")
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
                
    response_text = "\n".join(extracted_texts)
    
    return {
        "id": "cmpl-nemotron",
        "object": "text_completion",
        "created": 1677652288,
        "model": body.get("model", "nvidia/nemotron-ocr-v2"),
        "choices": [{
            "text": response_text,
            "index": 0,
            "logprobs": None,
            "finish_reason": "stop"
        }],
        "usage": {
            "prompt_tokens": 10,
            "completion_tokens": len(response_text.split()),
            "total_tokens": 10 + len(response_text.split())
        }
    }

@app.get("/v1/models")
async def list_models():
    return {
        "object": "list",
        "data": [
            {
                "id": "nvidia/nemotron-ocr-v2",
                "object": "model",
                "created": 1677652288,
                "owned_by": "nvidia"
            }
        ]
    }

if __name__ == "__main__":
    host = os.environ.get("GENAI_HOST", "0.0.0.0")
    port = int(os.environ.get("GENAI_PORT", "8119"))
    print(f"==> Starting OpenAI-compatible Nemotron-OCR-v2 server on {host}:{port}")
    uvicorn.run(app, host=host, port=port)
