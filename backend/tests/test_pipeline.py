from backend.app.agents.guardian import GuardianResult
from backend.app.orchestration import pipeline
from backend.app.orchestration.pipeline import EchoPipeline


HERO_MESSAGE = "Customer's 600 GB nightly export keeps timing out under high concurrency."
COMPLETE_HERO_MESSAGE = HERO_MESSAGE[:-1] + " in sync mode."


def test_complete_hero_case_changes_recommendation_with_hindsight():
	result = EchoPipeline.run(COMPLETE_HERO_MESSAGE)

	assert result.status == "COMPLETE"
	assert result.case_context is not None
	assert result.case_context.export_size_gb == 600
	assert result.case_context.concurrency == "high"
	assert result.final_recommendation == "async_chunked_export"
	assert result.changed_by_hindsight is True
	assert any("EXP-007: increase_timeout -> FAILURE" in item for item in result.decision_evidence)
	assert any("EXP-002: async_chunked_export -> SUCCESS" in item for item in result.decision_evidence)
	assert result.guardian is not None and result.guardian.approved is True


def test_literal_hero_message_stops_for_missing_execution_mode():
	result = EchoPipeline.run(HERO_MESSAGE)

	assert result.status == "INCOMPLETE_CASE"
	assert result.case_context is None
	assert result.final_recommendation is None
	assert "execution_mode" in result.errors[0]


def test_boundary_case_does_not_transfer_large_export_experience():
	result = EchoPipeline.run(
		"Customer's 20 GB nightly export keeps timing out under low concurrency in sync mode."
	)

	assert result.status == "COMPLETE"
	assert result.experience_reasoning is not None
	assert result.experience_reasoning.applicability_states["EXP-007"] == "BOUNDARY"
	assert all("EXP-007" not in item for item in result.decision_evidence)
	assert result.guardian is not None and result.guardian.approved is True


def test_incomplete_message_returns_no_recommendation():
	result = EchoPipeline.run("The export is slow.")

	assert result.status == "INCOMPLETE_CASE"
	assert result.final_recommendation is None
	assert result.errors


def test_invalid_input_is_reported():
	for message in ("", "   ", None):
		result = EchoPipeline.run(message)  # type: ignore[arg-type]
		assert result.status == "INVALID_INPUT"
		assert result.final_recommendation is None


def test_pipeline_is_deterministic():
	first = EchoPipeline.run(COMPLETE_HERO_MESSAGE).model_dump()
	second = EchoPipeline.run(COMPLETE_HERO_MESSAGE).model_dump()

	assert first == second


def test_no_applicable_experience_returns_no_recommendation():
	result = EchoPipeline.run(COMPLETE_HERO_MESSAGE, experiences=[])

	assert result.status == "NO_APPLICABLE_EXPERIENCE"
	assert result.final_recommendation is None


def test_guardian_rejection_prevents_final_recommendation(monkeypatch):
	monkeypatch.setattr(
		pipeline.Guardian,
		"run",
		staticmethod(
			lambda case, resolution, reasoning: GuardianResult(
				approved=False,
				issues=["Test rejection."],
				reason="Rejected for test.",
			)
		),
	)

	result = EchoPipeline.run(COMPLETE_HERO_MESSAGE)

	assert result.status == "GUARDIAN_REJECTED"
	assert result.guardian is not None and result.guardian.approved is False
	assert result.final_recommendation is None
	assert result.errors == ["Test rejection."]


def test_investigation_and_decision_analysis_failures_are_reported(monkeypatch):
	monkeypatch.setattr(
		pipeline.Investigator,
		"run",
		staticmethod(lambda case: (_ for _ in ()).throw(RuntimeError("investigator error"))),
	)
	failed_investigation = EchoPipeline.run(COMPLETE_HERO_MESSAGE)
	assert failed_investigation.status == "INVESTIGATION_FAILED"

	monkeypatch.undo()
	monkeypatch.setattr(
		pipeline.ExperienceReasoner,
		"run",
		staticmethod(lambda case, experiences: (_ for _ in ()).throw(RuntimeError("analysis error"))),
	)
	failed_analysis = EchoPipeline.run(COMPLETE_HERO_MESSAGE)
	assert failed_analysis.status == "DECISION_ANALYSIS_FAILED"
