"""
Device Event Dispatcher
Processes incoming messages, validates schemas, updates database state,
synthesizes cursor movement, and broadcasts updates to connected desktop clients.
"""

from typing import Dict, Any
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

    async def handle_message(self, raw_data: dict):
        try:
            envelope = ProtocolEnvelope(**raw_data)
        except Exception as e:
            logger.warning(f"[DISPATCH] Malformed protocol message: {e}")
            return

        msg_type = envelope.type
        payload = envelope.payload
        ts = envelope.timestamp_ms

        active_session = LectureSessionRepository.get_active()
        session_id = active_session["id"] if active_session else None

        # Route by message type
        if msg_type == "device_hello":
            await self._handle_hello(payload)
        elif msg_type == "heartbeat":
            await self._handle_heartbeat(payload)
        elif msg_type == "button_event":
            await self._handle_button(payload, session_id, ts)
        elif msg_type == "mode_change":
            await self._handle_mode_change(payload, session_id, ts)
        elif msg_type == "motion_update":
            await self._handle_motion(payload)
        elif msg_type == "slide_nav_gesture":
            await self._handle_slide_nav(payload, session_id, ts)
        elif msg_type == "device_status":
            await self._handle_status(payload)
        else:
            logger.info(f"[DISPATCH] Unknown message type: {msg_type}")

    async def _handle_hello(self, payload: dict):
        device_id = payload.get("device_id", "glove-01")
        mac = payload.get("mac_address")
        hw = payload.get("hardware_version")
        fw = payload.get("firmware_version")
        
        device = DeviceRepository.upsert_device(
            device_id=device_id,
            user_id="usr_default",
            device_name=f"Manoeuvre Glove ({device_id})",
            mac_address=mac,
            firmware_version=fw,
            hardware_version=hw
        )
        connection_manager.active_device_info = device
        logger.info(f"[DISPATCH] Device registered: {device_id}")

        # Send server handshake ack
        pres_state = presentation_controller.get_state()
        server_hello = {
            "protocol_version": 1,
            "type": "server_hello",
            "event_id": "server:ack",
            "timestamp_ms": 0,
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

    async def _handle_button(self, payload: dict, session_id: str, ts: int):
        button = payload.get("button")
        action = payload.get("action")
        mode = payload.get("mode")

        if session_id:
            LectureEventRepository.log_event(
                session_id=session_id,
                event_type="BUTTON_EVENT",
                slide_index=presentation_controller.current_slide_index,
                data=payload,
                timestamp_ms=ts
            )

        # Handle button actions
        if button == "ACTION":
            if mode == "CURSOR" and action == "single_press":
                # Toggle Zoom notification
                await connection_manager.broadcast_to_desktop({"type": "toggle_zoom"})
            elif mode == "ANNOTATE":
                if action == "press_down":
                    input_controller.mouse_down()
                elif action == "release":
                    input_controller.mouse_up()
                elif action == "double_press" and session_id:
                    AnnotationRepository.clear_for_slide(session_id, presentation_controller.current_slide_index)
                    await connection_manager.broadcast_to_desktop({
                        "type": "annotations_cleared",
                        "slide_index": presentation_controller.current_slide_index
                    })

        # Broadcast button event to desktop for live button test panel
        await connection_manager.broadcast_to_desktop({
            "type": "button_event",
            "payload": payload
        })

    async def _handle_mode_change(self, payload: dict, session_id: str, ts: int):
        self.active_mode = payload.get("new_mode", "CURSOR")
        if session_id:
            LectureEventRepository.log_event(
                session_id=session_id,
                event_type="MODE_CHANGE",
                slide_index=presentation_controller.current_slide_index,
                data=payload,
                timestamp_ms=ts
            )
        await connection_manager.broadcast_to_desktop({
            "type": "mode_changed",
            "payload": payload
        })

    async def _handle_motion(self, payload: dict):
        if self.active_mode in ["CURSOR", "ANNOTATE"]:
            dx = float(payload.get("dx", 0.0))
            dy = float(payload.get("dy", 0.0))
            precision = bool(payload.get("precision_mode", False))
            input_controller.move_relative(dx, dy, precision_mode=precision)
            # Also forward to desktop overlay for laser pointer visualization
            await connection_manager.broadcast_to_desktop({
                "type": "cursor_delta",
                "payload": payload
            })

    async def _handle_slide_nav(self, payload: dict, session_id: str, ts: int):
        direction = payload.get("direction")
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

        # Notify device display
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

dispatcher = DeviceDispatcher()
