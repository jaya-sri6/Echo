# Phase 02 — Four Transfer Applicability States Evidence

## 1. Applicability Matrix

Echo enforces deterministic applicability guards to prevent negative transfer. The table below documents the 4 verified transfer classifications evaluated in `backend/tests/test_hindsight_loop.py::test_four_applicability_states_explicitly`:

| State | Historical Context | Target Context | Evaluation Result | Transfer Allowed? |
| :--- | :--- | :--- | :--- | :--- |
| **`MATCH`** | 600 GB, High concurrency, Nightly batch, Sync, Export timeout | 600 GB, High concurrency, Nightly batch, Sync, Export timeout | Score: 1.0 (5/5 matching attributes, within [500GB, 1000GB] bounds) | **YES** — Direct recommendation transfer |
| **`PARTIAL_MATCH`** | 600 GB, High concurrency, Nightly batch, Sync, Export timeout | 600 GB, Low concurrency, Nightly batch, Sync, Export timeout | Score: 0.8 (4/5 matching attributes, concurrency differs) | **YES** — Supporting evidence only |
| **`BOUNDARY`** | 600 GB, High concurrency, Nightly batch, Sync, Export timeout (Min: 500 GB) | 20 GB, High concurrency, Nightly batch, Sync, Export timeout | Size 20 GB < 500 GB threshold | **NO** — Boundary violation detected |
| **`NON_TRANSFERABLE`** | 600 GB, High concurrency, Nightly batch, Sync, Export timeout | 600 GB, High concurrency, Nightly batch, Sync, Auth failure | Problem type mismatch (`auth_failure` vs `export_timeout`) | **NO** — Strictly barred from reasoning |

## 2. Code Proof
Evaluated directly via `evaluate_applicability` in `backend/app/domain/decision_analysis.py`:
```python
# MATCH
res_match = evaluate_applicability(match_case, base_exp)
assert res_match.applicability == "MATCH"
assert res_match.score == 1.0

# PARTIAL_MATCH
res_partial = evaluate_applicability(partial_case, base_exp)
assert res_partial.applicability == "PARTIAL_MATCH"
assert "concurrency" in res_partial.mismatched_conditions

# BOUNDARY
res_boundary = evaluate_applicability(boundary_case, base_exp)
assert res_boundary.applicability == "BOUNDARY"

# NON_TRANSFERABLE
res_non_transferable = evaluate_applicability(diff_problem_case, base_exp)
assert res_non_transferable.applicability == "NON_TRANSFERABLE"
```
