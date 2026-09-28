from __future__ import annotations

import json
import logging
import os
import threading
from pathlib import Path
from typing import Any, Literal, Mapping

from pydantic import ValidationError

from backend.app.domain.case_context import CaseContext
from backend.app.domain.experiences import Experience
from backend.app.hindsight.client import HindsightClient, HindsightError
from backend.app.hindsight.recall import (
    ApplicabilityCheck,
    RecallResult,
    RemoteMemoryEvidence,
    check_applicability,
    recall_experiences,
)
from backend.app.hindsight.reflect import (
    ReflectionResult,
    build_reflection,
    should_reflect,
)

logger = logging.getLogger(__name__)

MemoryStatus = Literal["SUCCESS", "FAILURE", "PARTIAL", "BOUNDARY", "NON-TRANSFERABLE"]


class ExperienceRecord(Experience):
    """Persisted experience schema, including the outcome class used in reflection."""

    status: MemoryStatus = "SUCCESS"


class ExperienceMemory:
    """Support-experiences bank with a Hindsight backend and an explicit seeded fallback."""

    BANK_ID = "support-experiences"
    SEED_PATH = Path(__file__).resolve().parents[3] / "data" / "experiences" / "seeded_experiences.json"

    def __init__(
        self,
        *,
        hindsight_client: HindsightClient | None = None,
        connect_hindsight: bool = True,
        seed: bool = True,
        seed_path: Path | None = None,
    ) -> None:
        self.bank_id = (
            hindsight_client.bank_id
            if hindsight_client is not None
            else os.getenv("HINDSIGHT_BANK_ID", self.BANK_ID)
        )
        self._client = (
            hindsight_client
            if hindsight_client is not None
            else HindsightClient(bank_id=self.bank_id)
            if connect_hindsight
            else None
        )
        self._remote_failed = False
        self._memory_mode = "SEEDED DEMO FALLBACK"
        self._seed_remote_on_use = bool(seed and self._client is not None)
        self._experiences: dict[str, ExperienceRecord] = {}
        self._lock = threading.RLock()

        if seed:
            path = seed_path or self.SEED_PATH
            with path.open("r", encoding="utf-8") as source:
                payload = json.load(source)
            if not isinstance(payload, list):
                raise ValueError(f"Seeded experience file must contain a JSON list: {path}")
            for item in payload:
                self._store_local(_make_record(item, status=None))

    @property
    def memory_mode(self) -> str:
        with self._lock:
            return self._memory_mode

    @property
    def experiences(self) -> tuple[ExperienceRecord, ...]:
        with self._lock:
            return tuple(self._experiences.values())

    def retain(
        self,
        experience: ExperienceRecord | Experience | Mapping[str, Any],
        *,
        status: str | None = None,
    ) -> ExperienceRecord:
        """Keep an outcome locally and send the same structured evidence to Hindsight."""
        record = _make_record(experience, status=status)
        with self._lock:
            self._store_local(record)
        self._run_remote("retain", record)
        return record

    def recall(
        self,
        context: CaseContext | Mapping[str, Any],
        *,
        limit: int = 5,
    ) -> RecallResult:
        """Recall related experiences and annotate applicability and transfer boundaries."""
        if limit < 1:
            raise ValueError("Recall limit must be at least 1.")
        case = _case_context(context)
        query = _context_query(case)
        remote_response = self._run_remote("recall", query)
        remote_memories = self._remote_memories(remote_response)
        with self._lock:
            evidence = recall_experiences(self._experiences.values(), case, limit=limit)
        has_applicable_evidence = any(item.applicability.applicable for item in evidence)
        return RecallResult(
            query=query,
            memory_mode=self.memory_mode,
            bank_id=self.bank_id,
            evidence=evidence,
            remote_memories=remote_memories,
            boundary_detected=bool(evidence) and not has_applicable_evidence,
        )

    def check_applicability(
        self,
        experience: ExperienceRecord | Experience | Mapping[str, Any],
        context: CaseContext | Mapping[str, Any],
    ) -> ApplicabilityCheck:
        return check_applicability(experience, context)

    def reflect(
        self,
        recalled: RecallResult | list[Any],
        *,
        initial_action: str | None = None,
    ) -> ReflectionResult:
        """Use applicable outcome evidence to explain or change the initial action."""
        evidence = recalled.evidence if isinstance(recalled, RecallResult) else recalled
        result = build_reflection(evidence, initial_action=initial_action)
        if self._client is not None and not self._remote_failed and should_reflect(evidence):
            query = _reflection_query(evidence, initial_action, result.recommended_action)
            response = self._run_remote("reflect", query)
            if response:
                answer = response.get("text") or response.get("answer")
                if isinstance(answer, str) and answer.strip():
                    result.hindsight_reflection = answer.strip()
        return result

    def ui_evidence(
        self,
        recalled: RecallResult,
        reflection: ReflectionResult | None = None,
    ) -> dict[str, Any]:
        """Return a JSON-ready payload containing evidence and any recommendation change."""
        payload = recalled.to_ui()
        payload["memory_mode"] = self.memory_mode
        if reflection is not None:
            payload["reflection"] = reflection.to_ui()
        return payload

    def _store_local(self, record: ExperienceRecord) -> None:
        with self._lock:
            self._experiences[record.experience_id] = record

    def _run_remote(self, operation: str, value: ExperienceRecord | str) -> dict[str, Any] | None:
        if self._client is None or self._remote_failed:
            return None
        try:
            if self._seed_remote_on_use:
                seed_items = [
                    (f"echo-seed-{record.experience_id}", _record_content(record))
                    for record in self.experiences
                ]
                if isinstance(self._client, HindsightClient):
                    self._client.retain_many(seed_items)
                else:
                    for _document_id, content in seed_items:
                        self._client.retain(content)
                self._seed_remote_on_use = False

            if operation == "retain":
                assert isinstance(value, ExperienceRecord)
                content = _record_content(value)
                if isinstance(self._client, HindsightClient):
                    response = self._client.retain(
                        content,
                        document_id=f"echo-case-{value.experience_id}",
                    )
                else:
                    response = self._client.retain(content)
            elif operation == "recall":
                assert isinstance(value, str)
                response = self._client.recall(value)
            elif operation == "reflect":
                assert isinstance(value, str)
                response = self._client.reflect(value)
            else:
                raise ValueError(f"Unsupported Hindsight operation: {operation}")
        except HindsightError as error:
            with self._lock:
                self._remote_failed = True
                self._memory_mode = "SEEDED DEMO FALLBACK"
            logger.warning(
                "Hindsight %s failed; continuing with the seeded memory provider: %s",
                operation,
                error,
            )
            return None
        with self._lock:
            self._memory_mode = "HINDSIGHT"
        return response

    def _remote_memories(
        self,
        response: Mapping[str, Any] | None,
    ) -> list[RemoteMemoryEvidence]:
        if response is None:
            return []
        results: Any = response.get("results", response.get("items", response.get("memories", [])))
        if isinstance(results, Mapping):
            results = results.get("items", [])
        if not isinstance(results, list):
            return []

        memories: list[RemoteMemoryEvidence] = []
        for item in results:
            if not isinstance(item, Mapping):
                continue
            text = item.get("text") or item.get("content")
            if not isinstance(text, str) or not text.strip():
                logger.warning("Ignoring Hindsight memory result without text content.")
                continue

            experience = self._structured_experience(text)
            memories.append(
                RemoteMemoryEvidence(
                    memory_id=_remote_memory_id(item),
                    text=text,
                    experience=experience.model_dump(mode="json") if experience else None,
                )
            )
            if experience is not None:
                self._store_local(experience)
        return memories

    @staticmethod
    def _structured_experience(text: str) -> ExperienceRecord | None:
        start = text.find("{")
        if start < 0:
            return None
        try:
            decoded, _ = json.JSONDecoder().raw_decode(text[start:])
            if not isinstance(decoded, Mapping) or "experience_id" not in decoded:
                return None
            return _make_record(decoded, status=None)
        except (json.JSONDecodeError, ValidationError, ValueError) as error:
            logger.warning("Ignoring malformed structured memory returned by Hindsight: %s", error)
            return None


