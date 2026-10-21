#ifndef MANOEUVRE_PROTOCOL_H
#define MANOEUVRE_PROTOCOL_H

#include <Arduino.h>
#include <ArduinoJson.h>
#include "Config.h"
#include "StateMachine.h"
#include "IMUManager.h"

class ProtocolHelper {
public:
    static String serializeHello(uint32_t now, const char* ip, const char* mac) {
        StaticJsonDocument<384> doc;
        doc["protocol_version"] = PROTOCOL_VERSION;
        doc["type"] = "device_hello";
        doc["event_id"] = String(DEVICE_ID) + ":hello";
        doc["timestamp_ms"] = now;

        JsonObject payload = doc.createNestedObject("payload");
        payload["device_id"] = DEVICE_ID;
        payload["hardware_version"] = HARDWARE_VERSION;
        payload["firmware_version"] = FIRMWARE_VERSION;
        payload["mac_address"] = mac;
        payload["ip_address"] = ip;

        JsonArray caps = payload.createNestedArray("capabilities");
        caps.add("imu");
        caps.add("oled");
        caps.add("buttons");

        String output;
        serializeJson(doc, output);
        return output;
    }

    static String serializeHeartbeat(uint32_t now, uint32_t seq, int32_t rssi, uint32_t freeHeap) {
        StaticJsonDocument<256> doc;
        doc["protocol_version"] = PROTOCOL_VERSION;
        doc["type"] = "heartbeat";
        doc["event_id"] = String(DEVICE_ID) + ":" + String(seq);
        doc["timestamp_ms"] = now;

        JsonObject payload = doc.createNestedObject("payload");
        payload["uptime_seconds"] = now / 1000;
        payload["free_heap"] = freeHeap;
        payload["wifi_rssi"] = rssi;

        String output;
        serializeJson(doc, output);
        return output;
    }

    static String serializeButtonEvent(uint32_t now, uint32_t seq, ButtonId btn, ButtonEventType type, const char* mode, uint32_t durationMs) {
        StaticJsonDocument<320> doc;
        doc["protocol_version"] = PROTOCOL_VERSION;
        doc["type"] = "button_event";
        doc["event_id"] = String(DEVICE_ID) + ":" + String(seq);
        doc["timestamp_ms"] = now;

        JsonObject payload = doc.createNestedObject("payload");
        
        switch (btn) {
            case BTN_ID_MODE: payload["button"] = "MODE"; break;
            case BTN_ID_ACTION: payload["button"] = "ACTION"; break;
            case BTN_ID_SYSTEM: payload["button"] = "SYSTEM"; break;
            default: payload["button"] = "UNKNOWN"; break;
        }

        switch (type) {
            case BTN_EVENT_PRESS_DOWN: payload["action"] = "press_down"; payload["state"] = "PRESSED"; break;
            case BTN_EVENT_RELEASE: payload["action"] = "release"; payload["state"] = "RELEASED"; break;
            case BTN_EVENT_SINGLE_PRESS: payload["action"] = "single_press"; payload["state"] = "RELEASED"; break;
            case BTN_EVENT_DOUBLE_PRESS: payload["action"] = "double_press"; payload["state"] = "RELEASED"; break;
            case BTN_EVENT_LONG_PRESS: payload["action"] = "long_press"; payload["state"] = "HOLD"; break;
            default: payload["action"] = "none"; payload["state"] = "NONE"; break;
        }

        payload["mode"] = mode;
        payload["duration_ms"] = durationMs;

        String output;
        serializeJson(doc, output);
        return output;
    }

    static String serializeModeChange(uint32_t now, uint32_t seq, const char* prevMode, const char* newMode, bool isTemp) {
        StaticJsonDocument<256> doc;
        doc["protocol_version"] = PROTOCOL_VERSION;
        doc["type"] = "mode_change";
        doc["event_id"] = String(DEVICE_ID) + ":" + String(seq);
        doc["timestamp_ms"] = now;

        JsonObject payload = doc.createNestedObject("payload");
        payload["previous_mode"] = prevMode;
        payload["new_mode"] = newMode;
        payload["temporary"] = isTemp;

        String output;
        serializeJson(doc, output);
        return output;
    }

    static String serializeMotion(uint32_t now, uint32_t seq, const MotionData& m, bool precisionMode) {
        StaticJsonDocument<256> doc;
        doc["protocol_version"] = PROTOCOL_VERSION;
        doc["type"] = "motion_update";
        doc["event_id"] = String(DEVICE_ID) + ":" + String(seq);
        doc["timestamp_ms"] = now;

        JsonObject payload = doc.createNestedObject("payload");
        payload["dx"] = serialized(String(m.dx, 2));
        payload["dy"] = serialized(String(m.dy, 2));
        payload["pitch"] = serialized(String(m.pitch, 1));
        payload["roll"] = serialized(String(m.roll, 1));
        payload["yaw"] = serialized(String(m.yaw, 1));
        payload["precision_mode"] = precisionMode;

        String output;
        serializeJson(doc, output);
        return output;
    }

    static String serializeSlideNav(uint32_t now, uint32_t seq, const char* direction, float tiltAngle) {
        StaticJsonDocument<256> doc;
        doc["protocol_version"] = PROTOCOL_VERSION;
        doc["type"] = "slide_nav_gesture";
        doc["event_id"] = String(DEVICE_ID) + ":" + String(seq);
        doc["timestamp_ms"] = now;

        JsonObject payload = doc.createNestedObject("payload");
        payload["direction"] = direction;
        payload["tilt_angle"] = serialized(String(tiltAngle, 1));

        String output;
        serializeJson(doc, output);
        return output;
    }

    static String serializeStatus(uint32_t now, uint32_t seq, bool wifi, bool ws, bool cal, const char* mode) {
        StaticJsonDocument<256> doc;
        doc["protocol_version"] = PROTOCOL_VERSION;
        doc["type"] = "device_status";
        doc["event_id"] = String(DEVICE_ID) + ":" + String(seq);
        doc["timestamp_ms"] = now;

        JsonObject payload = doc.createNestedObject("payload");
        payload["wifi_connected"] = wifi;
        payload["ws_connected"] = ws;
        payload["calibrated"] = cal;
        payload["battery_percent"] = nullptr;
        payload["current_mode"] = mode;

        String output;
        serializeJson(doc, output);
        return output;
    }
};

#endif // MANOEUVRE_PROTOCOL_H
