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

PIPELINE_CONFIG="${PIPELINE_CONFIG:-paddle-ocr-vl-1-6-v2/pipeline_config_vllm.yaml}"
PIPELINE_HOST="${PIPELINE_HOST:-0.0.0.0}"
PIPELINE_PORT="${PIPELINE_PORT:-8090}"
PIPELINE_DEVICE="${PIPELINE_DEVICE:-gpu:0}"
VENV=".venv-api"

# Check if VLLM_SERVER_URL is provided to override the url in the config
if [[ -n "${VLLM_SERVER_URL:-}" ]]; then
  echo "==> Overriding VLLM server URL with ${VLLM_SERVER_URL}"
  TEMP_CONFIG=$(mktemp /tmp/pipeline_config_XXXXXX.yaml)
  cp "${PIPELINE_CONFIG}" "${TEMP_CONFIG}"
  sed -i "s|server_url:.*|server_url: ${VLLM_SERVER_URL}|g" "${TEMP_CONFIG}"
  PIPELINE_CONFIG="${TEMP_CONFIG}"
  trap 'rm -f "${TEMP_CONFIG}"' EXIT
fi

if [[ ! -d "${VENV}" ]]; then
  echo "Missing ${VENV}. Make sure dependencies are installed." >&2
  exit 1
fi

if [[ ! -f "${PIPELINE_CONFIG}" ]]; then
  echo "Missing pipeline config: ${PIPELINE_CONFIG}" >&2
  exit 1
fi

echo "==> Starting PaddleOCR-VL pipeline API"
echo "    config:  ${PIPELINE_CONFIG}"
echo "    device:  ${PIPELINE_DEVICE}"
echo "    url:     http://${PIPELINE_HOST}:${PIPELINE_PORT}/layout-parsing"
echo "    vllm:    ${VLLM_SERVER_URL:-http://127.0.0.1:8118/v1}"

exec "${ROOT}/${VENV}/bin/paddlex" --serve \
  --pipeline "${PIPELINE_CONFIG}" \
  --host "${PIPELINE_HOST}" \
  --port "${PIPELINE_PORT}" \
  --device "${PIPELINE_DEVICE}"
