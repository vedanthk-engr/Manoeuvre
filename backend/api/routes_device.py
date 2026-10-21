"""
Device Manager API Routes
Manages physical and simulated device configuration, calibration, and diagnostics.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from backend.device.connection_manager import connection_manager
from backend.device.input_controller import input_controller
from backend.db.repositories import DeviceRepository, UserSettingsRepository

router = APIRouter(prefix="/api/device", tags=["Device"])

class DeviceConfigRequest(BaseModel):
    sensitivity: Optional[float] = None
    dead_zone: Optional[float] = None
    smoothing: Optional[float] = None
    enabled: Optional[bool] = None

class ModeRequest(BaseModel):
    target_mode: str

@router.get("/status")
async def get_device_status():
    settings = UserSettingsRepository.get() or {}
    return {
        "connected": connection_manager.device_socket is not None,
        "device_info": connection_manager.active_device_info,
        "cursor_settings": {
            "sensitivity": input_controller.sensitivity,
            "dead_zone": input_controller.dead_zone,
            "smoothing": input_controller.smoothing,
            "enabled": input_controller.enabled
        },
        "all_devices": DeviceRepository.list_all()
    }

@router.post("/configure")
async def configure_device(req: DeviceConfigRequest):
    input_controller.set_config(
        sensitivity=req.sensitivity,
        dead_zone=req.dead_zone,
        smoothing=req.smoothing,
        enabled=req.enabled
    )
    # Save to user settings
    updates = {}
    if req.sensitivity is not None: updates["cursor_sensitivity"] = req.sensitivity
    if req.dead_zone is not None: updates["cursor_dead_zone"] = req.dead_zone
    if req.smoothing is not None: updates["cursor_smoothing"] = req.smoothing
    if updates:
        UserSettingsRepository.update("usr_default", updates)

    # Forward to physical glove if connected
    if connection_manager.device_socket:
        await connection_manager.send_to_device({
            "protocol_version": 1,
            "type": "configure_device",
            "event_id": "server:cfg",
            "timestamp_ms": 0,
            "payload": req.model_dump(exclude_none=True)
        })

    return {"status": "UPDATED", "config": req.model_dump(exclude_none=True)}

@router.post("/calibrate")
async def trigger_calibration():
    if connection_manager.device_socket:
        await connection_manager.send_to_device({
            "protocol_version": 1,
            "type": "calibrate_imu",
            "event_id": "server:cal",
            "timestamp_ms": 0,
            "payload": {}
        })
        return {"status": "CALIBRATION_COMMAND_SENT"}
    return {"status": "DEVICE_NOT_CONNECTED"}

@router.post("/mode")
async def set_mode(req: ModeRequest):
    if connection_manager.device_socket:
        await connection_manager.send_to_device({
            "protocol_version": 1,
            "type": "set_mode",
            "event_id": "server:mode",
            "timestamp_ms": 0,
            "payload": {"target_mode": req.target_mode}
        })
    return {"status": "MODE_COMMAND_SENT", "target_mode": req.target_mode}
