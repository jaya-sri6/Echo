from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import sqlite3
import time
from pathlib import Path
from typing import Any

# Database path
repo_root = Path(__file__).resolve().parents[3]
data_dir = repo_root / "data"
data_dir.mkdir(parents=True, exist_ok=True)
DB_PATH = data_dir / "echo.db"

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "echo-super-secret-jwt-key-2026-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_SECONDS = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "1440")) * 60


def get_db_connection() -> sqlite3.Connection:
	conn = sqlite3.connect(str(DB_PATH))
	conn.row_factory = sqlite3.Row
	return conn


def init_db() -> None:
	with get_db_connection() as conn:
		cursor = conn.cursor()
		# Users table
		cursor.execute("""
			CREATE TABLE IF NOT EXISTS users (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				email TEXT UNIQUE NOT NULL,
				password_hash TEXT NOT NULL,
				name TEXT NOT NULL,
				created_at TEXT NOT NULL
			)
		""")

		# Conversations table
		cursor.execute("""
			CREATE TABLE IF NOT EXISTS conversations (
				id TEXT PRIMARY KEY,
				user_id INTEGER,
				title TEXT NOT NULL,
				created_at TEXT NOT NULL,
				updated_at TEXT NOT NULL,
				FOREIGN KEY (user_id) REFERENCES users(id)
			)
		""")

		# Messages table
		cursor.execute("""
			CREATE TABLE IF NOT EXISTS messages (
				id TEXT PRIMARY KEY,
				conversation_id TEXT NOT NULL,
				sender TEXT NOT NULL,
				text TEXT NOT NULL,
				meta_json TEXT,
				created_at TEXT NOT NULL,
				FOREIGN KEY (conversation_id) REFERENCES conversations(id)
			)
		""")

		# Investigations table
		cursor.execute("""
			CREATE TABLE IF NOT EXISTS investigations (
				id TEXT PRIMARY KEY,
				user_id INTEGER,
				case_key TEXT,
				message TEXT NOT NULL,
				status TEXT NOT NULL,
				final_recommendation TEXT,
				simulation_json TEXT,
				retained_experience_id TEXT,
				created_at TEXT NOT NULL,
				FOREIGN KEY (user_id) REFERENCES users(id)
			)
		""")

		# Retained experiences table (growth from 15 seeds)
		cursor.execute("""
			CREATE TABLE IF NOT EXISTS retained_experiences (
				experience_id TEXT PRIMARY KEY,
				title TEXT NOT NULL,
				action TEXT NOT NULL,
				outcome TEXT NOT NULL,
				context_json TEXT NOT NULL,
				lesson TEXT NOT NULL,
				created_at TEXT NOT NULL
			)
		""")
		conn.commit()

	# Seed default user if not exists
	seed_default_user()


def hash_password(password: str) -> str:
	salt = "echo_salt_2026"
	return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000).hex()


def verify_password(password: str, hashed: str) -> bool:
	return hmac.compare_digest(hash_password(password), hashed)


def seed_default_user() -> None:
	with get_db_connection() as conn:
		cursor = conn.cursor()
		cursor.execute("SELECT id FROM users WHERE email = ?", ("ankit@echo.ai",))
		if not cursor.fetchone():
			cursor.execute(
				"INSERT INTO users (email, password_hash, name, created_at) VALUES (?, ?, ?, ?)",
				("ankit@echo.ai", hash_password("echo123"), "Ankit (Support Lead)", time.strftime("%Y-%m-%dT%H:%M:%SZ")),
			)
			conn.commit()


# --- JWT Implementation (Standard RFC 7519 HMAC-SHA256) ---

def _b64_encode(data: bytes) -> str:
	return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _b64_decode(data: str) -> bytes:
	padding = "=" * (-len(data) % 4)
	return base64.urlsafe_b64decode(data + padding)


def create_access_token(user_id: int, email: str, name: str) -> str:
	now = int(time.time())
	payload = {
		"sub": str(user_id),
		"email": email,
		"name": name,
		"iat": now,
		"exp": now + JWT_EXPIRE_SECONDS,
	}
	header = {"alg": JWT_ALGORITHM, "typ": "JWT"}
	header_b64 = _b64_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
	payload_b64 = _b64_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
	signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
	signature = hmac.new(JWT_SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256).digest()
	return f"{header_b64}.{payload_b64}.{_b64_encode(signature)}"


def verify_access_token(token: str) -> dict[str, Any] | None:
	try:
		parts = token.split(".")
		if len(parts) != 3:
			return None
		header_b64, payload_b64, sig_b64 = parts
		signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
		expected_sig = hmac.new(JWT_SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256).digest()
		if not hmac.compare_digest(_b64_encode(expected_sig), sig_b64):
			return None
		payload = json.loads(_b64_decode(payload_b64).decode("utf-8"))
		if payload.get("exp") and payload["exp"] < time.time():
			return None
		return payload
	except Exception:
		return None


