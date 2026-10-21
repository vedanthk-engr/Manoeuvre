"""
AI Assistant & Intelligence API Routes
Routes pedagogical queries to active AIProvider and logs interactions.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.presentation.controller import presentation_controller
from backend.ai.provider import get_ai_provider
from backend.db.repositories import (
    UserSettingsRepository, LectureSessionRepository, AIInteractionRepository
)
from backend.speech.service import speech_service
from backend.device.connection_manager import connection_manager

router = APIRouter(prefix="/api/ai", tags=["AI"])

class AIActionRequest(BaseModel):
    action: str # "explain", "summarize", "mcq", "analogy", "code", "recap"
    slide_index: Optional[int] = None
    custom_prompt: Optional[str] = None
    focus: Optional[str] = "general"

@router.post("/query")
async def execute_ai_query(req: AIActionRequest):
    settings = UserSettingsRepository.get() or {}
    provider_name = settings.get("ai_provider", "mock")
    api_key = settings.get(f"{provider_name}_api_key", "")
    model_name = settings.get("ai_model")

    ai = get_ai_provider(provider_type=provider_name, api_key=api_key, model_name=model_name)

    # Resolve slide content
    slide_idx = req.slide_index or presentation_controller.current_slide_index
    slide = None
    if presentation_controller.active_presentation:
        from backend.db.repositories import SlideRepository
        slide = SlideRepository.get_slide(presentation_controller.active_presentation["id"], slide_idx)

    slide_title = slide["title"] if slide else f"Slide {slide_idx}"
    slide_text = slide["extracted_text"] if slide else (req.custom_prompt or "Standard presentation slide.")

    try:
        if req.action == "explain":
            res = await ai.explain_slide(slide_title, slide_text, focus=req.focus or "general")
        elif req.action == "summarize":
            res = await ai.summarize_slide(slide_title, slide_text)
        elif req.action == "mcq":
            res = await ai.generate_mcq(slide_title, slide_text, count=3)
        elif req.action == "analogy":
            res = await ai.generate_analogy(slide_title, slide_text)
        elif req.action == "code":
            res = await ai.generate_code(slide_title, slide_text, language="python")
        elif req.action == "recap":
            res = await ai.generate_recap(duration_sec=300, slides_count=slide_idx, annotations_count=2, topics=[slide_title])
        else:
            prompt = req.custom_prompt or f"Analyze {slide_title}"
            res = await ai.generate_response(prompt)

        # Log to active session if one exists
        active_session = LectureSessionRepository.get_active()
        if active_session:
            AIInteractionRepository.log(
                session_id=active_session["id"],
                slide_index=slide_idx,
                query_type=req.action,
                prompt=f"{req.action} for {slide_title}",
                response_text=res["response_text"],
                provider=res["provider"],
                model=res["model"],
                latency_ms=res.get("latency_ms", 0),
                tokens_used=res.get("tokens_used", 0)
            )

        # Broadcast to overlay
        await connection_manager.broadcast_to_desktop({
            "type": "ai_response_ready",
            "payload": {
                "action": req.action,
                "slide_index": slide_idx,
                "response": res
            }
        })

        return res

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/speech/toggle")
async def toggle_speech_recording():
    if not speech_service.is_recording:
        res = speech_service.start_recording()
        await connection_manager.broadcast_to_desktop({"type": "speech_state", "payload": res})
        return res
    else:
        res = speech_service.stop_and_transcribe()
        await connection_manager.broadcast_to_desktop({"type": "speech_state", "payload": res})
        return res

@router.get("/history/{session_id}")
async def get_session_ai_history(session_id: str):
    return AIInteractionRepository.list_for_session(session_id)
