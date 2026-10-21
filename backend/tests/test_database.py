"""
Integration Tests: SQLite Database Migrations & Repositories
"""

import os
import tempfile
import pytest
from backend.db.database import DatabaseManager
from backend.db.migrations import SCHEMA_SQL, DEFAULT_USER_ID
from backend.db.repositories import (
    UserSettingsRepository, DeviceRepository, PresentationRepository,
    SlideRepository, LectureSessionRepository, AnnotationRepository,
    LectureEventRepository, AIInteractionRepository
)

@pytest.fixture(autouse=True)
def setup_test_db(monkeypatch):
    fd, path = tempfile.mkstemp(suffix=".sqlite3")
    os.close(fd)
    test_db = DatabaseManager(db_path=path)
    
    # Patch db_manager in repositories
    monkeypatch.setattr("backend.db.repositories.db_manager", test_db)
    monkeypatch.setattr("backend.db.migrations.db_manager", test_db)

    # Run schema creation
    with test_db.connection() as conn:
        conn.executescript(SCHEMA_SQL)
        conn.execute("INSERT INTO user_profiles (id, name) VALUES (?, ?)", (DEFAULT_USER_ID, "Prof Test"))
        conn.execute("INSERT INTO user_settings (user_id) VALUES (?)", (DEFAULT_USER_ID,))

    yield test_db

    try:
        os.remove(path)
    except OSError:
        pass

def test_user_settings_repository():
    settings = UserSettingsRepository.get(DEFAULT_USER_ID)
    assert settings is not None
    assert settings["theme"] == "dark"

    updated = UserSettingsRepository.update(DEFAULT_USER_ID, {"cursor_sensitivity": 2.4, "ai_provider": "gemini"})
    assert updated["cursor_sensitivity"] == 2.4
    assert updated["ai_provider"] == "gemini"

def test_device_repository():
    dev = DeviceRepository.upsert_device(
        device_id="glove-t1",
        user_id=DEFAULT_USER_ID,
        device_name="Test Glove",
        mac_address="11:22:33:44:55:66",
        firmware_version="1.0.0",
        hardware_version="ESP32"
    )
    assert dev["id"] == "glove-t1"
    assert dev["is_active"] == 1

    devices = DeviceRepository.list_all()
    assert len(devices) == 1

    DeviceRepository.set_inactive("glove-t1")
    dev_after = DeviceRepository.list_all()[0]
    assert dev_after["is_active"] == 0

def test_presentation_and_slides():
    pres = PresentationRepository.create(
        user_id=DEFAULT_USER_ID,
        title="Deep Learning Lec 1",
        file_path="/path/test.pdf",
        page_count=10
    )
    assert pres["id"].startswith("pres_")
    assert pres["page_count"] == 10

    slide = SlideRepository.upsert_slide(
        presentation_id=pres["id"],
        slide_index=1,
        title="Intro",
        extracted_text="Neural Networks Basics"
    )
    assert slide["slide_index"] == 1
    assert slide["extracted_text"] == "Neural Networks Basics"

    slides = SlideRepository.list_for_presentation(pres["id"])
    assert len(slides) == 1

def test_lecture_session_and_annotations():
    session = LectureSessionRepository.create(
        user_id=DEFAULT_USER_ID,
        title="Class Session 1"
    )
    assert session["status"] == "ACTIVE"
    assert session["id"].startswith("sess_")

    active = LectureSessionRepository.get_active(DEFAULT_USER_ID)
    assert active["id"] == session["id"]

    annot = AnnotationRepository.create(
        session_id=session["id"],
        presentation_id=None,
        slide_index=1,
        annotation_type="stroke",
        color="#EF4444",
        stroke_width=2.5,
        points=[[0.1, 0.2], [0.3, 0.4]]
    )
    assert annot["id"].startswith("ann_")

    annots = AnnotationRepository.list_for_slide(session["id"], 1)
    assert len(annots) == 1

    # Test undo
    undone = AnnotationRepository.undo_last_for_slide(session["id"], 1)
    assert undone is True
    assert len(AnnotationRepository.list_for_slide(session["id"], 1)) == 0

    # End session
    ended = LectureSessionRepository.end_session(
        session_id=session["id"],
        duration_sec=300,
        slides_viewed=5,
        recap_summary="Good pacing"
    )
    assert ended["status"] == "COMPLETED"
    assert ended["total_duration_seconds"] == 300
    assert LectureSessionRepository.get_active(DEFAULT_USER_ID) is None

def test_lecture_events_and_ai_interactions():
    session = LectureSessionRepository.create(DEFAULT_USER_ID, "Event Test")
    evt = LectureEventRepository.log_event(
        session_id=session["id"],
        event_type="BUTTON_EVENT",
        slide_index=2,
        data={"button": "ACTION", "action": "single_press"}
    )
    assert evt["event_type"] == "BUTTON_EVENT"

    events = LectureEventRepository.list_for_session(session["id"])
    assert len(events) == 1

    inter = AIInteractionRepository.log(
        session_id=session["id"],
        slide_index=2,
        query_type="explain",
        prompt="Explain backprop",
        response_text="Backpropagation computes gradients...",
        provider="mock",
        model="mock-offline",
        latency_ms=150
    )
    assert inter["query_type"] == "explain"
    assert inter["latency_ms"] == 150

    interactions = AIInteractionRepository.list_for_session(session["id"])
    assert len(interactions) == 1
