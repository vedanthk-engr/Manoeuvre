"""
Integration Tests: WebSocket Protocol & Device Communication
"""

import os
import tempfile
import pytest
from starlette.testclient import TestClient
from backend.main import app
from backend.db.database import DatabaseManager
from backend.db.migrations import SCHEMA_SQL, DEFAULT_USER_ID

@pytest.fixture
def ws_client():
    fd, path = tempfile.mkstemp(suffix=".sqlite3")
    os.close(fd)
    test_db = DatabaseManager(db_path=path)

    with test_db.connection() as conn:
        conn.executescript(SCHEMA_SQL)
        conn.execute("INSERT INTO user_profiles (id, name) VALUES (?, ?)", (DEFAULT_USER_ID, "Prof WS"))
        conn.execute("INSERT INTO user_settings (user_id) VALUES (?)", (DEFAULT_USER_ID,))

    from backend.db import repositories
    repositories.db_manager = test_db

    with TestClient(app) as client:
        yield client

    try:
        os.remove(path)
    except OSError:
        pass

def test_device_websocket_lifecycle(ws_client):
    with ws_client.websocket_connect("/ws/device") as ws:
        # 1. Send device_hello handshake
        hello_msg = {
            "protocol_version": 1,
            "type": "device_hello",
            "event_id": "glove-test:1",
            "timestamp_ms": 1000,
            "payload": {
                "device_id": "glove-test",
                "hardware_version": "ESP32-DEV-V1",
                "firmware_version": "1.0.0",
                "mac_address": "AA:BB:CC:DD:EE:01",
                "capabilities": ["imu", "oled", "buttons"]
            }
        }
        ws.send_json(hello_msg)

        # Expect server_hello
        resp = ws.receive_json()
        assert resp["type"] == "server_hello"
        assert resp["protocol_version"] == 1
        assert "payload" in resp

        # 2. Send heartbeat
        hb_msg = {
            "protocol_version": 1,
            "type": "heartbeat",
            "event_id": "glove-test:2",
            "timestamp_ms": 4000,
            "payload": {
                "uptime_seconds": 4,
                "free_heap": 180000,
                "wifi_rssi": -45
            }
        }
        ws.send_json(hb_msg)

        # 3. Send button event
        btn_msg = {
            "protocol_version": 1,
            "type": "button_event",
            "event_id": "glove-test:3",
            "timestamp_ms": 4500,
            "payload": {
                "button": "ACTION",
                "action": "single_press",
                "mode": "CURSOR",
                "state": "RELEASED",
                "duration_ms": 110
            }
        }
        ws.send_json(btn_msg)

        # 4. Send slide nav gesture
        nav_msg = {
            "protocol_version": 1,
            "type": "slide_nav_gesture",
            "event_id": "glove-test:4",
            "timestamp_ms": 6000,
            "payload": {
                "direction": "NEXT",
                "tilt_angle": 26.5
            }
        }
        ws.send_json(nav_msg)

        # Device should receive display_notification about slide
        notice = ws.receive_json()
        assert notice["type"] == "display_notification"
        assert "Slide" in notice["payload"]["title"]
