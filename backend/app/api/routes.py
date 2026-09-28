from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.app.orchestration.pipeline import EchoPipeline, PipelineResult

router = APIRouter()


class CaseRequest(BaseModel):
	message: str = Field(..., min_length=1)


@router.get("/health")
def health() -> dict[str, str]:
	return {"status": "ok"}


@router.post("/api/case", response_model=PipelineResult)
def create_case(request: CaseRequest) -> Any:
	if not request.message.strip():
		raise HTTPException(
			status_code=422,
			detail={"code": "invalid_request", "message": "message must not be blank."},
		)

	try:
		result = EchoPipeline.run(request.message)
	except Exception:
		raise HTTPException(
			status_code=500,
			detail={"code": "pipeline_failure", "message": "The case pipeline could not complete."},
		) from None

	if result.status == "INVALID_INPUT":
		raise HTTPException(
			status_code=422,
			detail={"code": "invalid_request", "message": "The customer message is invalid."},
		)
	if result.status == "INCOMPLETE_CASE":
		raise HTTPException(
			status_code=422,
			detail={
				"code": "incomplete_case",
				"message": "Required case information is missing.",
				"errors": result.errors,
			},
		)
	if result.status == "NO_APPLICABLE_EXPERIENCE":
		raise HTTPException(
			status_code=422,
			detail={"code": "no_applicable_experience", "message": "No applicable historical experience was found."},
		)
	if result.status != "COMPLETE":
		raise HTTPException(
			status_code=500,
			detail={"code": "pipeline_failure", "message": "The case pipeline could not complete."},
		)
	return result


__all__ = ["router", "CaseRequest", "health", "create_case"]
