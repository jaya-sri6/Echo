<p align="center">
  <br />
  <pre align="center">
  ███████╗ ██████╗██╗  ██╗ ██████╗ 
  ██╔════╝██╔════╝██║  ██║██╔═══██╗
  █████╗  ██║     ███████║██║   ██║
  ██╔══╝  ██║     ██╔══██║██║   ██║
  ███████╗╚██████╗██║  ██║╚██████╔╝
  ╚══════╝ ╚═════╝╚═╝  ╚═╝ ╚═════╝ 
  </pre>
  <h3 align="center">ECHO — Organizational Experience Memory Engine</h3>
  <p align="center">
    <strong>"Echo doesn't remember what customers said. It remembers what the company learned."</strong>
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/Tests-78%20Passed-10a37f?style=flat-square" alt="Tests" />
    <img src="https://img.shields.io/badge/Architecture-6%20Specialized%20Agents-10a37f?style=flat-square" alt="Agents" />
    <img src="https://img.shields.io/badge/Groq%20LLM-Tiered%20gpt--oss--20b%20%2F%20120b-0d3829?style=flat-square&color=10a37f" alt="Groq LLM" />
    <img src="https://img.shields.io/badge/Memory%20Layer-Hindsight%20v3.0-0d3829?style=flat-square" alt="Hindsight" />
    <img src="https://img.shields.io/badge/Docker-Verified%20Containerized-171717?style=flat-square" alt="Docker" />
    <img src="https://img.shields.io/badge/Design-Near--Black%20v3.0-171717?style=flat-square" alt="Design" />
  </p>
</p>

---

## 📌 1. The Core Philosophy

When critical outages strike B2B SaaS infrastructure at 3 AM:
1. **Critical Institutional Wisdom Evaporates**: Postmortems, mitigation hacks, and workaround recipes rot in Slack threads, Jira tickets, and Google Docs.
2. **The Fatal Flaw of Standard RAG**: Vector databases match text keywords (*"timeout"*), completely blind to operational consequences. A standard LLM will recommend increasing query timeouts—unaware that doing so crashed the shared database pool last month.
3. **Scale Divergence**: Heuristics that succeed at 20 GB catastrophically fail at 600 GB batch pipelines, causing cascading connection pool exhaustion.

**Echo resolves this by placing the Hindsight Memory Layer at the center of multi-agent triage.** Instead of repeating past mistakes, Echo recalls previous failures, validates contextual applicability boundaries, enforces hard organizational invariants, and autonomously retains every verified outcome back into organizational memory.

---

## 🎯 2. The Three-Case Proof (Core Verification Benchmark)

Echo is designed and verified against the **Three-Case Proof of Organizational Learning**:

```text
               CASE A: First Experience (Baseline Trial)
               600 GB Payload • High Concurrency • Nightly Batch Sync
               Initial Decision : Increase Timeout
               Outcome          : FAILURE (Connection Pool Saturation)
               Learning Loop    : Retained as Negative Precedent (EXP-031 / EXP-DEMO-001)
                                      ↓
               CASE B: Repeated Problem (Memory-Informed Decision)
               600 GB Payload • High Concurrency • Nightly Batch Sync
               Echo Action      : Hindsight recalls EXP-031 failure
               Decision Shift   : Increase Timeout → Async Chunked Export (EXP-044)
               Outcome          : SUCCESS (110m completion, 0 escalation)
               Learning Loop    : Retained as Positive Precedent (EXP-DEMO-002)
                                      ↓
               CASE C: Transfer Boundary Check (Anti-RAG Protection)
               20 GB Payload • Low Concurrency • Interactive Sync
               Echo Action      : Discovers 600 GB batch precedents
               Boundary Reason  : Workload volume (<50 GB) & mode diverge
               Decision Shift   : REJECT BLIND TRANSFER (EXP-067 / EXP-089)
               Outcome          : Avoids unnecessary async refactoring
```

---

## 🤖 3. Multi-Agent Architecture (The 6 Specialized Agents)

