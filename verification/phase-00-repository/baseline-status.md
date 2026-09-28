# Phase 00 — Baseline Environment & Toolchain State

## 1. Execution Environment
- **Operating System**: Microsoft Windows 11 (build 10.0.26100)
- **Shell**: PowerShell 7+
- **Python**: Python 3.14.5 (`C:\Users\shubh\AppData\Local\Python\pythoncore-3.14-64\python.exe`)
- **Node**: v24.16.0
- **npm**: 11.13.0
- **Git**: git version 2.54.0.windows.1

## 2. Repository Information
- **Repository URI**: `https://github.com/jaya-sri6/Echo.git`
- **Root Path**: `D:\vscode\Microsoft hackathon\Echo`
- **Initial Commit Hash**: `2bb7e44` (*"Complete Echo backend agent and API integration"*)
- **Active Branch**: `main`

## 3. Environment Secrets Verification
The root `.env` file was verified with live external services:
- `HINDSIGHT_API_URL`: `https://api.hindsight.vectorize.io` (Verified HTTP 200)
- `HINDSIGHT_API_KEY`: `hsk_9ac...` (Active Vectorize Hindsight API key)
- `HINDSIGHT_BANK_ID`: `support-experiences`
- `HINDSIGHT_TEST_BANK_ID`: `echo-hindsight-test`
- `GROQ_API_KEY`: `gsk_bPi...` (Verified HTTP 200 on models endpoint)

## 4. Initial Repository Hygiene
- Updated `.gitignore` to strictly ignore Python `__pycache__`, `*.pyc`, `dist/`, and `node_modules/`.
- Removed tracked `.pyc` files previously checked into `backend/app/domain/__pycache__/` in upstream origin.
- Created `brain/context.md` containing full architectural reference.
