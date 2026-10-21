"""
Presentation Controller
Manages PDF parsing, slide extraction, navigation state, and slide synchronization.
"""

from pathlib import Path
from typing import Optional, Dict, Any, List
import pypdf
from backend.core.logging import logger
from backend.db.repositories import PresentationRepository, SlideRepository

class PresentationController:
    def __init__(self):
        self.active_presentation: Optional[Dict[str, Any]] = None
        self.current_slide_index: int = 1
        self.total_slides: int = 0
        self.slides_cache: List[Dict[str, Any]] = []

    def load_pdf(self, file_path: str, title: Optional[str] = None, user_id: str = "usr_default") -> Dict[str, Any]:
        p = Path(file_path)
        if not p.exists():
            raise FileNotFoundError(f"Presentation file not found at: {file_path}")

        doc_title = title or p.stem
        file_size = p.stat().st_size

        reader = pypdf.PdfReader(str(p))
        page_count = len(reader.pages)

        # Save presentation record
        pres = PresentationRepository.create(
            user_id=user_id,
            title=doc_title,
            file_path=str(p.resolve()),
            page_count=page_count,
            file_size_bytes=file_size
        )
        self.active_presentation = pres
        self.total_slides = page_count
        self.current_slide_index = 1
        self.slides_cache = []

        # Extract and persist each slide's text and mock layout blocks
        for idx, page in enumerate(reader.pages, start=1):
            text = page.extract_text() or ""
            # Simple layout extraction heuristic: partition paragraphs into OCR blocks
            blocks = []
            paragraphs = [para.strip() for para in text.split("\n\n") if para.strip()]
            for b_idx, para in enumerate(paragraphs):
                # Normalized bounding box estimation
                y_start = min(0.9, 0.1 + (b_idx * 0.15))
                blocks.append({
                    "id": f"blk_{b_idx + 1}",
                    "text": para[:200],
                    "bbox": [0.1, round(y_start, 2), 0.9, round(y_start + 0.12, 2)],
                    "confidence": 0.95
                })

            slide_record = SlideRepository.upsert_slide(
                presentation_id=pres["id"],
                slide_index=idx,
                title=f"Slide {idx}",
                extracted_text=text,
                ocr_layout={"blocks": blocks}
            )
            self.slides_cache.append(slide_record)

        logger.info(f"[PRES] Loaded presentation '{doc_title}' ({page_count} slides).")
        return self.get_state()

    def set_active(self, pres_id: str) -> Optional[Dict[str, Any]]:
        pres = PresentationRepository.get(pres_id)
        if not pres:
            return None
        self.active_presentation = pres
        self.total_slides = pres["page_count"]
        self.current_slide_index = 1
        self.slides_cache = SlideRepository.list_for_presentation(pres_id)
        return self.get_state()

    def next_slide(self) -> Dict[str, Any]:
        if self.total_slides > 0 and self.current_slide_index < self.total_slides:
            self.current_slide_index += 1
        return self.get_state()

    def prev_slide(self) -> Dict[str, Any]:
        if self.current_slide_index > 1:
            self.current_slide_index -= 1
        return self.get_state()

    def goto_slide(self, index: int) -> Dict[str, Any]:
        if 1 <= index <= self.total_slides:
            self.current_slide_index = index
        return self.get_state()

    def get_current_slide_data(self) -> Optional[Dict[str, Any]]:
        if not self.active_presentation:
            return None
        return SlideRepository.get_slide(self.active_presentation["id"], self.current_slide_index)

    def get_state(self) -> Dict[str, Any]:
        return {
            "presentation_loaded": self.active_presentation is not None,
            "presentation_id": self.active_presentation["id"] if self.active_presentation else None,
            "title": self.active_presentation["title"] if self.active_presentation else None,
            "current_slide_index": self.current_slide_index,
            "total_slides": self.total_slides,
            "current_slide": self.get_current_slide_data()
        }

presentation_controller = PresentationController()
