import json
from pathlib import Path

from backend.app.domain.candidates import CandidateAction
from backend.app.domain.case_context import CaseContext
from backend.app.domain.experiences import Experience


DATASET_PATH = Path(__file__).resolve().parents[2] / "data" / "experiences" / "seeded_experiences.json"
SCENARIO_PATHS = [
    Path(__file__).resolve().parents[2] / "data" / "scenarios" / "case_01_failure.json",
    Path(__file__).resolve().parents[2] / "data" / "scenarios" / "case_02_learning.json",
    Path(__file__).resolve().parents[2] / "data" / "scenarios" / "case_03_boundary.json",
]


def test_case_context_valid_construction():
    case = CaseContext(
        export_size_gb=250.0,
        concurrency=12,
        workload="nightly_batch",
        execution_mode="sync",
        problem_type="export_timeout",
    )

    assert case.export_size_gb == 250.0
    assert case.concurrency == 12
    assert case.workload == "nightly_batch"
    assert case.execution_mode == "sync"
    assert case.problem_type == "export_timeout"
    assert case.model_dump()["export_size_gb"] == 250.0


def test_experience_valid_construction():
    case = CaseContext(
        export_size_gb=600,
        concurrency=28,
        workload="nightly_batch",
        execution_mode="async",
        problem_type="export_timeout",
    )
    experience = Experience(
        experience_id="exp-600-async",
        source="SEEDED",
        problem_type="export_timeout",
        context=case,
        diagnosis="Large batch export saturates database access during peak activity.",
        action="async_chunked_export",
        outcome="SUCCESS",
        lesson="Chunking the export prevents request saturation.",
        applicability={"workload": ["nightly_batch"], "execution_mode": ["async"], "export_size_gb_min": 500},
    )

    assert experience.experience_id == "exp-600-async"
    assert experience.source == "SEEDED"
    assert experience.problem_type == "export_timeout"
    assert experience.context.workload == "nightly_batch"
    assert experience.action == "async_chunked_export"
    assert experience.outcome == "SUCCESS"
    assert experience.model_dump()["experience_id"] == "exp-600-async"


def test_candidate_action_valid_construction():
    candidate = CandidateAction(
        action_type="async_chunked_export",
        description="Chunk the export into smaller async jobs.",
        rationale="This reduces saturation on the source system during a large nightly batch export.",
    )

    assert candidate.action_type == "async_chunked_export"
    assert candidate.description == "Chunk the export into smaller async jobs."
    assert candidate.rationale.startswith("This reduces saturation")
    assert candidate.model_dump()["action_type"] == "async_chunked_export"


def test_seeded_experience_dataset():
    payload = json.loads(DATASET_PATH.read_text(encoding="utf-8"))

    assert len(payload) == 15
    assert all("experience_id" in item for item in payload)
    assert all("source" in item for item in payload)
    assert all("problem_type" in item for item in payload)
    assert all("context" in item for item in payload)
    assert all("diagnosis" in item for item in payload)
    assert all("action" in item for item in payload)
    assert all("outcome" in item for item in payload)
    assert all("lesson" in item for item in payload)
    assert all("applicability" in item for item in payload)

    status_distribution = {
        "SUCCESS": sum(1 for item in payload if item.get("status") == "SUCCESS"),
        "FAILURE": sum(1 for item in payload if item.get("status") == "FAILURE"),
        "PARTIAL": sum(1 for item in payload if item.get("status") == "PARTIAL"),
        "BOUNDARY": sum(1 for item in payload if item.get("status") == "BOUNDARY"),
        "NON-TRANSFERABLE": sum(1 for item in payload if item.get("status") == "NON-TRANSFERABLE"),
    }
    assert status_distribution == {
        "SUCCESS": 6,
        "FAILURE": 4,
        "PARTIAL": 2,
        "BOUNDARY": 2,
        "NON-TRANSFERABLE": 1,
    }

    expected_actions = {
        "increase_timeout",
        "reduce_concurrency",
        "async_chunked_export",
        "retry_with_backoff",
        "schedule_off_peak",
    }
    observed_actions = {item["action"] for item in payload}
    assert expected_actions == observed_actions

    critical_failure = next(
        item
        for item in payload
        if item.get("context", {}).get("export_size_gb") == 600
        and item.get("status") == "FAILURE"
        and item.get("action") == "increase_timeout"
    )
    assert critical_failure["context"]["workload"] == "nightly_batch"
    assert critical_failure["context"]["execution_mode"] == "sync"

    critical_success = next(
        item
        for item in payload
        if item.get("context", {}).get("export_size_gb") == 600
        and item.get("status") == "SUCCESS"
        and item.get("action") == "async_chunked_export"
    )
    assert critical_success["context"]["workload"] == "nightly_batch"
    assert critical_success["context"]["execution_mode"] == "async"


def test_canonical_scenario_files_exist_and_parse():
    for scenario_path in SCENARIO_PATHS:
        assert scenario_path.exists(), f"Missing scenario file: {scenario_path}"
        payload = json.loads(scenario_path.read_text(encoding="utf-8"))
        assert isinstance(payload, dict)

    failure_case = json.loads(SCENARIO_PATHS[0].read_text(encoding="utf-8"))
    learning_case = json.loads(SCENARIO_PATHS[1].read_text(encoding="utf-8"))
    boundary_case = json.loads(SCENARIO_PATHS[2].read_text(encoding="utf-8"))

    assert "Our 600 GB nightly export is timing out." in failure_case["customer_statement"]
    assert failure_case["initial_action"]["action"] == "increase_timeout"
    assert failure_case["expected_behavior"]["outcome"] == "FAILURE"

    assert "Our 600 GB nightly export is timing out again." in learning_case["customer_statement"]
    assert learning_case["expected_behavior"]["preferred_action"] == "async_chunked_export"
    assert learning_case["expected_behavior"]["outcome"] == "SUCCESS"
    assert "longer timeout" in learning_case["historical_memory"]["lesson"]

    assert "Our 20 GB export is timing out." in boundary_case["customer_statement"]
    assert boundary_case["expected_behavior"]["transfer_confidence"] == "LOW"
    assert boundary_case["expected_behavior"]["match_quality"] == "LOW"
