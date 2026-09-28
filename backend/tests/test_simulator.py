from backend.app.domain.simulator import ExportSimulator


SUPPORTED_ACTIONS = [
    "increase_timeout",
    "reduce_concurrency",
    "async_chunked_export",
    "retry_with_backoff",
    "schedule_off_peak",
]


def test_supported_actions_are_accepted():
    for action in SUPPORTED_ACTIONS:
        result = ExportSimulator.simulate(
            export_size_gb=300,
            concurrency="medium",
            workload="daily_batch",
            execution_mode="sync",
            action=action,
        )
        assert result.outcome in {"SUCCESS", "FAILURE", "PARTIAL"}
        assert result.reason
        assert result.lesson


def test_critical_failure_scenario():
    result = ExportSimulator.simulate(
        export_size_gb=600,
        concurrency="high",
        workload="nightly_batch",
        execution_mode="sync",
        action="increase_timeout",
    )

    assert result.outcome == "FAILURE"
    assert result.escalated is True
    assert "timeout" in result.reason.lower()
    assert "high concurrency" in result.reason.lower()
    assert result.lesson


def test_critical_success_scenario():
    result = ExportSimulator.simulate(
        export_size_gb=600,
        concurrency="high",
        workload="nightly_batch",
        execution_mode="sync",
        action="async_chunked_export",
    )

    assert result.outcome == "SUCCESS"
    assert result.escalated is False
    assert result.reason
    assert result.lesson


def test_boundary_small_interactive_does_not_inherit_large_export_behavior():
    result = ExportSimulator.simulate(
        export_size_gb=20,
        concurrency="low",
        workload="interactive",
        execution_mode="sync",
        action="async_chunked_export",
    )

    assert result.outcome == "SUCCESS"
    assert result.escalated is False
    assert "large-export" in result.reason.lower() or "large export" in result.reason.lower()


def test_simulator_is_deterministic():
    first = ExportSimulator.simulate(
        export_size_gb=600,
        concurrency="high",
        workload="nightly_batch",
        execution_mode="sync",
        action="increase_timeout",
    )
    second = ExportSimulator.simulate(
        export_size_gb=600,
        concurrency="high",
        workload="nightly_batch",
        execution_mode="sync",
        action="increase_timeout",
    )
    third = ExportSimulator.simulate(
        export_size_gb=600,
        concurrency="high",
        workload="nightly_batch",
        execution_mode="sync",
        action="increase_timeout",
    )

    assert first.model_dump() == second.model_dump() == third.model_dump()


def test_structured_output_contains_required_fields():
    result = ExportSimulator.simulate(
        export_size_gb=120,
        concurrency="medium",
        workload="scheduled_report",
        execution_mode="async",
        action="schedule_off_peak",
    )

    expected_fields = {
        "outcome",
        "resolution_time_minutes",
        "escalated",
        "reason",
        "lesson",
    }
    assert set(result.model_dump().keys()) == expected_fields
    assert result.outcome in {"SUCCESS", "FAILURE", "PARTIAL"}
    assert isinstance(result.resolution_time_minutes, int)
    assert isinstance(result.escalated, bool)
    assert result.reason
    assert result.lesson
