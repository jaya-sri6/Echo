# ECHO — SYSTEM CONTEXT & ARCHITECTURAL REFERENCE

## 1. System Overview

**Echo** is an organizational customer experience memory system designed to prevent SaaS customer support and operations teams from repeating costly mistakes. When customer support or DevOps engineers investigate operational issues (such as timeouts, saturations, and memory bottlenecks), naive AI or human triage often recommends textbook fixes (e.g., "increase the timeout") that have historically failed under similar conditions.

Echo intercepts this decision point. By maintaining an organizational memory of prior case contexts, attempted actions, resulting outcomes, and explicit lessons learned, Echo compares candidate actions against historical evidence. If history proves that an initial instinct failed under identical or similar conditions and that a counterfactual action succeeded, Echo dynamically shifts its recommendation, verifies policy safety via an automated Guardian, simulates the expected outcome, and retains the new result back into memory.

### Key Tenets
1. **Outcomes Over Raw Text**: Memory retains structured context, actions, and consequences, not just conversational transcripts.
2. **Transfer Boundaries**: Historical lessons must not be blindly applied. If workload, execution mode, or size constraints differ significantly, Echo classifies the experience as `BOUNDARY` or `NON_TRANSFERABLE`.
3. **Deterministic Core**: Decision analysis, candidate ranking, and scenario simulation operate on deterministic business rules without hallucination.
4. **Resilient Dual-Mode Memory**: Echo integrates directly with Vectorize Hindsight while maintaining an offline seeded demo fallback for seamless local reliability.

---

## 2. Core Architecture & Data Flow

Echo implements a single-port or decoupled multi-tier architecture:
- **Frontend**: React 18 single-page application built with Vite and Tailwind CSS.
- **Backend API**: FastAPI application exposing REST (`/health`, `/api/case`) and real-time WebSocket (`/ws/case`) streaming endpoints.
- **Agent Pipeline**: 5 specialized agents orchestrating deterministic triage, investigation, memory recall, recommendation, and safety checks.
- **Memory Engine**: Hindsight client with bidirectional retain/recall and explicit applicability scoring.
- **Domain Simulator**: Deterministic export performance engine modeling execution outcomes across 5 distinct actions.

### End-to-End Data Flow
```
Customer Message
       │
       ▼
[Conversation Agent] ───────► Extracts CaseContext (size, concurrency, workload, mode, problem)
       │
       ▼
  [Investigator]    ───────► Validates context completeness & operational readiness
       │
       ▼
[Experience Memory] ───────► Queries Hindsight / Local Bank for historical experiences
       │
       ▼
[Experience Reasoner] ─────► Assesses Applicability (MATCH, PARTIAL_MATCH, BOUNDARY, NON_TRANSFERABLE)
       │                    Simulates candidate actions & evaluates counterfactuals
       ▼
 [Resolution Agent] ───────► Formulates concrete recommendation based on evidence
       │
       ▼
    [Guardian]      ───────► Validates confidence, safety boundaries, and escalation policy
       │
       ▼
 [Export Simulator] ───────► Deterministically evaluates chosen action -> Outcome (SUCCESS/FAILURE/PARTIAL)
       │
       ▼
[Experience Memory] ───────► Retains new experience (Context + Action + Outcome + Lesson)
       │
       ▼
Next Case Query     ───────► Recalls newly retained experience -> Adapts future decision!
```

---

## 3. Canonical Data Contracts

All data structures in Echo adhere to unified Pydantic schemas in Python (`backend/app/domain/`) and matching TypeScript interfaces in the frontend (`frontend/src/types/index.ts`).

### 3.1 CaseContext (`backend/app/domain/case_context.py`)
```python
class CaseContext(BaseModel):
    export_size_gb: float          # e.g., 600.0 (GB)
    concurrency: Union[str, int]   # e.g., "high", "medium", "low" or integer worker count
    workload: str                  # e.g., "nightly_batch", "interactive", "data_migration"
    execution_mode: str            # e.g., "sync", "async"
    problem_type: str              # e.g., "export_timeout", "export_performance"
```

