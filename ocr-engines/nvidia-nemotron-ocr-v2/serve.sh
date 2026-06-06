#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

unset VIRTUAL_ENV

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

echo "==> Starting custom OpenAI-compatible Nemotron-OCR-v2 service..."
exec uv run python nvidia-nemotron-ocr-v2/serve_nemotron.py
