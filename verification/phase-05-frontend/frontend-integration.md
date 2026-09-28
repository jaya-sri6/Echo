# Phase 05 — Frontend Integration Architecture

## 1. Single-Port Unified Architecture
The FastAPI backend (`backend/app/main.py`) directly mounts the compiled Vite production assets (`frontend/dist`) at `/`:
```python
dist_path = Path(__file__).resolve().parents[2] / "frontend" / "dist"
if dist_path.exists():
    app.mount("/", StaticFiles(directory=str(dist_path), html=True), name="static")
```
This enables single-container or single-process deployment on a single port (`8000`) without requiring an extra reverse proxy for standard hackathon evaluation.

## 2. API Services Client (`frontend/src/services/api.ts`)
- `checkHealth()`: Queries `/health` to determine backend availability; updates topbar indicator in real time.
- `runInvestigation(message)`: Posts to `/api/case`, receiving typed `PipelineResult`.
- `subscribeToCaseInvestigation(onEvent, onComplete, onError)`: Opens WebSocket to `/ws/case` and streams live agent events.

## 3. UI State Transitions
The interactive interface supports 3 primary live profiles:
1. **Case 02 (Large Export Timeout)**: 600 GB / High Concurrency / Nightly Batch / Sync. Echo recalls historical failure `EXP-031` and shifts recommendation to `Async chunked export`.
2. **Case 01 (First Attempt)**: Demonstrates failure without memory prior to retention.
3. **Case 03 (Boundary Check)**: 20 GB / Low Concurrency / Interactive. Echo detects low context match and maintains `Keep existing mode`.