### 3.2 Experience (`backend/app/domain/experiences.py`)
```python
class Experience(BaseModel):
    experience_id: str
    source: str                    # "SEEDED", "ECHO_RUN", "PLAYBOOK"
    problem_type: str
    context: CaseContext
    diagnosis: str
    action: str                    # e.g., "async_chunked_export", "increase_timeout"
    outcome: str                   # Plain-language outcome description
    status: Optional[Literal["SUCCESS", "FAILURE", "PARTIAL", "BOUNDARY", "NON-TRANSFERABLE"]]
    lesson: str
    applicability: Dict[str, Any]  # e.g., {"workload": ["nightly_batch"], "export_size_gb_min": 500}
```

### 3.3 SimulationResult (`backend/app/domain/simulator.py`)
```python
class SimulationResult(BaseModel):
    outcome: Literal["SUCCESS", "FAILURE", "PARTIAL"]
    resolution_time_minutes: int
    escalated: bool
    reason: str
    lesson: str
```

### 3.4 PipelineResult (`backend/app/orchestration/pipeline.py`)
```python
class PipelineResult(BaseModel):
    status: Literal[
        "COMPLETE", "INVALID_INPUT", "INCOMPLETE_CASE",
        "INVESTIGATION_FAILED", "NO_APPLICABLE_EXPERIENCE",
        "DECISION_ANALYSIS_FAILED", "RESOLUTION_FAILED", "GUARDIAN_REJECTED"
    ]
    case_context: Optional[CaseContext] = None
    investigation: Optional[InvestigationResult] = None
    experience_reasoning: Optional[ExperienceReasoningResult] = None
    resolution: Optional[ResolutionRecommendation] = None
    guardian: Optional[GuardianResult] = None
    final_recommendation: Optional[str] = None
    changed_by_hindsight: bool = False
    decision_evidence: List[str] = []
    errors: List[str] = []
```

---

## 4. Agent Responsibilities & Prompts

Echo employs 5 focused agents in an orchestrated pipeline:

| Agent | Module | Primary Responsibility | Input -> Output |
| :--- | :--- | :--- | :--- |
| **Conversation Agent** | `agents/conversation_agent.py` | Extracts structured case attributes from unstructured customer messages using deterministic regex parsing. | Raw Text -> `ExtractionResult` (`CaseContext`) |
| **Investigator** | `agents/investigator.py` | Validates extracted attributes, confirms whether case is actionable, identifies missing operational context. | `CaseContext` -> `InvestigationResult` |
| **Experience Reasoner** | `agents/experience_reasoner.py` | Interfaces with domain decision analysis to assess experience transferability and evaluate candidate actions. | `CaseContext` + `Experiences` -> `ExperienceReasoningResult` |
| **Resolution Agent** | `agents/resolution_agent.py` | Formulates the definitive recommendation, explaining the delta between naive initial instinct and hindsight-backed action. | `CaseContext` + `Reasoning` -> `ResolutionRecommendation` |
| **Guardian** | `agents/guardian.py` | Enforces safety policies: rejects solutions missing prerequisites, flags low confidence, prevents hazardous executions. | `CaseContext` + `Resolution` + `Reasoning` -> `GuardianResult` |

---

## 5. Memory Subsystem & Hindsight Mapping

Echo features a dual-layer memory subsystem in `backend/app/hindsight/`:

### 5.1 Remote Integration (`HindsightClient`)
- Communicates with Vectorize Hindsight API (`https://api.hindsight.vectorize.io`).
- Bank IDs: Configurable via `HINDSIGHT_BANK_ID` (default: `support-experiences`) and `HINDSIGHT_TEST_BANK_ID`.
- API Operations:
  - `retain(content, document_id)`: Stores structured JSON memory string.
  - `recall(query)`: Semantic retrieval of prior experiences.
  - `reflect(query)`: Synthesizes high-level takeaway from recalled experiences.

### 5.2 Local Experience Bank (`ExperienceMemory`)
- Manages local thread-safe registry of `ExperienceRecord` objects.
- On initialization, loads seeded dataset from `data/experiences/seeded_experiences.json`.
- If Hindsight remote is enabled and credentials are valid, synchronizes seeds on first use.
- If network connection fails or credentials expire, automatically transitions `memory_mode` to `SEEDED DEMO FALLBACK` with zero pipeline interruption.

