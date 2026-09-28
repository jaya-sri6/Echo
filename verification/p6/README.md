# Echo — P6 Deployment & Quality Assurance

## Role and Scope

**Person 6 — Product Auditor / Red Team / QA / Deployment**

The core product claim of Echo is:
> **Echo remembers what the company learned from previous interventions and uses that experience to change future decisions.**

The core acceptance criterion:
```text
Memory OFF -> generic recommendation
Memory ON  -> historical experience -> boundary/applicability -> different recommendation
```

P6 does **NOT** redesign or rewrite core agent orchestration. P6 maintains deployment pipelines, local/Docker configurations, test harnesses, fallback strategies, failure matrices, E2E acceptance tests, demo runners, and reliability documentation.

---

## 1. Current Repository State

An extensive audit of the repository was conducted on 2026-09-29:

| Subsystem | Components Present | State / Health |
| :--- | :--- | :--- |
| **Domain Models & Simulator** | `CaseContext`, `Experience`, `CandidateAction`, `ExportSimulator`, `DecisionAnalysis` | **COMPLETE & TESTED**. Fully deterministic rules, handles 600 GB batch timeout vs 20 GB interactive boundary. 100% unit test pass. |
| **Hindsight Memory Module** | `HindsightClient`, `ExperienceMemory`, `recall`, `reflect`, `retain`, seeded data | **COMPLETE & UNIT-TESTED**. Real HTTP client with auto-bank creation and stable document IDs. Explicit `SEEDED DEMO FALLBACK` on outage. 1 live test opt-in. |
| **Agent Orchestration** | `ConversationAgent`, `Investigator`, `ExperienceReasoner`, `ResolutionAgent`, `Guardian`, `EchoPipeline` | **COMPLETE & INTEGRATED**. 5-agent linear deterministic pipeline running from customer message to guarded recommendation. 62/63 pytest tests passing. |
| **API & WebSocket** | `GET /health`, `POST /api/case`, `WS /ws/case` | **OPERATIONAL**. Clean Starlette/FastAPI endpoints. Tested with TestClient. |
| **Frontend UI** | React 18 + Vite 5 SPA (`App.jsx`, `Case.tsx`, `components/`) | **BUILDS CLEANLY**. Production build passes. Standalone interactive case switcher (`informed`, `failure`, `boundary`). WebSocket connection to live backend pending UI integration. |
| **Docker & Compose** | `backend/Dockerfile`, `frontend/Dockerfile`, `docker-compose.yml` | **STUBBED (0 bytes)** at start of P6 audit. Ready for P6 implementation. |
| **Demo Runner & Evaluation** | `demo/demo_runner.py`, `evaluation/*` | **STUBBED (0 bytes)** at start of P6 audit. Ready for P6 implementation. |
| **Root Documentation** | `README.md`, `docs/architecture.md`, `docs/demo-script.md` | **STUBBED (0 bytes)** at start of P6 audit. Ready for P6 implementation. |

---

## 2. P6 Deliverables

1. **Docker Infrastructure**:
   - Multi-stage `backend/Dockerfile` with non-root user and healthcheck.
   - Multi-stage `frontend/Dockerfile` with Nginx/Vite preview for production build.
   - Root `docker-compose.yml` orchestrating Frontend (port 4173) and Backend (port 8000).
   - `.dockerignore` for clean builds avoiding local caches and secrets.
2. **Cloud Deployment Readiness**:
   - Backend on **Render** (binds 0.0.0.0, `$PORT` environment variable support, `/health` and `/ready` endpoints).
   - Frontend on **Vercel** (static SPA build, environment-configured API proxy / backend URL).
   - CORS middleware with environment-driven origins.
3. **Reliability & Fallbacks**:
   - `verification/p6/websocket-reliability.md`: WebSocket connect, streaming, disconnect, and HTTP fallback.
   - Primary Hindsight Cloud with automatic fallback to `SEEDED DEMO FALLBACK`.
   - Groq integration status & fallback audit (Blocked on P1).
   - Voice fallback architecture (Voice -> Transcription -> Echo text; no LiveKit).
4. **Verification & Testing**:
   - `verification/p6/FAILURE_MATRIX.md`: 17 comprehensive failure scenarios.
   - `verification/p6/E2E_TEST.md`: Acceptance test for Case A (failure) -> Case B (learning) -> Case C (boundary), Memory OFF vs ON.
   - `verification/p6/DEMO_RUNBOOK.md`: Deterministic demo guide and judge Q&A.
   - `verification/p6/P6_STATUS.md`: Formal status report with explicit PASS/FAIL/BLOCKED ratings.
5. **Deterministic Demo Runner**:
   - `demo/demo_runner.py`: CLI supporting `reset`, `case-a`, `case-b`, `case-c`, `benchmark`, `e2e`.

---

## 3. How to Run the Verification Suite

### A. Run Unit & Pipeline Tests
```bash
python3 -m pytest backend/tests -v
```

### B. Run E2E Test Suite (P6)
```bash
python3 demo/demo_runner.py e2e
```

### C. Run Docker Compose Locally
```bash
docker compose up --build
```
- Frontend: `http://localhost:4173`
- Backend API: `http://localhost:8000`
- Healthcheck: `http://localhost:8000/health`
- Readiness: `http://localhost:8000/ready`
