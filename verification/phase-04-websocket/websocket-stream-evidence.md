# Phase 04 — WebSocket Streaming Trace Evidence

## Live Event Stream Trace
The following 12 events were captured over the live `/ws/case` WebSocket connection during execution of the hero case (`"Customer's 600 GB nightly export keeps timing out under high concurrency in sync mode."`):

```json
[
  {
    "step_index": 0,
    "event": "case_started",
    "agent": "conversation_agent",
    "status": "completed",
    "message": "Customer message received; case context extracted.",
    "duration_ms": 0.42,
    "data": {
      "export_size_gb": 600.0,
      "concurrency": "high",
      "workload": "nightly_batch",
      "execution_mode": "sync",
      "problem_type": "large_export_timeout"
    }
  },
  {
    "step_index": 1,
    "event": "investigation_completed",
    "agent": "investigator",
    "status": "completed",
    "message": "Investigation complete; case verified actionable.",
    "duration_ms": 0.15,
    "data": {
      "identified_problem": "Customer's 600 GB nightly export is failing with a timeout under high concurrency.",
      "ready_for_reasoning": true,
      "missing_information": []
    }
  },
  {
    "step_index": 2,
    "event": "hindsight_recall_completed",
    "agent": "experience_memory",
    "status": "completed",
    "message": "Recalled 5 experiences from SEEDED DEMO FALLBACK.",
    "duration_ms": 1.28,
    "data": {
      "bank_id": "support-experiences",
      "recalled_count": 5
    }
  },
  {
    "step_index": 3,
    "event": "applicability_assessed",
    "agent": "experience_reasoner",
    "status": "completed",
    "message": "Applicability assessed across 10 experiences.",
    "duration_ms": 0.54,
    "data": {
      "applicability_states": {
        "EXP-001": "PARTIAL_MATCH",
        "EXP-002": "MATCH",
        "EXP-007": "MATCH"
      }
    }
  },
  {
    "step_index": 4,
    "event": "reflection_completed",
    "agent": "experience_reasoner",
    "status": "completed",
    "message": "Synthesized lesson and counterfactual reflection from historical outcomes.",
    "duration_ms": 0.22,
    "data": {
      "changed_by_hindsight": true
    }
  },
  {
    "step_index": 5,
    "event": "simulation_completed",
    "agent": "simulator",
    "status": "completed",
    "message": "Evaluated 5 candidate mitigations deterministically.",
    "duration_ms": 0.38,
    "data": {
      "recommended_action": "async_chunked_export"
    }
  },
  {
    "step_index": 6,
    "event": "guardian_validated",
    "agent": "guardian",
    "status": "completed",
    "message": "Guardian approved the recommended action.",
    "duration_ms": 0.18,
    "data": {
      "approved": true,
      "confidence": 0.85
    }
  },
  {
    "step_index": 7,
    "event": "recommendation_ready",
    "agent": "resolution_agent",
    "status": "completed",
    "message": "Recommended action: async_chunked_export.",
    "duration_ms": 0.1,
    "data": {
      "recommended_action": "async_chunked_export"
    }
  },
  {
    "step_index": 8,
    "event": "execution_started",
    "agent": "executor",
    "status": "in_progress",
    "message": "Applying action 'async_chunked_export' to workload.",
    "duration_ms": 0.1,
    "data": {
      "action": "async_chunked_export"
    }
  },
  {
    "step_index": 9,
    "event": "outcome_recorded",
    "agent": "simulator",
    "status": "completed",
    "message": "Outcome recorded: SUCCESS (110 min).",
    "duration_ms": 0.24,
    "data": {
      "outcome": "SUCCESS",
      "resolution_time_minutes": 110,
      "escalated": false
    }
  },
  {
    "step_index": 10,
    "event": "experience_retained",
    "agent": "experience_memory",
    "status": "completed",
    "message": "Retained experience EXP-RETAINED-782BA6F9.",
    "duration_ms": 0.45,
    "data": {
      "retained_experience_id": "EXP-RETAINED-782BA6F9",
      "retained": true
    }
  },
  {
    "step_index": 11,
    "event": "pipeline_completed",
    "agent": "pipeline",
    "status": "completed",
    "message": "Echo pipeline completed successfully.",
    "duration_ms": 4.1,
    "data": {
      "status": "COMPLETE",
      "final_recommendation": "async_chunked_export",
      "changed_by_hindsight": true
    }
  }
]
```
