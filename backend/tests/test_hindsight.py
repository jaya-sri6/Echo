from __future__ import annotations

import json
import os
from io import BytesIO
from typing import Any
from urllib.request import Request

import pytest
from pydantic import ValidationError

import backend.app.hindsight.client as hindsight_client_module
from backend.app.domain.case_context import CaseContext
from backend.app.hindsight.client import HindsightClient, HindsightError
from backend.app.hindsight.memory import ExperienceMemory, ExperienceRecord
from backend.app.hindsight.recall import check_applicability


def _case(
    *,
    export_size_gb: float = 600,
    concurrency: int = 36,
    workload: str = "nightly_batch",
    execution_mode: str = "sync",
) -> CaseContext:
    return CaseContext(
        export_size_gb=export_size_gb,
        concurrency=concurrency,
        workload=workload,
        execution_mode=execution_mode,
        problem_type="export_timeout",
    )


def _experience(
    experience_id: str,
    *,
    status: str,
    action: str,
    execution_mode: str = "sync",
) -> dict[str, Any]:
    return {
        "experience_id": experience_id,
        "source": "CASE",
        "problem_type": "export_timeout",
        "status": status,
        "context": {
            "export_size_gb": 600,
            "concurrency": 36,
            "workload": "nightly_batch",
            "execution_mode": execution_mode,
        },
        "diagnosis": "Processing saturation under high concurrency.",
        "action": action,
        "outcome": status,
        "lesson": f"Historical outcome for {action}.",
        "applicability": {
            "workload": ["nightly_batch"],
            "execution_mode": [execution_mode],
            "export_size_gb_min": 500,
        },
    }


class StubHindsightClient:
    bank_id = "support-experiences"

    def __init__(self, recalled: list[dict[str, Any]] | None = None) -> None:
        self.recalled = recalled or []
        self.retained: list[str] = []
        self.retained_documents: list[tuple[str, str]] = []
        self.recall_queries: list[str] = []
        self.reflect_queries: list[str] = []
        self.events: list[str] = []
        self.fail_retain = False

    def retain(self, content: str) -> dict[str, Any]:
        if self.fail_retain:
            raise HindsightError("simulated outage")
        self.retained.append(content)
        self.events.append("retain")
        return {"accepted": True}

    def retain_many(self, items: list[tuple[str, str]]) -> dict[str, Any]:
        if self.fail_retain:
            raise HindsightError("simulated outage")
        self.retained_documents.extend(items)
        self.events.append("retain_many")
        return {"accepted": True}

    def recall(self, query: str) -> dict[str, Any]:
        self.recall_queries.append(query)
        self.events.append("recall")
        return {"results": self.recalled}

    def reflect(self, query: str) -> dict[str, Any]:
        self.reflect_queries.append(query)
        self.events.append("reflect")
        return {"answer": "Hindsight compared applicable historical outcomes."}


def test_experience_bank_loads_seeded_records_and_status_distribution():
    memory = ExperienceMemory(connect_hindsight=False)

    assert memory.bank_id == "support-experiences"
    assert len(memory.experiences) == 15
    assert {status: sum(item.status == status for item in memory.experiences) for status in (
        "SUCCESS",
        "FAILURE",
        "PARTIAL",
        "BOUNDARY",
        "NON-TRANSFERABLE",
    )} == {
        "SUCCESS": 6,
        "FAILURE": 4,
        "PARTIAL": 2,
        "BOUNDARY": 2,
        "NON-TRANSFERABLE": 1,
    }


def test_experience_schema_accepts_seeded_record_and_rejects_incomplete_record():
    memory = ExperienceMemory(connect_hindsight=False)
    experience = memory.experiences[0]

    assert isinstance(experience, ExperienceRecord)
    assert experience.experience_id
    assert experience.source
    assert experience.problem_type
    assert experience.context
    assert experience.diagnosis
    assert experience.action
    assert experience.outcome
    assert experience.lesson
    assert experience.applicability

    with pytest.raises(ValidationError):
        ExperienceRecord.model_validate({"experience_id": "incomplete"})


