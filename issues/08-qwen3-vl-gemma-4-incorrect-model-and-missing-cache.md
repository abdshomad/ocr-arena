# Issue 08: Qwen3-VL and Gemma 4 Incorrect Model and Missing Cache Weights

## Problem
- Qwen3-VL and Gemma 4 were incorrectly loading `zai-org/GLM-OCR` model instead of their own dedicated models.
- When trying to load the dedicated models locally, execution failed with:
  `OSError: Qwen/Qwen3-VL-2B-Instruct does not appear to have a file named pytorch_model.bin or model.safetensors`
  indicating that the cached model weights in the local Hugging Face cache folder were incomplete or missing.

## Context
- Environment: Docker containers running backend serving APIs for layout parsing.
- Affected serving scripts: `ocr-engines/qwen3-vl/serve.py` and `ocr-engines/gemma-4/serve.py`.
- Hugging Face cache directories relative to the workspace root:
  - `../../../.cache/huggingface/hub/models--Qwen--Qwen3-VL-2B-Instruct`
  - `../../../.cache/huggingface/hub/models--google--gemma-4-E4B-it`

## Solution
- Updated the serving scripts to import and load their respective dedicated models (`Qwen/Qwen3-VL-2B-Instruct` and `google/gemma-4-E4B-it`) using the corresponding Transformers classes (`Qwen3VLForConditionalGeneration` and `Gemma4ForConditionalGeneration`) with `local_files_only=True`.
- Setup correct local inference processing (such as using `qwen-vl-utils.process_vision_info` for Qwen3-VL).
- Executed background download tasks using Hugging Face's `snapshot_download` to completely download the model weight files onto the host system cache, resolving the offline load issues.
