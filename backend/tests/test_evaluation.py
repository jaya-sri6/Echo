import json
from pathlib import Path

from evaluation.metrics import compute_metrics, compare_metrics
from evaluation.run_benchmark import (
    BENCHMARK_PATH,
    load_benchmark_cases,
    run_memory_off,
    run_memory_on,
)


def test_benchmark_dataset_has_exact_required_structure():
    cases = load_benchmark_cases()
    assert len(cases) == 8, f"Benchmark must have exactly 8 cases, found {len(cases)}"

    categories = [c["category"] for c in cases]
    assert categories.count("memory_helpful") == 3
    assert categories.count("historical_failure") == 2
    assert categories.count("context_mismatch") == 2
    assert categories.count("ambiguous") == 1

    for c in cases:
        assert "case_id" in c
        assert "customer_message" in c
        assert "context" in c
        assert "naive_baseline_action" in c
        assert "expected_memory_action" in c
        assert "expected_applicability" in c


def test_memory_off_execution_matches_baseline_heuristics():
    cases = load_benchmark_cases()
    off_results = run_memory_off(cases)

    assert len(off_results) == 8
    # Baseline naive actions should suffer high failure rate on large batch jobs
    failures = [r for r in off_results if r.outcome == "FAILURE"]
    assert len(failures) >= 4

    metrics = compute_metrics(off_results)
    assert metrics.mode == "MEMORY_OFF"
    assert metrics.decision_change_count == 0
    assert metrics.failed_intervention_rate > 50.0


def test_memory_on_improves_decisions_and_avoids_failures():
    cases = load_benchmark_cases()
    on_results = run_memory_on(cases)

    assert len(on_results) == 8
    # Memory ON should have 0 failures across benchmark cases
    failures = [r for r in on_results if r.outcome == "FAILURE"]
    assert len(failures) == 0

    metrics = compute_metrics(on_results)
    assert metrics.mode == "MEMORY_ON"
    assert metrics.decision_success_rate >= 87.5
    assert metrics.failed_intervention_rate == 0.0
    assert metrics.decision_change_count >= 4
    assert metrics.applicability_accuracy == 100.0


def test_metrics_comparison_shows_positive_delta():
    cases = load_benchmark_cases()
    off_results = run_memory_off(cases)
    on_results = run_memory_on(cases)

    off_metrics = compute_metrics(off_results)
    on_metrics = compute_metrics(on_results)
    comparison = compare_metrics(off_metrics, on_metrics)

    assert comparison["success_rate_delta"] > 0
    assert comparison["failure_rate_reduction"] > 0
    assert comparison["resolution_time_savings_min"] > 0
    assert comparison["decision_changes_triggered"] >= 4
