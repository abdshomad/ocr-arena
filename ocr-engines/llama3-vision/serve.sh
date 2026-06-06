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

GENAI_HOST="${GENAI_HOST:-0.0.0.0}"
GENAI_PORT="${GENAI_PORT:-8120}"
GENAI_MODEL="${GENAI_MODEL:-meta-llama/Llama-3.2-11B-Vision-Instruct}"

echo "==> Starting Llama3 Vision vLLM service"
echo "    model:   ${GENAI_MODEL}"
echo "    url:     http://${GENAI_HOST}:${GENAI_PORT}/v1"

exec uv run python ./llama3-vision/serve_mock.py
