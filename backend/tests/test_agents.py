from backend.app.agents.conversation_agent import ConversationAgent
from backend.app.agents.experience_reasoner import ExperienceReasoner
from backend.app.agents.guardian import Guardian
from backend.app.agents.investigator import Investigator
from backend.app.agents.resolution_agent import ResolutionAgent
from backend.app.domain.case_context import CaseContext


def hero_case() -> CaseContext:
	return CaseContext(
		export_size_gb=600,
		concurrency="high",
		workload="nightly_batch",
		execution_mode="sync",
		problem_type="large_export_timeout",
	)


def test_conversation_agent_extracts_explicit_large_export_case():
	result = ConversationAgent.run(
		"Customer's 600 GB nightly export keeps timing out under high concurrency in sync mode."
	)

	assert result.extraction_status == "COMPLETE"
	assert result.missing_fields == []
	assert result.original_message.startswith("Customer's 600 GB")
	assert result.case_context is not None
	assert result.case_context.model_dump() == {
		"export_size_gb": 600.0,
		"concurrency": "high",
		"workload": "nightly_batch",
		"execution_mode": "sync",
		"problem_type": "large_export_timeout",
	}


def test_conversation_agent_does_not_invent_execution_mode():
	result = ConversationAgent.run(
		"Customer's 600 GB nightly export keeps timing out under high concurrency."
	)

	assert result.extraction_status == "PARTIAL"
	assert result.case_context is None
	assert result.missing_fields == ["execution_mode"]


def test_investigator_reports_supplied_case_context_and_readiness():
	result = Investigator.run(hero_case())

	assert result.identified_problem == "large_export_timeout"
	assert result.relevant_context["concurrency"] == "high"
	assert result.missing_information == []
	assert result.ready_for_reasoning is True


def test_investigator_flags_missing_context_value():
	case = hero_case().model_copy(update={"concurrency": ""})

	result = Investigator.run(case)

	assert result.missing_information == ["concurrency"]
	assert result.ready_for_reasoning is False


def test_experience_reasoner_finds_historical_evidence_and_changes_decision():
	result = ExperienceReasoner.run(
		hero_case(), ExperienceReasoner.load_seeded_experiences()
	)

	assert result.changed_by_hindsight is True
	assert result.recommended_action == "async_chunked_export"
	assert any("EXP-007: increase_timeout -> FAILURE (MATCH)" == item for item in result.decision_evidence)
	assert any("EXP-002: async_chunked_export -> SUCCESS" in item for item in result.decision_evidence)
	assert result.applicability_states["EXP-007"] == "MATCH"


def test_resolution_agent_uses_reasoner_recommendation_and_result():
	case = hero_case()
	reasoning = ExperienceReasoner.run(case, ExperienceReasoner.load_seeded_experiences())

	result = ResolutionAgent.run(case, reasoning)

	assert result.recommended_action == reasoning.recommended_action == "async_chunked_export"
	assert result.expected_outcome == "SUCCESS"
	assert result.escalation_required is False
	assert any(evidence.startswith("Simulator: async_chunked_export -> SUCCESS") for evidence in result.supporting_evidence)


def test_guardian_approves_supported_hero_recommendation():
	case = hero_case()
	experiences = ExperienceReasoner.load_seeded_experiences()
	reasoning = ExperienceReasoner.run(case, experiences)
	resolution = ResolutionAgent.run(case, reasoning)

	result = Guardian.run(case, resolution, reasoning)

	assert result.approved is True
	assert result.issues == []


def test_guardian_rejects_recommendation_not_supported_by_reasoning():
	case = hero_case()
	experiences = ExperienceReasoner.load_seeded_experiences()
	reasoning = ExperienceReasoner.run(case, experiences)
	resolution = ResolutionAgent.run(case, reasoning)
	resolution.recommended_action = "unsupported_action"

	result = Guardian.run(case, resolution, reasoning)

	assert result.approved is False
	assert any("not supported" in issue for issue in result.issues)


def test_reasoner_and_guardian_do_not_directly_transfer_large_case_memory_to_small_case():
	case = CaseContext(
		export_size_gb=20,
		concurrency="low",
		workload="interactive",
		execution_mode="sync",
		problem_type="large_export_timeout",
	)
	experiences = ExperienceReasoner.load_seeded_experiences()
	reasoning = ExperienceReasoner.run(case, experiences)
	resolution = ResolutionAgent.run(case, reasoning)
	guardian = Guardian.run(case, resolution, reasoning)
	states = reasoning.applicability_states

	assert states["EXP-007"] == "BOUNDARY"
	assert all(
		item.experience_id not in {"EXP-007", "EXP-002"}
		for item in reasoning.decision_analysis.applicable_experiences
		if item.applicability in {"MATCH", "PARTIAL_MATCH"}
	)
	assert guardian.approved is True
