from __future__ import annotations

import json
from pathlib import Path
from typing import List, Sequence, Union

from pydantic import BaseModel

from backend.app.domain.case_context import CaseContext
from backend.app.domain.decision_analysis import (
	ApplicabilityResult,
	CandidateSimulationResult,
	DecisionAnalysisResult,
	analyze_decision,
)
from backend.app.domain.experiences import Experience


class ExperienceReasoningResult(BaseModel):
	applicable_experiences: List[ApplicabilityResult]
	applicability_states: dict[str, str]
	decision_evidence: List[str]
	candidate_action_results: List[CandidateSimulationResult]
	recommended_action: str
	changed_by_hindsight: bool
	recommendation_reason: str
	decision_analysis: DecisionAnalysisResult


class ExperienceReasoner:
	"""Adapt case terminology and delegate all analysis to the domain layer."""

	DEFAULT_ACTIONS = (
		"increase_timeout",
		"reduce_concurrency",
		"async_chunked_export",
		"retry_with_backoff",
		"schedule_off_peak",
	)
	DATASET_PATH = Path(__file__).resolve().parents[3] / "data" / "experiences" / "seeded_experiences.json"

	@staticmethod
	def load_seeded_experiences(path: Path | None = None) -> List[Experience]:
		source = path or ExperienceReasoner.DATASET_PATH
		records = json.loads(source.read_text(encoding="utf-8"))
		return [Experience.model_validate(record) for record in records]

	@staticmethod
	def run(
		case: CaseContext,
		experiences: Sequence[Experience],
		candidate_actions: Sequence[str] = DEFAULT_ACTIONS,
	) -> ExperienceReasoningResult:
		# The conversation-facing label maps to the existing seeded domain category.
		analysis_case = case.model_copy(
			update={"problem_type": "export_timeout"}
		) if case.problem_type == "large_export_timeout" else case
		result = analyze_decision(
			case=analysis_case,
			experiences=experiences,
			candidate_actions=candidate_actions,
			initial_action="increase_timeout",
		)
		return ExperienceReasoningResult(
			applicable_experiences=result.applicable_experiences,
			applicability_states={
				item.experience_id: item.applicability
				for item in result.applicable_experiences
			},
			decision_evidence=result.decision_evidence,
			candidate_action_results=result.candidate_results,
			recommended_action=result.recommended_action,
			changed_by_hindsight=result.changed_by_hindsight,
			recommendation_reason=result.recommendation_reason,
			decision_analysis=result,
		)


__all__ = ["ExperienceReasoningResult", "ExperienceReasoner"]
