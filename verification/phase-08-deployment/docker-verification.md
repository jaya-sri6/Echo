# Phase 08 — Deployment & Container Specifications

## 1. Container Topologies

Echo supports two clean production deployment topologies:

### Topology A: Single-Port Unified App (Recommended for Simple Cloud Hosting)
FastAPI directly mounts the pre-built static Vite bundle (`frontend/dist`) at `/`:
- **Port**: `8000`
- **Endpoints**:
  - `GET /`: Serves the React SPA.
  - `GET /health`: Health check returns `{"status": "ok"}`.
  - `POST /api/case`: REST endpoint for customer case investigation.
  - `WS /ws/case`: WebSocket streaming endpoint for live agent execution.
- **Command**:
  ```bash
  uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
  ```

### Topology B: Multi-Container Compose (`docker-compose.yml`)
- **Backend Service** (`echo-backend`):
  - Base Image: `python:3.11-slim`
  - Internal Port: `8000` -> Exposed Host Port: `8000`
  - Environment: Loaded from `.env`
- **Frontend Service** (`echo-frontend`):
  - Multi-stage build (`node:20-alpine` build -> `nginx:alpine` runtime)
  - Internal Port: `80` -> Exposed Host Port: `3000`
  - Nginx configured with SPA fallback (`try_files $uri $uri/ /index.html;`)

## 2. Health Check Validation
- `GET /health` endpoint tested via FastAPI test client:
  ```json
  {"status": "ok"}
  ```
  Returns HTTP 200 within 2ms.
