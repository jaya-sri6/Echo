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
		events = []
		while True:
			try:
				events.append(websocket.receive_json())
			except WebSocketDisconnect as disconnect:
				assert disconnect.code == 1000
				break

		assert len(events) >= 11
		first = events[0]
		assert first["event"] == "case_started"
		assert first["agent"] == "conversation_agent"
		assert first["status"] == "completed"
		assert "timestamp" in first
		assert "duration_ms" in first
		assert first["step_index"] == 0

		event_names = [e["event"] for e in events]
		assert "case_started" in event_names
		assert "investigation_completed" in event_names
		assert "hindsight_recall_completed" in event_names
		assert "applicability_assessed" in event_names
		assert "reflection_completed" in event_names
		assert "simulation_completed" in event_names
		assert "guardian_validated" in event_names
		assert "recommendation_ready" in event_names
		assert "execution_started" in event_names
		assert "outcome_recorded" in event_names
		assert "experience_retained" in event_names
		assert "pipeline_completed" in event_names

		completed = events[-1]
		assert completed["event"] == "pipeline_completed"
		assert completed["status"] == "completed"
		assert completed["data"]["final_recommendation"] == "async_chunked_export"
		assert completed["data"]["changed_by_hindsight"] is True
		assert completed["data"]["decision_evidence"]


def test_websocket_reports_incomplete_pipeline_result_without_recommending():
	with client.websocket_connect("/ws/case") as websocket:
		websocket.send_json(
			{"message": "Customer's 600 GB nightly export keeps timing out under high concurrency."}
		)
		events = []
		while True:
			try:
				events.append(websocket.receive_json())
			except WebSocketDisconnect:
				break

	assert len(events) >= 1
	last = events[-1]
	assert last["status"] == "failed"
	assert last["data"]["missing_fields"] == ["execution_mode"]


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
	def fail_pipeline(*args, **kwargs):
		raise RuntimeError("private internal detail")

	monkeypatch.setattr(websocket_module.EchoPipeline, "run", fail_pipeline)
	with client.websocket_connect("/ws/case") as websocket:
		websocket.send_json({"message": HERO_MESSAGE})
		event = websocket.receive_json()

		assert event["status"] == "failed"
		assert event["data"] == {"code": "pipeline_failure"}
		assert "private internal detail" not in str(event)
		with pytest.raises(WebSocketDisconnect) as disconnect:
			websocket.receive_json()
		assert disconnect.value.code == 1011