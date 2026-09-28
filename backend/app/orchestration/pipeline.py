from __future__ import annotations

from typing import List, Literal, Optional, Sequence

from pydantic import BaseModel

from backend.app.agents.conversation_agent import ConversationAgent
from backend.app.agents.experience_reasoner import (
	ExperienceReasoner,
	ExperienceReasoningResult,
)
from backend.app.agents.guardian import Guardian, GuardianResult
from backend.app.agents.investigator import InvestigationResult, Investigator
from backend.app.agents.resolution_agent import (
	ResolutionAgent,
	ResolutionRecommendation,
)
from backend.app.domain.case_context import CaseContext
from backend.app.domain.experiences import Experience

PipelineStatus = Literal[
	"COMPLETE",
	"INVALID_INPUT",
	"INCOMPLETE_CASE",
	"INVESTIGATION_FAILED",
	"NO_APPLICABLE_EXPERIENCE",
	"DECISION_ANALYSIS_FAILED",
	"RESOLUTION_FAILED",
	"GUARDIAN_REJECTED",
]


class PipelineResult(BaseModel):
	status: PipelineStatus
	case_context: Optional[CaseContext] = None
	investigation: Optional[InvestigationResult] = None
	experience_reasoning: Optional[ExperienceReasoningResult] = None
	resolution: Optional[ResolutionRecommendation] = None
	guardian: Optional[GuardianResult] = None
	final_recommendation: Optional[str] = None
	changed_by_hindsight: bool = False
	decision_evidence: List[str] = []
	errors: List[str] = []


class EchoPipeline:
	"""Run the deterministic customer-message-to-recommendation workflow."""

	@staticmethod
	def run(
		customer_message: str,
		experiences: Optional[Sequence[Experience]] = None,
	) -> PipelineResult:
		if not isinstance(customer_message, str) or not customer_message.strip():
			return PipelineResult(
				status="INVALID_INPUT",
				errors=["Customer message must be a non-empty string."],
			)

		try:
			extraction = ConversationAgent.run(customer_message)
		except Exception as error:
			return PipelineResult(
				status="INVALID_INPUT",
				errors=[f"Conversation extraction failed: {error}"],
			)

		if extraction.case_context is None:
			missing = ", ".join(extraction.missing_fields)
			return PipelineResult(
				status="INCOMPLETE_CASE",
				errors=[f"Missing required case information: {missing}."],
			)
		case = extraction.case_context

		try:
			investigation = Investigator.run(case)
		except Exception as error:
			return PipelineResult(
				status="INVESTIGATION_FAILED",
				case_context=case,
				errors=[f"Investigation failed: {error}"],
			)
		if not investigation.ready_for_reasoning:
			return PipelineResult(
				status="INCOMPLETE_CASE",
				case_context=case,
				investigation=investigation,
				errors=[
					"Investigation found missing information: "
					+ ", ".join(investigation.missing_information)
				],
			)

		try:
			available_experiences = (
				list(experiences)
				if experiences is not None
				else ExperienceReasoner.load_seeded_experiences()
			)
			reasoning = ExperienceReasoner.run(case, available_experiences)
		except Exception as error:
			return PipelineResult(
				status="DECISION_ANALYSIS_FAILED",
				case_context=case,
				investigation=investigation,
				errors=[f"Experience reasoning or simulation failed: {error}"],
			)

		base = {
			"case_context": case,
			"investigation": investigation,
			"experience_reasoning": reasoning,
			"changed_by_hindsight": reasoning.changed_by_hindsight,
			"decision_evidence": reasoning.decision_evidence,
		}
		usable_states = {"MATCH", "PARTIAL_MATCH"}
		if not any(state in usable_states for state in reasoning.applicability_states.values()):
			return PipelineResult(
				status="NO_APPLICABLE_EXPERIENCE",
				errors=["No historical experience is applicable to this case; no recommendation was issued."],
				**base,
			)

		try:
			resolution = ResolutionAgent.run(case, reasoning)
		except Exception as error:
			return PipelineResult(
				status="RESOLUTION_FAILED",
				errors=[f"Resolution generation failed: {error}"],
				**base,
			)

		try:
			guardian = Guardian.run(case, resolution, reasoning)
		except Exception as error:
			return PipelineResult(
				status="GUARDIAN_REJECTED",
				resolution=resolution,
				errors=[f"Guardian validation failed: {error}"],
				**base,
			)
		if not guardian.approved:
			return PipelineResult(
				status="GUARDIAN_REJECTED",
				resolution=resolution,
				guardian=guardian,
				errors=guardian.issues,
				**base,
			)

		return PipelineResult(
			status="COMPLETE",
			resolution=resolution,
			guardian=guardian,
			final_recommendation=resolution.recommended_action,
			**base,
		)


run_pipeline = EchoPipeline.run

__all__ = ["PipelineResult", "EchoPipeline", "run_pipeline"]
