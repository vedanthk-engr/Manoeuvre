"""
User Settings API Routes
Handles persistent configuration for theme, cursor, AI keys, and hardware thresholds.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from backend.db.repositories import UserSettingsRepository
from backend.device.input_controller import input_controller

router = APIRouter(prefix="/api/settings", tags=["Settings"])

class SettingsUpdateRequest(BaseModel):
    theme: Optional[str] = None
    cursor_sensitivity: Optional[float] = None
    cursor_dead_zone: Optional[float] = None
    cursor_smoothing: Optional[float] = None
    zoom_factor: Optional[float] = None
    highlight_color: Optional[str] = None
    overlay_opacity: Optional[float] = None
    button_hold_threshold_ms: Optional[int] = None
    ai_provider: Optional[str] = None
    ai_model: Optional[str] = None
    gemini_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    language: Optional[str] = None
    save_transcripts: Optional[bool] = None
    save_ai_interactions: Optional[bool] = None

@router.get("/")
async def get_settings():
    s = UserSettingsRepository.get() or {}
    # Mask API keys for security in UI
    masked = dict(s)
    if masked.get("gemini_api_key"):
        masked["gemini_api_key_masked"] = f"***{masked['gemini_api_key'][-4:]}"
    if masked.get("openai_api_key"):
        masked["openai_api_key_masked"] = f"***{masked['openai_api_key'][-4:]}"
    return masked

@router.post("/")
async def update_settings(req: SettingsUpdateRequest):
    updates = req.model_dump(exclude_none=True)
    updated = UserSettingsRepository.update("usr_default", updates)

    # Sync runtime input controller if cursor values changed
    input_controller.set_config(
        sensitivity=req.cursor_sensitivity,
        dead_zone=req.cursor_dead_zone,
        smoothing=req.cursor_smoothing
    )

    return updated
