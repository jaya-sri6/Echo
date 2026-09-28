from __future__ import annotations

from typing import Any, Dict, List
from pydantic import BaseModel, Field


class BenchmarkCaseResult(BaseModel):
    """Execution result for a single benchmark test case under a specific mode."""

    case_id: str
    name: str
    category: str
    mode: str  # "MEMORY_OFF" or "MEMORY_ON"
    action: str
    outcome: str
    resolution_time_minutes: int
    escalated: bool
    changed_by_hindsight: bool = False
    applicability_state: str = "N/A"
    applicability_correct: bool = True
    reason: str = ""


class BenchmarkMetrics(BaseModel):
    """Aggregated benchmark performance metrics."""

    mode: str
    total_cases: int
    decision_success_count: int
    decision_success_rate: float
    failed_intervention_count: int
    failed_intervention_rate: float
    applicability_accuracy: float
    decision_change_count: int
    decision_change_rate: float
    average_resolution_time: float


def compute_metrics(results: List[BenchmarkCaseResult]) -> BenchmarkMetrics:
    """Compute the 5 canonical Echo benchmark evaluation metrics."""
    if not results:
        raise ValueError("Cannot compute metrics on empty results list.")

    mode = results[0].mode
    total = len(results)

    success_count = sum(1 for r in results if r.outcome == "SUCCESS")
    failure_count = sum(1 for r in results if r.outcome == "FAILURE")
    correct_applicability = sum(1 for r in results if r.applicability_correct)
    changes_count = sum(1 for r in results if r.changed_by_hindsight)
    total_time = sum(r.resolution_time_minutes for r in results)

    return BenchmarkMetrics(
        mode=mode,
        total_cases=total,
        decision_success_count=success_count,
        decision_success_rate=round((success_count / total) * 100, 1),
        failed_intervention_count=failure_count,
        failed_intervention_rate=round((failure_count / total) * 100, 1),
        applicability_accuracy=round((correct_applicability / total) * 100, 1),
        decision_change_count=changes_count,
        decision_change_rate=round((changes_count / total) * 100, 1),
        average_resolution_time=round(total_time / total, 1),
    )


def compare_metrics(
    memory_off: BenchmarkMetrics,
    memory_on: BenchmarkMetrics,
) -> Dict[str, Any]:
    """Produce comparison delta between Memory OFF and Memory ON."""
    return {
        "success_rate_delta": round(memory_on.decision_success_rate - memory_off.decision_success_rate, 1),
        "failure_rate_reduction": round(memory_off.failed_intervention_rate - memory_on.failed_intervention_rate, 1),
        "resolution_time_savings_min": round(memory_off.average_resolution_time - memory_on.average_resolution_time, 1),
        "decision_changes_triggered": memory_on.decision_change_count,
        "applicability_accuracy_on": memory_on.applicability_accuracy,
    }
