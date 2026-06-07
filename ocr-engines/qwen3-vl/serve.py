import base64
import io
import os
from PIL import Image, ImageOps
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import uvicorn
import torch
from transformers import (
    Qwen3VLForConditionalGeneration,
    AutoProcessor,
)
from qwen_vl_utils import process_vision_info

app = FastAPI()

ENGINE_NAME = "Qwen3-VL"
MODEL_NAME = "Qwen/Qwen3-VL-2B-Instruct"
model = None
processor = None

def get_model():
    global model, processor
    if model is None:
        print(f"==> Loading {MODEL_NAME} locally for {ENGINE_NAME}...")
        processor = AutoProcessor.from_pretrained(MODEL_NAME, trust_remote_code=True, local_files_only=True)
        model = Qwen3VLForConditionalGeneration.from_pretrained(
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

        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "image", "image": image},
                    {"type": "text", "text": "OCR the text from this image."}
                ]
            }
        ]
        text = p.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        image_inputs, video_inputs = process_vision_info(messages)
        inputs = p(
            text=[text],
            images=image_inputs,
            videos=video_inputs,
            padding=True,
            return_tensors="pt"
        )
        inputs = {k: v.to(m.device) if isinstance(v, torch.Tensor) else v for k, v in inputs.items()}

        with torch.no_grad():
            outputs = m.generate(
                **inputs,
                max_new_tokens=4096,
            )

        generated_ids_trimmed = [
            out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs["input_ids"], outputs)
        ]
        output_text = p.batch_decode(
            generated_ids_trimmed, skip_special_tokens=True, clean_up_tokenization_spaces=False
        )

        return {
            "errorCode": 0,
            "errorMsg": "",
            "result": {
                "layoutParsingResults": [
                    {
                        "markdown": {
                            "text": output_text[0].strip()
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
    port = int(os.environ.get("GENAI_PORT", "8128"))
    uvicorn.run(app, host=host, port=port)

