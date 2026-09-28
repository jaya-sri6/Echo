# Echo — Deployment & Production Readiness Guide (P6)

## 1. Target Deployment Architecture

```text
                  USER (Browser)
                        │
                        ▼
           Frontend: React 18 / Vite 5
              [Deployed on Vercel]
                        │
                     HTTPS / WSS
                        │
                        ▼
           Backend: FastAPI / Uvicorn
              [Deployed on Render]
                        │
            ┌───────────┴───────────┐
            ▼                       ▼
     Hindsight Cloud               Groq
 (Vectorize.io REST API)    (Reserved - P1 Blocked)
```

> **Ownership Separation:** Agent execution, state machine orchestration, Hindsight memory recall/retain/reflect, outcome simulation, Guardian safety rules, and WebSocket streaming reside **exclusively in the backend on Render**. The Vercel frontend acts strictly as a presentation and interaction layer.

---

## 2. Local Architecture (Docker Compose)

Echo is fully containerized for local development and demonstration:

```text
Docker Compose
 ├── Frontend (port 4173) -> React / Vite built SPA served via Nginx (echo-frontend)
 └── Backend  (port 8000) -> FastAPI app served via Uvicorn (echo-backend)
       ├── Hindsight Cloud (api.hindsight.vectorize.io) [or SEEDED FALLBACK]
       └── Groq [Reserved for P1]
```

### No Infrastructure Bloat
As per frozen architecture guidelines, Echo requires **NO** local database services:
- No Redis
- No Kafka
- No PostgreSQL / MySQL
- No MongoDB
- No Celery
- No Pinecone / Weaviate / Milvus / Chroma

All persistent organizational memory is handled via Hindsight Cloud API (with in-memory seeded fallback for network resilience).

---

## 3. Render Deployment Specification (Backend)

### Service Configuration
- **Environment:** Python 3
- **Build Command:** `pip install -r backend/requirements.txt`
- **Start Command:** `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
- **Auto-Deploy:** On commit to `main` branch.

### Health & Readiness Probes
- **Health Check Endpoint:** `GET /health` -> `{"status": "ok"}`
- **Readiness Endpoint:** `GET /ready` -> `{"status": "ready"}`
- **Behavior:** These probes perform local verification without consuming Hindsight API credits or external quota.

### Render Environment Variables

| Variable Name | Required | Default / Example | Purpose |
| :--- | :--- | :--- | :--- |
| `PORT` | Auto (Render) | `10000` / `8000` | Port assigned by Render runtime |
| `ENVIRONMENT` | Yes | `production` | Operational environment flag |
| `CORS_ORIGINS` | Yes | `https://echo-app.vercel.app` | Comma-separated allowed frontend origins |
| `HINDSIGHT_API_URL` | Yes | `https://api.hindsight.vectorize.io` | Base URL of Hindsight Cloud instance |
| `HINDSIGHT_API_KEY` | Yes | *(Secret)* | Authenticated API token for Hindsight Cloud |
| `HINDSIGHT_BANK_ID` | Yes | `support-experiences` | Organization memory bank identifier |
| `HINDSIGHT_TIMEOUT_SECONDS` | No | `2.0` | Timeout before gracefully falling back to seeded memory |
| `GROQ_API_KEY` | No | *(Pending P1)* | Reserved for future LLM integration |
| `GROQ_MODEL` | No | `llama-3.3-70b-versatile` | Reserved for future LLM integration |

---

## 4. Vercel Deployment Specification (Frontend)

### Project Configuration
- **Framework Preset:** Vite
- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### Vercel Environment Variables

| Variable Name | Required | Example | Purpose |
| :--- | :--- | :--- | :--- |
| `VITE_BACKEND_URL` | Yes | `https://echo-api.onrender.com` | Base URL for FastAPI backend (HTTP & WS) |

---

## 5. Production CORS Configuration

- Development permits: `http://localhost:4173`, `http://localhost:5173`, `http://127.0.0.1:4173`, `http://127.0.0.1:5173`.
- Production enforces environment-based origins passed in `CORS_ORIGINS`.
- Wildcard `allow_origins=["*"]` is strictly avoided to protect organizational memory endpoints.

---

## 6. Deployment Security Audit Checklist

| Item | Status | Verification Detail |
| :--- | :--- | :--- |
| **No Secrets in Git** | PASS | `.env` and `.env.*` ignored; only `.env.example` committed. |
| **No Secrets in Docker** | PASS | `.dockerignore` excludes all `.env` files and caches. |
| **Non-Root Containers** | PASS | `backend/Dockerfile` runs as non-root `echouser` (UID 1001). |
| **CORS Controlled** | PASS | Configurable via `CORS_ORIGINS`, defaults to safe local origins. |
| **Stack Trace Sanitation** | PASS | Production error responses return structured JSON codes (`pipeline_failure`, `invalid_request`) without leaking tracebacks. |
| **Memory Isolation** | PASS | Unit/CI tests use isolated `HINDSIGHT_TEST_BANK_ID`; production uses isolated bank. |
| **Input Validation** | PASS | Pydantic validation on `CaseRequest`, message min-length enforcement, non-empty whitespace checks. |

---

## 7. Local Deployment Execution

To run the complete stack locally using Docker Compose:

```bash
# 1. Build and start containers
docker compose up --build

# 2. Check health in another terminal
curl http://localhost:8000/health
curl http://localhost:8000/ready
curl http://localhost:4173/health

# 3. Access frontend
open http://localhost:4173
```
