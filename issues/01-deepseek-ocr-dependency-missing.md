# Issue 01: DeepSeek-OCR-2 Missing Dependency 'addict'

## Problem
When invoking the `deepseek-ocr-2` engine via the `/layout-parsing` API, the container logs showed:
`ImportError: This modeling file requires the following packages that were not found in your environment: addict. Run pip install addict`

## Context
- **Environment**: Docker container running Python 3.12 (CPython).
- **Command Run**: `uv run python deepseek-ocr-2/serve.py` in container.
- **Root Cause**: The model modeling file dynamically checks for and requires the `addict` package, which was missing from `ocr-engines/pyproject.toml`.

## Solution
Added `"addict"` to `dependencies` in `ocr-engines/pyproject.toml`, regenerated `ocr-engines/uv.lock` using `uv lock`, and rebuilt the Docker containers via `docker compose build` and restarted them via `docker compose up -d`.

## References
- [ocr-engines/pyproject.toml](./ocr-engines/pyproject.toml)
- [ocr-engines/uv.lock](./ocr-engines/uv.lock)