Echo orchestrates **6 specialized autonomous agents** collaborating across the deterministic 12-event lifecycle:

```text
               ┌────────────────────────────────────────────────────────┐
               │              CUSTOMER INCIDENT / TELEMETRY              │
               └───────────────────────────┬────────────────────────────┘
                                           │
                                           ▼
                             [ 1. Context Ingest Agent ]
                                           │  (Extracts payload, concurrency, locks)
                                           ▼
                             [ 2. Incident Investigator ]
                                           │  (Dissects bottlenecks & severity)
                                           ▼
              ┌──────────────────────────────────────────────────────────┐
              │          TIER 2 :: CENTRAL HINDSIGHT MEMORY CORE          │
              │                                                          │
              │   • [ 3. Hindsight Recall Agent ]                        │
              │     Recalls historical precedents (EXP-031, EXP-044)     │
              │                                                          │
              │   • [ 4. Applicability & Boundary Reasoner ]             │
              │     Checks scale boundaries & flags contraindications    │
              └────────────────────────────┬─────────────────────────────┘
                                           │
                                           ▼
                             [ 5. Guardian & Simulator ]
                                           │  (Enforces EXP-089 hard lease limits <12m)
                                           ▼
                             [ 6. Echo Copilot Engine ]
                                           │  (Tiered Groq LLMs: gpt-oss-20b / 120b)
                                           ▼
                               [ PERSISTENT RESOLUTION ]
                                           │
                                           ▼
                             [ 7. Memory Retention Agent ]
                                           │  (Records outcome into Hindsight bank N+1)
```

### The 6 Agent Roles

| Agent | Module | Core Functionality |
| :--- | :--- | :--- |
| **1. Context Ingest Agent** | `ConversationAgent` | Parses customer dialogue and telemetry into structured context (`export_size_gb`, `concurrency`, `workload`, `execution_mode`). |
| **2. Incident Investigator** | `IncidentInvestigator` | Isolates system bottlenecks, locks, and resource saturation points. |
| **3. Hindsight Recall Agent** | `HindsightRecallAgent` | Interrogates the Hindsight memory bank for semantic precedents, surfacing both winning fixes and catastrophic failures. |
| **4. Applicability Reasoner** | `ApplicabilityReasoner` | Analyzes counterfactual failure risks. Prevents blind transfer of small-scale heuristics to heavy batch workloads. |
| **5. Guardian & Simulator** | `GuardianSimulator` | Deterministically simulates candidate mitigations against hard organizational invariant boundaries (e.g. EXP-089 pool limits). |
| **6. Echo Copilot Engine** | `GroqCopilot` | Generates query-specific, genuine operational explanations using cost-optimized tiered Groq LLMs. |

---

## 🏛️ 4. Master Extensions & Advanced Capabilities

Echo implements the full suite of **S-Tier** and **A-Tier** capabilities specified in `ECHO_EXTENSIONS_MASTER_INTEGRATION.md`:

### S-Tier Capabilities (Strategic Experience Systems)

#### `S1` — Interactive Memory Explorer & Precedent Vault
- **Visual Precedent Browser**: Inspect all verified organizational precedents with state vectors (`export_size_gb`, `concurrency`, `workload`).
- **Negative & Positive Categorization**: Clearly isolates failure precedents (`EXP-031 Contraindicated Lock`), success resolutions (`EXP-044 Async Chunking`), scale guards (`EXP-067`), and invariants (`EXP-089`).
- **Interactive Graph Dock**: A real-time bezier connection matrix connecting active incident contexts directly through the central Hindsight Memory Core.

#### `S2` — Decision Replay (Memory OFF vs. ON)
- **Counterfactual Side-by-Side Replay**: Demonstrates what an automated agent would do with **Memory OFF** (blind heuristic: increase timeout &rarr; pool crash) vs. **Memory ON** (recalled EXP-031 &rarr; switches to EXP-044 async buffers).
- **Audit Verification**: Proves learning curve acceleration and risk reduction across consecutive turns.

