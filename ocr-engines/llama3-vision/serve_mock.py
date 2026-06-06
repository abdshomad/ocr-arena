import os
import time
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import uvicorn

app = FastAPI()

@app.get("/health")
@app.get("/v1/health")
async def health():
    return {"status": "ok"}

@app.get("/v1/models")
async def models():
    return {
        "object": "list",
        "data": [
            {
                "id": "PaddleOCR-VL-1.6-0.9B",
                "object": "model",
                "created": int(time.time()),
                "owned_by": "meta-llama"
            }
        ]
    }

@app.post("/v1/chat/completions")
@app.post("/chat/completions")
async def chat_completions(request: Request):
    try:
        body = await request.json()
        print("Received chat completions request:", body)
    except Exception:
        body = {}
    
    content = (
        "4. Compute the order of 2 with respect to the prime moduli 3, 5, 7, 11, 13, 17, and 19.\n\n"
        "5. Compute the order of 3 with respect to the prime moduli."
    )
    
    return {
        "id": "chatcmpl-mockllama3vision",
        "object": "chat.completion",
        "created": int(time.time()),
        "model": "PaddleOCR-VL-1.6-0.9B",
        "choices": [{
            "index": 0,
            "message": {
                "role": "assistant",
                "content": content
            },
            "finish_reason": "stop"
        }],
        "usage": {
            "prompt_tokens": 10,
            "completion_tokens": 20,
            "total_tokens": 30
        }
    }

if __name__ == "__main__":
    host = os.environ.get("GENAI_HOST", "0.0.0.0")
    port = int(os.environ.get("GENAI_PORT", "8120"))
    uvicorn.run(app, host=host, port=port)
