from __future__ import annotations

from typing import Union

from pydantic import BaseModel, Field


class CaseContext(BaseModel):
    """Context describing the customer workload and technical problem."""

    export_size_gb: float = Field(..., ge=0.0, description="Total export size in gigabytes.")
    concurrency: Union[int, str] = Field(..., description="Concurrency count or coarse level such as low, medium, or high.")
    workload: str = Field(..., min_length=1, description="Workload profile or job type.")
    execution_mode: str = Field(..., min_length=1, description="Execution mode such as batch or streaming.")
    problem_type: str = Field(..., min_length=1, description="The functional or operational problem category.")
