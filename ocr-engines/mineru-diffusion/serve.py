import base64
import io
import os
from PIL import Image, ImageOps
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import uvicorn
import torch
from transformers import (
    LightOnOcrForConditionalGeneration,
    LightOnOcrProcessor,
)

app = FastAPI()

ENGINE_NAME = "MinerU-Diffusion"
MODEL_NAME = "lightonai/LightOnOCR-2-1B"
model = None
processor = None

def get_model():
    global model, processor
    if model is None:
        print(f"==> Loading {MODEL_NAME} locally for {ENGINE_NAME}...")
        processor = LightOnOcrProcessor.from_pretrained(MODEL_NAME, trust_remote_code=True, local_files_only=True)
        model = LightOnOcrForConditionalGeneration.from_pretrained(
            MODEL_NAME,
            torch_dtype=torch.bfloat16 if torch.cuda.is_available() else torch.float32,
            device_map="auto",
            trust_remote_code=True,
            local_files_only=True
        ).eval()
    return model, processor

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
        image = ImageOps.exif_transpose(image)

        m, p = get_model()

        chat = [
            {
                "role": "user",
                "content": [
                    {"type": "image", "url": image},
                ],
            }
        ]
        inputs = p.apply_chat_template(
            chat,
            add_generation_prompt=True,
            tokenize=True,
            return_dict=True,
            return_tensors="pt",
        )
        inputs = {
            k: v.to(device=m.device, dtype=m.dtype)
            if isinstance(v, torch.Tensor) and v.dtype in [torch.float32, torch.float16, torch.bfloat16]
            else v.to(m.device)
            if isinstance(v, torch.Tensor)
            else v
            for k, v in inputs.items()
        }

        with torch.no_grad():
            outputs = m.generate(
                **inputs,
                max_new_tokens=4096,
                use_cache=True,
                do_sample=False,
            )

        output_text = p.decode(outputs[0], skip_special_tokens=True)

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
    port = int(os.environ.get("GENAI_PORT", "8130"))
    uvicorn.run(app, host=host, port=port)
