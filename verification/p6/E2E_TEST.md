# Echo — End-to-End Acceptance Test Specification (P6)

## 1. Core Acceptance Condition

Echo's central product claim is:
> **Echo remembers what the company learned from previous interventions and uses that experience to change future decisions.**

The core test assertion verified by this suite is:
```text
Memory OFF
    ↓
Generic recommendation ("increase_timeout") -> Outcome: FAILURE

Memory ON
    ↓
Recalls historical failure ("increase_timeout" -> FAILURE)
    ↓
Evaluates transfer boundaries and candidate actions
    ↓
Different recommendation ("async_chunked_export") -> Outcome: SUCCESS
```

---

## 2. Canonical 3-Case Acceptance Sequence

```text
┌─────────────────────────────────────────────────────────┐
│ STEP 0: RESET                                           │
│ Demo memory reset to baseline known state.              │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 1: CASE A (The Baseline Failure)                   │
│ Workload: 600 GB nightly batch, high concurrency, sync  │
│ Initial default action: "increase_timeout"              │
│ Simulation outcome: FAILURE (timeout / queue saturate)  │
│ Learning takeaway: Longer timeout does not fix backlog  │
│ Action: Retain failure experience into memory bank      │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 2: CASE B (The Learned Experience)                 │
│ Workload: 600 GB nightly batch, high concurrency, sync  │
│ Recall: Identifies Case A failure memory under same ctx │
│ Boundary check: Exact condition match (MATCH)           │
│ Rejection: Initial "increase_timeout" rejected          │
│ Alternative: "async_chunked_export" evaluated           │
│ Simulation outcome: SUCCESS (chunked async completes)   │
│ Guardian: Approves evidence-backed recommendation       │
│ Result: Echo changes its mind based on prior experience │
│ Action: Retain successful resolution into memory bank   │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 3: CASE C (The Boundary Check)                     │
│ Workload: 20 GB interactive, low concurrency, sync      │
│ Recall: Memory of 600 GB batch failure is retrieved     │
│ Boundary check: Size (20 vs 600) & workload mismatch    │
│ Transfer check: Boundary detected (BOUNDARY / LOW CONF) │
│ Protection: Large-batch chunking is NOT blindly applied │
│ Guardian: Verifies boundary memory is not transferred   │
│ Result: Safe, context-appropriate recommendation        │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Automated Test Implementation

The end-to-end acceptance loop is codified in:
1. Python runner: `demo/demo_runner.py e2e`
2. Regression test: `backend/tests/test_pipeline.py` & `backend/tests/test_hindsight.py`

### Test Invariants Verified
1. **Determinism:** Given identical inputs and memory state, the pipeline emits 100% deterministic recommendations without hallucinations.
2. **Guardian Enforcement:** Guardian rejects recommendations that cite boundary experiences as direct evidence.
3. **Memory Contrast Assertion:**
   ```python
   assert result_memory_off.final_recommendation != result_memory_on.final_recommendation
   assert result_memory_on.changed_by_hindsight is True
   ```
4. **Boundary Isolation:**
   ```python
   # Case C must NOT recommend async_chunked_export simply because it was successful in Case B
   assert case_c_result.final_recommendation != "async_chunked_export"
   ```

---

## 4. How to Execute E2E Verification

```bash
# Run automated acceptance sequence via CLI
python3 demo/demo_runner.py e2e

# Run underlying pipeline regression tests
python3 -m pytest backend/tests/test_pipeline.py backend/tests/test_hindsight.py -v
```
