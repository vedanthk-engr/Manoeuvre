"""
Integration Tests: FastAPI REST Endpoints & Workflows
"""

import os
import tempfile
import pytest
from starlette.testclient import TestClient
from backend.main import app
from backend.db.database import DatabaseManager
from backend.db.migrations import SCHEMA_SQL, DEFAULT_USER_ID

@pytest.fixture(scope="module")
def client():
    fd, path = tempfile.mkstemp(suffix=".sqlite3")
    os.close(fd)
    test_db = DatabaseManager(db_path=path)

    # Initialize schema
    with test_db.connection() as conn:
        conn.executescript(SCHEMA_SQL)
        conn.execute("INSERT INTO user_profiles (id, name) VALUES (?, ?)", (DEFAULT_USER_ID, "Prof Tester"))
        conn.execute(
            """INSERT INTO user_settings (user_id, theme, ai_provider, ai_model)
               VALUES (?, 'dark', 'mock', 'mock-offline')""",
            (DEFAULT_USER_ID,)
        )

    from backend.db import repositories
    repositories.db_manager = test_db

    with TestClient(app) as test_client:
        yield test_client

    try:
        os.remove(path)
    except OSError:
        pass

def test_health_check(client):
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "HEALTHY"
    assert data["service"] == "Manoeuvre Core"

def test_dashboard_summary(client):
    res = client.get("/api/dashboard/summary")
    assert res.status_code == 200
    data = res.json()
    assert "device" in data
    assert "session" in data
    assert "system_health" in data

def test_device_status_and_configure(client):
    res = client.get("/api/device/status")
    assert res.status_code == 200
    data = res.json()
    assert "cursor_settings" in data

    config_res = client.post("/api/device/configure", json={"sensitivity": 2.2, "dead_zone": 0.15})
    assert config_res.status_code == 200
    assert config_res.json()["status"] == "UPDATED"

def test_session_lifecycle_and_analytics(client):
    # 1. Start session
    start_res = client.post("/api/session/start", json={"title": "Computer Vision Lecture"})
    assert start_res.status_code == 200
    session_data = start_res.json()
    session_id = session_data["id"]
    assert session_data["status"] == "ACTIVE"

    # 2. Check active session
    active_res = client.get("/api/session/active")
    assert active_res.status_code == 200
    assert active_res.json()["active"] is True

    # 3. Add annotation
    annot_res = client.post("/api/annotations/", json={
        "annotation_type": "stroke",
        "color": "#EF4444",
        "stroke_width": 3.0,
        "points": [[0.2, 0.3], [0.4, 0.5]],
        "slide_index": 1
    })
    assert annot_res.status_code == 200

    # 4. Execute AI Query
    ai_res = client.post("/api/ai/query", json={
        "action": "explain",
        "slide_index": 1,
        "focus": "intuitive"
    })
    assert ai_res.status_code == 200
    assert "response_text" in ai_res.json()
    assert ai_res.json()["provider"] == "mock"

    # 5. End session
    end_res = client.post("/api/session/end", json={"generate_recap": True})
    assert end_res.status_code == 200
    ended_data = end_res.json()
    assert ended_data["status"] == "COMPLETED"
    assert ended_data["recap_summary"] is not None

    # 6. Check Analytics
    ana_res = client.get(f"/api/analytics/session/{session_id}")
    assert ana_res.status_code == 200
    ana_data = ana_res.json()
    assert ana_data["session_id"] == session_id
    assert ana_data["annotations_count"] >= 1
    assert ana_data["ai_queries_count"] >= 1

    # 7. Check Markdown Report Export
    export_res = client.get(f"/api/analytics/session/{session_id}/export")
    assert export_res.status_code == 200
    assert "Manoeuvre Lecture Report" in export_res.text

def test_settings_routes(client):
    res = client.get("/api/settings/")
    assert res.status_code == 200
    data = res.json()
    assert "theme" in data

    update_res = client.post("/api/settings/", json={
        "cursor_sensitivity": 1.8,
        "zoom_factor": 2.5
    })
    assert update_res.status_code == 200
    assert update_res.json()["cursor_sensitivity"] == 1.8
    assert update_res.json()["zoom_factor"] == 2.5
