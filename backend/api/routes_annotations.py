"""
Annotation Manager API Routes
Stores, retrieves, undos, and clears normalized vector annotations per slide.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Any
from backend.db.repositories import AnnotationRepository, LectureSessionRepository
from backend.presentation.controller import presentation_controller
from backend.device.connection_manager import connection_manager

router = APIRouter(prefix="/api/annotations", tags=["Annotations"])

class CreateAnnotationRequest(BaseModel):
    annotation_type: str = "stroke" # "stroke", "highlight", "laser"
    color: str = "#EF4444"
    stroke_width: float = 3.0
    points: List[Any] # [[x, y], [x, y], ...]
    slide_index: int

@router.get("/{session_id}/{slide_index}")
async def get_annotations(session_id: str, slide_index: int):
    return AnnotationRepository.list_for_slide(session_id, slide_index)

@router.post("/")
async def create_annotation(req: CreateAnnotationRequest):
    active_session = LectureSessionRepository.get_active()
    if not active_session:
        raise HTTPException(status_code=400, detail="Cannot save annotations outside an active lecture session.")

    pres_id = presentation_controller.active_presentation["id"] if presentation_controller.active_presentation else None

    annot = AnnotationRepository.create(
        session_id=active_session["id"],
        presentation_id=pres_id,
        slide_index=req.slide_index,
        annotation_type=req.annotation_type,
        color=req.color,
        stroke_width=req.stroke_width,
        points=req.points
    )

    await connection_manager.broadcast_to_desktop({
        "type": "annotation_created",
        "payload": annot
    })
    return annot

@router.post("/undo/{session_id}/{slide_index}")
async def undo_annotation(session_id: str, slide_index: int):
    success = AnnotationRepository.undo_last_for_slide(session_id, slide_index)
    if success:
        await connection_manager.broadcast_to_desktop({
            "type": "annotation_undone",
            "slide_index": slide_index
        })
    return {"success": success}

@router.post("/clear/{session_id}/{slide_index}")
async def clear_annotations(session_id: str, slide_index: int):
    count = AnnotationRepository.clear_for_slide(session_id, slide_index)
    await connection_manager.broadcast_to_desktop({
        "type": "annotations_cleared",
        "slide_index": slide_index
    })
    return {"cleared_count": count}