def test_retain_validates_stores_and_updates_by_experience_id():
    memory = ExperienceMemory(connect_hindsight=False, seed=False)
    original = _experience("EXP-031", status="FAILURE", action="increase_timeout")

    retained = memory.retain(original)
    updated = memory.retain({**original, "lesson": "Updated lesson."})

    assert isinstance(retained, ExperienceRecord)
    assert retained.status == "FAILURE"
    assert len(memory.experiences) == 1
    assert memory.experiences[0].experience_id == "EXP-031"
    assert memory.experiences[0].lesson == "Updated lesson."
    with pytest.raises(ValueError, match="Invalid experience record"):
        memory.retain({"experience_id": "incomplete"})
    assert updated.lesson == "Updated lesson."


def test_recall_ranks_applicable_evidence_and_obeys_limit():
    memory = ExperienceMemory(connect_hindsight=False)
    result = memory.recall(_case(), limit=3)

    assert len(result.evidence) == 3
    assert result.memory_mode == "SEEDED DEMO FALLBACK"
    applicable = [item for item in result.evidence if item.applicability.applicable]
    assert applicable
    assert applicable[0].experience_id == "EXP-007"
    assert [item.applicability.applicable for item in result.evidence] == sorted(
        [item.applicability.applicable for item in result.evidence],
        reverse=True,
    )
    with pytest.raises(ValueError, match="at least 1"):
        memory.recall(_case(), limit=0)


def test_applicability_checks_size_and_workload_boundaries():
    large_experience = _experience(
        "EXP-LARGE",
        status="FAILURE",
        action="increase_timeout",
    )
    large = check_applicability(large_experience, _case())
    small = check_applicability(
        large_experience,
        _case(export_size_gb=20, concurrency=2, workload="interactive"),
    )

    assert large.applicable
    assert large.score == 1.0
    assert not small.applicable
    assert small.transfer_confidence == "LOW"
    assert "workload_mismatch:interactive" in small.boundary_reasons


def test_boundary_case_does_not_inherit_large_export_recommendation():
    memory = ExperienceMemory(connect_hindsight=False)
    small_case = _case(export_size_gb=20, concurrency=2, workload="interactive")
    recalled = memory.recall(small_case, limit=15)
    reflection = memory.reflect(recalled, initial_action="increase_timeout")

    assert recalled.boundary_detected
    assert reflection.boundary_detected
    assert reflection.recommended_action == "increase_timeout"
    assert not reflection.changed_mind
    assert all(
        evidence.applicability.transfer_confidence == "LOW"
        for evidence in recalled.evidence
        if not evidence.applicability.applicable
    )


def test_complete_retain_recall_reflect_loop_changes_the_next_recommendation():
    memory = ExperienceMemory(connect_hindsight=False)
    failure = _experience(
        "EXP-031",
        status="FAILURE",
        action="increase_timeout",
    )
    memory.retain(failure)

    recalled = memory.recall(_case(), limit=15)
    reflection = memory.reflect(recalled, initial_action="increase_timeout")

    assert "EXP-031" in {item.experience_id for item in recalled.evidence}
    assert "EXP-031" in reflection.contradicting_experiences
    assert reflection.supporting_experiences == ["EXP-002"]
    assert reflection.recommended_action == "async_chunked_export"
    assert reflection.changed_mind


def test_reflect_does_not_invent_an_alternative_from_failure_only():
    memory = ExperienceMemory(connect_hindsight=False, seed=False)
    memory.retain(_experience("EXP-FAIL", status="FAILURE", action="increase_timeout"))

    result = memory.reflect(memory.recall(_case()), initial_action="increase_timeout")

    assert result.recommended_action == "increase_timeout"
    assert not result.changed_mind
    assert result.contradicting_experiences == ["EXP-FAIL"]


def test_remote_recall_returns_clean_structured_evidence_and_caches_records():
    structured = _experience(
        "EXP-REMOTE",
        status="SUCCESS",
        action="async_chunked_export",
        execution_mode="async",
    )
    client = StubHindsightClient(
        recalled=[
            {"id": "remote-structured", "text": json.dumps(structured), "provider_debug": "not exposed"},
            {"id": "remote-text", "text": "A plain-text memory without validated experience fields."},
        ]
    )
    memory = ExperienceMemory(hindsight_client=client)

    result = memory.recall(_case())
    ui = memory.ui_evidence(result)

    assert result.memory_mode == "HINDSIGHT"
    assert len(result.remote_memories) == 2
    assert result.remote_memories[0].source == "HINDSIGHT"
    assert result.remote_memories[0].memory_id == "remote-structured"
    assert result.remote_memories[0].experience["experience_id"] == "EXP-REMOTE"
    assert result.remote_memories[1].experience is None
    assert "provider_debug" not in ui["remote_memories"][0]
    assert json.loads(json.dumps(ui))["remote_memories"][1]["text"].startswith("A plain-text")
    assert any(item.experience_id == "EXP-REMOTE" for item in result.evidence)


