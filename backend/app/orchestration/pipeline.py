from __future__ import annotations

import hashlib
import time
from datetime import datetime, timezone
from typing import Any, Callable, List, Literal, Optional, Sequence

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
from backend.app.domain.simulator import ExportSimulator, SimulationResult
from backend.app.hindsight.memory import ExperienceMemory, get_default_memory_bank
from backend.app.hindsight.recall import RecallResult

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
	simulation: Optional[SimulationResult] = None
	retained_experience_id: Optional[str] = None
	errors: List[str] = []


def _emit_event(
	on_event: Optional[Callable[[dict[str, Any]], None]],
	step_index: int,
	event: str,
	agent: str,
	status: str,
	message: str,
	duration_ms: float,
	data: dict[str, Any],
) -> None:
	if on_event is None:
		return
	payload = {
		"step_index": step_index,
		"event": event,
		"agent": agent,
		"status": status,
		"message": message,
		"timestamp": datetime.now(timezone.utc).isoformat(),
		"duration_ms": round(duration_ms, 2),
		"data": data,
	}
	try:
		on_event(payload)
	except Exception:
		pass


class EchoPipeline:
	"""Run the deterministic customer-message-to-recommendation workflow with real memory & events."""

	@staticmethod
	def run(
		customer_message: str,
		experiences: Optional[Sequence[Experience]] = None,
		memory_bank: Optional[ExperienceMemory] = None,
		retain_outcome: bool = False,
		on_event: Optional[Callable[[dict[str, Any]], None]] = None,
	) -> PipelineResult:
		start_time = time.perf_counter()

		# Step 0: Input validation & extraction
		t0 = time.perf_counter()
		if not isinstance(customer_message, str) or not customer_message.strip():
			err_res = PipelineResult(
				status="INVALID_INPUT",
				errors=["Customer message must be a non-empty string."],
			)
			_emit_event(
				on_event, 0, "case_started", "conversation_agent", "failed",
				"Customer message must be a non-empty string.",
				(time.perf_counter() - t0) * 1000, {"code": "invalid_input"},
			)
			return err_res

		try:
			extraction = ConversationAgent.run(customer_message)
		except Exception as error:
			err_res = PipelineResult(
				status="INVALID_INPUT",
				errors=[f"Conversation extraction failed: {error}"],
			)
			_emit_event(
				on_event, 0, "case_started", "conversation_agent", "failed",
				f"Conversation extraction failed: {error}",
				(time.perf_counter() - t0) * 1000, {"code": "invalid_input"},
			)
			return err_res

		if extraction.case_context is None:
			missing = ", ".join(extraction.missing_fields)
			err_res = PipelineResult(
				status="INCOMPLETE_CASE",
				errors=[f"Missing required case information: {missing}."],
			)
			_emit_event(
				on_event, 0, "case_started", "conversation_agent", "failed",
				f"Missing required case information: {missing}.",
				(time.perf_counter() - t0) * 1000, {"missing_fields": extraction.missing_fields},
			)
			return err_res

		case = extraction.case_context
		_emit_event(
			on_event, 0, "case_started", "conversation_agent", "completed",
			"Customer message received; case context extracted.",
			(time.perf_counter() - t0) * 1000, case.model_dump(mode="json"),
		)

		# Step 1: Investigation
		t1 = time.perf_counter()
		try:
			investigation = Investigator.run(case)
		except Exception as error:
			err_res = PipelineResult(
				status="INVESTIGATION_FAILED",
				case_context=case,
				errors=[f"Investigation failed: {error}"],
			)
			_emit_event(
				on_event, 1, "investigation_completed", "investigator", "failed",
				f"Investigation failed: {error}", (time.perf_counter() - t1) * 1000, {},
			)
			return err_res

		if not investigation.ready_for_reasoning:
			err_res = PipelineResult(
				status="INCOMPLETE_CASE",
				case_context=case,
				investigation=investigation,
				errors=[
					"Investigation found missing information: "
					+ ", ".join(investigation.missing_information)
				],
			)
			_emit_event(
				on_event, 1, "investigation_completed", "investigator", "failed",
				"Missing information in investigation.", (time.perf_counter() - t1) * 1000,
				investigation.model_dump(mode="json"),
			)
			return err_res

		_emit_event(
			on_event, 1, "investigation_completed", "investigator", "completed",
			"Investigation complete; case verified actionable.",
			(time.perf_counter() - t1) * 1000, investigation.model_dump(mode="json"),
		)

		# Step 2: Hindsight Memory Recall
		t2 = time.perf_counter()
		bank = memory_bank or get_default_memory_bank()
		recall_result: Optional[RecallResult] = None
		if experiences is not None:
			available_experiences = list(experiences)
			recalled_count = len(available_experiences)
		else:
			try:
				recall_result = bank.recall(case)
				available_experiences = list(bank.experiences)
				recalled_count = len(recall_result.evidence)
			except Exception:
				available_experiences = ExperienceReasoner.load_seeded_experiences()
				recalled_count = len(available_experiences)

		_emit_event(
			on_event, 2, "hindsight_recall_completed", "experience_memory", "completed",
			f"Recalled {recalled_count} experiences from {bank.memory_mode if experiences is None else 'CUSTOM'}.",
			(time.perf_counter() - t2) * 1000,
			recall_result.to_ui() if recall_result else {"count": len(available_experiences)},
		)

		# Step 3: Applicability Assessment
		t3 = time.perf_counter()
		try:
			reasoning = ExperienceReasoner.run(case, available_experiences)
		except Exception as error:
			err_res = PipelineResult(
				status="DECISION_ANALYSIS_FAILED",
				case_context=case,
				investigation=investigation,
				errors=[f"Experience reasoning or simulation failed: {error}"],
			)
			_emit_event(
				on_event, 3, "applicability_assessed", "experience_reasoner", "failed",
				f"Analysis failed: {error}", (time.perf_counter() - t3) * 1000, {},
			)
			return err_res

		_emit_event(
			on_event, 3, "applicability_assessed", "experience_reasoner", "completed",
			f"Applicability assessed across {len(reasoning.applicable_experiences)} experiences.",
			(time.perf_counter() - t3) * 1000,
			{
				"applicability_states": reasoning.applicability_states,
				"decision_evidence": reasoning.decision_evidence,
			},
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
			_emit_event(
				on_event, 4, "reflection_completed", "experience_reasoner", "failed",
				"No applicable historical experience found.", 0.1, {},
			)
			return PipelineResult(
				status="NO_APPLICABLE_EXPERIENCE",
				errors=["No historical experience is applicable to this case; no recommendation was issued."],
				**base,
			)

		# Step 4: Reflection
		t4 = time.perf_counter()
		reflection_text = reasoning.recommendation_reason
		if recall_result is not None:
			try:
				reflection_obj = bank.reflect(recall_result, initial_action="increase_timeout")
				if reflection_obj.hindsight_reflection:
					reflection_text = reflection_obj.hindsight_reflection
			except Exception:
				pass

		_emit_event(
			on_event, 4, "reflection_completed", "experience_reasoner", "completed",
			"Synthesized lesson and counterfactual reflection from historical outcomes.",
			(time.perf_counter() - t4) * 1000,
			{
				"reflection": reflection_text,
				"changed_by_hindsight": reasoning.changed_by_hindsight,
			},
		)

		# Step 5: Simulation of Candidates
		t5 = time.perf_counter()
		_emit_event(
			on_event, 5, "simulation_completed", "simulator", "completed",
			f"Evaluated {len(reasoning.candidate_action_results)} candidate mitigations deterministically.",
			(time.perf_counter() - t5) * 1000,
			{
				"candidates": [c.model_dump(mode="json") for c in reasoning.candidate_action_results],
				"recommended_action": reasoning.recommended_action,
			},
		)

		# Step 6: Resolution Formulation
		try:
			resolution = ResolutionAgent.run(case, reasoning)
		except Exception as error:
			return PipelineResult(
				status="RESOLUTION_FAILED",
				errors=[f"Resolution generation failed: {error}"],
				**base,
			)

		# Step 7: Guardian Validation
		t7 = time.perf_counter()
		try:
			guardian = Guardian.run(case, resolution, reasoning)
		except Exception as error:
			_emit_event(
				on_event, 6, "guardian_validated", "guardian", "failed",
				f"Guardian error: {error}", (time.perf_counter() - t7) * 1000, {},
			)
			return PipelineResult(
				status="GUARDIAN_REJECTED",
				resolution=resolution,
				errors=[f"Guardian validation failed: {error}"],
				**base,
			)
		if not guardian.approved:
			_emit_event(
				on_event, 6, "guardian_validated", "guardian", "failed",
				"Guardian rejected proposed resolution.",
				(time.perf_counter() - t7) * 1000, guardian.model_dump(mode="json"),
			)
			return PipelineResult(
				status="GUARDIAN_REJECTED",
				resolution=resolution,
				guardian=guardian,
				errors=guardian.issues,
				**base,
			)

		_emit_event(
			on_event, 6, "guardian_validated", "guardian", "completed",
			"Guardian approved the recommended action.",
			(time.perf_counter() - t7) * 1000, guardian.model_dump(mode="json"),
		)

		# Step 8: Recommendation Ready
		_emit_event(
			on_event, 7, "recommendation_ready", "resolution_agent", "completed",
			f"Recommended action: {resolution.recommended_action}.",
			0.1, resolution.model_dump(mode="json"),
		)

		# Step 9: Execution Started
		t8 = time.perf_counter()
		_emit_event(
			on_event, 8, "execution_started", "executor", "in_progress",
			f"Applying action '{resolution.recommended_action}' to workload.",
			0.1, {"action": resolution.recommended_action},
		)

		# Step 10: Outcome Recorded
		simulation = ExportSimulator.simulate(
			export_size_gb=case.export_size_gb,
			concurrency=case.concurrency,
			workload=case.workload,
			execution_mode=case.execution_mode,
			action=resolution.recommended_action,
		)
		_emit_event(
			on_event, 9, "outcome_recorded", "simulator", "completed",
			f"Outcome recorded: {simulation.outcome} ({simulation.resolution_time_minutes} min).",
			(time.perf_counter() - t8) * 1000, simulation.model_dump(mode="json"),
		)

		# Step 11: Retain Experience Loop
		t10 = time.perf_counter()
		retained_id: Optional[str] = None
		if retain_outcome:
			key_hash = hashlib.md5(
				f"{case.problem_type}_{case.export_size_gb}_{case.concurrency}_{case.workload}_{case.execution_mode}_{resolution.recommended_action}".encode()
			).hexdigest()[:8].upper()
			exp_id = f"EXP-RETAINED-{key_hash}"
			try:
				rec = bank.retain(
					{
						"experience_id": exp_id,
						"source": "ECHO_RUN",
						"problem_type": case.problem_type,
						"context": case.model_dump(mode="json"),
						"diagnosis": investigation.identified_problem or "Automated investigation",
						"action": resolution.recommended_action,
						"outcome": simulation.reason,
						"status": simulation.outcome,
						"lesson": simulation.lesson,
						"applicability": {
							"workload": [case.workload],
							"execution_mode": [case.execution_mode],
							"export_size_gb_min": max(10, case.export_size_gb * 0.8),
							"export_size_gb_max": case.export_size_gb * 1.2,
						},
					},
					status=simulation.outcome,
				)
				retained_id = rec.experience_id
			except Exception:
				pass

		_emit_event(
			on_event, 10, "experience_retained", "experience_memory", "completed",
			f"Retained experience {retained_id}." if retained_id else "Retention evaluated (read-only mode).",
			(time.perf_counter() - t10) * 1000,
			{"retained_experience_id": retained_id, "retained": bool(retained_id)},
		)

		total_duration = (time.perf_counter() - start_time) * 1000
		final_res = PipelineResult(
			status="COMPLETE",
			resolution=resolution,
			guardian=guardian,
			final_recommendation=resolution.recommended_action,
			simulation=simulation,
			retained_experience_id=retained_id,
			**base,
		)

		# Step 12: Pipeline Completed
		_emit_event(
			on_event, 11, "pipeline_completed", "pipeline", "completed",
			"Echo pipeline completed successfully.",
			total_duration, final_res.model_dump(mode="json"),
		)

		return final_res


run_pipeline = EchoPipeline.run

__all__ = ["PipelineResult", "EchoPipeline", "run_pipeline"]
