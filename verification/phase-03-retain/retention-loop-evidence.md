# Phase 03 — Real Retention Loop Evidence

## 1. Scenario Description
- **Target Workload**: 400 GB Daily Batch Sync Export under High Concurrency.
- **Problem**: Long-running query timeout.

## 2. Execution Trace

### Step 1: Baseline Attempt (Case A)
In an isolated bank with zero prior memories:
```
Message: "Customer's 400 GB daily export keeps timing out under high concurrency in sync mode."
Pipeline Status: NO_APPLICABLE_EXPERIENCE (No recommendation issued without evidence)
```

### Step 2: Simulation & Retention of Failure
When evaluated in `ExportSimulator.simulate(400, "high", "daily_batch", "sync", "increase_timeout")`:
```json
{
  "outcome": "FAILURE",
  "resolution_time_minutes": 200,
  "escalated": true,
  "reason": "The timeout extension simply waits longer while the export remains bottlenecked by shared infrastructure or heavy concurrency.",
  "lesson": "Time extension is only useful when the workload is slowing for a brief, recoverable reason; it is not a substitute for architecture changes."
}
```
Echo retains this failure as `EXP-LEARNED-001` with `status: "FAILURE"`.

### Step 3: Retention of Successful Counterfactual
When evaluated in `ExportSimulator.simulate(400, "high", "daily_batch", "sync", "reduce_concurrency")`:
```json
{
  "outcome": "SUCCESS",
  "resolution_time_minutes": 75,
  "escalated": false,
  "reason": "Reducing concurrency lowers the contention on the storage and database layers, restoring a stable export cadence without requiring a hard failover.",
  "lesson": "Concurrency throttling is effective when the bottleneck is shared-resource contention rather than an external infra limit."
}
```
Echo retains this success as `EXP-LEARNED-002` with `status: "SUCCESS"`.

### Step 4: Re-query (Case B)
The identical case is presented to Echo:
```
Message: "Customer's 400 GB daily export keeps timing out under high concurrency in sync mode."
```
1. **Hindsight Recall**: Retrieves `EXP-LEARNED-001` and `EXP-LEARNED-002`.
2. **Applicability**: Both match the 400 GB daily batch sync profile (`MATCH`, Score: 1.0).
3. **Reflection**: The reasoner notes that `increase_timeout` failed and `reduce_concurrency` succeeded.
4. **Resolution**: Recommendation dynamically changes:
   - Initial Instinct: `increase_timeout`
   - Final Recommendation: `reduce_concurrency`
   - `changed_by_hindsight`: `true`
5. **Decision Evidence**:
   - `EXP-LEARNED-001: increase_timeout -> FAILURE (MATCH)`
   - `EXP-LEARNED-002: reduce_concurrency -> SUCCESS (MATCH)`

## 3. Verification Log
Verified by automated test `backend/tests/test_hindsight_loop.py::test_real_outcome_retain_and_recall_learning_loop` (PASSED).
