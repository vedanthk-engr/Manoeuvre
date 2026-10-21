"""
Native Windows Cursor and Input Controller
Synthesizes relative mouse cursor motion and clicks using Win32 API SendInput / mouse_event.
Includes sensitivity scaling, dead-zone suppression, smoothing, and safety clamps.
"""

import sys
import math
from typing import Optional
from backend.core.logging import logger
from backend.core.config import settings

# Win32 Mouse Flags
MOUSEEVENTF_MOVE = 0x0001
MOUSEEVENTF_LEFTDOWN = 0x0002
MOUSEEVENTF_LEFTUP = 0x0004
MOUSEEVENTF_RIGHTDOWN = 0x0008
MOUSEEVENTF_RIGHTUP = 0x0010

class InputController:
    def __init__(self):
        self.is_windows = sys.platform == "win32"
        self.enabled = settings.ENABLE_VIRTUAL_CURSOR
        self.sensitivity = settings.DEFAULT_CURSOR_SENSITIVITY
        self.dead_zone = settings.DEFAULT_CURSOR_DEAD_ZONE
        self.smoothing = settings.DEFAULT_CURSOR_SMOOTHING
        
        self._prev_dx = 0.0
        self._prev_dy = 0.0
        self._user32 = None

        if self.is_windows:
            try:
                import ctypes
                self._user32 = ctypes.windll.user32
                logger.info("[INPUT] Native Win32 SendInput controller initialized.")
            except Exception as e:
                logger.warning(f"[INPUT] Win32 API binding failed: {e}. Falling back to virtual simulation.")
                self.is_windows = False
        else:
            logger.info("[INPUT] Non-Windows OS detected. Running in virtual input mode.")

    def set_config(self, sensitivity: Optional[float] = None, dead_zone: Optional[float] = None,
                   smoothing: Optional[float] = None, enabled: Optional[bool] = None):
        if sensitivity is not None: self.sensitivity = max(0.1, min(5.0, sensitivity))
        if dead_zone is not None: self.dead_zone = max(0.0, min(1.0, dead_zone))
        if smoothing is not None: self.smoothing = max(0.0, min(0.95, smoothing))
        if enabled is not None: self.enabled = enabled

    def move_relative(self, dx: float, dy: float, precision_mode: bool = False):
        if not self.enabled:
            return

        # Dead-zone check
        mag = math.sqrt(dx * dx + dy * dy)
        if mag < self.dead_zone:
            return

        # Precision mode dampening
        scale = self.sensitivity * (0.35 if precision_mode else 1.0)
        target_dx = dx * scale
        target_dy = dy * scale

        # Low-pass smoothing
        smooth_dx = (self.smoothing * self._prev_dx) + ((1.0 - self.smoothing) * target_dx)
        smooth_dy = (self.smoothing * self._prev_dy) + ((1.0 - self.smoothing) * target_dy)

        self._prev_dx = smooth_dx
        self._prev_dy = smooth_dy

        int_dx = int(round(smooth_dx))
        int_dy = int(round(smooth_dy))

        if int_dx == 0 and int_dy == 0:
            return

        if self.is_windows and self._user32:
            try:
                self._user32.mouse_event(MOUSEEVENTF_MOVE, int_dx, int_dy, 0, 0)
            except Exception as e:
                logger.error(f"[INPUT] Win32 mouse_event error: {e}")

    def mouse_down(self):
        if not self.enabled: return
        if self.is_windows and self._user32:
            try:
                self._user32.mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
            except Exception as e:
                logger.error(f"[INPUT] Win32 mouse_down error: {e}")

    def mouse_up(self):
        if not self.enabled: return
        if self.is_windows and self._user32:
            try:
                self._user32.mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
            except Exception as e:
                logger.error(f"[INPUT] Win32 mouse_up error: {e}")

    def click(self):
        self.mouse_down()
        self.mouse_up()

input_controller = InputController()
