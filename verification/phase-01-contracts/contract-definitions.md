# Phase 01 — Canonical Data Contract Specifications

## 1. CaseContext Contract
| Field | Python Type | TypeScript Type | Description |
| :--- | :--- | :--- | :--- |
| `export_size_gb` | `float` | `number` | Size of the export payload in Gigabytes |
| `concurrency` | `Union[str, int]` | `string \| number` | Concurrency tier ("low", "medium", "high") or worker count |
| `workload` | `str` | `string` | Workload category (`nightly_batch`, `interactive`, etc.) |
| `execution_mode` | `str` | `string` | Synchronous (`sync`) or asynchronous (`async`) |
| `problem_type` | `str` | `string` | Canonical problem type (`export_timeout`, etc.) |

## 2. Applicability States Contract
The system recognizes exactly 4 applicability states:
- `MATCH`: Full context match (all 5 attributes match, export size within bounds).
- `PARTIAL_MATCH`: Related problem type and within bounds, but 1 or more operational parameters differ.
- `BOUNDARY`: Size constraint falls outside explicit `export_size_gb_min` or `export_size_gb_max`.
- `NON_TRANSFERABLE`: Issue type or structural preconditions do not align; memory transfer is strictly barred.

## 3. Simulation Result Contract
- `outcome`: `"SUCCESS" | "FAILURE" | "PARTIAL"`
- `resolution_time_minutes`: `int` (>= 0)
- `escalated`: `bool`
- `reason`: Non-empty deterministic explanation
- `lesson`: Plain-language learning takeaway

## 4. WebSocket Agent Event Contract
- `step_index`: `int` (0 to 11)
- `event`: String event identifier (e.g. `case_started`, `pipeline_completed`)
- `agent`: Emitting agent identifier (e.g. `conversation_agent`, `guardian`)
- `status`: `"started" | "in_progress" | "completed" | "failed"`
- `message`: Human-readable summary
- `timestamp`: ISO-8601 string
- `duration_ms`: Execution duration in milliseconds (`float` >= 0)
- `data`: Typed dictionary payload containing agent state
