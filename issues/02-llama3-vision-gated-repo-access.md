# Issue 02: Llama 3.2 Vision Gated Repository Access Error

## Problem
The `ocr-engine-llama3-vision` container fails to start, displaying the following error in the logs:
`OSError: You are trying to access a gated repo. Make sure to have access to it at https://huggingface.co/meta-llama/Llama-3.2-11B-Vision-Instruct.`

## Context
- **Environment**: Docker container trying to start `vllm serve meta-llama/Llama-3.2-11B-Vision-Instruct`.
- **Root Cause**: Gated Hugging Face repositories require authorization. Since no HF token is passed, the model download fails.

## Solution
Users must configure their Hugging Face Hub token by adding the `HF_TOKEN` key to the project's root `.env` file (which is automatically loaded by Docker Compose):
```env
HF_TOKEN=hf_your_token_here
```
Alternatively, they can export it directly in their host shell environment before starting the containers:
```bash
export HF_TOKEN=hf_your_token_here
docker compose up -d
```

## References
- [docker-compose.yml](./docker-compose.yml)
