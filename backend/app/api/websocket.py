from __future__ import annotations

import asyncio
import os
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
	event: str | None = None,
	step_index: int | None = None,
	duration_ms: float = 0.0,
) -> None:
	payload = {
		"agent": agent,
		"status": status,
		"message": message,
		"data": data or {},
	}
	if event is not None:
		payload["event"] = event
	if step_index is not None:
		payload["step_index"] = step_index
	if duration_ms:
		payload["duration_ms"] = duration_ms
	await websocket.send_json(payload)


@router.websocket("/ws/case")
async def case_websocket(websocket: WebSocket) -> None:
	await websocket.accept()
	try:
		try:
			payload = await websocket.receive_json()
		except (ValueError, TypeError):
			await _send_event(
				websocket,
				agent="completed",
				status="failed",
				message="Expected a JSON object containing a customer message.",
				data={"code": "invalid_input"},
				event="pipeline_completed",
				step_index=0,
			)
			await websocket.close(code=1003)
			return

		if not isinstance(payload, dict) or not isinstance(payload.get("message"), str) or not payload["message"].strip():
			await _send_event(
				websocket,
				agent="completed",
				status="failed",
				message="A non-empty message string is required.",
				data={"code": "invalid_input"},
				event="pipeline_completed",
				step_index=0,
			)
			await websocket.close(code=1008)
			return

		loop = asyncio.get_running_loop()
		queue: asyncio.Queue[dict[str, Any] | None] = asyncio.Queue()

		def on_pipeline_event(evt: dict[str, Any]) -> None:
			loop.call_soon_threadsafe(queue.put_nowait, evt)

		async def run_worker() -> None:
			try:
				await run_in_threadpool(
					EchoPipeline.run,
					payload["message"],
					retain_outcome=True,
					on_event=on_pipeline_event,
				)
			except Exception:
				loop.call_soon_threadsafe(
					queue.put_nowait,
					{
						"step_index": 0,
						"event": "pipeline_completed",
						"agent": "completed",
						"status": "failed",
						"message": "The Echo pipeline could not complete.",
						"duration_ms": 0.0,
						"data": {"code": "pipeline_failure"},
					},
				)
			finally:
				loop.call_soon_threadsafe(queue.put_nowait, None)

		worker_task = asyncio.create_task(run_worker())

		has_pipeline_failure = False
		while True:
			evt = await queue.get()
			if evt is None:
				break
			if evt.get("data", {}).get("code") == "pipeline_failure":
				has_pipeline_failure = True
			await websocket.send_json(evt)
			pace = float(os.getenv("ECHO_WS_PACE", "0.38"))
			await asyncio.sleep(pace)

		await worker_task

		if has_pipeline_failure:
			await websocket.close(code=1011)
		else:
			await websocket.close(code=1000)

	except WebSocketDisconnect:
		return


__all__ = ["router", "case_websocket"]