MemoryBank = ExperienceMemory


def _remote_memory_id(item: Mapping[str, Any]) -> str | None:
    for key in ("id", "memory_id", "fact_id"):
        value = item.get(key)
        if value is not None:
            return str(value)
    return None


_default_memory_bank: ExperienceMemory | None = None
_default_lock = threading.Lock()


def get_default_memory_bank() -> ExperienceMemory:
    global _default_memory_bank
    with _default_lock:
        if _default_memory_bank is None:
            _default_memory_bank = ExperienceMemory()
        return _default_memory_bank


def retain(
    experience: ExperienceRecord | Experience | Mapping[str, Any],
    *,
    status: str | None = None,
    memory_bank: ExperienceMemory | None = None,
) -> ExperienceRecord:
    return (memory_bank or get_default_memory_bank()).retain(experience, status=status)


def _make_record(
    experience: ExperienceRecord | Experience | Mapping[str, Any],
    *,
    status: str | None,
) -> ExperienceRecord:
    if isinstance(experience, ExperienceRecord):
        payload = experience.model_dump(mode="json")
    elif isinstance(experience, Experience):
        payload = experience.model_dump(mode="json")
    elif isinstance(experience, Mapping):
        payload = dict(experience)
    else:
        raise TypeError("Retained experience must be a mapping or a Pydantic model.")

    problem = payload.pop("problem", None)
    if isinstance(problem, Mapping):
        payload.setdefault("problem_type", problem.get("type"))
    diagnosis = payload.get("diagnosis")
    if isinstance(diagnosis, Mapping):
        payload["diagnosis"] = diagnosis.get("cause") or json.dumps(diagnosis, sort_keys=True)
    action = payload.get("action")
    if isinstance(action, Mapping):
        payload["action"] = action.get("type") or json.dumps(action, sort_keys=True)
    outcome = payload.get("outcome")
    if isinstance(outcome, Mapping):
        if status is None:
            status = str(outcome.get("status", "SUCCESS"))
        payload["outcome"] = (
            outcome.get("summary")
            or outcome.get("description")
            or json.dumps(outcome, sort_keys=True)
        )
    context = payload.get("context")
    if isinstance(context, Mapping):
        normalized_context = dict(context)
        concurrency = normalized_context.get("concurrency")
        if isinstance(concurrency, str):
            normalized_context["concurrency"] = _concurrency_number(concurrency)
        if not normalized_context.get("problem_type") and payload.get("problem_type"):
            normalized_context["problem_type"] = payload["problem_type"]
        if (
            payload.get("problem_type")
            and normalized_context.get("problem_type")
            and normalized_context["problem_type"] != payload["problem_type"]
        ):
            raise ValueError("Experience problem_type must match context.problem_type.")
        payload["context"] = normalized_context
    payload.setdefault("status", "SUCCESS")
    if status is not None:
        payload["status"] = status.strip().upper().replace("_", "-")
    try:
        return ExperienceRecord.model_validate(payload)
    except ValidationError as error:
        raise ValueError(f"Invalid experience record: {error}") from error


