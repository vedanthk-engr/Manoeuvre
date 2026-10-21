# Manoeuvre Device Communication Protocol Specification

**Protocol Version**: `1`  
**Transport**: WebSocket over Wi-Fi (TCP)  
**Encoding**: JSON UTF-8  
**Endpoint**: `ws://<desktop-ip>:8000/ws/device`

---

## 1. Message Envelope

Every message sent across the WebSocket connection—in both device-to-desktop and desktop-to-device directions—must strictly adhere to the standard envelope format:

```json
{
  "protocol_version": 1,
  "type": "string",
  "event_id": "string",
  "timestamp_ms": 123456789,
  "payload": {}
}
```

### Fields:
- `protocol_version` (`integer`, required): Must equal `1`. Messages with unsupported protocol versions are rejected.
- `type` (`string`, required): Canonical event or command type identifier.
- `event_id` (`string`, required): Monotonic sequence string `<device_id>:<seq_number>` or UUID to prevent duplicate processing.
- `timestamp_ms` (`integer`, required): Monotonic milliseconds from boot (device clock) or epoch milliseconds (host).
- `payload` (`object`, required): Event-specific dictionary.

---

## 2. Device to Desktop Message Types

### 2.1 Handshake (`device_hello`)
Sent by the glove immediately upon establishing the WebSocket connection:
```json
{
  "protocol_version": 1,
  "type": "device_hello",
  "event_id": "glove-01:1",
  "timestamp_ms": 2500,
  "payload": {
    "device_id": "glove-01",
    "hardware_version": "ESP32-DEV-V1",
    "firmware_version": "1.0.0",
    "mac_address": "24:6F:28:XX:XX:XX",
    "ip_address": "192.168.1.150",
    "capabilities": ["imu", "oled", "buttons"]
  }
}
```

### 2.2 Heartbeat (`heartbeat`)
Sent periodically (every 3000ms) to maintain connection liveness:
```json
{
  "protocol_version": 1,
  "type": "heartbeat",
  "event_id": "glove-01:42",
  "timestamp_ms": 32500,
  "payload": {
    "uptime_seconds": 32,
    "free_heap": 184520,
    "wifi_rssi": -58
  }
}
```

### 2.3 Button Event (`button_event`)
Sent when a button transition is detected (single press, double press, long press, hold, release):
```json
{
  "protocol_version": 1,
  "type": "button_event",
  "event_id": "glove-01:105",
  "timestamp_ms": 45100,
  "payload": {
    "button": "ACTION",
    "action": "single_press",
    "mode": "CURSOR",
    "state": "RELEASED",
    "duration_ms": 120
  }
}
```
Supported `button` values: `"MODE"`, `"ACTION"`, `"SYSTEM"`.  
Supported `action` values: `"single_press"`, `"double_press"`, `"long_press"`, `"press_down"`, `"release"`.

### 2.4 Mode Change (`mode_change`)
Sent when the primary mode changes:
```json
{
  "protocol_version": 1,
  "type": "mode_change",
  "event_id": "glove-01:106",
  "timestamp_ms": 45150,
  "payload": {
    "previous_mode": "CURSOR",
    "new_mode": "ANNOTATE",
    "temporary": false
  }
}
```
Supported modes: `"CURSOR"`, `"ANNOTATE"`, `"HIGHLIGHT"`, `"VOICE"`, `"SLIDE_NAV"`.

### 2.5 Motion Stream (`motion_update`)
Sent while in `CURSOR` mode or during continuous gestures. Rate-limited to 50Hz (20ms interval):
```json
{
  "protocol_version": 1,
  "type": "motion_update",
  "event_id": "glove-01:542",
  "timestamp_ms": 48200,
  "payload": {
    "dx": 3.45,
    "dy": -1.20,
    "pitch": 4.2,
    "roll": -1.5,
    "yaw": 0.3,
    "precision_mode": false
  }
}
```

### 2.6 Slide Navigation Gesture (`slide_nav_gesture`)
Sent during temporary slide navigation when pitch/roll tilt crosses threshold:
```json
{
  "protocol_version": 1,
  "type": "slide_nav_gesture",
  "event_id": "glove-01:610",
  "timestamp_ms": 52300,
  "payload": {
    "direction": "NEXT",
    "tilt_angle": 28.4
  }
}
```
Supported directions: `"NEXT"`, `"PREVIOUS"`.

### 2.7 Device Status (`device_status`)
Sent periodically or on state change:
```json
{
  "protocol_version": 1,
  "type": "device_status",
  "event_id": "glove-01:611",
  "timestamp_ms": 52400,
  "payload": {
    "wifi_connected": true,
    "ws_connected": true,
    "calibrated": true,
    "battery_percent": null,
    "current_mode": "CURSOR"
  }
}
```

---

## 3. Desktop to Device Message Types

### 3.1 Handshake Acknowledgment (`server_hello`)
```json
{
  "protocol_version": 1,
  "type": "server_hello",
  "event_id": "server:1",
  "timestamp_ms": 1729500000000,
  "payload": {
    "session_active": true,
    "presentation_loaded": true,
    "slide_index": 3,
    "total_slides": 24,
    "active_mode": "CURSOR"
  }
}
```

### 3.2 Device Configuration Update (`configure_device`)
```json
{
  "protocol_version": 1,
  "type": "configure_device",
  "event_id": "server:12",
  "timestamp_ms": 1729500005000,
  "payload": {
    "sensitivity": 1.5,
    "dead_zone": 0.15,
    "smoothing": 0.8,
    "long_press_ms": 500
  }
}
```

### 3.3 Set Device Mode (`set_mode`)
```json
{
  "protocol_version": 1,
  "type": "set_mode",
  "event_id": "server:13",
  "timestamp_ms": 1729500006000,
  "payload": {
    "target_mode": "ANNOTATE"
  }
}
```

### 3.4 Display Notification / Slide Update (`display_notification`)
```json
{
  "protocol_version": 1,
  "type": "display_notification",
  "event_id": "server:14",
  "timestamp_ms": 1729500007000,
  "payload": {
    "title": "Slide 4/24",
    "subtitle": "Neural Architectures",
    "duration_ms": 2000
  }
}
```

### 3.5 Calibration Command (`calibrate_imu`)
```json
{
  "protocol_version": 1,
  "type": "calibrate_imu",
  "event_id": "server:15",
  "timestamp_ms": 1729500008000,
  "payload": {}
}
```
