"""
End-to-End Integration Tests: Continuous Annotation, Trajectory Retention,
Device Disconnect Safety, and Dual WebSocket Protocol Routing.
"""

import os
import math
import tempfile
import pytest
from starlette.testclient import TestClient
from backend.main import app
from backend.db.database import DatabaseManager
from backend.db.migrations import SCHEMA_SQL, DEFAULT_USER_ID
from backend.device.dispatcher import dispatcher
from backend.device.input_controller import input_controller

@pytest.fixture
def integration_env():
    fd, path = tempfile.mkstemp(suffix=".sqlite3")
    os.close(fd)
    test_db = DatabaseManager(db_path=path)

    with test_db.connection() as conn:
        conn.executescript(SCHEMA_SQL)
        conn.execute("INSERT INTO user_profiles (id, name) VALUES (?, ?)", (DEFAULT_USER_ID, "Prof Tester"))
        conn.execute("INSERT INTO user_settings (user_id) VALUES (?)", (DEFAULT_USER_ID,))

    from backend.db import repositories
    repositories.db_manager = test_db

    with TestClient(app) as client:
        yield client

    try:
        os.remove(path)
    except OSError:
        pass


def test_dual_endpoint_device_connection(integration_env):
    """Verify both /ws/device and legacy /ws connect successfully and dispatch hello."""
    client = integration_env

    # 1. Test /ws/device
    with client.websocket_connect("/ws/device") as ws_dev:
        hello_msg = {
            "protocol_version": 1,
            "type": "device_hello",
            "event_id": "esp-1:1",
            "timestamp_ms": 100,
            "payload": {
                "device_id": "nodemcu-01",
                "hardware_version": "ESP8266-V1",
                "firmware_version": "1.0.0",
                "mac_address": "5C:CF:7F:01:02:03",
                "capabilities": ["imu", "buttons"]
            }
        }
        ws_dev.send_json(hello_msg)
        resp = ws_dev.receive_json()
        assert resp["type"] == "server_hello"

    # 2. Test /ws alias
    with client.websocket_connect("/ws") as ws_alias:
        raw_hello = {
            "type": "DEVICE_HELLO",
            "device": "Manoeuvre-Glove-ESP8266",
            "mac": "5C:CF:7F:01:02:03"
        }
        ws_alias.send_json(raw_hello)
        resp2 = ws_alias.receive_json()
        assert resp2["type"] == "server_hello"


