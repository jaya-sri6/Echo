from __future__ import annotations

from typing import List

from pydantic import BaseModel

from backend.app.domain.case_context import CaseContext
from backend.app.agents.experience_reasoner import ExperienceReasoningResult


class ResolutionRecommendation(BaseModel):
	recommended_action: str
	explanation: str
	expected_outcome: str
	escalation_required: bool
	supporting_evidence: List[str]


class ResolutionAgent:
	"""Translate the domain decision into a customer-facing recommendation."""

	@staticmethod
	def run(case: CaseContext, reasoning: ExperienceReasoningResult) -> ResolutionRecommendation:
		selected = next(
			result
			for result in reasoning.candidate_action_results
			if result.action == reasoning.recommended_action
		)
		explanation = (
			f"For this {case.export_size_gb:g} GB {case.workload} case, "
			f"{selected.reason} {reasoning.recommendation_reason}"
		)
		return ResolutionRecommendation(
			recommended_action=reasoning.recommended_action,
			explanation=explanation,
			expected_outcome=selected.outcome,
			escalation_required=selected.escalated,
			supporting_evidence=reasoning.decision_evidence + [
				f"Simulator: {selected.action} -> {selected.outcome}: {selected.reason}"
			],
		)


__all__ = ["ResolutionRecommendation", "ResolutionAgent"]
