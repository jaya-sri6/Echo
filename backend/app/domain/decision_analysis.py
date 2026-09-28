from __future__ import annotations

from typing import Iterable, List, Literal, Sequence, Union

from pydantic import BaseModel, Field

from backend.app.domain.candidates import CandidateAction
from backend.app.domain.case_context import CaseContext
from backend.app.domain.experiences import Experience
from backend.app.domain.simulator import ExportSimulator, Outcome

ApplicabilityState = Literal["MATCH", "PARTIAL_MATCH", "BOUNDARY", "NON_TRANSFERABLE"]
HistoricalStatus = Literal["SUCCESS", "FAILURE", "PARTIAL", "BOUNDARY", "NON-TRANSFERABLE"]


class ApplicabilityResult(BaseModel):
    experience_id: str
    applicability: ApplicabilityState
    score: float = Field(..., ge=0.0, le=1.0)
    matched_conditions: List[str]
    mismatched_conditions: List[str]
    reason: str


class CandidateSimulationResult(BaseModel):
    action: str
    outcome: Outcome
    resolution_time_minutes: int
    escalated: bool
    reason: str
    lesson: str


class DecisionAnalysisResult(BaseModel):
    current_case: CaseContext
    applicable_experiences: List[ApplicabilityResult]
    candidate_results: List[CandidateSimulationResult]
    recommended_action: str
    recommendation_reason: str
    changed_by_hindsight: bool
    decision_evidence: List[str]


_CONTEXT_FIELDS = (
    "export_size_gb",
    "concurrency",
    "workload",
    "execution_mode",
    "problem_type",
)
_OUTCOME_RANK = {"FAILURE": 0, "PARTIAL": 1, "SUCCESS": 2}


def evaluate_applicability(case: CaseContext, experience: Experience) -> ApplicabilityResult:
    """Evaluate transfer based on explicit context agreement, not similarity alone."""

    historical = experience.context
    matched: List[str] = []
    mismatched: List[str] = []
    for field in _CONTEXT_FIELDS:
        current_value = getattr(case, field)
        historical_value = getattr(historical, field)
        if field == "concurrency":
            equal = ExportSimulator.normalize_concurrency(current_value) == ExportSimulator.normalize_concurrency(historical_value)
        elif field in {"workload", "execution_mode", "problem_type"}:
            equal = str(current_value).strip().lower() == str(historical_value).strip().lower()
        else:
            equal = float(current_value) == float(historical_value)
        (matched if equal else mismatched).append(field)

    if experience.problem_type.strip().lower() != case.problem_type.strip().lower():
        state: ApplicabilityState = "NON_TRANSFERABLE"
        reason = "The experience addresses a different problem type and must not transfer."
    else:
        minimum = experience.applicability.get("export_size_gb_min")
        maximum = experience.applicability.get("export_size_gb_max")
        outside_size_bounds = (
            (minimum is not None and case.export_size_gb < float(minimum))
            or (maximum is not None and case.export_size_gb > float(maximum))
        )
        if outside_size_bounds:
            state = "BOUNDARY"
            reason = "The current export size falls outside the experience's explicit applicability bounds."
        elif not mismatched:
            state = "MATCH"
            reason = "All five case-context conditions match the historical experience."
        else:
            state = "PARTIAL_MATCH"
            reason = "Some context conditions match, but at least one differs; treat this as supporting evidence, not a direct transfer."

    return ApplicabilityResult(
        experience_id=experience.experience_id,
        applicability=state,
        score=len(matched) / len(_CONTEXT_FIELDS),
        matched_conditions=matched,
        mismatched_conditions=mismatched,
        reason=reason,
    )


def analyze_decision(
    case: CaseContext,
    experiences: Iterable[Experience],
    candidate_actions: Sequence[Union[str, CandidateAction]],
    initial_action: str = "increase_timeout",
) -> DecisionAnalysisResult:
    """Compare deterministic candidate outcomes and expose relevant historical evidence."""

    experience_list = list(experiences)
    applicability = [evaluate_applicability(case, item) for item in experience_list]
    action_names: List[str] = []
    for candidate in candidate_actions:
        action = candidate if isinstance(candidate, str) else candidate.action_type
        if action not in action_names:
            action_names.append(action)
    if initial_action not in action_names:
        action_names.insert(0, initial_action)
    if not action_names:
        raise ValueError("At least one candidate action or initial action is required.")

    results: List[CandidateSimulationResult] = []
    for action in action_names:
        simulated = ExportSimulator.simulate(
            export_size_gb=case.export_size_gb,
            concurrency=case.concurrency,
            workload=case.workload,
            execution_mode=case.execution_mode,
            action=action,
        )
        results.append(CandidateSimulationResult(action=action, **simulated.model_dump()))

    result_by_action = {result.action: result for result in results}
    supporting_actions: dict[str, float] = {}
    for experience, applicability_result in zip(experience_list, applicability):
        if (
            experience.status == "SUCCESS"
            and applicability_result.applicability in {"MATCH", "PARTIAL_MATCH"}
        ):
            supporting_actions[experience.action] = max(
                applicability_result.score,
                supporting_actions.get(experience.action, 0.0),
            )
    recommended = max(
        results,
        key=lambda result: (
            _OUTCOME_RANK[result.outcome],
            supporting_actions.get(result.action, 0.0),
            not result.escalated,
            -result.resolution_time_minutes,
        ),
    )
    initial_result = result_by_action[initial_action]

    evidence: List[str] = []
    for experience, applicability_result in zip(experience_list, applicability):
        if applicability_result.applicability not in {"MATCH", "PARTIAL_MATCH"}:
            continue
        if experience.status not in {"SUCCESS", "FAILURE", "PARTIAL"}:
            continue
        evidence.append(
            f"{experience.experience_id}: {experience.action} -> {experience.status} "
            f"({applicability_result.applicability})"
        )
    changed_by_hindsight = (
        recommended.action != initial_action
        and _OUTCOME_RANK[recommended.outcome] > _OUTCOME_RANK[initial_result.outcome]
        and recommended.action in supporting_actions
    )
    comparison = (
        f"The simulator predicts {recommended.outcome} for {recommended.action} "
        f"versus {initial_result.outcome} for the initial {initial_action} action."
    )
    if changed_by_hindsight:
        recommendation_reason = f"Applicable historical success supports the improved counterfactual. {comparison}"
    else:
        recommendation_reason = comparison

    return DecisionAnalysisResult(
        current_case=case,
        applicable_experiences=applicability,
        candidate_results=results,
        recommended_action=recommended.action,
        recommendation_reason=recommendation_reason,
        changed_by_hindsight=changed_by_hindsight,
        decision_evidence=evidence,
    )


__all__ = [
    "ApplicabilityResult",
    "CandidateSimulationResult",
    "DecisionAnalysisResult",
    "evaluate_applicability",
    "analyze_decision",
]