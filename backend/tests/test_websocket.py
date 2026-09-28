import pytest
from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

from backend.app.api import websocket as websocket_module
from backend.app.main import app

client = TestClient(app)
HERO_MESSAGE = "Customer's 600 GB nightly export keeps timing out under high concurrency in sync mode."


def test_websocket_emits_start_and_final_recommendation_then_closes_cleanly():
	with client.websocket_connect("/ws/case") as websocket:
		websocket.send_json({"message": HERO_MESSAGE})
		started = websocket.receive_json()
		completed = websocket.receive_json()

		assert started == {
			"agent": "conversation_agent",
			"status": "started",
			"message": "Customer message received; starting the Echo pipeline.",
			"data": {},
		}
		assert completed["agent"] == "completed"
		assert completed["status"] == "completed"
		assert completed["data"]["final_recommendation"] == "async_chunked_export"
		assert completed["data"]["changed_by_hindsight"] is True
		assert completed["data"]["decision_evidence"]
		with pytest.raises(WebSocketDisconnect) as disconnect:
			websocket.receive_json()
		assert disconnect.value.code == 1000


def test_websocket_reports_incomplete_pipeline_result_without_recommending():
	with client.websocket_connect("/ws/case") as websocket:
		websocket.send_json(
			{"message": "Customer's 600 GB nightly export keeps timing out under high concurrency."}
		)
		assert websocket.receive_json()["agent"] == "conversation_agent"
		completed = websocket.receive_json()

	assert completed["status"] == "failed"
	assert completed["data"]["status"] == "INCOMPLETE_CASE"
	assert completed["data"]["final_recommendation"] is None


def test_websocket_rejects_invalid_input_and_closes_with_policy_code():
	with client.websocket_connect("/ws/case") as websocket:
		websocket.send_json({"message": "   "})
		event = websocket.receive_json()

		assert event["agent"] == "completed"
		assert event["status"] == "failed"
		assert event["data"]["code"] == "invalid_input"
		with pytest.raises(WebSocketDisconnect) as disconnect:
			websocket.receive_json()
		assert disconnect.value.code == 1008


def test_websocket_sanitizes_pipeline_exception_and_closes_with_error_code(monkeypatch):
	def fail_pipeline(message: str):
		raise RuntimeError("private internal detail")

	monkeypatch.setattr(websocket_module.EchoPipeline, "run", fail_pipeline)
	with client.websocket_connect("/ws/case") as websocket:
		websocket.send_json({"message": HERO_MESSAGE})
		assert websocket.receive_json()["agent"] == "conversation_agent"
		event = websocket.receive_json()

		assert event["status"] == "failed"
		assert event["data"] == {"code": "pipeline_failure"}
		assert "private internal detail" not in str(event)
		with pytest.raises(WebSocketDisconnect) as disconnect:
			websocket.receive_json()
		assert disconnect.value.code == 1011