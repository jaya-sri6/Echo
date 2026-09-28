from __future__ import annotations

from typing import List, Union

from pydantic import BaseModel

from backend.app.domain.case_context import CaseContext


class InvestigationResult(BaseModel):
	identified_problem: str
	relevant_context: dict[str, Union[str, int, float]]
	missing_information: List[str]
	ready_for_reasoning: bool


class Investigator:
	"""Check the supplied case fields without inferring customer facts."""

	@staticmethod
	def run(case: CaseContext) -> InvestigationResult:
		context = case.model_dump()
		missing = [
			field
			for field, value in context.items()
			if value is None or (isinstance(value, str) and not value.strip())
		]
		return InvestigationResult(
			identified_problem=case.problem_type,
			relevant_context=context,
			missing_information=missing,
			ready_for_reasoning=not missing,
		)


__all__ = ["InvestigationResult", "Investigator"]
