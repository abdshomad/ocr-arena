# Stage 0: GPU Base image
FROM nvidia/cuda:12.6.0-devel-ubuntu22.04 AS base-gpu

ENV DEBIAN_FRONTEND=noninteractive
ENV PATH="/root/.local/bin:$PATH"

# Install system dependencies (libgl and libglib are required for OpenCV, git-lfs for HF downloads)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    git-lfs \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install uv
RUN curl -LsSf https://astral.sh/uv/install.sh | sh

# --- vLLM Server Stage ---
FROM base-gpu AS vllm-server
WORKDIR /app

# Install project dependencies
COPY pyproject.toml uv.lock ./
RUN uv python pin 3.12 && uv sync --frozen --no-dev

# Install prebuilt flash-attention wheel
ARG FLASH_ATTN_WHEEL=https://github.com/mjun0812/flash-attention-prebuild-wheels/releases/download/v0.3.14/flash_attn-2.8.2+cu128torch2.8-cp312-cp312-linux_x86_64.whl
RUN uv pip install --python .venv "${FLASH_ATTN_WHEEL}"

# Install nvidia/nemotron-ocr-v2 package (avoiding downloading large weights at build time)
RUN uv pip install --python .venv hatchling editables && \
    GIT_LFS_SKIP_SMUDGE=1 git clone --depth=1 https://huggingface.co/nvidia/nemotron-ocr-v2 && \
    uv pip install --python .venv --no-build-isolation -e ./nemotron-ocr-v2/nemotron-ocr

# Patch paddlex vllm model file to avoid KeyError: 'pixel_values' on decode/text-only steps
RUN /app/.venv/bin/python -c 'path = "/app/.venv/lib/python3.12/site-packages/paddlex/inference/genai/models/paddleocr_vl_09b/_vllm.py"; content = open(path).read(); target = "def get_multimodal_embeddings(self, **kwargs):\n            pixel_values = kwargs[\"pixel_values\"]"; replacement = "def get_multimodal_embeddings(self, **kwargs):\n            if \"pixel_values\" not in kwargs or kwargs[\"pixel_values\"] is None:\n                return []\n            pixel_values = kwargs[\"pixel_values\"]"; assert target in content, "Target not found in _vllm.py"; open(path, "w").write(content.replace(target, replacement))'

COPY . /app
RUN chmod +x /app/paddle-ocr-vl-1-6-v2/serve.sh /app/nvidia-nemotron-ocr-v2/serve.sh /app/llama3-vision/serve.sh /app/deepseek-vl2/serve.sh

EXPOSE 8118
CMD ["./paddle-ocr-vl-1-6-v2/serve.sh"]

# --- Pipeline API Stage ---
FROM base-gpu AS pipeline-api
WORKDIR /app

# Build paddlepaddle and paddlex virtual env
RUN uv venv .venv-api --python 3.12
RUN uv pip install --python .venv-api paddlepaddle-gpu -i https://www.paddlepaddle.org.cn/packages/stable/cu126/
RUN uv pip install --python .venv-api "paddleocr[doc-parser]>=3.3.0"
RUN uv pip install --python .venv-api "aiohttp>=3.9" "filetype>=1.2" "fastapi>=0.110" "starlette>=0.36" "uvicorn>=0.16"

COPY . /app
RUN chmod +x /app/paddle-ocr-vl-1-6-v2/serve-pipeline.sh

EXPOSE 8090
CMD ["./paddle-ocr-vl-1-6-v2/serve-pipeline.sh"]

# --- Gradio UI Stage ---
FROM python:3.12-slim AS gradio-ui
WORKDIR /app/PaddleOCR-VL-1.6_Online_Demo

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY PaddleOCR-VL-1.6_Online_Demo/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY PaddleOCR-VL-1.6_Online_Demo ./

EXPOSE 7870

ENV GRADIO_SERVER_NAME="0.0.0.0"
ENV GRADIO_SERVER_PORT="7870"

CMD ["python", "app.py"]

# --- Next.js Web App Stage ---
FROM node:20-slim AS pfm-web-app
WORKDIR /app
COPY pfm-web-app/package.json pfm-web-app/package-lock.json ./
RUN npm ci
COPY pfm-web-app/ ./
ENV NODE_ENV=production
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
