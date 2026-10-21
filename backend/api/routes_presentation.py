"""
Presentation Manager API Routes
Handles PDF upload, slide parsing, active presentation selection, and navigation.
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pathlib import Path
import shutil
from typing import Optional
from backend.core.config import settings
from backend.presentation.controller import presentation_controller
from backend.db.repositories import PresentationRepository, SlideRepository
from backend.device.connection_manager import connection_manager

router = APIRouter(prefix="/api/presentation", tags=["Presentation"])

@router.get("/list")
async def list_presentations():
    return PresentationRepository.list_all()

@router.get("/state")
async def get_state():
    return presentation_controller.get_state()

@router.post("/upload")
async def upload_presentation(file: UploadFile = File(...), title: Optional[str] = Form(None)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF presentations are currently supported.")

    uploads_dir = Path(settings.UPLOADS_DIR)
    uploads_dir.mkdir(parents=True, exist_ok=True)
    dest_path = uploads_dir / file.filename

    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    doc_title = title or file.filename.rsplit(".", 1)[0]
    state = presentation_controller.load_pdf(str(dest_path), title=doc_title)
    
    # Broadcast to desktop
    await connection_manager.broadcast_to_desktop({
        "type": "presentation_loaded",
        "payload": state
    })
    return state

@router.post("/select/{presentation_id}")
async def select_presentation(presentation_id: str):
    state = presentation_controller.set_active(presentation_id)
    if not state:
        raise HTTPException(status_code=404, detail="Presentation not found")
    await connection_manager.broadcast_to_desktop({
        "type": "presentation_loaded",
        "payload": state
    })
    return state

@router.post("/next")
async def next_slide():
    state = presentation_controller.next_slide()
    await connection_manager.broadcast_to_desktop({
        "type": "presentation_state",
        "payload": state
    })
    return state

@router.post("/prev")
async def prev_slide():
    state = presentation_controller.prev_slide()
    await connection_manager.broadcast_to_desktop({
        "type": "presentation_state",
        "payload": state
    })
    return state

@router.post("/goto/{slide_index}")
async def goto_slide(slide_index: int):
    state = presentation_controller.goto_slide(slide_index)
    await connection_manager.broadcast_to_desktop({
        "type": "presentation_state",
        "payload": state
    })
    return state

@router.get("/slides/{presentation_id}")
async def get_slides_for_presentation(presentation_id: str):
    return SlideRepository.list_for_presentation(presentation_id)
