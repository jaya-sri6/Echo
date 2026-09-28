# Echo — System Architecture

## Architecture Overview

Echo is structured into a 5-agent decision loop centered around organizational memory (Hindsight) and a deterministic SaaS export simulator.

```text
                        ┌────────────────────────┐
                        │     Customer Case      │
                        └───────────┬────────────┘
                                    │
                                    ▼
                        ┌────────────────────────┐
                        │   Conversation Agent   │
                        │    (Extract Context)   │
                        └───────────┬────────────┘
                                    │
                                    ▼
                        ┌────────────────────────┐
                        │      Investigator      │
                        │ (Constraints/Severity) │
                        └───────────┬────────────┘
                                    │
                                    ▼
┌──────────────────┐    ┌────────────────────────┐
│ Hindsight Memory │◄───┤  Experience Reasoner   │
│ (support-bank)   ├───►│  (Recall & Boundaries) │
└──────────────────┘    └───────────┬────────────┘
                                    │
                                    ▼
                        ┌────────────────────────┐
                        │    Resolution Agent    │
                        │ (Evaluate Candidates)  │
                        └───────────┬────────────┘
                                    │
                                    ▼
┌──────────────────┐    ┌────────────────────────┐
│  Export Simulator│◄───┤        Guardian        │
│  (Deterministic) │    │  (Safety/Escalation)   │
└──────────────────┘    └───────────┬────────────┘
                                    │
                                    ▼
                        ┌────────────────────────┐
                        │   Final Recommended    │
                        │      Remediation       │
                        └────────────────────────┘
```

## Data Contracts

### 1. `CaseContext`
```json
{
  "export_size_gb": 600.0,
  "concurrency": "high",
  "workload": "nightly_batch",
  "execution_mode": "sync",
  "problem_type": "large_export_timeout"
}
```

### 2. `ExperienceRecord`
- `experience_id`: Unique identifier (e.g. `EXP-002`)
- `source`: `SEEDED` or `EXECUTION`
- `problem_type`: `export_timeout`
- `context`: Input parameters
- `action`: Prescribed mitigation (e.g. `async_chunked_export`)
- `outcome`: `SUCCESS`, `FAILURE`, or `PARTIAL`
- `lesson`: Takeaway for future decisions
- `applicability`: Bounded operational constraints (min/max export size, workload, concurrency)

## Communication Protocols
- **REST API**: `POST /api/case` provides synchronous pipeline execution.
- **WebSocket**: `WS /ws/case` streams individual agent progression events in real time.
- **Frontend SPA**: React 18 dashboard displaying Live Case execution and "What Changed My Mind?" comparison.
