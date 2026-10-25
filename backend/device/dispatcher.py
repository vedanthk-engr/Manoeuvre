"""
Device Event Dispatcher
Processes incoming messages, validates schemas, normalizes legacy and protocol v1 events,
synthesizes cursor movement safely, and broadcasts updates to connected desktop clients.
"""

import time
from typing import Dict, Any, Optional
from backend.core.logging import logger
from backend.protocol.schemas import ProtocolEnvelope
from backend.device.connection_manager import connection_manager
from backend.device.input_controller import input_controller
from backend.presentation.controller import presentation_controller
from backend.db.repositories import (
    DeviceRepository, LectureSessionRepository, LectureEventRepository, AnnotationRepository
)

class DeviceDispatcher:
    def __init__(self):
        self.active_mode = "CURSOR"
        self.device_calibrated = False
        self.is_annotating = False
        self.last_event_time = 0

    async def handle_message(self, raw_data: dict):
        if not isinstance(raw_data, dict):
            logger.warning(f"[DISPATCH] Ignored non-dict message: {raw_data}")
            return

        # 1. Normalize message into canonical type and payload
        msg_type, payload, ts = self._normalize_message(raw_data)
        self.last_event_time = ts

        active_session = LectureSessionRepository.get_active()
        session_id = active_session["id"] if active_session else None

        # 2. Route by message type
        if msg_type in ["device_hello", "DEVICE_HELLO", "device_connected", "DEVICE_CONNECTED"]:
            await self._handle_hello(payload)
        elif msg_type in ["heartbeat", "HEARTBEAT"]:
            await self._handle_heartbeat(payload)
        elif msg_type in ["button_event", "BUTTON_EVENT"]:
            await self._handle_button(payload, session_id, ts)
        elif msg_type in ["cursor_click", "CURSOR_CLICK"]:
            input_controller.click()
            await connection_manager.broadcast_to_desktop({"type": "cursor_click", "payload": payload})
        elif msg_type in ["annotation_start", "ANNOTATION_START"]:
            await self._handle_annotation_start(payload, session_id, ts)
        elif msg_type in ["annotation_end", "ANNOTATION_END"]:
            await self._handle_annotation_end(payload, session_id, ts)
        elif msg_type in ["mode_change", "mode_changed", "MODE_CHANGED", "MODE_CHANGE"]:
            await self._handle_mode_change(payload, session_id, ts)
        elif msg_type in ["motion_update", "motion_event", "cursor_move", "CURSOR_MOVE"]:
            await self._handle_motion(payload)
        elif msg_type in ["slide_nav_gesture", "SLIDE_NEXT", "SLIDE_PREV", "CURSOR_GESTURE", "ANNOTATION_GESTURE", "HIGHLIGHT_GESTURE", "VOICE_GESTURE"]:
            await self._handle_slide_nav(payload, session_id, ts, msg_type)
        elif msg_type in ["device_status", "DEVICE_STATUS", "NEUTRAL_CALIBRATED"]:
            await self._handle_status(payload)
        elif msg_type in ["TEACHING_COACH_TOGGLE", "teaching_coach_toggle"]:
            await connection_manager.broadcast_to_desktop({"type": "teaching_coach_toggle", "payload": payload})
        else:
            logger.debug(f"[DISPATCH] Unhandled message type: {msg_type}")

    def _normalize_message(self, raw: dict) -> tuple[str, dict, int]:
        now_ms = int(time.time() * 1000)

        # Check if ProtocolEnvelope format
        if "protocol_version" in raw and "payload" in raw:
            return raw.get("type", "unknown"), raw.get("payload", {}), raw.get("timestamp_ms", now_ms)

        # Direct / Legacy bridge format: {"type": "...", ...} or {"event": "...", ...}
        raw_type = raw.get("type") or raw.get("event") or ""
        ts = raw.get("timestamp_ms") or raw.get("timestamp") or raw.get("millis") or now_ms

        payload = {k: v for k, v in raw.items() if k not in ["type", "event", "timestamp_ms", "timestamp", "millis"]}
        return raw_type, payload, int(ts)

    async def _handle_hello(self, payload: dict):
        device_id = payload.get("device_id", "glove-esp8266-01")
        mac = payload.get("mac_address", "ESP8266-MAC")
        hw = payload.get("hardware_version", "NodeMCU-ESP8266")
        fw = payload.get("firmware_version", "1.0.0")
        
        device = DeviceRepository.upsert_device(
            device_id=device_id,
            user_id="usr_default",
            device_name=f"Manoeuvre Glove ({device_id})",
            mac_address=mac,
            firmware_version=fw,
            hardware_version=hw
        )
        connection_manager.active_device_info = device
        logger.info(f"[DISPATCH] Device registered: {device_id} ({hw})")

        # Send server handshake ack
        pres_state = presentation_controller.get_state()
        server_hello = {
            "protocol_version": 1,
            "type": "server_hello",
            "event_id": "server:ack",
            "timestamp_ms": int(time.time() * 1000),
            "payload": {
                "session_active": LectureSessionRepository.get_active() is not None,
                "presentation_loaded": pres_state["presentation_loaded"],
                "slide_index": pres_state["current_slide_index"],
                "total_slides": pres_state["total_slides"],
                "active_mode": self.active_mode
            }
        }
        await connection_manager.send_to_device(server_hello)
        await connection_manager.broadcast_to_desktop({
            "type": "device_connected",
            "payload": device
        })

    async def _handle_heartbeat(self, payload: dict):
        if connection_manager.active_device_info:
            DeviceRepository.update_last_seen(connection_manager.active_device_info["id"])
        await connection_manager.broadcast_to_desktop({
            "type": "device_heartbeat",
            "payload": payload
        })

    async def _handle_button(self, payload: dict, session_id: Optional[str], ts: int):
        button = payload.get("button")
        action = payload.get("action")
        mode = payload.get("mode") or self.active_mode

        if session_id:
            LectureEventRepository.log_event(
                session_id=session_id,
                event_type="BUTTON_EVENT",
                slide_index=presentation_controller.current_slide_index,
                data=payload,
                timestamp_ms=ts
            )

        # Handle context-sensitive button actions
        if button == "ACTION":
            if mode == "CURSOR" and action in ["single_press", "click"]:
                await connection_manager.broadcast_to_desktop({"type": "toggle_zoom"})
            elif mode == "ANNOTATE":
                state = payload.get("state")
                if action in ["press_down", "press", "down"] or state == "PRESSED":
                    await self._handle_annotation_start(payload, session_id, ts)
                elif action in ["release", "single_press", "up"] or state == "RELEASED":
                    await self._handle_annotation_end(payload, session_id, ts)
                elif action == "double_press" and session_id:
                    AnnotationRepository.clear_for_slide(session_id, presentation_controller.current_slide_index)
                    await connection_manager.broadcast_to_desktop({
                        "type": "annotations_cleared",
                        "slide_index": presentation_controller.current_slide_index
                    })
        elif button == "MODE":
            if action in ["single_press", "click"]:
                modes = ["CURSOR", "ANNOTATE", "HIGHLIGHT", "VOICE"]
                idx = (modes.index(self.active_mode) + 1) % len(modes) if self.active_mode in modes else 0
                await self._handle_mode_change({"new_mode": modes[idx]}, session_id, ts)
            elif action == "long_press":
                await self._handle_mode_change({"new_mode": "SLIDE NAV"}, session_id, ts)
            elif action == "release" and self.active_mode == "SLIDE NAV":
                await self._handle_mode_change({"new_mode": "CURSOR"}, session_id, ts)

        # Forward button event to desktop for telemetry & button test bench
        await connection_manager.broadcast_to_desktop({
            "type": "button_event",
            "payload": payload
        })

    async def _handle_annotation_start(self, payload: dict, session_id: Optional[str], ts: int):
        self.is_annotating = True
        input_controller.mouse_down()
        logger.debug("[DISPATCH] Continuous annotation START")
        
        if session_id:
            LectureEventRepository.log_event(
                session_id=session_id,
                event_type="ANNOTATION_START",
                slide_index=presentation_controller.current_slide_index,
                data=payload,
                timestamp_ms=ts
            )

        await connection_manager.broadcast_to_desktop({
            "type": "annotation_start",
            "payload": {
                "slide_index": presentation_controller.current_slide_index,
                "timestamp_ms": ts
            }
        })

    async def _handle_annotation_end(self, payload: dict, session_id: Optional[str], ts: int):
        self.is_annotating = False
        input_controller.mouse_up()
        logger.debug("[DISPATCH] Continuous annotation END")

        if session_id:
            LectureEventRepository.log_event(
                session_id=session_id,
                event_type="ANNOTATION_END",
                slide_index=presentation_controller.current_slide_index,
                data=payload,
                timestamp_ms=ts
            )

        await connection_manager.broadcast_to_desktop({
            "type": "annotation_end",
            "payload": {
                "slide_index": presentation_controller.current_slide_index,
                "timestamp_ms": ts
            }
        })

    async def _handle_mode_change(self, payload: dict, session_id: Optional[str], ts: int):
        new_mode = payload.get("new_mode") or payload.get("mode") or payload.get("mode_name") or "CURSOR"
        old_mode = self.active_mode
        self.active_mode = new_mode

        # If transitioning out of ANNOTATE while stroke was active, immediately release mouse
        if old_mode == "ANNOTATE" and new_mode != "ANNOTATE" and self.is_annotating:
            logger.info("[DISPATCH] Mode exited ANNOTATE during active stroke. Releasing mouse button.")
            await self._handle_annotation_end({"reason": "mode_change"}, session_id, ts)

        if session_id:
            LectureEventRepository.log_event(
                session_id=session_id,
                event_type="MODE_CHANGE",
                slide_index=presentation_controller.current_slide_index,
                data={"old_mode": old_mode, "new_mode": new_mode},
                timestamp_ms=ts
            )

        await connection_manager.broadcast_to_desktop({
            "type": "mode_changed",
            "payload": {"old_mode": old_mode, "new_mode": new_mode}
        })

    async def _handle_motion(self, payload: dict):
        try:
            dx = float(payload.get("dx", 0.0))
            dy = float(payload.get("dy", 0.0))
        except (ValueError, TypeError):
            return

        # Sanity validation: reject NaN / Inf
        if not (-1000.0 <= dx <= 1000.0 and -1000.0 <= dy <= 1000.0):
            return

        precision = bool(payload.get("precision_mode", False))

        # Synthesize OS mouse move if glove or desktop is in CURSOR or ANNOTATE mode
        effective_mode = payload.get("mode") or self.active_mode
        if effective_mode in ["CURSOR", "ANNOTATE"]:
            input_controller.move_relative(dx, dy, precision_mode=precision)

        # Broadcast normalized cursor update to desktop clients (for on-canvas drawing & laser pointer)
        await connection_manager.broadcast_to_desktop({
            "type": "cursor_delta",
            "payload": {
                "dx": dx,
                "dy": dy,
                "pitch": float(payload.get("pitch", 0.0)),
                "roll": float(payload.get("roll", 0.0)),
                "precision_mode": precision,
                "is_annotating": self.is_annotating,
                "active_mode": self.active_mode
            }
        })

    async def _handle_slide_nav(self, payload: dict, session_id: Optional[str], ts: int, raw_type: str = ""):
        direction = payload.get("direction")
        if not direction:
            if raw_type == "SLIDE_NEXT": direction = "NEXT"
            elif raw_type == "SLIDE_PREV": direction = "PREVIOUS"
            else: direction = "NEXT"

        if direction == "NEXT":
            new_state = presentation_controller.next_slide()
        else:
            new_state = presentation_controller.prev_slide()

        if session_id:
            LectureEventRepository.log_event(
                session_id=session_id,
                event_type="SLIDE_CHANGE",
                slide_index=new_state["current_slide_index"],
                data={"direction": direction},
                timestamp_ms=ts
            )

        # Send slide info notice to device if connected
        await connection_manager.send_to_device({
            "protocol_version": 1,
            "type": "display_notification",
            "event_id": "nav:notice",
            "timestamp_ms": ts,
            "payload": {
                "title": f"Slide {new_state['current_slide_index']}/{new_state['total_slides']}",
                "duration_ms": 1000
            }
        })

        # Broadcast slide change to desktop
        await connection_manager.broadcast_to_desktop({
            "type": "presentation_state",
            "payload": new_state
        })

    async def _handle_status(self, payload: dict):
        self.device_calibrated = payload.get("calibrated", False)
        await connection_manager.broadcast_to_desktop({
            "type": "device_status",
            "payload": payload
        })

    async def handle_disconnect(self):
        """Called when glove socket disconnects."""
        logger.info("[DISPATCH] Glove disconnected. Performing safety cleanup.")
        if self.is_annotating:
            self.is_annotating = False
            input_controller.mouse_up()
            logger.info("[DISPATCH] Released stuck mouse button on disconnect.")

        if connection_manager.active_device_info:
            DeviceRepository.set_inactive(connection_manager.active_device_info["id"])

        await connection_manager.broadcast_to_desktop({
            "type": "device_disconnected"
        })

dispatcher = DeviceDispatcher()