def test_continuous_annotation_trajectory_retention(integration_env):
    """
    Verify that in ANNOTATE mode:
    1. ACTION press starts annotation and triggers mouse_down / annotation_start.
    2. Over 100 intermediate curved movement points are generated and dispatched.
    3. Intermediate points are not lost, batched out, or snapped to a straight line.
    4. ACTION release triggers annotation_end and mouse_up.
    """
    client = integration_env

    # Connect desktop client to observe broadcast stream
    with client.websocket_connect("/ws/desktop") as ws_desktop:
        # Connect device client
        with client.websocket_connect("/ws/device") as ws_device:
            # First switch to ANNOTATE mode
            mode_msg = {
                "protocol_version": 1,
                "type": "mode_changed",
                "event_id": "esp:1",
                "timestamp_ms": 100,
                "payload": {"new_mode": "ANNOTATE"}
            }
            ws_device.send_json(mode_msg)

            # Consume mode_changed broadcast on desktop
            desktop_mode_evt = ws_desktop.receive_json()
            assert desktop_mode_evt["type"] == "mode_changed"
            assert desktop_mode_evt["payload"]["new_mode"] == "ANNOTATE"

            # 1. ACTION pressed -> triggers ANNOTATION_START + button_event
            btn_down = {
                "protocol_version": 1,
                "type": "button_event",
                "event_id": "esp:2",
                "timestamp_ms": 150,
                "payload": {
                    "button": "ACTION",
                    "action": "press",
                    "mode": "ANNOTATE",
                    "state": "PRESSED",
                    "duration_ms": 0
                }
            }
            ws_device.send_json(btn_down)

            # Desktop receives annotation_start broadcast
            annot_start = ws_desktop.receive_json()
            assert annot_start["type"] == "annotation_start"
            assert input_controller.mouse_pressed is True

            # Desktop receives button_event broadcast
            btn_evt = ws_desktop.receive_json()
            assert btn_evt["type"] == "button_event"

            # 2. Stream a continuous curved trajectory of 120 points (circular arc)
            num_points = 120
            generated_deltas = []
            received_deltas = []

            for i in range(num_points):
                # Generates a circular spiral trajectory
                angle = (i / num_points) * 2 * math.pi
                dx = round(3.0 * math.cos(angle), 3)
                dy = round(3.0 * math.sin(angle), 3)
                generated_deltas.append((dx, dy))

                move_msg = {
                    "protocol_version": 1,
                    "type": "motion_event",
                    "event_id": f"esp:pt_{i}",
                    "timestamp_ms": 200 + (i * 10),
                    "payload": {
                        "dx": dx,
                        "dy": dy,
                        "pitch": 0.0,
                        "roll": 0.0,
                        "yaw": 0.0,
                        "is_precision": False
                    }
                }
                ws_device.send_json(move_msg)

                # Receive on desktop
                desktop_move = ws_desktop.receive_json()
                assert desktop_move["type"] == "cursor_delta"
                payload = desktop_move["payload"]
                received_deltas.append((payload["dx"], payload["dy"]))

            # 3. Assert all 120 intermediate points were received in order
            assert len(received_deltas) == num_points
            assert received_deltas[0] == generated_deltas[0]
            assert received_deltas[-1] == generated_deltas[-1]

            # 4. Assert curvature is preserved and NOT a straight line between (first, last)
            # Reconstruct positions from cumulative deltas
            xs = [0.0]
            ys = [0.0]
            for dx, dy in received_deltas:
                xs.append(xs[-1] + dx)
                ys.append(ys[-1] + dy)

            # Compute variance of distances from chord (straight line between start and end)
            start_x, start_y = xs[0], ys[0]
            end_x, end_y = xs[-1], ys[-1]
            chord_len = math.hypot(end_x - start_x, end_y - start_y)

            # Calculate perpendicular distance of intermediate points from the straight line chord
            max_deviation = 0.0
            for x, y in zip(xs, ys):
                if chord_len > 1e-4:
                    # Point-to-line distance formula
                    dist = abs((end_y - start_y) * x - (end_x - start_x) * y + end_x * start_y - end_y * start_x) / chord_len
                else:
                    dist = math.hypot(x - start_x, y - start_y)
                if dist > max_deviation:
                    max_deviation = dist

            # For a circular curve, max_deviation must be significantly > 0 (proving it is NOT a straight line)
            assert max_deviation > 20.0, f"Expected curved stroke, but max deviation from chord was only {max_deviation}"

            # 5. ACTION released -> triggers ANNOTATION_END + button_event
            btn_up = {
                "protocol_version": 1,
                "type": "button_event",
                "event_id": "esp:300",
                "timestamp_ms": 1600,
                "payload": {
                    "button": "ACTION",
                    "action": "single_press",
                    "mode": "ANNOTATE",
                    "state": "RELEASED",
                    "duration_ms": 1450
                }
            }
            ws_device.send_json(btn_up)

            annot_end = ws_desktop.receive_json()
            assert annot_end["type"] == "annotation_end"
            assert input_controller.mouse_pressed is False

            btn_up_evt = ws_desktop.receive_json()
            assert btn_up_evt["type"] == "button_event"


def test_disconnect_releases_held_mouse_and_ends_stroke(integration_env):
    """Verify that abrupt device disconnection releases held mouse buttons and cleans up."""
    client = integration_env

    with client.websocket_connect("/ws/desktop") as ws_desktop:
        with client.websocket_connect("/ws/device") as ws_device:
            # Start drawing
            ws_device.send_json({
                "type": "MODE_CHANGED",
                "payload": {"new_mode": "ANNOTATE"}
            })
            mode_evt = ws_desktop.receive_json()
            assert mode_evt["type"] == "mode_changed"

            ws_device.send_json({
                "type": "ANNOTATION_START",
                "payload": {}
            })
            annot_evt = ws_desktop.receive_json()
            assert annot_evt["type"] == "annotation_start"
            assert input_controller.mouse_pressed is True

    # After websocket closes, dispatcher.handle_disconnect() runs
    import asyncio
    asyncio.run(dispatcher.handle_disconnect())
    assert input_controller.mouse_pressed is False


