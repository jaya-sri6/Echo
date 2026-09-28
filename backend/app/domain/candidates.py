from __future__ import annotations

from pydantic import BaseModel, Field


class CandidateAction(BaseModel):
    """A single deterministic action suggestion derived from an experience."""

    action_type: str = Field(..., min_length=1, description="Category of the recommended action.")
    description: str = Field(..., min_length=1, description="Human-readable summary of the action.")
    rationale: str = Field(..., min_length=1, description="Reason the action is considered relevant to the case.")
