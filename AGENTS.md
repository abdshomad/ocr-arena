# Agent Guidelines: OCR Arena

This repository implements the **OCR Arena** web application. If you are an AI agent working in this repository, you **MUST** always read, adopt, and follow the guidelines defined in the [andrej-karpathy-skills](andrej-karpathy-skills) submodule.

---

## 1. Core Behavioral Guidelines (Karpathy Skills)

You must unconditionally adhere to the rules in [CLAUDE.md](andrej-karpathy-skills/CLAUDE.md):

1. **Think Before Coding**:
   - Do not make assumptions. Explicitly state assumptions.
   - If there is ambiguity or multiple options exist, surface them and ask the user rather than deciding silently.
   - Stop and seek clarification when you are confused.

2. **Simplicity First**:
   - Implement only what has been requested. No speculative features, abstractions, or "flexibility."
   - Keep code short, simple, and clean.

3. **Surgical Changes**:
   - Touch only what is required to fulfill the request.
   - Do not perform drive-by formatting, styling, or refactoring in unrelated areas.
   - Match the existing style and pattern of the codebase.

4. **Goal-Driven Execution**:
   - Define clear, verifiable success criteria before writing code.
   - Verify every change systematically (using compilers, linters, or manual verification).

---

## 2. Project Architecture & Setup

This repository contains:

* **[ocr-engines](ocr-engines)**: Contains our custom configuration and dockerization setup for serving the OCR engines.
* **[andrej-karpathy-skills](andrej-karpathy-skills)**: Submodule containing developer guidelines and Cursor rules.

---

## 3. Web Application Stack

* **Frontend**: Next.js (App Router, Tailwind CSS, TypeScript).
* **Database**: PostgreSQL (schema is initialized automatically on demand).
* **Backend APIs**:
  - `Layout-parsing` APIs on ports `8090`-`8093` (served via Docker under the `ocr-engines` configuration).
  - `vLLM` servers on ports `8118`-`8121` (served via Docker under the `ocr-engines` configuration).

---

## 4. Path Guidelines (always follow)

Never use full paths containing the user's logged-in name (e.g., `/home/{uid}/path`). Always use relative paths instead (e.g., `.` or `./path` relative to the workspace root).

---

## 5. App Testing Guidelines (always follow)

- Not every feature implementation requires running the E2E tests.
- Only when the user intentionally asks to test the app (using "test", "t", or explicit test instructions), do the E2E tests with screenshots.
- When running the E2E tests:
  - Use `uv` to manage the virtual environment, sync dependencies, and run scripts:
    ```bash
    # Create the virtual environment
    uv venv
    
    # Activate the virtual environment
    source .venv/bin/activate
    
    # Sync dependencies
    uv sync
    
    # Install playwright browser binaries
    uv run playwright install
    
    # Run E2E tests (either directly with activated venv or via uv run)
    uv run python3 -m tests.run_all
    # or
    python3 -m tests.run_all
    ```
  - Use browser tools to test the app.
  - Take a screenshot for each sample image, each step, and each variant/option (if any), until the OCR result appears.
  - Save the screenshots in the `/screenshots/` folder.
  - Follow the file naming convention: `{2-digit-number}-{step#}-{variant_or_options_if_any}-{slug}.jpg` (e.g., `01-step1-default-upload.jpg`).

---

## Issue recording (always follow)

**Every problem encountered** during install, serve, debug, or client integration must be written to `issues/` before moving on — even if it was resolved in the same session.

### Naming

```
issues/{NN}-{slug}.md
```

| Part | Rule | Example |
|------|------|---------|
| `{NN}` | Two-digit running number (`01`, `02`, …). Increment from the highest existing file. | `03` |
| `{slug}` | Lowercase kebab-case summary of the problem | `gpu-memory-startup-failure` |

Full example: `issues/04-gpu-memory-startup-failure.md`

### When to create a file

- Install or dependency errors (flash-attn, vLLM, uv conflicts)
- Server startup or runtime failures (OOM, port bind, model load)
- Client integration bugs or misconfiguration
- Workarounds that took non-obvious steps to discover

Do **not** rely on chat history or inline comments alone — if it blocked progress, it belongs in `issues/`.

### File template

```markdown
# Issue {NN}: {Short title}

## Problem
What failed, with exact error message or symptom.

## Context
Environment, command run, relevant config (`.env`, `config/vllm_config.yaml`).

## Solution
What fixed it, or current workaround / open status.

## References
Links, related issue files, or AGENTS.md sections.
```

---

## 7. Autonomous Execution Plan

All pending enhancements are tracked in [plan/next-enhancements.md](plan/next-enhancements.md).

When the user replies with "enhance" or "e", you MUST:
1. Identify areas of improvement / new features for the app.
2. Add the new enhancement tasks to [plan/next-enhancements.md](plan/next-enhancements.md), planning **at least 3 next enhancements for EVERY section** of the application (specifically: Compare Workspace, Scan History, and Telemetry & Analytics, totaling a minimum of 9 tasks overall), starting each task's status with `[PENDING]`.
3. Stop and report the plan to the user.

When the user replies with "next" or "n" (or initiates autonomous execution), you MUST:
1. Locate the active task list in [plan/next-enhancements.md](plan/next-enhancements.md).
2. Identify the most impactful next task that is not marked as `[DONE]`.
3. Execute the task surgically.
4. Update its status in both `AGENTS.md` and [plan/next-enhancements.md](plan/next-enhancements.md) to `[DONE]` to track its completion.
5. Stop to await further user commands.

---

## 8. Code Modularization Guidelines (always follow)

- **File Length Limit**: Big files must be refactored into several smaller, modular components.
- **Target Size**: Every source code file should target less than 256 lines of code (LOC) to ensure maintainability, readability, and ease of automated editing.

---

