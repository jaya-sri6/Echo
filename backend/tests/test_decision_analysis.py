import json
from pathlib import Path

from backend.app.domain.case_context import CaseContext
from backend.app.domain.decision_analysis import analyze_decision, evaluate_applicability
from backend.app.domain.experiences import Experience


DATASET_PATH = Path(__file__).resolve().parents[2] / "data" / "experiences" / "seeded_experiences.json"


def make_case(
    *, size=600, concurrency=36, workload="nightly_batch", mode="sync", problem="export_timeout"
):
    return CaseContext(
        export_size_gb=size,
        concurrency=concurrency,
        workload=workload,
        execution_mode=mode,
        problem_type=problem,
    )


def make_experience(
    *, experience_id="EXP-TEST", size=600, concurrency=36, workload="nightly_batch",
    mode="sync", problem="export_timeout", action="increase_timeout", status="FAILURE", applicability=None,
):
    return Experience(
        experience_id=experience_id,
        source="TEST",
        problem_type=problem,
        context={
            "export_size_gb": size,
            "concurrency": concurrency,
            "workload": workload,
            "execution_mode": mode,
            "problem_type": problem,
        },
        diagnosis="The export encountered a deterministic test condition.",
        action=action,
        outcome=f"Historical {status.lower()} result.",
        status=status,
        lesson="Use only within supported context conditions.",
        applicability=applicability or {},
    )


def seeded_experiences():
    records = json.loads(DATASET_PATH.read_text(encoding="utf-8"))
    return [Experience.model_validate(record) for record in records]


def test_exact_applicability_match():
    result = evaluate_applicability(make_case(), make_experience())

    assert result.applicability == "MATCH"
    assert result.score == 1.0
    assert result.matched_conditions == [
        "export_size_gb", "concurrency", "workload", "execution_mode", "problem_type"
    ]
    assert result.mismatched_conditions == []


def test_partial_applicability_exposes_mismatched_context():
    result = evaluate_applicability(
        make_case(), make_experience(mode="async")
    )

    assert result.applicability == "PARTIAL_MATCH"
    assert result.mismatched_conditions == ["execution_mode"]
    assert "not a direct transfer" in result.reason


def test_explicit_size_bounds_detect_boundary():
    experience = make_experience(
        size=600, applicability={"export_size_gb_min": 500}
    )

    result = evaluate_applicability(make_case(size=20, concurrency=2, workload="interactive"), experience)

    assert result.applicability == "BOUNDARY"
    assert "export_size_gb" in result.mismatched_conditions
    assert "outside" in result.reason


def test_different_problem_type_is_non_transferable():
    result = evaluate_applicability(
        make_case(problem="authentication"), make_experience()
    )

    assert result.applicability == "NON_TRANSFERABLE"
    assert "different problem type" in result.reason


def test_multiple_candidate_actions_are_simulated():
    analysis = analyze_decision(
        make_case(), [], ["increase_timeout", "async_chunked_export", "reduce_concurrency"]
    )

    assert [item.action for item in analysis.candidate_results] == [
        "increase_timeout", "async_chunked_export", "reduce_concurrency"
    ]
    assert [item.outcome for item in analysis.candidate_results] == [
        "FAILURE", "SUCCESS", "SUCCESS"
    ]
    assert analysis.recommended_action in {"async_chunked_export", "reduce_concurrency"}


def test_critical_case_exposes_failure_and_async_success_evidence():
    analysis = analyze_decision(
        make_case(),
        seeded_experiences(),
        [
            "increase_timeout",
            "reduce_concurrency",
            "async_chunked_export",
            "retry_with_backoff",
            "schedule_off_peak",
        ],
    )
    statuses = {item.action: item.outcome for item in analysis.candidate_results}

    assert statuses["increase_timeout"] == "FAILURE"
    assert statuses["async_chunked_export"] == "SUCCESS"
    assert analysis.recommended_action == "async_chunked_export"
    assert any("EXP-007: increase_timeout -> FAILURE (MATCH)" == item for item in analysis.decision_evidence)
    assert any("EXP-002: async_chunked_export -> SUCCESS (PARTIAL_MATCH)" == item for item in analysis.decision_evidence)


def test_recommendation_changes_because_of_historical_evidence():
    analysis = analyze_decision(
        make_case(),
        seeded_experiences(),
        [
            "increase_timeout",
            "reduce_concurrency",
            "async_chunked_export",
            "retry_with_backoff",
            "schedule_off_peak",
        ],
    )

    initial_result = next(item for item in analysis.candidate_results if item.action == "increase_timeout")
    assert initial_result.outcome == "FAILURE"
    assert analysis.recommended_action == "async_chunked_export"
    assert analysis.changed_by_hindsight is True
    assert "historical success" in analysis.recommendation_reason


def test_small_interactive_case_blocks_blind_large_export_transfer():
    analysis = analyze_decision(
        make_case(size=20, concurrency=2, workload="interactive"),
        seeded_experiences(),
        ["increase_timeout", "async_chunked_export"],
    )
    by_id = {item.experience_id: item for item in analysis.applicable_experiences}

    assert by_id["EXP-007"].applicability == "BOUNDARY"
    assert "export_size_gb" in by_id["EXP-007"].mismatched_conditions
    assert all(
        item.applicability != "MATCH"
        for item in analysis.applicable_experiences
        if "export_size_gb" in item.mismatched_conditions
    )
    assert analysis.changed_by_hindsight is False


def test_decision_analysis_is_deterministic():
    case = make_case()
    experiences = seeded_experiences()
    actions = ["increase_timeout", "async_chunked_export"]

    first = analyze_decision(case, experiences, actions).model_dump()
    second = analyze_decision(case, experiences, actions).model_dump()

    assert first == second