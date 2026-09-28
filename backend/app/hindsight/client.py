from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

PROJECT_ENV_FILE = Path(__file__).resolve().parents[3] / ".env"


class HindsightError(RuntimeError):
    """Raised when the configured Hindsight API cannot complete an operation."""

    def __init__(self, message: str, *, status_code: int | None = None) -> None:
        super().__init__(message)
        self.status_code = status_code


class HindsightClient:
    """Small synchronous client for Hindsight's documented REST API."""

    def __init__(
        self,
        base_url: str | None = None,
        api_key: str | None = None,
        bank_id: str | None = None,
        timeout: float | None = None,
    ) -> None:
        _load_project_env()
        self.base_url = (base_url or os.getenv("HINDSIGHT_API_URL") or "http://localhost:8888").rstrip("/")
        self.api_key = api_key if api_key is not None else os.getenv("HINDSIGHT_API_KEY")
        self.bank_id = bank_id or os.getenv("HINDSIGHT_BANK_ID", "support-experiences")
        self.timeout = timeout if timeout is not None else float(os.getenv("HINDSIGHT_TIMEOUT_SECONDS", "8.0"))

    def retain(self, content: str, *, document_id: str | None = None) -> dict[str, Any]:
        item: dict[str, Any] = {"content": content}
        if document_id:
            item["document_id"] = document_id
        return self._request(
            "POST",
            f"/v1/default/banks/{quote(self.bank_id, safe='')}/memories",
            {"items": [item], "async": False},
        )

    def retain_many(self, items: list[tuple[str, str]]) -> dict[str, Any]:
        """Retain stable, synchronously indexed documents in one request.

        Hindsight creates a bank automatically on the first retain request.
        Stable document IDs make re-seeding an upsert rather than a duplicate.
        """
        if not items:
            return {}
        return self._request(
            "POST",
            f"/v1/default/banks/{quote(self.bank_id, safe='')}/memories",
            {
                "items": [
                    {"content": content, "document_id": document_id}
                    for document_id, content in items
                ],
                "async": False,
            },
        )

    def recall(self, query: str) -> dict[str, Any]:
        return self._request(
            "POST",
            f"/v1/default/banks/{quote(self.bank_id, safe='')}/memories/recall",
            {"query": query},
        )

    def reflect(self, query: str) -> dict[str, Any]:
        return self._request(
            "POST",
            f"/v1/default/banks/{quote(self.bank_id, safe='')}/reflect",
            {"query": query, "budget": "low"},
        )

    def _request(self, method: str, path: str, payload: dict[str, Any]) -> dict[str, Any]:
        headers = {"Content-Type": "application/json", "Accept": "application/json"}
        if self.api_key:
            headers["Authorization"] = "Bearer " + self.api_key

        request = Request(
            f"{self.base_url}{path}",
            data=json.dumps(payload, separators=(",", ":")).encode("utf-8"),
            headers=headers,
            method=method,
        )
        try:
            with urlopen(request, timeout=self.timeout) as response:
                raw = response.read()
        except HTTPError as error:
            detail = error.read().decode("utf-8", errors="replace")
            raise HindsightError(
                f"Hindsight returned HTTP {error.code}: {detail[:500]}",
                status_code=error.code,
            ) from error
        except (URLError, TimeoutError, OSError) as error:
            raise HindsightError(f"Could not reach Hindsight at {self.base_url}: {error}") from error

        if not raw:
            return {}
        try:
            result = json.loads(raw)
        except json.JSONDecodeError as error:
            raise HindsightError("Hindsight returned a non-JSON response.") from error
        if not isinstance(result, dict):
            raise HindsightError("Hindsight returned an unexpected response shape.")
        return result


def _load_project_env() -> None:
    """Load Hindsight settings from the root .env without overriding shell settings."""
    try:
        lines = PROJECT_ENV_FILE.read_text(encoding="utf-8").splitlines()
    except FileNotFoundError:
        return

    for line in lines:
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, value = stripped.split("=", maxsplit=1)
        key = key.strip()
        if not key.startswith("HINDSIGHT_") or key in os.environ:
            continue
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
            value = value[1:-1]
        os.environ[key] = value
