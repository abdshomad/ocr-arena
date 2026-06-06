import base64
import io
import os
import re
import sys
import tempfile
import shutil
from io import StringIO
from PIL import Image, ImageOps
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import uvicorn
import torch
import sys
import transformers.models.llama.modeling_llama as modeling_llama
import transformers.models.llama.modeling_llama as modeling_llama

# Patch LlamaAttention/LlamaFlashAttention2 forward signature for compatibility
original_llama_attention_forward = modeling_llama.LlamaAttention.forward

def patched_llama_attention_forward(self, *args, **kwargs):
    has_position_embeddings = False
    if "position_embeddings" in kwargs:
        has_position_embeddings = True
    elif len(args) > 1:
        # In the new signature, the second argument (index 1) is position_embeddings
        has_position_embeddings = True
        
    is_old_signature = not has_position_embeddings
        
    if is_old_signature:
        old_arg_names = ["hidden_states", "attention_mask", "position_ids", "past_key_value"]
        new_kwargs = kwargs.copy()
        for i, val in enumerate(args):
            if i < len(old_arg_names):
                new_kwargs[old_arg_names[i]] = val
        
        hidden_states = new_kwargs.get("hidden_states")
        attention_mask = new_kwargs.get("attention_mask")
        position_ids = new_kwargs.get("position_ids")
        past_key_values = new_kwargs.get("past_key_value") or new_kwargs.get("past_key_values")
        cache_position = new_kwargs.get("cache_position")
        
        if position_ids is None:
            seq_len = hidden_states.shape[1]
            device = hidden_states.device
            position_ids = torch.arange(seq_len, dtype=torch.long, device=device).unsqueeze(0)
        elif position_ids.shape[1] != hidden_states.shape[1]:
            position_ids = position_ids[:, -hidden_states.shape[1]:]
            
        if not hasattr(self, "rotary_emb"):
            from transformers.models.llama.modeling_llama import LlamaRotaryEmbedding
            self.rotary_emb = LlamaRotaryEmbedding(self.config, device=hidden_states.device)
            
        cos, sin = self.rotary_emb(hidden_states, position_ids)
        position_embeddings = (cos, sin)
        
        res = original_llama_attention_forward(
            self,
            hidden_states=hidden_states,
            position_embeddings=position_embeddings,
            attention_mask=attention_mask,
            past_key_values=past_key_values,
            cache_position=cache_position,
        )
        
        if isinstance(res, tuple) and len(res) == 2:
            return res[0], res[1], past_key_values
        return res
    else:
        res = original_llama_attention_forward(self, *args, **kwargs)
        if isinstance(res, tuple) and len(res) == 2:
            past_key_values = kwargs.get("past_key_values") or kwargs.get("past_key_value")
            if past_key_values is None and len(args) > 3:
                # self, hidden_states, position_embeddings, attention_mask, past_key_values
                past_key_values = args[3]
            return res[0], res[1], past_key_values
        return res

modeling_llama.LlamaAttention.forward = patched_llama_attention_forward
if not hasattr(modeling_llama, "LlamaFlashAttention2"):
    modeling_llama.LlamaFlashAttention2 = modeling_llama.LlamaAttention
else:
    modeling_llama.LlamaFlashAttention2.forward = patched_llama_attention_forward

import transformers.utils.import_utils as import_utils
if not hasattr(import_utils, "is_torch_fx_available"):
    import_utils.is_torch_fx_available = lambda: True
from transformers import AutoModel, AutoTokenizer
from transformers.cache_utils import DynamicCache
if not hasattr(DynamicCache, "seen_tokens"):
    DynamicCache.seen_tokens = property(lambda self: self.get_seq_length())
if not hasattr(DynamicCache, "get_max_length"):
    DynamicCache.get_max_length = lambda self: None
if not hasattr(DynamicCache, "get_usable_length"):
    DynamicCache.get_usable_length = lambda self, seq_length=None, layer_idx=0: self.get_seq_length(layer_idx)

app = FastAPI()

MODEL_NAME = 'deepseek-ai/DeepSeek-OCR-2'
tokenizer = None
model = None

