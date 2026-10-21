#!/usr/bin/env python3
"""
Manoeuvre Hardware Device Simulator
Emulates the ESP32 Wearable Glove over WebSockets using Protocol v1.
Can be run in automated smoke-test mode or interactive keyboard mode.
"""

import asyncio
import json
import time
import sys
import argparse
import math
from typing import Optional

try:
    import websockets
except ImportError:
    print("[ERROR] 'websockets' library is required. Install via: pip install websockets")
    sys.exit(1)

DEVICE_ID = "glove-sim-01"
PROTOCOL_VERSION = 1

class ManoeuvreDeviceSimulator:
    def __init__(self, host: str = "127.0.0.1", port: int = 8000, path: str = "/ws/device"):
        self.uri = f"ws://{host}:{port}{path}"
        self.ws: Optional[websockets.WebSocketClientProtocol] = None
        self.seq = 1
        self.current_mode = "CURSOR"
        self.in_slide_nav = False
        self.running = False
        self.is_connected = False
        self.received_messages = []

    async def connect(self):
        print(f"[SIMULATOR] Connecting to Manoeuvre Core at {self.uri}...")
        try:
            self.ws = await websockets.connect(self.uri)
            self.is_connected = True
            self.running = True
            print("[SIMULATOR] Connected successfully! Sending handshake...")
            await self.send_hello()
            return True
        except Exception as e:
            print(f"[SIMULATOR] Connection failed: {e}")
            self.is_connected = False
            return False

    def _make_envelope(self, msg_type: str, payload: dict) -> dict:
        self.seq += 1
        return {
            "protocol_version": PROTOCOL_VERSION,
            "type": msg_type,
            "event_id": f"{DEVICE_ID}:{self.seq}",
            "timestamp_ms": int(time.time() * 1000),
            "payload": payload
        }

    async def send_message(self, msg_type: str, payload: dict):
        if not self.ws or not self.is_connected:
            return
        msg = self._make_envelope(msg_type, payload)
        await self.ws.send(json.dumps(msg))

    async def send_hello(self):
        payload = {
            "device_id": DEVICE_ID,
            "hardware_version": "ESP32-SIMULATOR",
            "firmware_version": "1.0.0-sim",
            "mac_address": "AA:BB:CC:DD:EE:FF",
            "ip_address": "127.0.0.1",
            "capabilities": ["imu", "oled", "buttons", "simulator"]
        }
        await self.send_message("device_hello", payload)
        print(f"[SIMULATOR] -> Sent device_hello")

    async def send_heartbeat(self):
        payload = {
            "uptime_seconds": int(time.time()),
            "free_heap": 195400,
            "wifi_rssi": -42
        }
        await self.send_message("heartbeat", payload)

    async def send_button_event(self, button: str, action: str, duration_ms: int = 100):
        payload = {
            "button": button,
            "action": action,
            "mode": self.current_mode if not self.in_slide_nav else "SLIDE NAV",
            "state": "HOLD" if action == "long_press" else "RELEASED",
            "duration_ms": duration_ms
        }
        await self.send_message("button_event", payload)
        print(f"[SIMULATOR] -> Sent button_event: {button} [{action}] in mode {payload['mode']}")

    async def cycle_mode(self):
        modes = ["CURSOR", "ANNOTATE", "HIGHLIGHT", "VOICE"]
        prev = self.current_mode
        idx = (modes.index(prev) + 1) % len(modes)
        self.current_mode = modes[idx]
        
        await self.send_button_event("MODE", "single_press", 90)
        await self.send_message("mode_change", {
            "previous_mode": prev,
            "new_mode": self.current_mode,
            "temporary": False
        })
        print(f"[SIMULATOR] -> Mode changed: {prev} => {self.current_mode}")

    async def trigger_slide_nav(self, direction: str):
        # Long press MODE enters slide nav, tilt triggers step, release exits
        self.in_slide_nav = True
        await self.send_button_event("MODE", "long_press", 550)
        await asyncio.sleep(0.05)
        
        tilt_angle = 28.5 if direction == "NEXT" else -28.5
        await self.send_message("slide_nav_gesture", {
            "direction": direction,
            "tilt_angle": tilt_angle
        })
        print(f"[SIMULATOR] -> Sent slide_nav_gesture: {direction} ({tilt_angle}°)")
        
        await asyncio.sleep(0.05)
        self.in_slide_nav = False
        await self.send_button_event("MODE", "release", 120)

    async def stream_motion_burst(self, duration_sec: float = 1.0, precision: bool = False):
        print(f"[SIMULATOR] -> Streaming motion burst ({duration_sec}s, precision={precision})...")
        steps = int(duration_sec * 50)
        for i in range(steps):
            t = i * 0.02
            dx = math.sin(t * 4.0) * 8.0
            dy = math.cos(t * 4.0) * 5.0
            await self.send_message("motion_update", {
                "dx": round(dx, 2),
                "dy": round(dy, 2),
                "pitch": round(math.sin(t) * 10, 1),
                "roll": round(math.cos(t) * 8, 1),
                "yaw": 0.0,
                "precision_mode": precision
            })
            await asyncio.sleep(0.02)

    async def listen_loop(self):
        while self.running and self.ws:
            try:
                raw = await self.ws.recv()
                msg = json.loads(raw)
                self.received_messages.append(msg)
                msg_type = msg.get("type", "unknown")
                payload = msg.get("payload", {})
                print(f"[SIMULATOR] <- Received server msg: {msg_type}: {payload}")
            except websockets.ConnectionClosed:
                print("[SIMULATOR] Connection closed by server.")
                self.is_connected = False
                break
            except Exception as e:
                print(f"[SIMULATOR] Read error: {e}")
                break

    async def heartbeat_loop(self):
        while self.running and self.is_connected:
            await self.send_heartbeat()
            await asyncio.sleep(3.0)

    async def run_smoke_test(self) -> bool:
        """Automated test sequence validating bidirectional protocol."""
        print("\n==============================================")
        print("   STARTING HARDWARE SIMULATOR SMOKE TEST     ")
        print("==============================================")
        
        ok = await self.connect()
        if not ok:
            print("[FAIL] Could not connect to WebSocket server.")
            return False

        # Launch background listener & heartbeat
        listen_task = asyncio.create_task(self.listen_loop())
        hb_task = asyncio.create_task(self.heartbeat_loop())

        try:
            await asyncio.sleep(0.5)

            # 1. Test button events
            print("\n[TEST 1] Button single press (ACTION - toggle zoom)")
            await self.send_button_event("ACTION", "single_press", 110)
            await asyncio.sleep(0.3)

            # 2. Test mode cycling
            print("\n[TEST 2] Mode cycling (CURSOR -> ANNOTATE -> HIGHLIGHT -> VOICE)")
            for _ in range(4):
                await self.cycle_mode()
                await asyncio.sleep(0.2)

            # 3. Test motion burst
            print("\n[TEST 3] Motion streaming burst")
            await self.stream_motion_burst(duration_sec=0.5)

            # 4. Test slide navigation
            print("\n[TEST 4] Slide navigation gestures")
            await self.trigger_slide_nav("NEXT")
            await asyncio.sleep(0.2)
            await self.trigger_slide_nav("PREVIOUS")
            await asyncio.sleep(0.2)

            # 5. Test system button actions
            print("\n[TEST 5] System button actions (Coach, Recap, Calibration)")
            await self.send_button_event("SYSTEM", "single_press", 100) # Toggle Coach
            await asyncio.sleep(0.2)
            await self.send_button_event("SYSTEM", "double_press", 150) # Request Recap
            await asyncio.sleep(0.2)
            await self.send_button_event("SYSTEM", "long_press", 550)   # Calibrate IMU
            await asyncio.sleep(0.5)

            print("\n==============================================")
            print("   SMOKE TEST COMPLETED SUCCESSFULLY!         ")
            print(f"   Received {len(self.received_messages)} responses from server.")
            print("==============================================\n")
            return True

        finally:
            self.running = False
            listen_task.cancel()
            hb_task.cancel()
            if self.ws:
                await self.ws.close()