### 5.3 Applicability Assessment Engine (`recall.py` & `decision_analysis.py`)
Computes transfer validity across 5 dimensions:
1. `problem_type`: Must match target issue; mismatch results in `NON_TRANSFERABLE`.
2. `export_size_gb`: Evaluated against `export_size_gb_min` and `export_size_gb_max`. Out-of-bounds results in `BOUNDARY`.
3. `concurrency`: Normalized into tiers (`low` <= 4, `medium` 5–12, `high` >= 13).
4. `workload`: Matches execution profile (`nightly_batch`, `interactive`, etc.).
5. `execution_mode`: Distinguishes `sync` from `async`.

---

## 6. Simulator Rules & Outcome Transitions

The `ExportSimulator` (`backend/app/domain/simulator.py`) codifies deterministic domain physics for SaaS data exports:

### Supported Actions
- `increase_timeout`
- `reduce_concurrency`
- `async_chunked_export`
- `retry_with_backoff`
- `schedule_off_peak`

### Transition Truth Table
| Workload | Size (GB) | Concurrency | Mode | Action | Outcome | Escalated | Resolution Time |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `nightly_batch` | >= 500 | `high` | `sync` | `increase_timeout` | **FAILURE** | Yes | 180 min |
| `nightly_batch` | >= 500 | `high` | `sync` | `async_chunked_export` | **SUCCESS** | No | 110 min |
| `nightly_batch` | >= 250 | `high` | `sync` | `reduce_concurrency` | **SUCCESS** | No | 75 min |
| `nightly_batch` | >= 300 | `high` | `sync` | `retry_with_backoff` | **PARTIAL** | No | 140 min |
| `nightly_batch` | >= 180 | Any | `sync` | `schedule_off_peak` | **SUCCESS** | No | 90 min |
| `interactive` | <= 20 | `low` | `sync` | `increase_timeout` | **SUCCESS** | No | 8 min |

---

## 7. Guardian Policy & Boundary Checks

The Guardian (`backend/app/agents/guardian.py`) inspects recommendations before publication:
- **Approval Criteria**:
  - Recommendation must not be empty or invalid.
  - Action must not contradict safety rules (e.g. attempting sync increase on saturated 500GB+ batch).
  - Confidence threshold must meet or exceed minimum safety margin (0.70).
- **Rejection Handling**:
  - Sets `approved = False`.
  - Populates `issues` list with concrete failure descriptions.
  - Pipeline halts with status `GUARDIAN_REJECTED`.

---

## 8. WebSocket Event Stream Schema

WebSocket endpoint `/ws/case` streams real-time execution events. Every event conforms to:

```json
{
  "step_index": 0,
  "event": "case_started",
  "agent": "conversation_agent",
  "status": "started",
  "message": "Customer message received; starting the Echo pipeline.",
  "timestamp": "2026-09-29T00:15:00.000000Z",
  "duration_ms": 1.25,
  "data": {}
}
```

### Full Event Sequence
1. `case_started` (`conversation_agent`)
2. `investigation_completed` (`investigator`)
3. `hindsight_recall_completed` (`experience_memory`)
4. `applicability_assessed` (`experience_reasoner`)
5. `reflection_completed` (`experience_reasoner`)
6. `simulation_completed` (`simulator`)
7. `guardian_validated` (`guardian`)
8. `recommendation_ready` (`resolution_agent`)
9. `execution_started` (`executor`)
10. `outcome_recorded` (`simulator`)
11. `experience_retained` (`experience_memory`)
12. `pipeline_completed` (`pipeline`)

---

## 9. Evaluation Benchmark & Metric Equations

Located in `evaluation/`, Person 4 evaluation suite tracks the statistical efficacy of Hindsight memory across 8 canonical benchmark cases:

### Metrics Computed (`evaluation/metrics.py`)
1. **Success Rate**:
   $$\text{Success Rate} = \frac{\text{Cases with SUCCESS outcome}}{\text{Total completed cases}} \times 100\%$$
