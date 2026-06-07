# Issue 07: DeepSeek OCR 2 Device Type Mismatch due to GPU Memory Starvation

## Problem
During comparative runs or direct requests, the DeepSeek OCR 2 process failed with the following traceback:
```
  File "/root/.cache/huggingface/modules/transformers_modules/deepseek_hyphen_ai/DeepSeek_hyphen_OCR_hyphen_2/aaa02f3811945a91062062994c5c4a3f4c0af2b0/deepencoderv2.py", line 956, in forward
    x = self.proj(x)
  ...
RuntimeError: Input type (CUDABFloat16Type) and weight type (CPUBFloat16Type) should be the same
```

## Context
- **Environment**: Shared GPU host machine with two NVIDIA L40 GPUs.
- **Affected Services**: `ocr-deepseek-ocr-2`.
- **Root Cause**:
  - The `ocr-deepseek-ocr-2` container was configured to run on GPU 1 (`CUDA_VISIBLE_DEVICES=1` in `docker-compose.yml`).
  - GPU 1 is heavily utilized (~98% full) by processes from other projects, leaving less than 600MB of free VRAM.
  - When a request was sent, the server attempted to lazy-load the model and call `model.eval().cuda()`. Because of severe VRAM starvation on GPU 1, the transfer of some submodules (such as `sam_model` and its `patch_embed` projections) to the GPU was compromised or failed to allocate correctly, leaving their weights on the CPU.
  - During the forward pass, this resulted in a mismatch between CUDA-based inputs and CPU-based model weights, raising the type mismatch `RuntimeError`.

## Solution
- Switched the GPU allocation for `ocr-deepseek-ocr-2` from GPU 1 to GPU 0 by editing [docker-compose.yml](../docker-compose.yml#L206-L220).
- Setting `CUDA_VISIBLE_DEVICES=0` allows the container to run on GPU 0, which has ~20GB of free VRAM.
- Re-created the container using:
  ```bash
  docker compose up -d ocr-deepseek-ocr-2
  ```
- Validated the fix by sending a test curl request to the API, which successfully loaded the model weights onto GPU 0 and completed the inference without OOM or device mismatch errors.

## References
- [docker-compose.yml](../docker-compose.yml)
- [AGENTS.md](../AGENTS.md)
