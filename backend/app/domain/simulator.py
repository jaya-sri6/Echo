from __future__ import annotations

from typing import Literal, Union

from pydantic import BaseModel, Field

Outcome = Literal["SUCCESS", "FAILURE", "PARTIAL"]
ActionName = Literal[
    "increase_timeout",
    "reduce_concurrency",
    "async_chunked_export",
    "retry_with_backoff",
    "schedule_off_peak",
]


class SimulationResult(BaseModel):
    """Deterministic result of evaluating an export scenario."""

    outcome: Outcome = Field(..., description="Overall outcome of the export scenario.")
    resolution_time_minutes: int = Field(..., ge=0, description="Estimated time to resolution in minutes.")
    escalated: bool = Field(..., description="Whether the case should be escalated to a human or specialist workflow.")
    reason: str = Field(..., min_length=1, description="Deterministic explanation of why the result occurred.")
    lesson: str = Field(..., min_length=1, description="Plain-language learning takeaway for the team.")


class ExportSimulator:
    """Deterministic rules for Echo's SaaS export performance MVP.

    The rules intentionally avoid random behavior and external dependencies so other
    team members can reuse this module for deterministic support reasoning and demo
    scenarios.
    """

    SUPPORTED_ACTIONS: set[str] = {
        "increase_timeout",
        "reduce_concurrency",
        "async_chunked_export",
        "retry_with_backoff",
        "schedule_off_peak",
    }

    @staticmethod
    def normalize_concurrency(concurrency: Union[str, int]) -> str:
        """Normalize a concurrency description into a coarse level."""

        if isinstance(concurrency, int):
            if concurrency <= 4:
                return "low"
            if concurrency <= 12:
                return "medium"
            return "high"

        value = str(concurrency).strip().lower()
        if value in {"low", "light", "minimal"}:
            return "low"
        if value in {"medium", "moderate", "normal"}:
            return "medium"
        if value in {"high", "heavy", "aggressive", "very_high"}:
            return "high"
        return value

    @staticmethod
    def simulate(
        export_size_gb: float,
        concurrency: Union[str, int],
        workload: str,
        execution_mode: str,
        action: str,
    ) -> SimulationResult:
        """Evaluate a deterministic export scenario and return a structured result."""

        normalized_action = str(action).strip().lower()
        if normalized_action not in ExportSimulator.SUPPORTED_ACTIONS:
            raise ValueError(f"Unsupported action: {action}")

        normalized_workload = str(workload).strip().lower()
        normalized_mode = str(execution_mode).strip().lower()
        concurrency_level = ExportSimulator.normalize_concurrency(concurrency)
        size_gb = float(export_size_gb)

        if (
            size_gb >= 500
            and concurrency_level == "high"
            and normalized_workload == "nightly_batch"
            and normalized_mode == "sync"
            and normalized_action == "increase_timeout"
        ):
            return SimulationResult(
                outcome="FAILURE",
                resolution_time_minutes=180,
                escalated=True,
                reason=(
                    "Increasing the timeout does not resolve processing saturation caused by "
                    "high concurrency during a 600 GB nightly batch sync export."
                ),
                lesson=(
                    "For very large nightly batch exports with high concurrency, a longer timeout "
                    "does not fix the root saturation problem; the workload must be restructured or chunked."
                ),
            )

        if (
            size_gb >= 500
            and concurrency_level == "high"
            and normalized_workload == "nightly_batch"
            and normalized_action == "async_chunked_export"
        ):
            return SimulationResult(
                outcome="SUCCESS",
                resolution_time_minutes=110,
                escalated=False,
                reason=(
                    "Chunking the workload into async segments distributes the processing load and "
                    "prevents the sync saturation bottleneck from dominating the export path."
                ),
                lesson=(
                    "For very large nightly batch exports, async chunking is a reliable operating model "
                    "when sync high-concurrency jobs saturate the database or storage layer."
                ),
            )

        if (
            size_gb <= 20
            and concurrency_level == "low"
            and normalized_workload == "interactive"
            and normalized_mode == "sync"
        ):
            return SimulationResult(
                outcome="SUCCESS",
                resolution_time_minutes=8,
                escalated=False,
                reason=(
                    "Small interactive sync exports are not affected by the same saturation pattern as "
                    "large nightly batch jobs, so the large-export heuristic does not apply here."
                ),
                lesson=(
                    "Applicability must be scoped by workload size and concurrency; a large-batch strategy "
                    "does not automatically transfer to small interactive exports."
                ),
            )

        if normalized_action == "reduce_concurrency":
            if size_gb >= 250 and (concurrency_level == "high" or normalized_workload in {"nightly_batch", "daily_batch"}):
                return SimulationResult(
                    outcome="SUCCESS",
                    resolution_time_minutes=75,
                    escalated=False,
                    reason=(
                        "Reducing concurrency lowers the contention on the storage and database layers, "
                        "restoring a stable export cadence without requiring a hard failover."
                    ),
                    lesson="Concurrency throttling is effective when the bottleneck is shared-resource contention rather than an external infra limit.",
                )
            return SimulationResult(
                outcome="SUCCESS",
                resolution_time_minutes=20,
                escalated=False,
                reason="The workload is moderate enough that reducing concurrency restores reliable throughput without causing delays.",
                lesson="Guardrails for concurrency are useful even in modest workloads, but the return is strongest when contention becomes visible.",
            )

        if normalized_action == "retry_with_backoff":
            if size_gb >= 300 and concurrency_level in {"medium", "high"} and normalized_workload in {"nightly_batch", "daily_batch", "data_migration"}:
                return SimulationResult(
                    outcome="PARTIAL",
                    resolution_time_minutes=140,
                    escalated=False,
                    reason=(
                        "Transient failures recover with bounded retries, but the underlying load continues to "
                        "make the export fragile during peak contention."
                    ),
                    lesson="Retry logic is useful for brief instability, but it cannot overcome sustained backend saturation or structural throughput limits.",
                )
            return SimulationResult(
                outcome="SUCCESS",
                resolution_time_minutes=35,
                escalated=False,
                reason="Short retries allow transient queue or network noise to dissipate without damaging the export lifecycle.",
                lesson="Backoff is a good short-term mitigation for temporary interruption, but it should not be treated as a general large-export fix.",
            )

        if normalized_action == "schedule_off_peak":
            if normalized_workload in {"nightly_batch", "daily_batch", "scheduled_report"} and size_gb >= 180:
                return SimulationResult(
                    outcome="SUCCESS",
                    resolution_time_minutes=90,
                    escalated=False,
                    reason=(
                        "Moving the export to a low-load period reduces shared-resource contention and restores "
                        "predictable throughput for the job window."
                    ),
                    lesson="Off-peak scheduling is highly effective for large, recurring batch exports when operational timing is under customer control.",
                )
            return SimulationResult(
                outcome="SUCCESS",
                resolution_time_minutes=18,
                escalated=False,
                reason="The workload is small enough that the export can complete without requiring the scheduling intervention.",
                lesson="Scheduling changes are most valuable when the job overlaps crowded shared infrastructure windows.",
            )

        if normalized_action == "async_chunked_export":
            if size_gb >= 120 or normalized_workload in {"nightly_batch", "data_migration", "daily_batch"}:
                return SimulationResult(
                    outcome="SUCCESS",
                    resolution_time_minutes=95,
                    escalated=False,
                    reason=(
                        "Chunking the export into smaller async segments allows the system to process the job without "
                        "collapsing the sync request window."
                    ),
                    lesson="Async chunking is a strong default for large data exports that cannot be processed reliably in one synchronous pass.",
                )
            return SimulationResult(
                outcome="PARTIAL",
                resolution_time_minutes=55,
                escalated=False,
                reason="The workload is moderate, and async chunking avoids a direct failure but still leaves the export slower than the user expectation.",
                lesson="Chunking helps when size is large enough to justify parallelization, but the benefit should be balanced against user-visible latency.",
            )

        if normalized_action == "increase_timeout":
            if size_gb >= 300 and normalized_workload in {"nightly_batch", "daily_batch", "data_migration"}:
                return SimulationResult(
                    outcome="FAILURE",
                    resolution_time_minutes=200,
                    escalated=True,
                    reason=(
                        "The timeout extension simply waits longer while the export remains bottlenecked by "
                        "shared infrastructure or heavy concurrency."
                    ),
                    lesson="Time extension is only useful when the workload is slowing for a brief, recoverable reason; it is not a substitute for architecture changes.",
                )
            return SimulationResult(
                outcome="SUCCESS",
                resolution_time_minutes=30,
                escalated=False,
                reason="The workload is small enough or the request pattern is stable enough that a longer timeout safely resolves the delay.",
                lesson="Timeout increases are a useful last resort for moderate workloads, not a general fix for large batch saturation.",
            )

        return SimulationResult(
            outcome="SUCCESS",
            resolution_time_minutes=15,
            escalated=False,
            reason="The workload falls within the normal deterministic operating envelope for this simulator.",
            lesson="Default behavior remains stable when the system is operating within expected workload boundaries.",
        )


def simulate_export_outcome(
    export_size_gb: float,
    concurrency: Union[str, int],
    workload: str,
    execution_mode: str,
    action: str,
) -> SimulationResult:
    """Convenience wrapper for deterministic export simulation."""

    return ExportSimulator.simulate(
        export_size_gb=export_size_gb,
        concurrency=concurrency,
        workload=workload,
        execution_mode=execution_mode,
        action=action,
    )


__all__ = ["SimulationResult", "ExportSimulator", "simulate_export_outcome"]
