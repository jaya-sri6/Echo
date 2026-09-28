from __future__ import annotations

import re
from typing import Any, Iterable, Literal, Mapping

from pydantic import BaseModel, Field

from backend.app.domain.case_context import CaseContext


class ApplicabilityCheck(BaseModel):
    applicable: bool
    match_quality: Literal["HIGH", "MEDIUM", "LOW"]
    transfer_confidence: Literal["HIGH", "MEDIUM", "LOW"]
    score: float = Field(ge=0.0, le=1.0)
    matched_conditions: list[str] = Field(default_factory=list)
    boundary_reasons: list[str] = Field(default_factory=list)

    @property
    def boundary_detected(self) -> bool:
        return bool(self.boundary_reasons)


class RecallEvidence(BaseModel):
    experience: dict[str, Any]
    applicability: ApplicabilityCheck

    @property
    def experience_id(self) -> str:
        return str(self.experience["experience_id"])

    @property
    def boundary_detected(self) -> bool:
        return self.applicability.boundary_detected

    def to_ui(self) -> dict[str, Any]:
        record = dict(self.experience)
        record.update(
            {
                "match_quality": self.applicability.match_quality,
                "transfer_confidence": self.applicability.transfer_confidence,
                "applicable": self.applicability.applicable,
                "boundary_detected": self.boundary_detected,
                "boundary_reasons": self.applicability.boundary_reasons,
                "matched_conditions": self.applicability.matched_conditions,
            }
        )
        return record


class RemoteMemoryEvidence(BaseModel):
    source: Literal["HINDSIGHT"] = "HINDSIGHT"
    memory_id: str | None = None
    text: str
    experience: dict[str, Any] | None = None


class RecallResult(BaseModel):
    query: str
    memory_mode: str
    bank_id: str
    evidence: list[RecallEvidence] = Field(default_factory=list)
    remote_memories: list[RemoteMemoryEvidence] = Field(default_factory=list)
    boundary_detected: bool = False

    @property
    def evidence_count(self) -> int:
        return len(self.evidence)

    def to_ui(self) -> dict[str, Any]:
        return {
            "memory_mode": self.memory_mode,
            "bank_id": self.bank_id,
            "query": self.query,
            "recalled_count": self.evidence_count,
            "boundary_detected": self.boundary_detected,
            "experiences": [item.to_ui() for item in self.evidence],
            "remote_memories": [item.model_dump(mode="json") for item in self.remote_memories],
        }


def check_applicability(
    experience: Any,
    context: CaseContext | Mapping[str, Any],
) -> ApplicabilityCheck:
    record = _as_mapping(experience)
    case = _context_mapping(context)
    applicability = record.get("applicability") or {}
    if not isinstance(applicability, Mapping):
        raise TypeError("Experience applicability must be a mapping.")

    matched: list[str] = []
    mismatched: list[str] = []
    checks: list[tuple[str, Any, Any]] = []
    uncheckable_conditions = 0

    if record.get("problem_type"):
        checks.append(("problem_type", record["problem_type"], case.get("problem_type")))

    for key, expected in applicability.items():
        if key == "notes" or expected is None:
            continue
        normalized_key = _constraint_key(str(key))
        if normalized_key is None:
            mismatched.append(f"unsupported_applicability_condition:{key}")
            uncheckable_conditions += 1
            continue
        actual = case.get(normalized_key)
        if actual is None:
            mismatched.append(f"case_context_missing:{normalized_key}")
            uncheckable_conditions += 1
            continue
        checks.append((str(key), expected, actual))

    for key, expected, actual in checks:
        if _is_async_transition(record, key, expected, actual):
            # This action changes a synchronous case to asynchronous execution.
            matched.append(key)
        elif _matches(key, expected, actual):
            matched.append(key)
        else:
            mismatched.append(_mismatch_reason(key, expected, actual))

    condition_count = len(checks) + uncheckable_conditions
    if not condition_count:
        return ApplicabilityCheck(
            applicable=False,
            match_quality="LOW",
            transfer_confidence="LOW",
            score=0.0,
            boundary_reasons=["no_applicability_conditions"],
        )

    score = len(matched) / condition_count
    status = str(record.get("status", "")).upper()
    if status in {"BOUNDARY", "NON-TRANSFERABLE"}:
        mismatched.append("experience_is_marked_non_transferable")

    applicable = not mismatched
    if status in {"BOUNDARY", "NON-TRANSFERABLE"}:
        quality = confidence = "LOW"
    elif not applicable:
        quality = confidence = "LOW"
    elif applicable and score >= 0.8:
        quality = confidence = "HIGH"
    elif score >= 0.55:
        quality = confidence = "MEDIUM"
    else:
        quality = confidence = "LOW"

    return ApplicabilityCheck(
        applicable=applicable,
        match_quality=quality,
        transfer_confidence=confidence,
        score=score,
        matched_conditions=matched,
        boundary_reasons=mismatched,
    )


def recall_experiences(
    experiences: Iterable[Any],
    context: CaseContext | Mapping[str, Any],
    *,
    limit: int = 5,
) -> list[RecallEvidence]:
    if limit < 1:
        raise ValueError("Recall limit must be at least 1.")
    case = _context_mapping(context)
    case_problem = str(case.get("problem_type", "")).lower()
    records: list[tuple[float, RecallEvidence]] = []

    for experience in experiences:
        record = _as_mapping(experience)
        problem_type = str(record.get("problem_type", "")).lower()
        if problem_type and case_problem and not _related_problem(problem_type, case_problem):
            continue
        check = check_applicability(record, case)
        records.append((check.score, RecallEvidence(experience=record, applicability=check)))

    records.sort(
        key=lambda entry: (
            entry[1].applicability.applicable,
            entry[0],
            str(entry[1].experience.get("status", "")).upper()
            in {"BOUNDARY", "NON-TRANSFERABLE"},
            str(entry[1].experience.get("experience_id", "")),
        ),
        reverse=True,
    )
    return [evidence for _, evidence in records[:limit]]


