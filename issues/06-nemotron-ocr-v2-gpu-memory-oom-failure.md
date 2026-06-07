# Issue 06: Nemotron OCR v2 GPU Memory OOM Failure

## Problem
When running OCR analysis using the NVIDIA Nemotron OCR v2 engine, the process failed. The `pipeline-nemotron` service logs threw an `Out of memory error on GPU 0` during Paddlex layout-parsing execution:
```
Out of memory error on GPU 0. Cannot allocate 45.776367MB memory on GPU 0, 44.376709GB memory has been allocated(actual using allocated memory 439.451172MB) and available memory is only 15.812500MB.
```

## Context
- **Environment**: Shared GPU host machine equipped with two NVIDIA L40 GPUs.
- **Affected Services**: `ocr-nemotron` and `pipeline-nemotron`.
- **Root Cause**:
  - The `ocr-nemotron` and `pipeline-nemotron` services were both configured to use GPU 1 (`CUDA_VISIBLE_DEVICES=1` in `docker-compose.yml`).
  - GPU 1 was heavily utilized (~98% full) by legacy containers from other projects, such as `paddleocr-vllm-server` consuming 31GB of VRAM.
  - Due to the memory starvation on GPU 1, Paddlex in `pipeline-nemotron` failed to allocate memory for the layout-parsing models (`PP-DocLayoutV3`, `UVDoc`) upon receiving the first inference request, resulting in a connection error on the frontend.

## Solution
- Switched the GPU allocation for both `ocr-nemotron` and `pipeline-nemotron` from GPU 1 to GPU 0 by editing [docker-compose.yml](../docker-compose.yml#L123-L150).
- Setting `CUDA_VISIBLE_DEVICES=0` allows the services to utilize GPU 0, which has plenty of free VRAM (~24GB free).
- Re-created the containers using:
  ```bash
  docker compose up -d ocr-nemotron pipeline-nemotron
  ```
- Validated that the services initialized and completed a mock API request successfully on the new GPU allocation.

## References
- [docker-compose.yml](../docker-compose.yml)
- [AGENTS.md](../AGENTS.md)
