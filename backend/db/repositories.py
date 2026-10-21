"""
Manoeuvre Repository Data Access Layer
Clean, typed abstractions for all 12 database entities.
"""

import json
import uuid
from typing import Optional, List, Dict, Any
from backend.db.database import db_manager

def generate_id(prefix: str = "obj") -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"

class UserSettingsRepository:
    @staticmethod
    def get(user_id: str = "usr_default") -> Optional[Dict[str, Any]]:
        with db_manager.connection() as conn:
            cur = conn.execute("SELECT * FROM user_settings WHERE user_id = ?", (user_id,))
            row = cur.fetchone()
            return dict(row) if row else None

    @staticmethod
    def update(user_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        allowed_cols = {
            "theme", "cursor_sensitivity", "cursor_dead_zone", "cursor_smoothing",
            "zoom_factor", "highlight_color", "overlay_opacity", "button_hold_threshold_ms",
            "ai_provider", "ai_model", "gemini_api_key", "openai_api_key", "language",
            "save_transcripts", "save_ai_interactions", "ws_port"
        }
        filtered = {k: v for k, v in updates.items() if k in allowed_cols}
        if not filtered:
            return UserSettingsRepository.get(user_id)

        set_clause = ", ".join(f"{col} = ?" for col in filtered.keys())
        values = list(filtered.values()) + [user_id]
        with db_manager.connection() as conn:
            conn.execute(f"UPDATE user_settings SET {set_clause}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?", values)
        return UserSettingsRepository.get(user_id)

class DeviceRepository:
    @staticmethod
    def upsert_device(device_id: str, user_id: str, device_name: str, mac_address: Optional[str],
                      firmware_version: Optional[str], hardware_version: Optional[str]) -> Dict[str, Any]:
        with db_manager.connection() as conn:
            conn.execute(
                """INSERT INTO devices (id, user_id, device_name, mac_address, firmware_version, hardware_version, last_seen_at, is_active)
                   VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 1)
                   ON CONFLICT(id) DO UPDATE SET
                       mac_address = COALESCE(excluded.mac_address, devices.mac_address),
                       firmware_version = COALESCE(excluded.firmware_version, devices.firmware_version),
                       hardware_version = COALESCE(excluded.hardware_version, devices.hardware_version),
                       last_seen_at = CURRENT_TIMESTAMP,
                       is_active = 1
                """,
                (device_id, user_id, device_name, mac_address, firmware_version, hardware_version)
            )
            cur = conn.execute("SELECT * FROM devices WHERE id = ?", (device_id,))
            return dict(cur.fetchone())

    @staticmethod
    def update_last_seen(device_id: str):
        with db_manager.connection() as conn:
            conn.execute("UPDATE devices SET last_seen_at = CURRENT_TIMESTAMP, is_active = 1 WHERE id = ?", (device_id,))

    @staticmethod
    def set_inactive(device_id: str):
        with db_manager.connection() as conn:
            conn.execute("UPDATE devices SET is_active = 0 WHERE id = ?", (device_id,))

    @staticmethod
    def list_all() -> List[Dict[str, Any]]:
        with db_manager.connection() as conn:
            cur = conn.execute("SELECT * FROM devices ORDER BY last_seen_at DESC")
            return [dict(r) for r in cur.fetchall()]

class PresentationRepository:
    @staticmethod
    def create(user_id: str, title: str, file_path: str, page_count: int, file_size_bytes: int = 0) -> Dict[str, Any]:
        pres_id = generate_id("pres")
        with db_manager.connection() as conn:
            conn.execute(
                """INSERT INTO presentations (id, user_id, title, file_path, file_type, page_count, file_size_bytes)
                   VALUES (?, ?, ?, ?, 'pdf', ?, ?)""",
                (pres_id, user_id, title, file_path, page_count, file_size_bytes)
            )
            cur = conn.execute("SELECT * FROM presentations WHERE id = ?", (pres_id,))
            return dict(cur.fetchone())

    @staticmethod
    def get(pres_id: str) -> Optional[Dict[str, Any]]:
        with db_manager.connection() as conn:
            cur = conn.execute("SELECT * FROM presentations WHERE id = ?", (pres_id,))
            row = cur.fetchone()
            return dict(row) if row else None

    @staticmethod
    def list_all(user_id: str = "usr_default") -> List[Dict[str, Any]]:
        with db_manager.connection() as conn:
            cur = conn.execute("SELECT * FROM presentations WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
            return [dict(r) for r in cur.fetchall()]

class SlideRepository:
    @staticmethod
    def upsert_slide(presentation_id: str, slide_index: int, title: Optional[str] = None,
                     extracted_text: Optional[str] = None, ocr_layout: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        slide_id = f"{presentation_id}_s{slide_index}"
        ocr_str = json.dumps(ocr_layout) if ocr_layout else None
        with db_manager.connection() as conn:
            conn.execute(
                """INSERT INTO slides (id, presentation_id, slide_index, title, extracted_text, ocr_layout_json)
                   VALUES (?, ?, ?, ?, ?, ?)
                   ON CONFLICT(presentation_id, slide_index) DO UPDATE SET
                       title = COALESCE(excluded.title, slides.title),
                       extracted_text = COALESCE(excluded.extracted_text, slides.extracted_text),
                       ocr_layout_json = COALESCE(excluded.ocr_layout_json, slides.ocr_layout_json)
                """,
                (slide_id, presentation_id, slide_index, title, extracted_text, ocr_str)
            )
            cur = conn.execute("SELECT * FROM slides WHERE id = ?", (slide_id,))
            return dict(cur.fetchone())

    @staticmethod
    def list_for_presentation(presentation_id: str) -> List[Dict[str, Any]]:
        with db_manager.connection() as conn:
            cur = conn.execute("SELECT * FROM slides WHERE presentation_id = ? ORDER BY slide_index ASC", (presentation_id,))
            return [dict(r) for r in cur.fetchall()]

    @staticmethod
    def get_slide(presentation_id: str, slide_index: int) -> Optional[Dict[str, Any]]:
        with db_manager.connection() as conn:
            cur = conn.execute("SELECT * FROM slides WHERE presentation_id = ? AND slide_index = ?", (presentation_id, slide_index))
            row = cur.fetchone()
            return dict(row) if row else None

class LectureSessionRepository:
    @staticmethod
    def create(user_id: str, title: str, presentation_id: Optional[str] = None) -> Dict[str, Any]:
        sess_id = generate_id("sess")
        with db_manager.connection() as conn:
            conn.execute(
                """INSERT INTO lecture_sessions (id, user_id, presentation_id, title, status)
                   VALUES (?, ?, ?, ?, 'ACTIVE')""",
                (sess_id, user_id, presentation_id, title)
            )
            cur = conn.execute("SELECT * FROM lecture_sessions WHERE id = ?", (sess_id,))
            return dict(cur.fetchone())

    @staticmethod
    def get_active(user_id: str = "usr_default") -> Optional[Dict[str, Any]]:
        with db_manager.connection() as conn:
            cur = conn.execute("SELECT * FROM lecture_sessions WHERE user_id = ? AND status = 'ACTIVE' ORDER BY started_at DESC LIMIT 1", (user_id,))
            row = cur.fetchone()
            return dict(row) if row else None

    @staticmethod
    def end_session(session_id: str, duration_sec: int, slides_viewed: int, recap_summary: Optional[str] = None) -> Optional[Dict[str, Any]]:
        with db_manager.connection() as conn:
            conn.execute(
                """UPDATE lecture_sessions SET
                    status = 'COMPLETED',
                    ended_at = CURRENT_TIMESTAMP,
                    total_duration_seconds = ?,
                    total_slides_viewed = ?,
                    recap_summary = COALESCE(?, recap_summary)
                   WHERE id = ?""",
                (duration_sec, slides_viewed, recap_summary, session_id)
            )
            cur = conn.execute("SELECT * FROM lecture_sessions WHERE id = ?", (session_id,))
            row = cur.fetchone()
            return dict(row) if row else None

    @staticmethod
    def list_sessions(user_id: str = "usr_default", limit: int = 20) -> List[Dict[str, Any]]:
        with db_manager.connection() as conn:
            cur = conn.execute(
                "SELECT * FROM lecture_sessions WHERE user_id = ? ORDER BY started_at DESC LIMIT ?",
                (user_id, limit)
            )
            return [dict(r) for r in cur.fetchall()]

    @staticmethod
    def get(session_id: str) -> Optional[Dict[str, Any]]:
        with db_manager.connection() as conn:
            cur = conn.execute("SELECT * FROM lecture_sessions WHERE id = ?", (session_id,))
            row = cur.fetchone()
            return dict(row) if row else None

class AnnotationRepository:
    @staticmethod
    def create(session_id: str, presentation_id: Optional[str], slide_index: int,
               annotation_type: str, color: str, stroke_width: float, points: List[Any]) -> Dict[str, Any]:
        annot_id = generate_id("ann")
        with db_manager.connection() as conn:
            conn.execute(
                """INSERT INTO annotations (id, lecture_session_id, presentation_id, slide_index, annotation_type, color, stroke_width, points_json)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (annot_id, session_id, presentation_id, slide_index, annotation_type, color, stroke_width, json.dumps(points))
            )
            # Increment session count
            conn.execute("UPDATE lecture_sessions SET total_annotations_count = total_annotations_count + 1 WHERE id = ?", (session_id,))
            cur = conn.execute("SELECT * FROM annotations WHERE id = ?", (annot_id,))
            return dict(cur.fetchone())

    @staticmethod
    def list_for_slide(session_id: str, slide_index: int) -> List[Dict[str, Any]]:
        with db_manager.connection() as conn:
            cur = conn.execute(
                "SELECT * FROM annotations WHERE lecture_session_id = ? AND slide_index = ? ORDER BY created_at ASC",
                (session_id, slide_index)
            )
            return [dict(r) for r in cur.fetchall()]

    @staticmethod
    def clear_for_slide(session_id: str, slide_index: int) -> int:
        with db_manager.connection() as conn:
            cur = conn.execute(
                "DELETE FROM annotations WHERE lecture_session_id = ? AND slide_index = ?",
                (session_id, slide_index)
            )
            return cur.rowcount

    @staticmethod
    def undo_last_for_slide(session_id: str, slide_index: int) -> bool:
        with db_manager.connection() as conn:
            cur = conn.execute(
                "SELECT id FROM annotations WHERE lecture_session_id = ? AND slide_index = ? ORDER BY created_at DESC LIMIT 1",
                (session_id, slide_index)
            )
            row = cur.fetchone()
            if row:
                conn.execute("DELETE FROM annotations WHERE id = ?", (row["id"],))
                return True
            return False

class LectureEventRepository:
    @staticmethod
    def log_event(session_id: str, event_type: str, slide_index: Optional[int] = None,
                  data: Optional[Dict[str, Any]] = None, timestamp_ms: Optional[int] = None) -> Dict[str, Any]:
        evt_id = generate_id("evt")
        import time
        ts = timestamp_ms or int(time.time() * 1000)
        data_str = json.dumps(data) if data else None
        with db_manager.connection() as conn:
            conn.execute(
                """INSERT INTO lecture_events (id, lecture_session_id, event_type, slide_index, data_json, timestamp_ms)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (evt_id, session_id, event_type, slide_index, data_str, ts)
            )
            cur = conn.execute("SELECT * FROM lecture_events WHERE id = ?", (evt_id,))
            return dict(cur.fetchone())

    @staticmethod
    def list_for_session(session_id: str) -> List[Dict[str, Any]]:
        with db_manager.connection() as conn:
            cur = conn.execute(
                "SELECT * FROM lecture_events WHERE lecture_session_id = ? ORDER BY timestamp_ms ASC",
                (session_id,)
            )
            return [dict(r) for r in cur.fetchall()]

class AIInteractionRepository:
    @staticmethod
    def log(session_id: str, slide_index: Optional[int], query_type: str, prompt: str,
            response_text: str, provider: str, model: str, latency_ms: int = 0,
            tokens_used: int = 0, error_message: Optional[str] = None) -> Dict[str, Any]:
        inter_id = generate_id("ai")
        with db_manager.connection() as conn:
            conn.execute(
                """INSERT INTO ai_interactions (id, lecture_session_id, slide_index, query_type, prompt, response_text, provider, model, latency_ms, tokens_used, error_message)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (inter_id, session_id, slide_index, query_type, prompt, response_text, provider, model, latency_ms, tokens_used, error_message)
            )
            conn.execute("UPDATE lecture_sessions SET total_ai_queries_count = total_ai_queries_count + 1 WHERE id = ?", (session_id,))
            cur = conn.execute("SELECT * FROM ai_interactions WHERE id = ?", (inter_id,))
            return dict(cur.fetchone())

    @staticmethod
    def list_for_session(session_id: str) -> List[Dict[str, Any]]:
        with db_manager.connection() as conn:
            cur = conn.execute(
                "SELECT * FROM ai_interactions WHERE lecture_session_id = ? ORDER BY created_at DESC",
                (session_id,)
            )
            return [dict(r) for r in cur.fetchall()]
