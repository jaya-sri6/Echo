# Phase 04 — Agent Execution Evidence

## Agent Execution Trace (Hero Case)
**Customer Message**: `"Customer's 600 GB nightly export keeps timing out under high concurrency in sync mode."`

### 1. ConversationAgent
- **Input**: Raw text string
- **Output**:
  ```json
  {
    "export_size_gb": 600.0,
    "concurrency": "high",
    "workload": "nightly_batch",
    "execution_mode": "sync",
    "problem_type": "large_export_timeout"
  }
  ```
- **Execution Rule**: Does not hallucinate or guess missing fields (e.g. execution_mode).

### 2. Investigator
- **Input**: `CaseContext`
- **Output**:
  ```json
  {
    "identified_problem": "Customer's 600 GB nightly export is failing with a timeout under high concurrency.",
    "ready_for_reasoning": true,
    "missing_information": []
  }
  ```

### 3. ExperienceReasoner
- **Input**: `CaseContext` + Available Experiences (EXP-001 through EXP-010)
- **Output**:
  - Found applicable historical failure: `EXP-007` (increase_timeout -> FAILURE under 600GB/high-concurrency/nightly_batch).
  - Found applicable historical success: `EXP-002` (async_chunked_export -> SUCCESS).
  - Evaluated candidate actions: `async_chunked_export`, `reduce_concurrency`, `retry_with_backoff`, `schedule_off_peak`, `increase_timeout`.
  - `changed_by_hindsight`: `true`.

### 4. ResolutionAgent
- **Input**: `CaseContext` + `ExperienceReasoningResult`
- **Output**:
  ```json
  {
    "initial_action": "increase_timeout",
    "recommended_action": "async_chunked_export",
    "recommendation_reason": "Applicable historical success supports the improved counterfactual. The simulator predicts SUCCESS for async_chunked_export versus FAILURE for the initial increase_timeout action."
  }
  ```

### 5. Guardian
- **Input**: `CaseContext` + `ResolutionRecommendation` + `ExperienceReasoningResult`
- **Evaluation**:
  - Validates confidence (0.85 >= 0.70 threshold).
  - Confirms action matches supported mitigation policies.
- **Output**:
  ```json
  {
    "approved": true,
    "confidence": 0.85,
    "issues": []
  }
  ```