def test_remote_reflection_runs_only_for_conflicting_applicable_experiences():
    failed = _experience("EXP-REMOTE-FAIL", status="FAILURE", action="increase_timeout")
    succeeded = _experience(
        "EXP-REMOTE-SUCCESS",
        status="SUCCESS",
        action="async_chunked_export",
        execution_mode="async",
    )
    client = StubHindsightClient(
        recalled=[
            {"id": "remote-failure", "text": json.dumps(failed)},
            {"id": "remote-success", "text": json.dumps(succeeded)},
        ]
    )
    memory = ExperienceMemory(hindsight_client=client, seed=False)
    result = memory.recall(_case())
    reflection = memory.reflect(result, initial_action="increase_timeout")

    assert len(client.reflect_queries) == 1
    assert reflection.hindsight_reflection == "Hindsight compared applicable historical outcomes."
    assert reflection.recommended_action == "async_chunked_export"


def test_hindsight_outage_is_labeled_and_fallback_still_recalls_retained_memory():
    client = StubHindsightClient()
    client.fail_retain = True
    memory = ExperienceMemory(hindsight_client=client, seed=False)
    memory.retain(_experience("EXP-OFFLINE", status="FAILURE", action="increase_timeout"))

    result = memory.recall(_case())

    assert result.memory_mode == "SEEDED DEMO FALLBACK"
    assert result.evidence[0].experience_id == "EXP-OFFLINE"
    assert not client.recall_queries


def test_hindsight_client_uses_auto_create_retain_and_memory_endpoints(monkeypatch):
    calls: list[tuple[str, str, dict[str, Any], str | None]] = []

    class Response(BytesIO):
        def __enter__(self):
            return self

        def __exit__(self, *_args):
            self.close()

    def fake_urlopen(request: Request, timeout: float):
        payload = json.loads(request.data or b"{}")
        calls.append((request.method, request.full_url, payload, request.get_header("Authorization")))
        return Response(b'{"results": []}')

    monkeypatch.setattr("backend.app.hindsight.client.urlopen", fake_urlopen)
    client = HindsightClient(
        base_url="http://hindsight.test",
        api_key="test-key",
        bank_id="support-experiences",
    )

    client.retain('{"experience_id":"EXP-HTTP"}', document_id="test-experience")
    client.recall("large nightly export timeout")
    client.reflect("Compare applicable export outcomes.")

    assert [call[1].removeprefix("http://hindsight.test") for call in calls] == [
        "/v1/default/banks/support-experiences/memories",
        "/v1/default/banks/support-experiences/memories/recall",
        "/v1/default/banks/support-experiences/reflect",
    ]
    assert all(call[3] == "Bearer test-key" for call in calls)
    assert calls[0][2] == {
        "items": [{"content": '{"experience_id":"EXP-HTTP"}', "document_id": "test-experience"}],
        "async": False,
    }
    assert calls[1][2]["query"] == "large nightly export timeout"


def test_hindsight_client_batch_retain_auto_creates_and_upserts_seed_documents(monkeypatch):
    calls: list[tuple[str, dict[str, Any]]] = []

    def fake_urlopen(request: Request, timeout: float):
        assert timeout > 0
        calls.append((request.full_url, json.loads(request.data or b"{}")))
        return BytesIO(b'{"accepted": true}')

    monkeypatch.setattr("backend.app.hindsight.client.urlopen", fake_urlopen)
    client = HindsightClient(base_url="http://hindsight.test", bank_id="support-experiences")
    client.retain_many(
        [
            ("echo-seed-EXP-001", '{"experience_id":"EXP-001"}'),
            ("echo-seed-EXP-002", '{"experience_id":"EXP-002"}'),
        ]
    )

    assert len(calls) == 1
    assert calls[0][0].endswith("/v1/default/banks/support-experiences/memories")
    assert calls[0][1] == {
        "items": [
            {"content": '{"experience_id":"EXP-001"}', "document_id": "echo-seed-EXP-001"},
            {"content": '{"experience_id":"EXP-002"}', "document_id": "echo-seed-EXP-002"},
        ],
        "async": False,
    }


