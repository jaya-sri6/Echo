from __future__ import annotations

from typing import Any, Iterable

from pydantic import BaseModel, Field

from backend.app.hindsight.recall import RecallEvidence, RecallResult


class ReflectionResult(BaseModel):
    initial_action: str | None = None
    recommended_action: str | None = None
    changed_mind: bool = False
    reasoning: str
    supporting_experiences: list[str] = Field(default_factory=list)
    contradicting_experiences: list[str] = Field(default_factory=list)
    boundary_detected: bool = False
    hindsight_reflection: str | None = None

    def to_ui(self) -> dict[str, Any]:
        return self.model_dump(mode="json")


def should_reflect(evidence: Iterable[RecallEvidence]) -> bool:
    applicable = [item for item in evidence if item.applicability.applicable]
    statuses = {str(item.experience.get("status", "")).upper() for item in applicable}
    actions = {str(item.experience.get("action", "")) for item in applicable}
    return len(applicable) > 1 and (len(statuses) > 1 or len(actions) > 1)


def build_reflection(
    evidence: Iterable[RecallEvidence],
    *,
    initial_action: str | None = None,
) -> ReflectionResult:
    items = list(evidence)
    applicable = [item for item in items if item.applicability.applicable]
    successful = [
        item
        for item in applicable
        if str(item.experience.get("status", "")).upper() == "SUCCESS"
    ]
    failures = [
        item
        for item in applicable
        if str(item.experience.get("status", "")).upper() == "FAILURE"
    ]

    successful.sort(
        key=lambda item: (
            item.applicability.score,
            str(item.experience.get("experience_id", "")),
        ),
        reverse=True,
    )
    selected = successful[0] if successful else None
    action = str(selected.experience.get("action")) if selected else None
    changed = bool(action and initial_action and action != initial_action)
    selected_ids = [selected.experience_id] if selected else []
    failure_ids = [item.experience_id for item in failures]

    if selected and failures:
        reason = (
            f"{selected.experience_id} records a successful {action} outcome in an applicable "
            f"context; historical failures show that {initial_action or 'the prior action'} "
            "did not resolve the matching case."
        )
    elif selected:
        reason = (
            f"{selected.experience_id} records a successful {action} outcome in an applicable "
            "context."
        )
    elif items and any(item.boundary_detected for item in items):
        reason = (
            "Historical experiences were recalled, but their conditions do not sufficiently "
            "match this case. Do not transfer those actions automatically."
        )
    elif items:
        reason = "No applicable successful experience was found; keep the initial decision for review."
    else:
        reason = "No historical experience was recalled; use the non-memory decision path."

    return ReflectionResult(
        initial_action=initial_action,
        recommended_action=action or initial_action,
        changed_mind=changed,
        reasoning=reason,
        supporting_experiences=selected_ids,
        contradicting_experiences=failure_ids,
        boundary_detected=(
            bool(items)
            and not any(item.applicability.applicable for item in items)
            and any(item.boundary_detected for item in items)
        ),
    )


def reflect(
    evidence: RecallResult | Iterable[RecallEvidence],
    *,
    initial_action: str | None = None,
) -> ReflectionResult:
    """Public reflect operation, using deterministic outcome-backed reasoning."""
    items = evidence.evidence if isinstance(evidence, RecallResult) else evidence
    return build_reflection(items, initial_action=initial_action)