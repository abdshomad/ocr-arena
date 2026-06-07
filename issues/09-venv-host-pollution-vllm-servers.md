# Issue 09: Host .venv Pollution in Docker Build Context causing vLLM/custom server crash loops
## Problem
During execution of the OCR Arena analysis, both the Nemotron OCR v2 and Paddle OCR VL 1.6 engines failed with `Internal server error` (and `ocr-engine-paddleocr` was trapped in a crash/restart loop).
The logs revealed:
1. `ocr-engine-paddleocr` failed with:
   ```
   paddleocr: error: argument COMMAND: invalid choice: 'genai_server'
   ```
2. `ocr-engine-nemotron` failed with:
   ```
   ModuleNotFoundError: No module named 'nemotron_ocr'
   ```

## Context
When building images with the `./ocr-engines` context, the local host `.venv` inside `ocr-engines/` was copied to the container by `COPY . /app` because it was not ignored in `.dockerignore`.
As the virtual environment's symlinks pointed to `/home/aiserver/.local/share/uv/python/...` (which did not exist in the container), `uv run python` inside the container ignored the broken environment, deleted it, and recreated it at container startup using only the standard `pyproject.toml` dependencies.
This caused the loss of:
1. Custom/manual installations such as `nemotron-ocr`, `attrdict`, and `DeepSeek-VL2`.
2. The `flash-attn` package installed via wheel in the Dockerfile. Because `flash-attn` was missing, Paddlex's `is_genai_engine_plugin_available` returned `False`, preventing registration of the `genai_server` command.

## Solution
1. Excluded `.venv` from being copied during docker build by updating the main [ocr-arena/.dockerignore](file:///home/aiserver/LABS/OCR/ocr-arena/.dockerignore) and creating a new [ocr-engines/.dockerignore](file:///home/aiserver/LABS/OCR/ocr-arena/ocr-engines/.dockerignore) file containing `.venv`.
2. Removed the stale local `.venv` directory on the host (`ocr-engines/.venv`).
3. Rebuilt and restarted the containers (`ocr-paddleocr`, `ocr-nemotron`, `pipeline-paddleocr`, `pipeline-nemotron`). The services now start successfully using their correct internal virtual environment.
