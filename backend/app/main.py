from __future__ import annotations

import os
import sys
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

# Ensure repository root is on sys.path regardless of how or where python is invoked
repo_root = Path(__file__).resolve().parents[2]
if str(repo_root) not in sys.path:
	sys.path.insert(0, str(repo_root))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.api.routes import router
from backend.app.api.websocket import router as websocket_router

app = FastAPI(
	title="Echo API",
	description="Organizational customer-experience memory system for technical support triage.",
	version="1.0.0",
)

app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

app.include_router(router)
app.include_router(websocket_router)

# Mount built frontend if available for unified single-port deployment
frontend_dist = repo_root / "frontend" / "dist"
if frontend_dist.exists() and (frontend_dist / "index.html").exists():
	app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")


def _start_port_80_redirect(target_port: int) -> None:
	"""If port 80 is available, redirect http://localhost -> http://localhost:<target_port>."""
	if target_port == 80:
		return
	try:
		class RedirectHandler(BaseHTTPRequestHandler):
			def do_GET(self) -> None:
				self.send_response(307)
				host = self.headers.get("Host", "localhost").split(":")[0]
				self.send_header("Location", f"http://{host}:{target_port}{self.path}")
				self.end_headers()

			def log_message(self, *args: object) -> None:
				pass

		httpd = HTTPServer(("0.0.0.0", 80), RedirectHandler)
		thread = threading.Thread(target=httpd.serve_forever, daemon=True)
		thread.start()
		print(f"Automatic port 80 redirect active -> http://localhost:{target_port}")
	except Exception:
		# Port 80 not available or restricted, skip gracefully
		pass


def main() -> None:
	import uvicorn
	host = os.getenv("HOST", "0.0.0.0")
	port = int(os.getenv("PORT", "8000"))
	_start_port_80_redirect(port)
	print(f"Starting Echo server on http://{host}:{port}")
	uvicorn.run("backend.app.main:app", host=host, port=port, reload=False)


if __name__ == "__main__":
	main()
