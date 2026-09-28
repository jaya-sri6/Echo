from fastapi.testclient import TestClient

from backend.app.api import routes
from backend.app.main import app

client = TestClient(app)
HERO_MESSAGE = "Customer's 600 GB nightly export keeps timing out under high concurrency."


def test_health_endpoint():
	response = client.get("/health")

	assert response.status_code == 200
	assert response.json() == {"status": "ok"}


def test_ready_endpoint():
	response = client.get("/ready")

	assert response.status_code == 200
	assert response.json() == {"status": "ready"}



def test_case_endpoint_returns_pipeline_result_for_complete_hero_case():
	response = client.post(
		"/api/case",
		json={"message": HERO_MESSAGE[:-1] + " in sync mode."},
	)

	assert response.status_code == 200
	result = response.json()
	assert result["status"] == "COMPLETE"
	assert result["final_recommendation"] == "async_chunked_export"
	assert result["changed_by_hindsight"] is True
	assert any("EXP-007: increase_timeout -> FAILURE" in item for item in result["decision_evidence"])
	# BUG-002: Assert experience was retained and exposed in response
	assert result["retained_experience_id"] is not None
	assert result["retained_experience_id"].startswith("EXP-RETAINED-")


def test_case_endpoint_reports_missing_execution_mode_for_literal_hero_message():
	response = client.post("/api/case", json={"message": HERO_MESSAGE})

	assert response.status_code == 422
	assert response.json()["detail"]["code"] == "incomplete_case"
	assert "execution_mode" in response.json()["detail"]["errors"][0]


def test_case_endpoint_validates_missing_and_invalid_message():
	missing = client.post("/api/case", json={})
	invalid = client.post("/api/case", json={"message": "   "})

	assert missing.status_code == 422
	assert missing.json()["detail"]
	assert invalid.status_code == 422
	assert invalid.json()["detail"]["code"] == "invalid_request"


def test_case_endpoint_hides_pipeline_exception_details(monkeypatch):
	def fail_pipeline(message: str):
		raise RuntimeError("private internal detail")

	monkeypatch.setattr(routes.EchoPipeline, "run", fail_pipeline)
	response = client.post(
		"/api/case",
		json={"message": HERO_MESSAGE[:-1] + " in sync mode."},
	)

	assert response.status_code == 500
	assert response.json()["detail"] == {
		"code": "pipeline_failure",
		"message": "The case pipeline could not complete.",
	}
	assert "private internal detail" not in response.text


def test_case_endpoint_retains_outcome_and_exposes_id():
	"""BUG-002 Test A & B: Verify successful REST request retains experience and returns ID."""
	response = client.post(
		"/api/case",
		json={"message": HERO_MESSAGE[:-1] + " in sync mode."},
	)
	assert response.status_code == 200
	payload = response.json()
	assert payload["status"] == "COMPLETE"
	assert payload["retained_experience_id"] is not None
	assert payload["retained_experience_id"].startswith("EXP-RETAINED-")


def test_case_endpoint_validation_edge_cases():
	"""BUG-002 Test C: Existing API validation behavior remains strictly unchanged."""
	# 1. Blank string
	res_blank = client.post("/api/case", json={"message": ""})
	assert res_blank.status_code == 422

	# 2. Whitespace only
	res_ws = client.post("/api/case", json={"message": "   "})
	assert res_ws.status_code == 422
	assert res_ws.json()["detail"]["code"] == "invalid_request"

	# 3. Missing message field
	res_missing = client.post("/api/case", json={})
	assert res_missing.status_code == 422

	# 4. Unparseable case context
	res_unparseable = client.post("/api/case", json={"message": "hello world"})
	assert res_unparseable.status_code == 422
	assert res_unparseable.json()["detail"]["code"] == "incomplete_case"