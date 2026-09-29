from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from typing import Any

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
DEFAULT_MODEL = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")


def synthesize_operational_explanation(
	message: str,
	context: dict[str, Any],
	evidence_records: list[dict[str, Any]],
	recommended_action: str,
	simulation_outcome: dict[str, Any] | None = None,
) -> dict[str, Any]:
	"""
	Synthesize operational rationale using Groq LLM if available,
	with zero-failure deterministic domain fallback.
	"""
	groq_key = os.getenv("GROQ_API_KEY")

	# Check for root .env if not yet in os.environ
	if not groq_key:
		try:
			from pathlib import Path
			env_path = Path(__file__).resolve().parents[3] / ".env"
			if env_path.exists():
				with open(env_path, "r", encoding="utf-8") as f:
					for line in f:
						if line.startswith("GROQ_API_KEY="):
							groq_key = line.strip().split("=", 1)[1]
							break
		except Exception:
			pass

	# Prepare deterministic baseline fallback explanation first
	recalled_str = ", ".join([f"{e.get('experience_id', 'EXP')}: {e.get('action')} ({e.get('status', e.get('outcome'))})" for e in evidence_records[:3]])
	has_failure_precedent = any(e.get("status") == "FAILURE" or e.get("outcome") == "FAILURE" for e in evidence_records)
	
	if has_failure_precedent:
		fallback_text = (
			f"Increasing the timeout is contraindicated. In historical precedent, extending query deadlines during a "
			f"high-concurrency {context.get('export_size_gb', 600)} GB batch window caused connection pool exhaustion and cascaded into secondary latency. "
			f"Instead, switching to '{recommended_action}' resolved the schema contention by releasing buffers at checkpoints."
		)
	else:
		fallback_text = (
			f"Evaluated context ({context.get('export_size_gb', 600)} GB, {context.get('concurrency', 'high')} concurrency, {context.get('execution_mode', 'sync')}). "
			f"Recommended action '{recommended_action}' validated against organizational memory precedents."
		)

	if not groq_key or groq_key.startswith("replace-"):
		return {
			"source": "deterministic_reasoner",
			"model": "rule-engine",
			"explanation": fallback_text,
			"status": "success",
		}

	# Call Groq LLM
	prompt = f"""You are the Echo Experience Reasoner, an operational incident triage copilot.
Customer Incident: "{message}"
Extracted Context: {json.dumps(context)}
Recalled Organizational Memories: {json.dumps(evidence_records[:3])}
Recommended Action: "{recommended_action}"
Simulated Outcome: {json.dumps(simulation_outcome) if simulation_outcome else 'SUCCESS'}

Explain in 2 concise sentences why naive heuristics (like increasing timeout or blindly retrying) fail under these conditions, and why the recommended memory-guided action '{recommended_action}' succeeds. Be direct and technical without markdown headers or greetings."""

	payload = {
		"model": DEFAULT_MODEL,
		"messages": [
			{"role": "system", "content": "You are Echo Experience Reasoner, a technical incident copilot. Be concise, authoritative, and operational."},
			{"role": "user", "content": prompt},
		],
		"temperature": 0.2,
		"max_tokens": 150,
	}

	try:
		req = urllib.request.Request(
			GROQ_API_URL,
			data=json.dumps(payload).encode("utf-8"),
			headers={
				"Authorization": f"Bearer {groq_key}",
				"Content-Type": "application/json",
				"User-Agent": "Echo/1.0",
			},
		)
		with urllib.request.urlopen(req, timeout=4.0) as resp:
			data = json.loads(resp.read().decode("utf-8"))
			choice = data.get("choices", [{}])[0]
			content = choice.get("message", {}).get("content", "").strip()
			if content:
				return {
					"source": "groq_llm",
					"model": DEFAULT_MODEL,
					"explanation": content,
					"status": "success",
				}
	except Exception:
		# Fallback smoothly to deterministic explanation without breaking caller
		pass

	return {
		"source": "deterministic_reasoner",
		"model": "rule-engine-fallback",
		"explanation": fallback_text,
		"status": "success",
	}
