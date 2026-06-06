import base64
import io
import os
import tempfile
from io import BytesIO
from PIL import Image, ImageOps
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import uvicorn
import torch
from transformers import AutoProcessor, AutoModelForImageTextToText

app = FastAPI()

MODEL_NAME = "zai-org/GLM-OCR"
processor = None
model = None

def get_model():
    global model, processor
    if model is None:
        print("==> Loading GLM-OCR model...")
        processor = AutoProcessor.from_pretrained(MODEL_NAME, trust_remote_code=True)
        model = AutoModelForImageTextToText.from_pretrained(
            pretrained_model_name_or_path=MODEL_NAME,
            torch_dtype=torch.bfloat16 if torch.cuda.is_available() else torch.float32,
            device_map="auto",
            trust_remote_code=True,
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

        # Temporary file for processor
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp:
            image.save(tmp.name, 'JPEG', quality=95)
            tmp_name = tmp.name

        try:
            messages = [
                {
                    "role": "user",
                    "content": [
                        {"type": "image", "url": tmp_name},
                        {"type": "text", "text": "Text Recognition:"},
                    ],
                }
            ]

            inputs = p.apply_chat_template(
                messages,
                tokenize=True,
                add_generation_prompt=True,
                return_dict=True,
                return_tensors="pt",
            )
        finally:
            if os.path.exists(tmp_name):
                os.unlink(tmp_name)

        inputs.pop("token_type_ids", None)
        inputs = {k: v.to(m.device) if hasattr(v, "to") else v for k, v in inputs.items()}

        with torch.no_grad():
            outputs = m.generate(
                **inputs,
                max_new_tokens=4096,
            )

        # Decode output
        # Get length of input token ids to skip prompt in decoded output
        input_len = inputs["input_ids"].shape[1]
        output_text = p.decode(outputs[0][input_len:], skip_special_tokens=True)

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
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"errorCode": 500, "errorMsg": str(e), "result": {}})

if __name__ == "__main__":
    host = os.environ.get("GENAI_HOST", "0.0.0.0")
    port = int(os.environ.get("GENAI_PORT", "8125"))
    uvicorn.run(app, host=host, port=port)
