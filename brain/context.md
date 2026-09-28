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