# --- User Store Operations ---

def create_user(email: str, password: str, name: str) -> dict[str, Any] | None:
	email = email.strip().lower()
	hashed = hash_password(password)
	now = time.strftime("%Y-%m-%dT%H:%M:%SZ")
	with get_db_connection() as conn:
		cursor = conn.cursor()
		try:
			cursor.execute(
				"INSERT INTO users (email, password_hash, name, created_at) VALUES (?, ?, ?, ?)",
				(email, hashed, name.strip(), now),
			)
			conn.commit()
			user_id = cursor.lastrowid
			return {"id": user_id, "email": email, "name": name.strip(), "created_at": now}
		except sqlite3.IntegrityError:
			return None


def get_user_by_email(email: str) -> dict[str, Any] | None:
	with get_db_connection() as conn:
		cursor = conn.cursor()
		cursor.execute("SELECT id, email, password_hash, name, created_at FROM users WHERE email = ?", (email.strip().lower(),))
		row = cursor.fetchone()
		if row:
			return dict(row)
		return None


def get_user_by_id(user_id: int) -> dict[str, Any] | None:
	with get_db_connection() as conn:
		cursor = conn.cursor()
		cursor.execute("SELECT id, email, name, created_at FROM users WHERE id = ?", (user_id,))
		row = cursor.fetchone()
		if row:
			return dict(row)
		return None


# --- Investigations & Retained Experiences Persistence ---

def save_investigation(
	investigation_id: str,
	user_id: int | None,
	case_key: str | None,
	message: str,
	status: str,
	final_recommendation: str | None,
	simulation_dict: dict[str, Any] | None,
	retained_experience_id: str | None,
) -> None:
	now = time.strftime("%Y-%m-%dT%H:%M:%SZ")
	with get_db_connection() as conn:
		cursor = conn.cursor()
		cursor.execute(
			"""
			INSERT OR REPLACE INTO investigations
			(id, user_id, case_key, message, status, final_recommendation, simulation_json, retained_experience_id, created_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
			""",
			(
				investigation_id,
				user_id,
				case_key,
				message,
				status,
				final_recommendation,
				json.dumps(simulation_dict) if simulation_dict else None,
				retained_experience_id,
				now,
			),
		)
		conn.commit()


def save_retained_experience(
	experience_id: str,
	title: str,
	action: str,
	outcome: str,
	context: dict[str, Any],
	lesson: str,
) -> None:
	now = time.strftime("%Y-%m-%dT%H:%M:%SZ")
	with get_db_connection() as conn:
		cursor = conn.cursor()
		cursor.execute(
			"""
			INSERT OR REPLACE INTO retained_experiences
			(experience_id, title, action, outcome, context_json, lesson, created_at)
			VALUES (?, ?, ?, ?, ?, ?, ?)
			""",
			(experience_id, title, action, outcome, json.dumps(context), lesson, now),
		)
		conn.commit()


def get_all_persisted_experiences() -> list[dict[str, Any]]:
	with get_db_connection() as conn:
		cursor = conn.cursor()
		cursor.execute("SELECT experience_id, title, action, outcome, context_json, lesson, created_at FROM retained_experiences ORDER BY created_at ASC")
		results = []
		for r in cursor.fetchall():
			results.append({
				"id": r["experience_id"],
				"experience_id": r["experience_id"],
				"title": r["title"],
				"action": r["action"],
				"outcome": r["outcome"],
				"status": r["outcome"],
				"context": json.loads(r["context_json"]),
				"lesson": r["lesson"],
				"created_at": r["created_at"],
				"is_retained": True,
			})
		return results


def get_investigations_history(limit: int = 20) -> list[dict[str, Any]]:
	with get_db_connection() as conn:
		cursor = conn.cursor()
		cursor.execute("SELECT id, user_id, case_key, message, status, final_recommendation, simulation_json, retained_experience_id, created_at FROM investigations ORDER BY created_at DESC LIMIT ?", (limit,))
		results = []
		for r in cursor.fetchall():
			results.append({
				"id": r["id"],
				"user_id": r["user_id"],
				"case_key": r["case_key"],
				"message": r["message"],
				"status": r["status"],
				"final_recommendation": r["final_recommendation"],
				"simulation": json.loads(r["simulation_json"]) if r["simulation_json"] else None,
				"retained_experience_id": r["retained_experience_id"],
				"created_at": r["created_at"],
			})
		return results


# Initialize database automatically on module import
init_db()