2. **Failure Rate**:
   $$\text{Failure Rate} = \frac{\text{Cases with FAILURE outcome}}{\text{Total completed cases}} \times 100\%$$
3. **Applicability Rate**:
   $$\text{Applicability Rate} = \frac{\text{Cases with MATCH or PARTIAL\_MATCH}}{\text{Total completed cases}} \times 100\%$$
4. **Decision Change Rate**:
   $$\text{Decision Change Rate} = \frac{\text{Cases where recommendation differed from baseline}}{\text{Total completed cases}} \times 100\%$$
5. **Average Resolution Time**:
   $$\text{Average Resolution Time} = \frac{\sum \text{Resolution Time (minutes)}}{\text{Total completed cases}}$$

---

## 10. Environment Variables & Fallback Behaviors

| Variable | Required | Default | Purpose |
| :--- | :--- | :--- | :--- |
| `HINDSIGHT_API_URL` | No | `https://api.hindsight.vectorize.io` | Vectorize Hindsight API base URL |
| `HINDSIGHT_API_KEY` | No | None | Vectorize Hindsight authentication bearer token |
| `HINDSIGHT_BANK_ID` | No | `support-experiences` | Production experience bank namespace |
| `HINDSIGHT_TEST_BANK_ID`| No | `echo-hindsight-test` | Automated test suite bank namespace |
| `GROQ_API_KEY` | No | None | Optional LLM copilot provider key |
| `PORT` | No | `8000` | Unified server bind port |

### Fallback Guarantee
If `HINDSIGHT_API_KEY` is missing, invalid, or the network is disconnected:
- `ExperienceMemory` automatically logs a warning and enters `SEEDED DEMO FALLBACK`.
- All pipeline functions continue without error.
- Zero mock/fake libraries are used; fallback relies strictly on local seeded dataset.

---

## 11. File & Directory Map

```
Echo/
├── .env                              # Active environment configuration
├── docker-compose.yml                # Unified multi-stage container deployment
├── README.md                         # Project documentation and quickstart
├── backend/
│   ├── Dockerfile                    # Production backend Dockerfile
│   ├── requirements.txt              # Production Python dependencies
│   ├── app/
│   │   ├── main.py                   # FastAPI app & static SPA asset mount
│   │   ├── agents/                   # 5 specialized pipeline agents
│   │   ├── api/                      # REST and WebSocket route controllers
│   │   ├── domain/                   # Deterministic simulation, models, analysis
│   │   ├── hindsight/                # Hindsight client, memory, recall, reflect
│   │   └── orchestration/            # EchoPipeline controller & execution flow
│   └── tests/                        # Full pytest suite (67+ unit and integration tests)
├── data/
│   └── experiences/                  # 10 canonical seeded historical experiences
├── demo/
│   └── demo_runner.py                # Deterministic CLI hero case runner
├── docs/                             # Architecture, demo script, setup guides
├── evaluation/
│   ├── benchmark_cases.json          # 8 canonical evaluation benchmark cases
│   ├── metrics.py                    # Metric calculation engine
│   ├── run_benchmark.py              # Comparative benchmark runner (Memory ON vs OFF)
│   └── benchmark_results.json        # Persisted benchmark output data
├── frontend/
│   ├── package.json                  # React 18, Vite, Tailwind dependencies
│   ├── vite.config.js                # Vite build configuration
│   └── src/                          # TypeScript definitions, API client, React UI
├── handoff/                          # Role handoff specifications (Members 1, 2, 4, 5)
└── verification/                     # Phase-by-phase stabilization evidence logs
```

---

## 12. Known Limitations & Future Roadmap

- **Workload Support**: MVP strictly models data export timeouts. Future extensions will model memory saturation in report generation and queue backlog in ingestion pipelines.
- **Dynamic Action Discovery**: Supported actions are currently drawn from a deterministic set of 5 mitigations. Future phases will support dynamic action generation from runbooks.
- **Distributed Memory Sync**: Retained experiences are written immediately to Hindsight and local process memory. Multi-instance horizontal scaling will utilize Hindsight webhook events for cache coherence.

---

## Track A Verification — 2026-09-29