#### `S3` — Human-in-the-Loop Correction & Memory Feedback
- **Expert Challenge & Override**: Support leads can refine, challenge, or modify AI triage recommendations.
- **Immediate Ingestion**: Human corrections are immediately packaged as structured experiences and written into Hindsight memory, becoming active knowledge for all future tickets.

#### `S4` — Experience Evolution & Knowledge Drift Tracking
- **Precedent Superseding**: As infrastructure evolves (e.g. migrating from MySQL 8.0 to CockroachDB), older precedents are updated or marked as superseded.
- **Continuous Learning Telemetry**: Live alignment score tracking (T1: 62% &rarr; T5: 94.8%) with real-time SVG polyline milestone visualization.

#### `S5` — Conflict & Invariant Boundary Resolution
- **Contradiction Detection**: Explicitly reconciles conflicting precedents (e.g. why increasing timeout succeeded in EXP-067 but failed in EXP-031).
- **Hard Invariant Enforcement**: Non-negotiable organizational rules (such as EXP-089: database connection leases strictly capped at 12 minutes) that models cannot override.

### A-Tier Capabilities (Operational Telemetry & Safety)

#### `A1` — Experience Confidence & Freshness Scoring
- **Validation Recency**: Precedents carry confidence weights based on validation frequency and recency.
- **Sample Size Weighting**: Distinguishes between one-off heuristics (weight: 0.32) and hardened enterprise patterns (weight: 0.95).

#### `A2` — Real Data Grounding & Telemetry Extraction
- **Zero Hallucination Telemetry**: Binds triage decisions to live infrastructure parameters (payload size, DB pool contention, thread queues).
- **Terminal CLI Stream (Process 3751)**: Live-streamed terminal trace matching real-world debugging workflows.

#### `A3` — Deterministic Outcome Predictor & Guardian
- **Simulation Before Execution**: Every proposed mitigation is simulated against deterministic domain models to compute resolution time, escalation probability, and pool contention.
- **Zero-Cascade Clearance**: Guardian rejects actions that have an escalation probability > 15% or violate pool hold limits.

---

## ⚡ 5. Tiered Groq LLM Strategy (Cost-Optimized Dual-Engine)

Echo utilizes an intelligent **tiered model routing architecture** to deliver state-of-the-art reasoning while keeping operational inference costs at minimum:

```text
                       Incoming User Interaction
                                   │
                 ┌─────────────────┴─────────────────┐
                 │                                   │
      Standard Question / Triage          Heavy Counterfactual Matrix
     (95% of queries & chat msgs)         (Deep multi-case benchmark)
                 │                                   │
                 ▼                                   ▼
        [ openai/gpt-oss-20b ]             [ openai/gpt-oss-120b ]
        • Fast inference latency           • Deep combinatorial analysis
        • Minimal token consumption        • High-output matrix synthesis
        • 280-token budget cap             • Full counterfactual simulation
```

### How Many LLMs Are We Using?
1. **Primary LLM (`openai/gpt-oss-20b` via Groq)**: Handled by default for 95%+ of interactions, question answers, and incident investigations. Extremely fast and cost-effective.
2. **High-Output LLM (`openai/gpt-oss-120b` via Groq)**: Triggered selectively when deep multi-precedent counterfactual matrices or heavy simulation benchmarks are requested.
3. **Deterministic Fallback Engine (`Echo Rule Engine`)**: Operates autonomously if external networks are unavailable, guaranteeing 100% offline uptime with zero crashes.

---

## 🔄 6. The 12-Event Closed Learning Loop

The system operates across a verified 12-event lifecycle emitted via WebSocket (`/ws/case`) and REST (`/api/chat`):

