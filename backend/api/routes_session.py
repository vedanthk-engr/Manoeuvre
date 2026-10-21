"""
Lecture Session Lifecycle API Routes
Manages starting, monitoring, and ending lecture sessions.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import time
from backend.db.repositories import LectureSessionRepository, LectureEventRepository
from backend.presentation.controller import presentation_controller
from backend.analytics.coach import teaching_coach
from backend.device.connection_manager import connection_manager

router = APIRouter(prefix="/api/session", tags=["Session"])

class StartSessionRequest(BaseModel):
    title: str
    presentation_id: Optional[str] = None

class EndSessionRequest(BaseModel):
    generate_recap: bool = True

@router.get("/active")
async def get_active_session():
    active = LectureSessionRepository.get_active()
    return {"active": active is not None, "session": active}

@router.get("/list")
async def list_sessions(limit: int = 20):
    return LectureSessionRepository.list_sessions(limit=limit)

@router.get("/{session_id}")
async def get_session(session_id: str):
    sess = LectureSessionRepository.get(session_id)
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    return sess

@router.post("/start")
async def start_session(req: StartSessionRequest):
    current = LectureSessionRepository.get_active()
    if current:
        raise HTTPException(status_code=400, detail="Another lecture session is already active. End it first.")

    pres_id = req.presentation_id or (
        presentation_controller.active_presentation["id"]
        if presentation_controller.active_presentation else None
    )

    session = LectureSessionRepository.create(
        user_id="usr_default",
        title=req.title,
        presentation_id=pres_id
    )

    LectureEventRepository.log_event(
        session_id=session["id"],
        event_type="SESSION_START",
        slide_index=presentation_controller.current_slide_index,
        data={"title": req.title, "presentation_id": pres_id}
    )

    await connection_manager.broadcast_to_desktop({
        "type": "session_started",
        "payload": session
    })
    return session

@router.post("/end")
async def end_active_session(req: EndSessionRequest):
    current = LectureSessionRepository.get_active()
    if not current:
        raise HTTPException(status_code=400, detail="No lecture session is currently active.")

    session_id = current["id"]
    # Calculate duration
    events = LectureEventRepository.list_for_session(session_id)
    duration_sec = 60 # Default sensible minimum
    if events:
        start_ts = events[0]["timestamp_ms"]
        end_ts = int(time.time() * 1000)
        duration_sec = max(10, int((end_ts - start_ts) / 1000))

    slides_viewed = max(1, presentation_controller.current_slide_index)
    recap = teaching_coach.generate_recap(session_id) if req.generate_recap else None

    completed = LectureSessionRepository.end_session(
        session_id=session_id,
        duration_sec=duration_sec,
        slides_viewed=slides_viewed,
        recap_summary=recap
    )

    LectureEventRepository.log_event(
        session_id=session_id,
        event_type="SESSION_END",
        slide_index=presentation_controller.current_slide_index,
        data={"duration_sec": duration_sec, "recap": recap}
    )

    await connection_manager.broadcast_to_desktop({
        "type": "session_ended",
        "payload": completed
    })
    return completed
