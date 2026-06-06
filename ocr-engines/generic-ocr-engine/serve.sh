#!/usr/bin/env bash
set -euo pipefail

if [ -n "${DOWNLOAD_MODEL:-}" ]; then
  echo "Downloading model weights metadata/configurations for ${DOWNLOAD_MODEL} to local cache..."
  uv run python -c "
from huggingface_hub import snapshot_download
try:
    print('Starting download of model configs: ${DOWNLOAD_MODEL}')
    snapshot_download(
        repo_id='${DOWNLOAD_MODEL}',
        ignore_patterns=['*.bin', '*.pth', '*.pkl', '*.msgpack', '*.safetensors'],
        local_files_only=False
    )
    print('Download completed successfully!')
except Exception as e:
    print(f'Error downloading model: {e}')
"
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [[ "$(basename "$ROOT")" == "ocr-engines" ]]; then
  ROOT="$(cd "$ROOT/.." && pwd)"
  cd "$ROOT"
  exec uv run python ocr-engines/generic-ocr-engine/serve.py
else
  cd "$ROOT"
  exec uv run python generic-ocr-engine/serve.py
fi
