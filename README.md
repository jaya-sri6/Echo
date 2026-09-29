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
    <strong>AI can reason from knowledge. Echo lets it reason from what your company experienced.</strong>
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

## 📌 Executive Summary

Enterprise incident triage suffers from **institutional amnesia**. When production outages occur at 3 AM:
1. **Critical Wisdom Evaporates**: Postmortems and incident workarounds rot in Slack threads, Jira tickets, and Google Docs.
2. **The Flaw of Standard RAG**: Vector search matches text keywords (*"timeout"*), completely blind to operational consequences. A standard copilot will recommend increasing query timeouts—unaware that doing so crashed the database connection pool last quarter.
3. **Scale Divergence**: Fixes that succeed at 20 GB often catastrophically fail on 600 GB batch pipelines.

**Echo resolves this by placing the Hindsight Memory Layer at the center of multi-agent triage.** Instead of repeating past mistakes, Echo recalls previous failures, validates contextual applicability boundaries, enforces hard organizational invariants, and autonomously retains every verified outcome back into organizational memory.

---

## 🤖 Multi-Agent Architecture (The 6 Specialized Agents)

Echo orchestrates **6 specialized autonomous agents** collaborating across a deterministic 12-event lifecycle:

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
                                              (Records outcome into Hindsight bank N+1)
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

## ⚡ Tiered LLM Strategy & Cost Optimization

Echo utilizes an intelligent **tiered model routing architecture** to deliver high-quality reasoning while keeping operational inference costs at minimum:

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

## 🔄 The 12-Event Closed Learning Loop

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

## 🚀 One-Command Deployment

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

## 🧪 Verification & Benchmark Results

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

### Key Benchmark Scenario (Acme Corp 600 GB Batch Contention)
- **Baseline Trial (Turn 1)**: Naive timeout extension fails. Triggers pool lock saturation. Retained as failure precedent `EXP-031`.
- **Memory-Informed Resolution (Turn 2)**: Echo recalls `EXP-031`, flags timeout as contraindicated, enforces `EXP-089` pool boundary (<12m), and shifts to `EXP-044` async chunked export. Result completes in 110 minutes with 0 escalation.
- **Scale Boundary Protection (Turn 3)**: Echo prevents blind transfer of `EXP-044` heavy batch memory to a small 20 GB interactive export, enforcing `EXP-067` scale bounds.

---

## 📄 License & Attribution

Built for the **Organizational Customer Experience Memory System** benchmark. Distributed under the MIT License.