def test_first_remote_recall_seeds_experiences_before_search():
    client = StubHindsightClient()
    memory = ExperienceMemory(hindsight_client=client)

    memory.recall(_case())

    assert len(client.retained) == 15
    assert client.events[:15] == ["retain"] * 15
    assert client.events[15] == "recall"
    assert len(client.recall_queries) == 1
    assert memory.memory_mode == "HINDSIGHT"


def test_hindsight_client_loads_root_env_and_preserves_shell_values(tmp_path, monkeypatch):
    env_file = tmp_path / ".env"
    env_file.write_text(
        "HINDSIGHT_API_URL='https://configured.example/'\n"
        "HINDSIGHT_API_KEY=\"local-secret\"\n"
        "HINDSIGHT_BANK_ID=local-bank\n"
        "IGNORED_SETTING=not-loaded\n",
        encoding="utf-8",
    )
    monkeypatch.setattr(hindsight_client_module, "PROJECT_ENV_FILE", env_file)
    monkeypatch.setenv("HINDSIGHT_API_URL", "https://shell.example")
    monkeypatch.delenv("HINDSIGHT_API_KEY", raising=False)
    monkeypatch.delenv("HINDSIGHT_BANK_ID", raising=False)
    monkeypatch.delenv("IGNORED_SETTING", raising=False)

    client = HindsightClient()

    assert client.base_url == "https://shell.example"
    assert client.api_key == "local-secret"
    assert client.bank_id == "local-bank"
    assert "IGNORED_SETTING" not in os.environ


@pytest.mark.skipif(
    os.getenv("HINDSIGHT_RUN_INTEGRATION") != "1",
    reason="Set HINDSIGHT_RUN_INTEGRATION=1 to call a real Hindsight service.",
)
def test_real_hindsight_retain_recall_reflect_contract():
    """Opt-in live test; use a disposable bank to avoid polluting application memories.

    Set HINDSIGHT_API_URL, HINDSIGHT_API_KEY, and HINDSIGHT_TEST_BANK_ID before running.
    """
    base_url = os.getenv("HINDSIGHT_API_URL")
    bank_id = os.getenv("HINDSIGHT_TEST_BANK_ID")
    api_key = os.getenv("HINDSIGHT_API_KEY")
    if not base_url or not bank_id or not api_key:
        pytest.fail(
            "Live test requires HINDSIGHT_API_URL, HINDSIGHT_API_KEY, "
            "and HINDSIGHT_TEST_BANK_ID."
        )

    client = HindsightClient(
        base_url=base_url,
        api_key=api_key,
        bank_id=bank_id,
        timeout=15,
    )
    unique_id = "EXP-LIVE-TEST-ECHO-CONTRACT"
    failure = _experience(unique_id, status="FAILURE", action="increase_timeout")
    success_id = f"{unique_id}-SUCCESS"
    success = _experience(
        success_id,
        status="SUCCESS",
        action="async_chunked_export",
        execution_mode="async",
    )

    memory = ExperienceMemory(hindsight_client=client, seed=False)
    failure_record = memory.retain(failure)
    success_record = memory.retain(success)
    recalled = memory.recall(_case())
    reflection = memory.reflect(recalled, initial_action="increase_timeout")
    recalled_text = " ".join(item.text for item in recalled.remote_memories)

    assert failure_record.experience_id == unique_id
    assert success_record.experience_id == success_id
    assert recalled.memory_mode == "HINDSIGHT"
    assert recalled.remote_memories
    assert "increase_timeout" in recalled_text
    assert "failed" in recalled_text.lower()
    assert "saturation" in recalled_text.lower()
    assert reflection.recommended_action == "async_chunked_export"
    assert reflection.changed_mind
    assert reflection.hindsight_reflection
