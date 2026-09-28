from __future__ import annotations

from typing import Any, Dict, Literal, Optional

from pydantic import BaseModel, Field, model_validator

from backend.app.domain.case_context import CaseContext


class Experience(BaseModel):
    """A stored support experience that may be relevant to a new case."""

    experience_id: str = Field(..., min_length=1, description="Unique stable identifier for the experience.")
    source: str = Field(..., min_length=1, description="Origin of the experience, such as internal case or playbook.")
    problem_type: str = Field(..., min_length=1, description="Problem category this experience addresses.")
    context: CaseContext = Field(..., description="Context in which the problem occurred.")
    diagnosis: str = Field(..., min_length=1, description="Root cause or diagnosis.")
    action: str = Field(..., min_length=1, description="Recommended action taken to resolve or mitigate the issue.")
    outcome: str = Field(..., min_length=1, description="Result or observed effect of the action.")
    status: Optional[Literal["SUCCESS", "FAILURE", "PARTIAL", "BOUNDARY", "NON-TRANSFERABLE"]] = Field(
        default=None, description="Structured historical outcome status when available."
    )
    lesson: str = Field(..., min_length=1, description="Learning captured for future reuse.")
    applicability: Dict[str, Any] = Field(default_factory=dict, description="Structured metadata describing when this experience applies.")

    @model_validator(mode="before")
    @classmethod
    def fill_context_problem_type(cls, values: Any) -> Any:
        """Allow seeded records to inherit their top-level problem type."""

        if isinstance(values, dict) and isinstance(values.get("context"), dict):
            values = values.copy()
            context = values["context"].copy()
            context.setdefault("problem_type", values.get("problem_type"))
            values["context"] = context
        return values
