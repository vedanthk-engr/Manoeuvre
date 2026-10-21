"""
Manoeuvre Core Application Entrypoint
FastAPI server hosting REST APIs and bidirectional WebSockets for device & desktop.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from backend.core.config import settings
from backend.core.logging import logger
from backend.db.migrations import run_migrations
from backend.device.connection_manager import connection_manager
from backend.device.dispatcher import dispatcher

# API Routers
from backend.api.routes_dashboard import router as dashboard_router
from backend.api.routes_device import router as device_router
from backend.api.routes_presentation import router as presentation_router
from backend.api.routes_session import router as session_router
from backend.api.routes_annotations import router as annotations_router
from backend.api.routes_ai import router as ai_router
from backend.api.routes_analytics import router as analytics_router
from backend.api.routes_settings import router as settings_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}...")
    run_migrations()
    yield
    logger.info(f"Shutting down {settings.APP_NAME}...")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount REST Routers
app.include_router(dashboard_router)
app.include_router(device_router)
app.include_router(presentation_router)
app.include_router(session_router)
app.include_router(annotations_router)
app.include_router(ai_router)
app.include_router(analytics_router)
app.include_router(settings_router)

@app.get("/health")
async def health_check():
    return {
        "status": "HEALTHY",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "device_connected": connection_manager.device_socket is not None,
        "desktop_clients": len(connection_manager.desktop_clients)
    }

# -------------------------------------------------------------
# WebSocket: Hardware Device (ESP32 Glove or Simulator)
# -------------------------------------------------------------
@app.websocket("/ws/device")
async def device_websocket_endpoint(websocket: WebSocket):
    await connection_manager.connect_device(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            await dispatcher.handle_message(data)
    except WebSocketDisconnect:
        connection_manager.disconnect_device()
        await connection_manager.broadcast_to_desktop({
            "type": "device_disconnected"
        })
    except Exception as e:
        logger.error(f"[WS DEVICE] Error in connection loop: {e}")
        connection_manager.disconnect_device()

# -------------------------------------------------------------
# WebSocket: Desktop Studio & Overlay
# -------------------------------------------------------------
@app.websocket("/ws/desktop")
async def desktop_websocket_endpoint(websocket: WebSocket):
    await connection_manager.connect_desktop(websocket)
    try:
        while True:
            # Desktop clients can send commands or stay listening
            data = await websocket.receive_json()
            logger.debug(f"[WS DESKTOP] Received client command: {data}")
    except WebSocketDisconnect:
        connection_manager.disconnect_desktop(websocket)
    except Exception as e:
        logger.error(f"[WS DESKTOP] Error in connection loop: {e}")
        connection_manager.disconnect_desktop(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=True)