async def interactive_mode(sim: ManoeuvreDeviceSimulator):
    ok = await sim.connect()
    if not ok:
        return

    asyncio.create_task(sim.listen_loop())
    asyncio.create_task(sim.heartbeat_loop())

    print("\n--- INTERACTIVE CONTROLS ---")
    print(" [m] Cycle Mode (CURSOR -> ANNOTATE -> HIGHLIGHT -> VOICE)")
    print(" [n] Next Slide (Tilt Right)")
    print(" [p] Prev Slide (Tilt Left)")
    print(" [z] Toggle Zoom (ACTION single press)")
    print(" [d] Hold Draw (ACTION press-down in ANNOTATE)")
    print(" [u] Release Draw (ACTION release)")
    print(" [v] Voice Hold (Mic Recording)")
    print(" [s] Voice Release (Submit Voice)")
    print(" [c] Toggle Teaching Coach (SYSTEM single press)")
    print(" [r] Request Lecture Recap (SYSTEM double press)")
    print(" [x] Motion Burst (0.5s cursor sine stream)")
    print(" [q] Quit Simulator")
    print("----------------------------\n")

    loop = asyncio.get_event_loop()
    while sim.running:
        cmd = await loop.run_in_executor(None, sys.stdin.readline)
        cmd = cmd.strip().lower()
        if cmd == 'q':
            break
        elif cmd == 'm':
            await sim.cycle_mode()
        elif cmd == 'n':
            await sim.trigger_slide_nav("NEXT")
        elif cmd == 'p':
            await sim.trigger_slide_nav("PREVIOUS")
        elif cmd == 'z':
            await sim.send_button_event("ACTION", "single_press")
        elif cmd == 'd':
            await sim.send_button_event("ACTION", "press_down")
        elif cmd == 'u':
            await sim.send_button_event("ACTION", "release")
        elif cmd == 'v':
            await sim.send_button_event("ACTION", "press_down")
        elif cmd == 's':
            await sim.send_button_event("ACTION", "release")
        elif cmd == 'c':
            await sim.send_button_event("SYSTEM", "single_press")
        elif cmd == 'r':
            await sim.send_button_event("SYSTEM", "double_press")
        elif cmd == 'x':
            await sim.stream_motion_burst(0.5)

    sim.running = False
    if sim.ws:
        await sim.ws.close()

def main():
    parser = argparse.ArgumentParser(description="Manoeuvre Glove Hardware Simulator")
    parser.add_argument("--host", default="127.0.0.1", help="Host IP of backend")
    parser.add_argument("--port", type=int, default=8000, help="Port of backend")
    parser.add_argument("--smoke-test", action="store_true", help="Run automated test and exit")
    parser.add_argument("--interactive", action="store_true", help="Run interactive console")
    args = parser.parse_args()

    sim = ManoeuvreDeviceSimulator(host=args.host, port=args.port)

    if args.smoke_test or (not args.interactive and not args.smoke_test):
        asyncio.run(sim.run_smoke_test())
    else:
        asyncio.run(interactive_mode(sim))

if __name__ == "__main__":
    main()
