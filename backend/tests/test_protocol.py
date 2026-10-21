"""
Unit Tests: Canonical Protocol v1 Message Schemas
"""

import pytest
from pydantic import ValidationError
from backend.protocol.schemas import (
    ProtocolEnvelope, ButtonEventPayload, MotionUpdatePayload,
    ModeChangePayload, SlideNavGesturePayload, DeviceHelloPayload,
    HeartbeatPayload, ServerHelloPayload
)

def test_valid_envelope():
    env = ProtocolEnvelope(
        protocol_version=1,
        type="button_event",
        event_id="glove-01:1",
        timestamp_ms=1000,
        payload={"button": "ACTION", "action": "single_press"}
    )
    assert env.protocol_version == 1
    assert env.type == "button_event"
    assert env.event_id == "glove-01:1"

def test_button_event_payload():
    payload = ButtonEventPayload(
        button="ACTION",
        action="single_press",
        mode="CURSOR",
        state="RELEASED",
        duration_ms=120
    )
    assert payload.button == "ACTION"
    assert payload.action == "single_press"
    assert payload.duration_ms == 120

def test_invalid_button_event():
    with pytest.raises(ValidationError):
        ButtonEventPayload(
            button="INVALID_BTN", # Must be MODE, ACTION, or SYSTEM
            action="single_press"
        )

def test_motion_update_payload():
    motion = MotionUpdatePayload(
        dx=2.5,
        dy=-1.8,
        pitch=5.2,
        roll=-3.1,
        precision_mode=True
    )
    assert motion.dx == 2.5
    assert motion.dy == -1.8
    assert motion.precision_mode is True

def test_slide_nav_gesture():
    nav = SlideNavGesturePayload(direction="NEXT", tilt_angle=25.4)
    assert nav.direction == "NEXT"
    assert nav.tilt_angle == 25.4

    with pytest.raises(ValidationError):
        SlideNavGesturePayload(direction="UPWARD") # Must be NEXT or PREVIOUS

def test_device_hello_and_server_hello():
    hello = DeviceHelloPayload(
        device_id="glove-test",
        capabilities=["imu", "oled"]
    )
    assert hello.device_id == "glove-test"
    assert "imu" in hello.capabilities

    ack = ServerHelloPayload(
        session_active=True,
        slide_index=4,
        total_slides=20
    )
    assert ack.session_active is True
    assert ack.slide_index == 4
