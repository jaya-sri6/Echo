from __future__ import annotations

from typing import List

from pydantic import BaseModel

from backend.app.domain.case_context import CaseContext
from backend.app.agents.experience_reasoner import ExperienceReasoningResult
from backend.app.agents.resolution_agent import ResolutionRecommendation


class GuardianResult(BaseModel):
	approved: bool
	issues: List[str]
	reason: str


class Guardian:
	"""Validate support reasoning without proposing or executing an action."""

	@staticmethod
	def run(
		case: CaseContext,
		resolution: ResolutionRecommendation,
		reasoning: ExperienceReasoningResult,
	) -> GuardianResult:
		issues: List[str] = []
		context_values = case.model_dump()
		if any(value is None or (isinstance(value, str) and not value.strip()) for value in context_values.values()):
			issues.append("Required case context is missing.")
		if not resolution.recommended_action:
			issues.append("No recommendation was provided.")

		selected = next(
			(result for result in reasoning.candidate_action_results if result.action == resolution.recommended_action),
			None,
		)
		if selected is None or resolution.recommended_action != reasoning.recommended_action:
			issues.append("The recommendation is not supported by the analyzed candidate results.")
		elif not any(
			evidence.startswith(f"Simulator: {selected.action} -> {selected.outcome}:")
			for evidence in resolution.supporting_evidence
		):
			issues.append("The recommendation has no matching simulator evidence.")

		boundary_ids = {
			item.experience_id
			for item in reasoning.applicable_experiences
			if item.applicability in {"BOUNDARY", "NON_TRANSFERABLE"}
		}
		for evidence in reasoning.decision_evidence:
			experience_id = evidence.split(":", maxsplit=1)[0]
			if experience_id in boundary_ids:
				issues.append(f"Boundary experience {experience_id} is presented as direct evidence.")

		if issues:
			return GuardianResult(approved=False, issues=issues, reason="The recommendation failed one or more evidence and context checks.")
		return GuardianResult(
			approved=True,
			issues=[],
			reason="Required context is present, and the unchanged recommendation is supported by simulator evidence without direct transfer from boundary memories.",
		)


__all__ = ["GuardianResult", "Guardian"]
