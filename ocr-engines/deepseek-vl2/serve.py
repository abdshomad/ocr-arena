import base64
import io
import os
import sys
from PIL import Image, ImageOps
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import uvicorn
import torch

# Patch collections for Python 3.10+ compat
import collections
if not hasattr(collections, 'MutableMapping'):
    import collections.abc
    collections.MutableMapping = collections.abc.MutableMapping
if not hasattr(collections, 'Mapping'):
    import collections.abc
    collections.Mapping = collections.abc.Mapping
if not hasattr(collections, 'Sequence'):
    import collections.abc
    collections.Sequence = collections.abc.Sequence

# Patch transformers compatibility
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

import transformers.modeling_utils as modeling_utils
if not hasattr(modeling_utils, "is_flash_attn_2_available"):
    modeling_utils.is_flash_attn_2_available = lambda: False
import transformers.utils.import_utils as import_utils
if not hasattr(import_utils, "is_torch_fx_available"):
    import_utils.is_torch_fx_available = lambda: True

from transformers import AutoModelForCausalLM, AutoProcessor
from deepseek_vl2.models import DeepseekVLV2Processor, DeepseekVLV2ForCausalLM

# Patch for older models compatibility with newer transformers/accelerate
DeepseekVLV2ForCausalLM.all_tied_weights_keys = property(lambda self: {})
from transformers.generation.utils import GenerationMixin
from deepseek_vl2.models.modeling_deepseek import DeepseekV2ForCausalLM
if GenerationMixin not in DeepseekV2ForCausalLM.__bases__:
    DeepseekV2ForCausalLM.__bases__ = DeepseekV2ForCausalLM.__bases__ + (GenerationMixin,)
if GenerationMixin not in DeepseekVLV2ForCausalLM.__bases__:
    DeepseekVLV2ForCausalLM.__bases__ = DeepseekVLV2ForCausalLM.__bases__ + (GenerationMixin,)
from transformers.cache_utils import DynamicCache
if not hasattr(DynamicCache, "seen_tokens"):
    DynamicCache.seen_tokens = property(lambda self: self.get_seq_length())
if not hasattr(DynamicCache, "get_max_length"):
    DynamicCache.get_max_length = lambda self: None
if not hasattr(DynamicCache, "get_usable_length"):
    DynamicCache.get_usable_length = lambda self, seq_length=None, layer_idx=0: self.get_seq_length(layer_idx)

# Patch prepare_inputs_for_generation for empty Cache compatibility (modern transformers version compatibility)
original_prepare = DeepseekV2ForCausalLM.prepare_inputs_for_generation

def patched_prepare(self, input_ids, past_key_values=None, attention_mask=None, inputs_embeds=None, **kwargs):
    model_inputs = original_prepare(self, input_ids, past_key_values=past_key_values, attention_mask=attention_mask, inputs_embeds=inputs_embeds, **kwargs)
    if inputs_embeds is not None and past_key_values is not None:
        is_empty = False
        if hasattr(past_key_values, "get_seq_length") and past_key_values.get_seq_length() == 0:
            is_empty = True
        elif not hasattr(past_key_values, "get_seq_length") and len(past_key_values) == 0:
            is_empty = True
            
        if is_empty:
            model_inputs["inputs_embeds"] = inputs_embeds
            if "input_ids" in model_inputs:
                del model_inputs["input_ids"]
    return model_inputs

DeepseekV2ForCausalLM.prepare_inputs_for_generation = patched_prepare

app = FastAPI()

MODEL_NAME = "deepseek-ai/deepseek-vl2-tiny"
model = None
processor = None

def get_model():
    global model, processor
    if model is None:
        print("==> Loading DeepSeek-VL2-Tiny model...")
        processor = DeepseekVLV2Processor.from_pretrained(MODEL_NAME, trust_remote_code=True, local_files_only=True)
        model = DeepseekVLV2ForCausalLM.from_pretrained(
            MODEL_NAME,
            torch_dtype=torch.bfloat16 if torch.cuda.is_available() else torch.float32,
            device_map="auto",
            trust_remote_code=True,
            local_files_only=True,
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
        tokenizer = p.tokenizer

        # Format conversation
        conversation = [
            {
                "role": "user",
                "content": "<image>\nConvert the document to markdown.",
                "images": ["dummy.jpg"]
            },
            {"role": "assistant", "content": ""}
        ]

        prepare_inputs = p(
            conversations=conversation, 
            images=[image], 
            force_batchify=True
        ).to(m.device)

        with torch.no_grad():
            inputs_embeds = m.prepare_inputs_embeds(**prepare_inputs)
            outputs = m.language.generate(
                inputs_embeds=inputs_embeds,
                attention_mask=prepare_inputs.attention_mask,
                pad_token_id=tokenizer.eos_token_id,
                bos_token_id=tokenizer.bos_token_id,
                eos_token_id=tokenizer.eos_token_id,
                max_new_tokens=2048,
                do_sample=False,
                use_cache=True
            )

        output_text = tokenizer.decode(outputs[0].cpu().tolist(), skip_special_tokens=True)

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
    port = int(os.environ.get("GENAI_PORT", "8121"))
    uvicorn.run(app, host=host, port=port)
