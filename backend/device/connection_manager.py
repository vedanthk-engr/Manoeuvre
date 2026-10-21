"""
WebSocket Connection Manager
Maintains active connections for the ESP32 hardware device and desktop UI clients.
"""

from typing import Set, Optional, Dict, Any
from fastapi import WebSocket
from backend.core.logging import logger

class ConnectionManager:
    def __init__(self):
        self.device_socket: Optional[WebSocket] = None
        self.desktop_clients: Set[WebSocket] = set()
        self.active_device_info: Optional[Dict[str, Any]] = None

    async def connect_device(self, websocket: WebSocket):
        await websocket.accept()
        self.device_socket = websocket
        logger.info("[WS] Wearable Glove device connected.")

    def disconnect_device(self):
        self.device_socket = None
        self.active_device_info = None
        logger.info("[WS] Wearable Glove device disconnected.")

    async def connect_desktop(self, websocket: WebSocket):
        await websocket.accept()
        self.desktop_clients.add(websocket)
        logger.info(f"[WS] Desktop client connected. Total clients: {len(self.desktop_clients)}")

    def disconnect_desktop(self, websocket: WebSocket):
        self.desktop_clients.discard(websocket)
        logger.info(f"[WS] Desktop client disconnected. Remaining: {len(self.desktop_clients)}")

    async def send_to_device(self, message: dict):
        if self.device_socket:
            try:
                await self.device_socket.send_json(message)
            except Exception as e:
                logger.error(f"[WS] Failed to send message to device: {e}")

    async def broadcast_to_desktop(self, message: dict):
        dead_clients = set()
        for client in self.desktop_clients:
            try:
                await client.send_json(message)
            except Exception:
                dead_clients.add(client)
        self.desktop_clients.difference_update(dead_clients)

connection_manager = ConnectionManager()
