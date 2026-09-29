from __future__ import annotations

from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


def test_auth_login_and_me_lifecycle():
	# Login with seeded user
	login_res = client.post("/api/auth/login", json={"email": "ankit@echo.ai", "password": "echo123"})
	assert login_res.status_code == 200
	data = login_res.json()
	assert "access_token" in data
	token = data["access_token"]
	assert data["user"]["email"] == "ankit@echo.ai"

	# Get /api/auth/me
	me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
	assert me_res.status_code == 200
	assert me_res.json()["email"] == "ankit@echo.ai"

	# Invalid token rejected
	bad_res = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid.token.value"})
	assert bad_res.status_code == 401


def test_auth_signup():
	import uuid
	rand_email = f"test_{uuid.uuid4().hex[:6]}@echo.ai"
	signup_res = client.post("/api/auth/signup", json={"email": rand_email, "password": "securepassword", "name": "Test Engineer"})
	assert signup_res.status_code == 200
	data = signup_res.json()
	assert "access_token" in data
	assert data["user"]["email"] == rand_email


def test_experiences_and_graph_endpoints():
	exp_res = client.get("/api/experiences")
	assert exp_res.status_code == 200
	data = exp_res.json()
	assert data["total_count"] >= 15
	assert len(data["experiences"]) >= 15

	graph_res = client.get("/api/graph")
	assert graph_res.status_code == 200
	gdata = graph_res.json()
	assert "nodes" in gdata
	assert "links" in gdata
	assert len(gdata["nodes"]) >= 5


def test_chat_investigation_and_persistence():
	login_res = client.post("/api/auth/login", json={"email": "ankit@echo.ai", "password": "echo123"})
	token = login_res.json()["access_token"]

	chat_res = client.post(
		"/api/chat",
		json={"message": "Our 600 GB export is timing out under high concurrency batch sync."},
		headers={"Authorization": f"Bearer {token}"},
	)
	assert chat_res.status_code == 200
	cdata = chat_res.json()
	assert cdata["status"] == "COMPLETE"
	assert cdata["final_recommendation"] == "async_chunked_export"
	assert "ai_copilot" in cdata
	assert "investigation_id" in cdata

	# Verify investigations history reflects this
	hist_res = client.get("/api/investigations")
	assert hist_res.status_code == 200
	assert len(hist_res.json()) >= 1