def _case_context(context: CaseContext | Mapping[str, Any]) -> CaseContext:
    if isinstance(context, CaseContext):
        return context
    if not isinstance(context, Mapping):
        raise TypeError("Case context must be a CaseContext or mapping.")
    payload = dict(context)
    concurrency = payload.get("concurrency")
    if isinstance(concurrency, str):
        payload["concurrency"] = _concurrency_number(concurrency)
    try:
        return CaseContext.model_validate(payload)
    except ValidationError as error:
        raise ValueError(f"Invalid case context: {error}") from error


def _record_content(record: ExperienceRecord) -> str:
    return json.dumps(record.model_dump(mode="json"), ensure_ascii=True, sort_keys=True)


def _context_query(context: CaseContext) -> str:
    return (
        f"Support experience for problem {context.problem_type}; "
        f"export size {context.export_size_gb:g} GB; concurrency {context.concurrency}; "
        f"workload {context.workload}; execution mode {context.execution_mode}. "
        "Find prior actions, outcomes, and conditions where they apply or do not apply."
    )


def _concurrency_number(value: str) -> int:
    tiers = {"low": 2, "medium": 10, "moderate": 10, "high": 20}
    tier = value.strip().lower()
    if tier not in tiers:
        raise ValueError(f"Unsupported concurrency tier: {value}")
    return tiers[tier]


def _reflection_query(evidence: list[Any], initial_action: str | None, selected_action: str | None) -> str:
    summaries = []
    for item in evidence:
        record = item.experience
        summaries.append(
            f"{record.get('experience_id')}: status={record.get('status')}, "
            f"action={record.get('action')}, applicable={item.applicability.applicable}, "
            f"lesson={record.get('lesson')}"
        )
    return (
        f"Initial action: {initial_action or 'not specified'}. "
        f"Deterministic candidate action: {selected_action or 'none'}. "
        "Compare the applicable historical outcomes only; do not transfer a boundary or "
        "non-transferable experience. Evidence: " + " | ".join(summaries)
    )