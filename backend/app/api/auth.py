from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, EmailStr, Field

from backend.app.persistence.db import (
	create_access_token,
	create_user,
	get_user_by_email,
	get_user_by_id,
	verify_access_token,
	verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


class SignupRequest(BaseModel):
	email: str = Field(..., min_length=3)
	password: str = Field(..., min_length=4)
	name: str = Field(..., min_length=1)


class LoginRequest(BaseModel):
	email: str = Field(..., min_length=3)
	password: str = Field(..., min_length=1)


class AuthResponse(BaseModel):
	access_token: str
	token_type: str = "bearer"
	user: dict[str, Any]


def get_current_user_optional(authorization: str | None = Header(None)) -> dict[str, Any] | None:
	if not authorization or not authorization.startswith("Bearer "):
		return None
	token = authorization.split("Bearer ", 1)[1].strip()
	payload = verify_access_token(token)
	if not payload or not payload.get("sub"):
		return None
	user = get_user_by_id(int(payload["sub"]))
	return user


def get_current_user(authorization: str | None = Header(None)) -> dict[str, Any]:
	user = get_current_user_optional(authorization)
	if not user:
		raise HTTPException(
			status_code=401,
			detail={"code": "unauthorized", "message": "Invalid or expired authentication token."},
		)
	return user


@router.post("/signup", response_model=AuthResponse)
def signup(req: SignupRequest) -> Any:
	existing = get_user_by_email(req.email)
	if existing:
		raise HTTPException(
			status_code=400,
			detail={"code": "user_exists", "message": "A user with this email address already exists."},
		)
	user = create_user(req.email, req.password, req.name)
	if not user:
		raise HTTPException(
			status_code=500,
			detail={"code": "signup_failed", "message": "Could not create user account."},
		)
	token = create_access_token(user["id"], user["email"], user["name"])
	return {
		"access_token": token,
		"token_type": "bearer",
		"user": {"id": user["id"], "email": user["email"], "name": user["name"]},
	}


@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest) -> Any:
	user = get_user_by_email(req.email)
	if not user or not verify_password(req.password, user["password_hash"]):
		raise HTTPException(
			status_code=401,
			detail={"code": "invalid_credentials", "message": "Invalid email address or password."},
		)
	token = create_access_token(user["id"], user["email"], user["name"])
	return {
		"access_token": token,
		"token_type": "bearer",
		"user": {"id": user["id"], "email": user["email"], "name": user["name"]},
	}


@router.get("/me")
def me(user: dict[str, Any] = Depends(get_current_user)) -> Any:
	return user