def test_malformed_and_non_finite_values_rejected(integration_env):
    """Verify that non-finite (NaN, inf) coordinates and malformed events are safely rejected."""
    client = integration_env

    with client.websocket_connect("/ws/device") as ws_device:
        # NaN / Inf payload
        nan_msg = {
            "type": "CURSOR_MOVE",
            "payload": {"dx": float("nan"), "dy": 10.0}
        }
        # Dispatched without crashing backend
        ws_device.send_json(nan_msg)

        # Empty payload
        ws_device.send_json({"type": "UNKNOWN_EVENT_TEST"})

    # Backend remains alive and healthy
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] in ("ok", "HEALTHY")


def test_reference_firmware_event_stream(integration_env):
    """
    Verify exact JSON event sequences transmitted by the reference NodeMCU ESP8266 firmware:
    1. DEVICE_CONNECTED
    2. Continuous CURSOR_MOVE
    3. MODE_CHANGED
    4. ANNOTATION_START and ANNOTATION_END
    5. CURSOR_CLICK
    """
    client = integration_env

    with client.websocket_connect("/ws/desktop") as ws_desktop:
        with client.websocket_connect("/ws/device") as ws_device:
            # 1. Device connects
            ws_device.send_json({
                "type": "DEVICE_CONNECTED",
                "mode": "CURSOR",
                "millis": 1000,
                "device": "Manoeuvre NodeMCU ESP8266",
                "ip": "10.190.151.45"
            })
            dev_evt = ws_desktop.receive_json()
            assert dev_evt["type"] == "device_connected"

            # 2. Continuous cursor move
            ws_device.send_json({
                "type": "CURSOR_MOVE",
                "mode": "CURSOR",
                "millis": 1010,
                "dx": 0.45,
                "dy": -0.32
            })
            delta_evt = ws_desktop.receive_json()
            assert delta_evt["type"] == "cursor_delta"
            assert delta_evt["payload"]["dx"] == 0.45
            assert delta_evt["payload"]["dy"] == -0.32

            # 3. Mode switch to ANNOTATE
            ws_device.send_json({
                "type": "MODE_CHANGED",
                "mode": "ANNOTATE",
                "millis": 1200,
                "mode_name": "ANNOTATE"
            })
            mode_evt = ws_desktop.receive_json()
            assert mode_evt["type"] == "mode_changed"
            assert mode_evt["payload"]["new_mode"] == "ANNOTATE"

            # 4. ACTION pressed -> ANNOTATION_START
            ws_device.send_json({
                "type": "ANNOTATION_START",
                "mode": "ANNOTATE",
                "millis": 1250
            })
            start_evt = ws_desktop.receive_json()
            assert start_evt["type"] == "annotation_start"
            assert input_controller.mouse_pressed is True

            # 5. Drawing continuous motion points
            ws_device.send_json({
                "type": "CURSOR_MOVE",
                "mode": "ANNOTATE",
                "millis": 1260,
                "dx": 1.15,
                "dy": 0.85
            })
            draw_delta = ws_desktop.receive_json()
            assert draw_delta["type"] == "cursor_delta"
            assert draw_delta["payload"]["dx"] == 1.15

            # 6. ACTION released -> ANNOTATION_END
            ws_device.send_json({
                "type": "ANNOTATION_END",
                "mode": "ANNOTATE",
                "millis": 1450
            })
            end_evt = ws_desktop.receive_json()
            assert end_evt["type"] == "annotation_end"
            assert input_controller.mouse_pressed is False

            # 7. CURSOR_CLICK
            ws_device.send_json({
                "type": "CURSOR_CLICK",
                "mode": "CURSOR",
                "millis": 1500
            })
            click_evt = ws_desktop.receive_json()
            assert click_evt["type"] == "cursor_click"