### Current Verified State
- **Audit Date:** 2026-09-29
- **Exact Commit:** `57ce66b6c20579e09d17d5c90b63f68310c9c716` (origin/main)
- **Overall Status:** PASS WITH CONDITIONS

### Tests Run & Actual Results
- **Full Pytest Suite:** `python3 -m pytest backend/tests/ -v` -> **69 passed, 1 skipped** in 41.49s.
  - `test_agents.py`: 9 passed
  - `test_api.py`: 6 passed
  - `test_decision_analysis.py`: 9 passed
  - `test_domain.py`: 5 passed
  - `test_evaluation.py`: 4 passed
  - `test_hindsight.py`: 15 passed, 1 skipped
  - `test_hindsight_loop.py`: 2 passed
  - `test_pipeline.py`: 9 passed
  - `test_simulator.py`: 6 passed
  - `test_websocket.py`: 4 passed
- **Live Remote Hindsight Suite:** `HINDSIGHT_RUN_INTEGRATION=1 python3 -m pytest backend/tests/test_hindsight.py::test_real_hindsight_retain_recall_reflect_contract -v` -> **1 passed** in 11.14s.
- **8-Case Evaluation Benchmark:** `python3 evaluation/run_benchmark.py` -> Clean pass, 100% decision success, -60m resolution time.
- **3-Case Hero Demo:** `python3 demo/demo_runner.py` -> All 3 hero cases verified end-to-end.
- **REST Endpoints:** `GET /health` (200 OK), `POST /api/case` (200 OK for valid context, 422 for invalid/incomplete).
- **WebSocket Stream:** `ws://localhost:8000/ws/case` -> 12 verified domain lifecycle events streamed cleanly.

### Hindsight Status
- **Remote Cloud Integration:** VERIFIED (Connected, retained test experiences, recalled remote memories, produced counterfactual reflection).
- **Local Fallback Mode:** VERIFIED (15 seeded experiences, deterministic similarity scoring, in-process retain).

### Known Bugs & Discrepancies
1. **BUG-001 (Pipeline Scope Bypass):** `backend/app/orchestration/pipeline.py:192` passes `list(bank.experiences)` to `ExperienceReasoner.run` instead of filtering down to `recall_result.evidence`.
2. **BUG-002 (REST API Retain Default):** `backend/app/api/routes.py:37` calls `EchoPipeline.run(request.message)` with default `retain_outcome=False`.
3. **BUG-003 (Tracked Bytecode):** Two `.pyc` files in `backend/tests/__pycache__/` are tracked in Git index.
4. **BUG-004 (Documentation Divergence):** `CHANGES.md` documents `token_stream` and `stage_start` WebSocket events; actual backend emits 12 domain lifecycle events (`case_started` ... `pipeline_completed`).
5. **BUG-005 (Unused Groq Config):** `GROQ_API_KEY` is documented in `.env.example`, but `backend/app/` has no active Groq client.

### Deployment Blockers
1. Host Docker Desktop daemon is currently paused; native run is verified.
2. Frontend Track B must consume the verified 12 domain event names, not the stale schema in `CHANGES.md`.

### Things NOT Verified
- Production Kubernetes / Multi-worker Celery queue deployment (not part of frozen MVP architecture).
- Host Docker Desktop container networking (blocked by host Docker Desktop daemon pause).

### Things That Must NOT Be Changed Before Track B
- Do not alter the 12 WebSocket event schemas (`case_started`, `investigation_completed`, `hindsight_recall_completed`, `applicability_assessed`, `reflection_completed`, `simulation_completed`, `guardian_validated`, `recommendation_ready`, `execution_started`, `outcome_recorded`, `experience_retained`, `pipeline_completed`).
- Do not replace the deterministic domain simulator or applicability classification logic.
- Do not introduce external queues or databases that break single-container deployment.

---

## Track A Remediation Verification — 2026-09-29

### Overall Status: TRACK A — PASS

