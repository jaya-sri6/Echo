from __future__ import annotations

from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from starlette.concurrency import run_in_threadpool

from backend.app.orchestration.pipeline import EchoPipeline

router = APIRouter()


async def _send_event(
	websocket: WebSocket,
	agent: str,
	status: str,
	message: str,
	data: dict[str, Any] | None = None,
) -> None:
	await websocket.send_json(
		{
			"agent": agent,
			"status": status,
			"message": message,
			"data": data or {},
		}
	)


@router.websocket("/ws/case")
async def case_websocket(websocket: WebSocket) -> None:
	await websocket.accept()
	try:
		try:
			payload = await websocket.receive_json()
		except (ValueError, TypeError):
			await _send_event(
				websocket,
				"completed",
				"failed",
				"Expected a JSON object containing a customer message.",
				{"code": "invalid_input"},
			)
			await websocket.close(code=1003)
			return

		if not isinstance(payload, dict) or not isinstance(payload.get("message"), str) or not payload["message"].strip():
			await _send_event(
				websocket,
				"completed",
				"failed",
				"A non-empty message string is required.",
				{"code": "invalid_input"},
			)
			await websocket.close(code=1008)
			return

		await _send_event(
			websocket,
			"conversation_agent",
			"started",
			"Customer message received; starting the Echo pipeline.",
		)
		try:
			result = await run_in_threadpool(EchoPipeline.run, payload["message"])
		except Exception:
			await _send_event(
				websocket,
				"completed",
				"failed",
				"The Echo pipeline could not complete.",
				{"code": "pipeline_failure"},
			)
			await websocket.close(code=1011)
			return

		completed = result.status == "COMPLETE"
		await _send_event(
			websocket,
			"completed",
			"completed" if completed else "failed",
			"Echo pipeline completed." if completed else "Echo pipeline finished without an approved recommendation.",
			result.model_dump(mode="json"),
		)
		await websocket.close(code=1000)
	except WebSocketDisconnect:
		return


__all__ = ["router", "case_websocket"]
