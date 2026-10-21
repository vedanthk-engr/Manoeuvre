"""
Dashboard API Routes
Aggregates high-level system state for the Home Dashboard screen.
"""

from fastapi import APIRouter
from backend.device.connection_manager import connection_manager
from backend.presentation.controller import presentation_controller
from backend.db.repositories import LectureSessionRepository, DeviceRepository, UserSettingsRepository

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/summary")
async def get_dashboard_summary():
    active_device = connection_manager.active_device_info
    devices = DeviceRepository.list_all()
    active_session = LectureSessionRepository.get_active()
    recent_sessions = LectureSessionRepository.list_sessions(limit=5)
    pres_state = presentation_controller.get_state()
    settings = UserSettingsRepository.get() or {}

    return {
        "device": {
            "connected": connection_manager.device_socket is not None,
            "info": active_device,
            "total_registered": len(devices)
        },
        "session": {
            "active": active_session is not None,
            "data": active_session
        },
        "presentation": pres_state,
        "recent_sessions": recent_sessions,
        "ai_status": {
            "provider": settings.get("ai_provider", "mock"),
            "model": settings.get("ai_model", "gemini-1.5-flash"),
            "ready": True
        },
        "system_health": {
            "status": "HEALTHY",
            "db": "CONNECTED",
            "ws_server": "RUNNING"
        }
    }