### Issue Resolutions
1. **BUG-001 Resolved (Hindsight Evidence Filtering):**
   - Modified `backend/app/orchestration/pipeline.py` to query Hindsight with `limit=10` and filter `available_experiences` strictly to `recall_result.evidence`.
   - Updated `backend/app/hindsight/recall.py` to normalize `large_export_timeout` in `_context_mapping` and include it in `_related_problem`.
   - Added unit and loop tests (`test_bug001_only_recalled_evidence_is_used`, `test_bug001_no_memory_behavior_deterministic_and_functional`, `test_bug001_evidence_contract_consistency`) in `backend/tests/test_hindsight_loop.py`.
2. **BUG-002 Resolved (REST API Retention):**
   - Updated `backend/app/api/routes.py` to pass `retain_outcome=True` to `EchoPipeline.run(...)`.
   - Added tests in `backend/tests/test_api.py` verifying retention persistence, exposure of `retained_experience_id`, and validation safety.
3. **BUG-004 Resolved (WebSocket Documentation Synchronization):**
   - Synchronized `CHANGES.md` to document the verified 12-event domain lifecycle (`case_started` through `pipeline_completed`), JSON request contract, and lifecycle semantics of `execution_started`.
4. **Repository Hygiene (Bytecode Cleanup):**
   - Untracked all compiled `.pyc` files from git cache via `git rm --cached`. `git ls-files | grep -E '(__pycache__|\.pyc)'` confirmed 0 files.
5. **Track C Frontend Safety:**
   - Zero frontend UI files modified; redesign work fully preserved.

### Verification Results Summary
- **Pytest Suite:** **74 passed, 1 skipped, 0 failed in 12.61s** (`python3 -m pytest backend/tests/ -v`).
- **Remote Hindsight Contract:** **1 passed in 11.06s** (`HINDSIGHT_RUN_INTEGRATION=1`).
- **Learning Demonstration:** **PASSED** (`python3 demo/demo_runner.py e2e`).
- **Evaluation Benchmark:** **PASSED** (`python3 evaluation/run_benchmark.py`: 100% decision success, -61.9m resolution time).
- **Live API & WebSocket:** `/health` (200), `/ready` (200), `/api/case` (200 with retention), `/ws/case` (all 12 events streamed).
- **Docker Status:** Docker Desktop daemon unpaused; containerized backend healthy on port 8000.
- **Remaining Blockers:** None.

---

## Track B Verification — 2026-09-29

### Overall Status: TRACK B — PASS

### Integration Summary
1. **Frontend / Backend Contracts:**
   - **REST:** `POST /api/case` takes `{"message": "<text>"}` and returns complete `PipelineResult` with `simulation`, `resolution`, `retained_experience_id`, and `decision_evidence`.
   - **WebSocket:** `WS /ws/case` accepts `{"message": "<text>"}` and streams the exact 12-event lifecycle without fake timers or synthetic progress.
2. **Frontend UI Communication:**
   - `frontend/src/types/index.ts` synchronized with backend `PipelineResult` and 12-event lifecycle types.
   - `frontend/src/App.jsx` updated: eliminated artificial `setTimeout` stage incrementing. Stages update directly upon receipt of real WebSocket events.
   - Error alert banner added to surface pipeline failures and connection interruptions without getting stuck in an infinite loading state.
   - Track C visual layout, styles, and cards preserved 100%.
3. **Docker Multi-Container & Single-Port Architectures:**
   - **Option A (Unified Single-Port):** `backend/Dockerfile` builds React SPA and mounts it on `/`, serving API, WebSocket, and UI on a single unified port (`$PORT` or 8000).
   - **Option B (Docker Compose Multi-Container):** `echo-backend` on port 8000 + `echo-frontend` on port 3000 (nginx with reverse proxy for `/api/`, `/health`, `/ready`, and `/ws/`). Both containers healthy.
4. **Containerized WebSocket Testing:**
   - Verified 12 out of 12 lifecycle events streamed in exact sequence across container boundary over both direct backend port 8000 and nginx reverse proxy port 3000.
5. **Security & Hygiene:**
   - No tracked `.env` or `.pyc` files.
   - Zero private API keys (`HINDSIGHT_API_KEY`, `GROQ_API_KEY`) exposed in client bundle or frontend images.
6. **Stable Checkpoint & Rollback:**
   - Stable Tag: `echo-stable-01`
   - Rollback documented in `verification/phase-05-frontend/track-b-verification.md`.