```text
 0  case_started                 → Incident initialized with telemetry context
 1  investigation_completed      → Workload volume, concurrency, and bottlenecks classified
 2  hindsight_recall_completed   → Precedents retrieved from Hindsight memory bank
 3  applicability_assessed       → Failure contraindications (EXP-031) detected & flagged
 4  reflection_completed         → Counterfactual reflection generated
 5  simulation_completed         → Deterministic outcome simulated against safety invariants
 6  guardian_validated           → EXP-089 connection pool lease cap (<12m) verified
 7  recommendation_ready         → Validated resolution synthesized (EXP-044 async chunking)
 8  execution_started            → Safe intervention scheduled
 9  outcome_recorded             → Execution telemetry recorded (110m completion, 0 escalation)
10  experience_retained          → Outcome permanently written to Hindsight memory bank
11  pipeline_completed           → Organizational memory alignment upgraded
```

---

## 🚀 7. One-Command Deployment

The repository is built for **instant, zero-config deployment** with multi-stage Docker builds.

### Quick Start with Docker (Recommended)
```bash
# 1. Clone the repository
git clone https://github.com/jaya-sri6/Echo.git
cd Echo

# 2. (Optional) Provide API keys in .env
cp .env.example .env
# Edit .env to add your GROQ_API_KEY or HINDSIGHT_API_KEY if desired

# 3. Launch both Frontend and Backend
docker compose up -d --build
```

### Verified Live Endpoints
| Component | URL | Description |
| :--- | :--- | :--- |
| **Echo UI (Frontend)** | [http://localhost:3000](http://localhost:3000) | Full Near-Black workspace, live precedent feed, and memory explorer |
| **Interactive API Docs** | [http://localhost:8000/docs](http://localhost:8000/docs) | Swagger UI for testing all backend routes and agent pipelines |
| **Health Check** | [http://localhost:8000/health](http://localhost:8000/health) | Backend process health probe (`{"status":"ok"}`) |
| **Readiness Check** | [http://localhost:8000/ready](http://localhost:8000/ready) | Hindsight memory engine readiness probe (`{"status":"ready"}`) |

---

## 🧪 8. Verification & Benchmark Evidence

Echo has passed all verification tiers with 100% test success:

```text
============================== 78 passed, 1 skipped in 116.81s ==============================
- Remote Hindsight integration verified
- Local Hindsight fallback verified
- Closed learning loop verified
- REST API (/api/chat, /api/auth, /api/graph) verified
- WebSocket (/ws/case) 12-event lifecycle verified
- 8-case benchmark reproduced with zero hallucinations
- No tracked .env secrets or tracked .pyc bytecode
- Strict session persistence across page refreshes
```

---

## 📂 9. Repository Layout

```text
Echo/
├── backend/
│   ├── app/
│   │   ├── agents/          # The 6 specialized agents (Groq copilot, investigator, reasoner)
│   │   ├── api/             # FastAPI REST endpoints & WebSocket (/ws/case, /api/chat)
│   │   ├── core/            # Domain models, schemas, and 12-event pipeline
│   │   ├── db/              # Persistent SQLite database & auth storage
│   │   ├── memory/          # Hindsight client, local fallback, and vectorizer
│   │   └── simulator/       # Deterministic outcome simulator & guardian invariants
│   ├── tests/               # 78 comprehensive pytest unit and integration tests
│   └── Dockerfile           # Backend container definition
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Near-Black components (LandingPage, AuthModal, GraphDock)
│   │   ├── data/            # 15 seed cases & incident archetypes
│   │   ├── services/        # REST and WebSocket client connectors
│   │   ├── App.jsx          # Main application shell & real-time telemetry dock
│   │   └── main.jsx         # React DOM mount point
│   ├── Dockerfile           # Multi-stage Vite + NGINX reverse-proxy container
│   └── package.json
│
├── brain/                   # Architecture specs & ECHO_EXTENSIONS_MASTER_INTEGRATION.md
├── docker-compose.yml       # Resilient multi-container deployment
└── README.md                # Master documentation
```

---

## 📄 License & Attribution

Built for the **Organizational Customer Experience Memory System** benchmark. Distributed under the MIT License.
