from fastapi import FastAPI

from backend.app.api.routes import router
from backend.app.api.websocket import router as websocket_router

app = FastAPI(title="Echo API")
app.include_router(router)
app.include_router(websocket_router)
