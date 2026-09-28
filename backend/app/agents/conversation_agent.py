from __future__ import annotations

import re
from typing import List, Literal, Optional

from pydantic import BaseModel

from backend.app.domain.case_context import CaseContext


class ConversationExtraction(BaseModel):
	case_context: Optional[CaseContext]
	original_message: str
	extraction_status: Literal["COMPLETE", "PARTIAL"]
	missing_fields: List[str]


class ConversationAgent:
	"""Extract only explicit MVP export-timeout facts from a message."""

	@staticmethod
	def run(message: str) -> ConversationExtraction:
		normalized = message.lower()
		values: dict[str, object] = {}

		size_match = re.search(r"\b(\d+(?:\.\d+)?)\s*gb\b", normalized)
		if size_match:
			values["export_size_gb"] = float(size_match.group(1))

		concurrency_match = re.search(r"\b(high|heavy|aggressive|medium|moderate|low)\s+concurrency\b", normalized)
		if concurrency_match:
			level = concurrency_match.group(1)
			values["concurrency"] = {"heavy": "high", "aggressive": "high", "moderate": "medium"}.get(level, level)

		if "nightly" in normalized and ("batch" in normalized or "export" in normalized):
			values["workload"] = "nightly_batch"
		elif "daily" in normalized and ("batch" in normalized or "export" in normalized):
			values["workload"] = "daily_batch"
		elif "interactive" in normalized:
			values["workload"] = "interactive"
		elif "batch" in normalized:
			values["workload"] = "batch"

		if re.search(r"\b(async|asynchronous)\b", normalized):
			values["execution_mode"] = "async"
		elif re.search(r"\b(sync|synchronous)\b", normalized):
			values["execution_mode"] = "sync"

		has_timeout = re.search(r"\b(?:timeout|timing\s+out)\b", normalized)
		if has_timeout and "export" in normalized:
			values["problem_type"] = "large_export_timeout"

		required_fields = [
			"export_size_gb",
			"concurrency",
			"workload",
			"execution_mode",
			"problem_type",
		]
		missing = [field for field in required_fields if field not in values]
		context = CaseContext(**values) if not missing else None
		return ConversationExtraction(
			case_context=context,
			original_message=message,
			extraction_status="COMPLETE" if not missing else "PARTIAL",
			missing_fields=missing,
		)


__all__ = ["ConversationExtraction", "ConversationAgent"]
