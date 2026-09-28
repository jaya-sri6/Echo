import pytest

from backend.app.agents.experience_reasoner import ExperienceReasoner
from backend.app.domain.case_context import CaseContext
from backend.app.domain.decision_analysis import evaluate_applicability
from backend.app.domain.experiences import Experience
from backend.app.domain.simulator import ExportSimulator
from backend.app.hindsight.memory import ExperienceMemory, ExperienceRecord
from backend.app.orchestration.pipeline import EchoPipeline


def test_four_applicability_states_explicitly():
	"""Verify MATCH, PARTIAL_MATCH, BOUNDARY, and NON_TRANSFERABLE states."""
	base_exp = Experience(
		experience_id="EXP-TEST-01",
		source="TEST",
		problem_type="export_timeout",
		context=CaseContext(
			export_size_gb=600,
			concurrency="high",
			workload="nightly_batch",
			execution_mode="sync",
			problem_type="export_timeout",
		),
		diagnosis="Resource exhaustion",
		action="async_chunked_export",
		outcome="Success",
		status="SUCCESS",
		lesson="Chunking resolves saturation",
		applicability={
			"workload": ["nightly_batch"],
			"execution_mode": ["sync"],
			"export_size_gb_min": 500,
			"export_size_gb_max": 1000,
		},
	)

	# 1. MATCH: Identical context within bounds
	match_case = CaseContext(
		export_size_gb=600,
		concurrency="high",
		workload="nightly_batch",
		execution_mode="sync",
		problem_type="export_timeout",
	)
	res_match = evaluate_applicability(match_case, base_exp)
	assert res_match.applicability == "MATCH"
	assert res_match.score == 1.0

	# 2. PARTIAL_MATCH: Concurrency differs but size is within bounds
	partial_case = CaseContext(
		export_size_gb=600,
		concurrency="low",
		workload="nightly_batch",
		execution_mode="sync",
		problem_type="export_timeout",
	)
	res_partial = evaluate_applicability(partial_case, base_exp)
	assert res_partial.applicability == "PARTIAL_MATCH"
	assert 0.0 < res_partial.score < 1.0
	assert "concurrency" in res_partial.mismatched_conditions

	# 3. BOUNDARY: Export size is below minimum bound (20 GB < 500 GB)
	boundary_case = CaseContext(
		export_size_gb=20,
		concurrency="high",
		workload="nightly_batch",
		execution_mode="sync",
		problem_type="export_timeout",
	)
	res_boundary = evaluate_applicability(boundary_case, base_exp)
	assert res_boundary.applicability == "BOUNDARY"

	# 4. NON_TRANSFERABLE: Problem type differs completely
	diff_problem_case = CaseContext(
		export_size_gb=600,
		concurrency="high",
		workload="nightly_batch",
		execution_mode="sync",
		problem_type="authentication_error",
	)
	res_non_transferable = evaluate_applicability(diff_problem_case, base_exp)
	assert res_non_transferable.applicability == "NON_TRANSFERABLE"


def test_real_outcome_retain_and_recall_learning_loop():
	"""Prove: Case A failure -> Retain -> Case B (same case) -> Recall Case A -> Recommendation changes."""
	# Initialize fresh isolated memory bank with no prior experience
	isolated_bank = ExperienceMemory(connect_hindsight=False, seed=False)
	assert len(isolated_bank.experiences) == 0

	case_message = "Customer's 400 GB daily export keeps timing out under high concurrency in sync mode."
	
	# Initial attempt without organizational memory:
	# Baseline instinct would be "increase_timeout", but there is no memory in isolated bank
	res_initial = EchoPipeline.run(
		case_message,
		memory_bank=isolated_bank,
	)
	# Because memory is completely empty, pipeline halts with NO_APPLICABLE_EXPERIENCE
	assert res_initial.status == "NO_APPLICABLE_EXPERIENCE"

	# Simulate Case A executing "increase_timeout" in this environment
	sim_failure = ExportSimulator.simulate(
		export_size_gb=400,
		concurrency="high",
		workload="daily_batch",
		execution_mode="sync",
		action="increase_timeout",
	)
	assert sim_failure.outcome == "FAILURE"
	assert sim_failure.escalated is True

	# Retain Case A's failure into the memory bank
	isolated_bank.retain(
		ExperienceRecord(
			experience_id="EXP-LEARNED-001",
			source="INCIDENT-400GB",
			problem_type="export_timeout",
			context=CaseContext(
				export_size_gb=400,
				concurrency="high",
				workload="daily_batch",
				execution_mode="sync",
				problem_type="export_timeout",
			),
			diagnosis="Increasing timeout fails under 400 GB high concurrency daily batch.",
			action="increase_timeout",
			outcome=sim_failure.reason,
			status="FAILURE",
			lesson=sim_failure.lesson,
			applicability={
				"workload": ["daily_batch"],
				"execution_mode": ["sync"],
				"export_size_gb_min": 300,
				"export_size_gb_max": 500,
			},
		),
		status="FAILURE",
	)

	# Also retain an alternative experience showing reduce_concurrency succeeds
	sim_success = ExportSimulator.simulate(
		export_size_gb=400,
		concurrency="high",
		workload="daily_batch",
		execution_mode="sync",
		action="reduce_concurrency",
	)
	assert sim_success.outcome == "SUCCESS"

	isolated_bank.retain(
		ExperienceRecord(
			experience_id="EXP-LEARNED-002",
			source="PLAYBOOK-CONT-MITIGATION",
			problem_type="export_timeout",
			context=CaseContext(
				export_size_gb=400,
				concurrency="high",
				workload="daily_batch",
				execution_mode="sync",
				problem_type="export_timeout",
			),
			diagnosis="Reducing concurrency prevents buffer exhaustion.",
			action="reduce_concurrency",
			outcome=sim_success.reason,
			status="SUCCESS",
			lesson=sim_success.lesson,
			applicability={
				"workload": ["daily_batch"],
				"execution_mode": ["sync"],
				"export_size_gb_min": 300,
				"export_size_gb_max": 500,
			},
		),
		status="SUCCESS",
	)

	# Case B arrives with identical operational conditions!
	res_learned = EchoPipeline.run(
		case_message,
		memory_bank=isolated_bank,
	)

	# The pipeline now completes successfully because it recalls the retained experiences!
	assert res_learned.status == "COMPLETE"
	assert res_learned.final_recommendation == "reduce_concurrency"
	assert res_learned.changed_by_hindsight is True
	# The decision evidence explicitly cites EXP-LEARNED-001 (FAILURE) and EXP-LEARNED-002 (SUCCESS)
	assert any("EXP-LEARNED-001: increase_timeout -> FAILURE" in ev for ev in res_learned.decision_evidence)
	assert any("EXP-LEARNED-002: reduce_concurrency -> SUCCESS" in ev for ev in res_learned.decision_evidence)
	assert res_learned.guardian is not None and res_learned.guardian.approved is True
