#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [[ "$(basename "$ROOT")" == "ocr-engines" ]]; then
  ROOT="$(cd "$ROOT/.." && pwd)"
  cd "$ROOT"
  exec uv run python ocr-engines/glm-ocr/serve.py
else
  cd "$ROOT"
  exec uv run python glm-ocr/serve.py
fi
