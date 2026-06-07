# Agent Guidelines: OCR Arena

This repository implements the **OCR Arena** web application. AI agents working in this repository must adopt and follow the guidelines defined in the [andrej-karpathy-skills](andrej-karpathy-skills) submodule.

---

## 1. Core Behavioral Guidelines
Adhere strictly to [CLAUDE.md](andrej-karpathy-skills/CLAUDE.md):
- **Think Before Coding**: Avoid assumptions. Ask the user if there's any ambiguity.
- **Simplicity First**: Implement only requested features without speculative abstractions.
- **Surgical Changes**: Touch only what is required. Match the existing codebase style.
- **Goal-Driven**: Define success criteria first and systematically verify changes.

---

## 2. Web Stack & Paths
- **Frontend**: Next.js (App Router, Tailwind CSS, TypeScript).
- **Database**: PostgreSQL (initialized automatically on demand).
- **Backend APIs**: Served via Docker under `ocr-engines` configuration.
  - Layout parsing APIs on ports `8090`-`8093`.
  - vLLM servers on ports `8118`-`8121`.
- **Relative Paths Only**: Never use absolute paths containing username (e.g. `/home/user/path`). Use relative paths (e.g., `.` or `./path`).

---

## 3. App Testing & Screenshots
- E2E tests are run only when explicitly requested (using "test" or "t").
- Execute tests via:
  ```bash
  uv venv && source .venv/bin/activate && uv sync && uv run playwright install
  uv run python3 -m tests.run_all
  ```
- Save step-by-step screenshots to `/screenshots/` using the format: `{NN}-{step}-{variant_if_any}-{slug}.jpg` (e.g., `01-step1-default-upload.jpg`).

---

## 4. Issue Recording
Record any installation, server, debugging, or client integration issue in `issues/` immediately as `issues/{NN}-{slug}.md` using the following format:
```markdown
# Issue {NN}: {Short title}
## Problem
What failed, with exact error or symptom.
## Context
Environment, command run, and relevant config.
## Solution
What fixed it or current status/workaround.
```

---

## 5. Autonomous Enhancements Plan
When requested, manage enhancements in [plan/next-enhancements.md](plan/next-enhancements.md):
- **"enhance" / "e"**: Plan at least 3 pending enhancements (`[TODO]`) for each section (Compare Workspace, Scan History, Telemetry & Analytics). Report the plan to the user.
- **"next" / "n"**: Locate the active task list, execute the next pending task, update its status to `[DONE]` in both `AGENTS.md` and the plan, and stop.

---

## 6. Code Modularization
- **File Length Limit**: Big files must be refactored into smaller, modular components.
- **LOC Target**: Every source code file should target less than 256 lines of code (LOC).

---

## 7. OCR Engine Isolation & Fallback Rules
- **Dedicated Models**: Every OCR engine must load and return output from its dedicated model. Specifically, Qwen3-VL must load Qwen3-VL (not GLM-OCR), and Gemma 4 must load Gemma 4 (not GLM-OCR).
- **No Engine Fallback**: Under no circumstances should an OCR engine backend fall back to querying another OCR engine or a shared vLLM/OCR server.
- **No Tesseract Fallback**: No fallback to Tesseract OCR is permitted.

---

