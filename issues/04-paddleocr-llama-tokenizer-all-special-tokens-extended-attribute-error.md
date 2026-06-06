# Issue 04: PaddleOCR LlamaTokenizer AttributeError in modern Transformers version

## Problem
During layout-parsing inference, the `ocr-engine-paddleocr` container failed to start up the vLLM GenAI server, crashing with:
`AttributeError: LlamaTokenizer has no attribute all_special_tokens_extended. Did you mean: 'num_special_tokens_to_add'?`
This happened because `all_special_tokens_extended` was completely removed in newer versions of Hugging Face `transformers` (v5.0.0/v4.49+), while the older version of vLLM used by PaddleOCR still attempts to access it during initialization of the tokenizer group.

## Context
- **Environment**: Docker container `ocr-engine-paddleocr` running Python 3.12, transformers 4.49+, and vLLM.
- **Model**: `PaddleOCR-VL-1.6-0.9B`

## Solution
We created a python wrapper script `ocr-engines/paddle-ocr-vl-1-6-v2/serve.py` that monkey-patches `PreTrainedTokenizerBase` in Hugging Face `transformers` to expose properties for `all_special_tokens_extended` and `special_tokens_map_extended`, returning their modern counterparts:
```python
import transformers
if hasattr(transformers, 'tokenization_utils_base'):
    tb = transformers.tokenization_utils_base
    if not hasattr(tb.PreTrainedTokenizerBase, 'all_special_tokens_extended'):
        tb.PreTrainedTokenizerBase.all_special_tokens_extended = property(lambda self: self.all_special_tokens)
    if not hasattr(tb.PreTrainedTokenizerBase, 'special_tokens_map_extended'):
        tb.PreTrainedTokenizerBase.special_tokens_map_extended = property(lambda self: self.special_tokens_map)
```
We then updated `ocr-engines/paddle-ocr-vl-1-6-v2/serve.sh` to run this wrapper script:
```bash
exec uv run python ./paddle-ocr-vl-1-6-v2/serve.py genai_server \
  --model_name "${GENAI_MODEL}" \
  --host "${GENAI_HOST}" \
  --port "${GENAI_PORT}" \
  --backend "${GENAI_BACKEND}" \
  --backend_config "${VLLM_CONFIG}"
```

This resolved the AttributeError, and the PaddleOCR GenAI server now starts successfully and accepts requests.

## References
- `ocr-engines/paddle-ocr-vl-1-6-v2/serve.py`
- `ocr-engines/paddle-ocr-vl-1-6-v2/serve.sh`
- `AGENTS.md`