def _as_mapping(value: Any) -> dict[str, Any]:
    if isinstance(value, Mapping):
        return dict(value)
    if hasattr(value, "model_dump"):
        dumped = value.model_dump(mode="json")
        if isinstance(dumped, dict):
            return dumped
    raise TypeError("Experience must be a mapping or a Pydantic model.")


def _context_mapping(context: CaseContext | Mapping[str, Any]) -> dict[str, Any]:
    if isinstance(context, CaseContext):
        return context.model_dump(mode="json")
    if not isinstance(context, Mapping):
        raise TypeError("Case context must be a CaseContext or mapping.")
    normalized = dict(context)
    concurrency = normalized.get("concurrency")
    if isinstance(concurrency, str):
        normalized["concurrency"] = _concurrency_tier(concurrency)
    return normalized


def _constraint_key(key: str) -> str | None:
    if key in {"export_size", "export_size_gb"} or key.startswith("export_size_gb_"):
        return "export_size_gb"
    return key if key in {"problem_type", "workload", "execution_mode", "concurrency"} else None


def _matches(key: str, expected: Any, actual: Any) -> bool:
    normalized = _constraint_key(key)
    if normalized is None:
        return True
    if normalized == "export_size_gb":
        actual_size = _numeric(actual)
        if actual_size is None:
            return False
        if key.endswith("_min"):
            expected_size = _numeric(expected)
            return expected_size is not None and actual_size >= expected_size
        if key.endswith("_max"):
            expected_size = _numeric(expected)
            return expected_size is not None and actual_size <= expected_size
        if isinstance(expected, str):
            return _compare_numeric_expression(expected, actual_size)
        if isinstance(expected, Mapping):
            minimum = expected.get("min")
            maximum = expected.get("max")
            minimum_value = _numeric(minimum) if minimum is not None else None
            maximum_value = _numeric(maximum) if maximum is not None else None
            return (
                (minimum is None or minimum_value is not None and actual_size >= minimum_value)
                and (maximum is None or maximum_value is not None and actual_size <= maximum_value)
            )
        return actual_size == _numeric(expected)
    if normalized == "concurrency":
        actual_tier = _concurrency_tier(actual)
        values = expected if isinstance(expected, (list, tuple, set)) else [expected]
        return any(
            str(value).lower() == actual_tier
            if isinstance(value, str) and value.lower() in {"low", "medium", "high"}
            else _numeric(value) == _numeric(actual)
            for value in values
        )
    values = expected if isinstance(expected, (list, tuple, set)) else [expected]
    actual_text = str(actual).strip().lower()
    return any(actual_text == str(value).strip().lower() for value in values)


def _is_async_transition(record: Mapping[str, Any], key: str, expected: Any, actual: Any) -> bool:
    if _constraint_key(key) != "execution_mode" or record.get("action") != "async_chunked_export":
        return False
    expected_values = expected if isinstance(expected, (list, tuple, set)) else [expected]
    return (
        str(actual).strip().lower() == "sync"
        and any(str(value).strip().lower() == "async" for value in expected_values)
    )


def _mismatch_reason(key: str, expected: Any, actual: Any) -> str:
    normalized_key = _constraint_key(key) or key
    if normalized_key == "export_size_gb":
        if key.endswith("_min"):
            return f"export_size_below_minimum:{expected}"
        if key.endswith("_max"):
            return f"export_size_above_maximum:{expected}"
        if isinstance(expected, str):
            match = re.match(r"\s*([<>]=?)\s*(\d+(?:\.\d+)?)", expected)
            if match:
                operator, limit = match.groups()
                comparison = "below" if operator.startswith(">") else "above"
                return f"export_size_{comparison}_boundary:{limit}GB"
        return f"export_size_mismatch:{actual}"
    return f"{normalized_key}_mismatch:{actual}"


def _numeric(value: Any) -> float | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        match = re.search(r"-?\d+(?:\.\d+)?", value)
        if match:
            return float(match.group())
    return None


def _compare_numeric_expression(expression: str, actual: float) -> bool:
    match = re.match(r"\s*(>=|<=|>|<|=)?\s*(-?\d+(?:\.\d+)?)", expression)
    if not match:
        return False
    operator, threshold_text = match.groups()
    threshold = float(threshold_text)
    return {
        ">": actual > threshold,
        ">=": actual >= threshold,
        "<": actual < threshold,
        "<=": actual <= threshold,
        "=": actual == threshold,
        None: actual == threshold,
    }[operator]


def _concurrency_tier(value: Any) -> str:
    if isinstance(value, str) and value.strip().lower() in {"low", "medium", "high"}:
        return value.strip().lower()
    amount = _numeric(value)
    if amount is None:
        return "unknown"
    if amount <= 5:
        return "low"
    if amount <= 15:
        return "medium"
    return "high"


def _related_problem(first: str, second: str) -> bool:
    if first == second:
        return True
    export_problems = {"export_timeout", "export_performance"}
    return first in export_problems and second in export_problems


def recall(
    context: CaseContext | Mapping[str, Any],
    *,
    limit: int = 5,
    memory_bank: Any = None,
) -> RecallResult:
    """Recall evidence from a supplied or default experience memory bank."""
    if memory_bank is None:
        from backend.app.hindsight.memory import get_default_memory_bank

        memory_bank = get_default_memory_bank()
    return memory_bank.recall(context, limit=limit)