def get_model():
    global tokenizer, model
    if model is None:
        print("==> Loading DeepSeek-OCR-2 model...")
        tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, trust_remote_code=True, local_files_only=True)
        from transformers import AutoConfig, LlamaConfig
        config = AutoConfig.from_pretrained(MODEL_NAME, trust_remote_code=True, local_files_only=True)
        if not hasattr(config, "pad_token_id") or config.pad_token_id is None:
            config.pad_token_id = tokenizer.pad_token_id or 0
        
        # Copy missing Llama defaults to make config fully Llama-compatible
        llama_default = LlamaConfig()
        for k, v in llama_default.to_dict().items():
            if not hasattr(config, k):
                setattr(config, k, v)
        
        # DeepSeek-V2 MoE and MLA specific defaults
        deepseek_v2_defaults = {
            "moe_layer_freq": 1,
            "routed_scaling_factor": 1.0,
            "ep_size": 1,
            "n_shared_experts": None,
            "n_routed_experts": None,
            "num_experts_per_tok": None,
            "first_k_dense_replace": 0,
            "norm_topk_prob": False,
            "scoring_func": "softmax",
            "aux_loss_alpha": 0.001,
            "seq_aux": True,
            "use_mla": True,
            "topk_method": "gready",
            "n_group": None,
            "topk_group": None,
            "kv_lora_rank": 512,
            "q_lora_rank": 1536,
            "qk_rope_head_dim": 64,
            "v_head_dim": 128,
            "qk_nope_head_dim": 128,
        }
        for k, v in deepseek_v2_defaults.items():
            if not hasattr(config, k):
                setattr(config, k, v)
                
        model = AutoModel.from_pretrained(
            MODEL_NAME,
            config=config,
            torch_dtype=torch.bfloat16,
            trust_remote_code=True,
            use_safetensors=True,
            local_files_only=True
        )
        model = model.eval().cuda()
    return model, tokenizer

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

        # Load model/tokenizer
        m, t = get_model()

        # Temporary file for model input
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp:
            image.save(tmp.name, 'JPEG', quality=95)
            tmp_name = tmp.name

        out_dir = tempfile.mkdtemp()
        prompt = "<image>\n<|grounding|>Convert the document to markdown."

        # Capture print output from model.infer
        stdout = sys.stdout
        sys.stdout = StringIO()
        try:
            m.infer(
                tokenizer=t,
                prompt=prompt,
                image_file=tmp_name,
                output_path=out_dir,
                base_size=1024,
                image_size=768,
                crop_mode=True,
                save_results=False
            )
            raw_output = sys.stdout.getvalue()
        finally:
            sys.stdout = stdout
            if os.path.exists(tmp_name):
                os.unlink(tmp_name)
            shutil.rmtree(out_dir, ignore_errors=True)

        result_text = '\n'.join([l for l in raw_output.split('\n')
                            if not any(s in l for s in ['image:', 'other:', 'PATCHES', '====', 'BASE:', '%|', 'torch.Size'])]).strip()

        # Parse grounding boxes
        pattern = r"<\|ref\|>(.*?)<\|/ref\|>\s*<\|det\|>\[\[(\d+),\s*(\d+),\s*(\d+),\s*(\d+)\]\]<\|/det\|>"
        matches = re.findall(pattern, result_text, flags=re.DOTALL)
        
        parsing_res_list = []
        for idx, (content, ymin, xmin, ymax, xmax) in enumerate(matches):
            ymin, xmin, ymax, xmax = int(ymin), int(xmin), int(ymax), int(xmax)
            parsing_res_list.append({
                "block_id": idx,
                "group_id": idx,
                "block_bbox": [xmin, ymin, xmax, ymax],
                "block_label": "text",
                "block_order": idx + 1,
                "block_content": content.strip(),
                "block_polygon_points": [
                    [xmin, ymin],
                    [xmax, ymin],
                    [xmax, ymax],
                    [xmin, ymax]
                ]
            })

        # Strip grounding tags for clean markdown view
        clean_text = re.sub(pattern, r"\1", result_text, flags=re.DOTALL)
        clean_text = clean_text.replace("<|ref|>", "").replace("</|ref|>", "").replace("<|det|>", "").replace("</|det|>", "")

        return {
            "errorCode": 0,
            "errorMsg": "",
            "result": {
                "layoutParsingResults": [
                    {
                        "markdown": {
                            "text": clean_text.strip()
                        },
                        "parsing_res_list": parsing_res_list,
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
    port = int(os.environ.get("GENAI_PORT", "8122"))
    uvicorn.run(app, host=host, port=port)
