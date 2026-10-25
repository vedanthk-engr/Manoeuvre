"""
Presentation Manager API Routes
Handles PPTX/PDF upload, slide parsing, active presentation selection, and navigation.
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
    raw_filename = file.filename or "presentation.pptx"
    ext = raw_filename.lower().rsplit(".", 1)[-1]
    if ext not in ["pdf", "pptx", "ppt"]:
        raise HTTPException(
            status_code=400,
            detail="Supported presentation formats: .pptx, .ppt, and .pdf"
        )

    uploads_dir = Path(settings.UPLOADS_DIR)
    uploads_dir.mkdir(parents=True, exist_ok=True)

    # Sanitize filename for windows filesystem while preserving extension
    base_name = raw_filename.rsplit(".", 1)[0]
    safe_base = "".join(c for c in base_name if c.isalnum() or c in " ._-").strip() or "presentation"
    filename = f"{safe_base}.{ext}"
    dest_path = uploads_dir / filename

    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    doc_title = title or base_name
    state = presentation_controller.load_presentation(str(dest_path), title=doc_title)
    
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
