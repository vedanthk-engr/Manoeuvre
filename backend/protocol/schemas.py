"""
Manoeuvre Canonical Communication Protocol v1 Schemas
Pydantic v2 models validating all incoming and outgoing messages.
"""

from typing import Literal, Optional, Any, List, Union
from pydantic import BaseModel, Field

PROTOCOL_VERSION = 1

# -------------------------------------------------------------
# Base Envelope
# -------------------------------------------------------------
class ProtocolEnvelope(BaseModel):
    protocol_version: int = Field(default=PROTOCOL_VERSION, description="Must equal 1")
    type: str = Field(description="Message type identifier")
    event_id: str = Field(description="Unique message event sequence ID")
    timestamp_ms: int = Field(description="Timestamp in monotonic or epoch ms")
    payload: dict[str, Any] = Field(default_factory=dict, description="Type-specific payload")

# -------------------------------------------------------------
# Device to Desktop Payloads
# -------------------------------------------------------------
class DeviceHelloPayload(BaseModel):
    device_id: str = "glove-01"
    hardware_version: str = "ESP32-DEV-V1"
    firmware_version: str = "1.0.0"
    mac_address: Optional[str] = None
    ip_address: Optional[str] = None
    capabilities: List[str] = Field(default_factory=lambda: ["imu", "oled", "buttons"])

class HeartbeatPayload(BaseModel):
    uptime_seconds: int = 0
    free_heap: Optional[int] = None
    wifi_rssi: Optional[int] = None

class ButtonEventPayload(BaseModel):
    button: Literal["MODE", "ACTION", "SYSTEM"]
    action: Literal["single_press", "double_press", "long_press", "press_down", "release"]
    mode: str = "CURSOR"
    state: Literal["PRESSED", "RELEASED", "HOLD", "NONE"] = "RELEASED"
    duration_ms: int = 0

class ModeChangePayload(BaseModel):
    previous_mode: str
    new_mode: str
    temporary: bool = False

class MotionUpdatePayload(BaseModel):
    dx: float = 0.0
    dy: float = 0.0
    pitch: float = 0.0
    roll: float = 0.0
    yaw: float = 0.0
    precision_mode: bool = False

class SlideNavGesturePayload(BaseModel):
    direction: Literal["NEXT", "PREVIOUS"]
    tilt_angle: float = 0.0

class DeviceStatusPayload(BaseModel):
    wifi_connected: bool = True
    ws_connected: bool = True
    calibrated: bool = True
    battery_percent: Optional[float] = None
    current_mode: str = "CURSOR"

# -------------------------------------------------------------
# Desktop to Device Payloads
# -------------------------------------------------------------
class ServerHelloPayload(BaseModel):
    session_active: bool = False
    presentation_loaded: bool = False
    slide_index: int = 0
    total_slides: int = 0
    active_mode: str = "CURSOR"

class ConfigureDevicePayload(BaseModel):
    sensitivity: Optional[float] = None
    dead_zone: Optional[float] = None
    smoothing: Optional[float] = None
    long_press_ms: Optional[int] = None

class SetModePayload(BaseModel):
    target_mode: Literal["CURSOR", "ANNOTATE", "HIGHLIGHT", "VOICE"]

class DisplayNotificationPayload(BaseModel):
    title: str
    subtitle: Optional[str] = None
    duration_ms: int = 2000
