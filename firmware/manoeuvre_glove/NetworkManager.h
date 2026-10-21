#ifndef MANOEUVRE_NETWORK_MANAGER_H
#define MANOEUVRE_NETWORK_MANAGER_H

#include <Arduino.h>
#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>
#include "Config.h"

typedef void (*MessageCallback)(const String& type, JsonObjectConst payload);

class NetworkManager {
public:
    NetworkManager()
        : _wifiConnected(false),
          _wsConnected(false),
          _lastWifiAttempt(0),
          _msgCallback(nullptr) {}

    void begin(MessageCallback cb) {
        _msgCallback = cb;
        connectWiFi();
        
        // Configure WebSocket client
        _wsClient.begin(WS_HOST_DEFAULT, WS_PORT_DEFAULT, WS_PATH_DEFAULT);
        _wsClient.onEvent([this](WStype_t type, uint8_t * payload, size_t length) {
            this->handleWsEvent(type, payload, length);
        });
        _wsClient.setReconnectInterval(2000);
        _wsClient.enableHeartbeat(15000, 3000, 2);
    }

    void update(uint32_t now) {
        // Wi-Fi check & reconnect without blocking loop
        if (WiFi.status() == WL_CONNECTED) {
            _wifiConnected = true;
            _wsClient.loop();
        } else {
            _wifiConnected = false;
            _wsConnected = false;
            if ((now - _lastWifiAttempt) > 5000) {
                _lastWifiAttempt = now;
                WiFi.reconnect();
            }
        }
    }

    bool send(const String& json) {
        if (_wsConnected) {
            return _wsClient.sendTXT(json);
        }
        return false;
    }

    bool isWifiConnected() const { return _wifiConnected; }
    bool isWsConnected() const { return _wsConnected; }
    String getIpAddress() const { return WiFi.localIP().toString(); }
    String getMacAddress() const { return WiFi.macAddress(); }
    int32_t getRssi() const { return WiFi.RSSI(); }

private:
    void connectWiFi() {
        WiFi.mode(WIFI_STA);
        WiFi.begin(WIFI_SSID_DEFAULT, WIFI_PASS_DEFAULT);
    }

    void handleWsEvent(WStype_t type, uint8_t * payload, size_t length) {
        switch (type) {
            case WStype_DISCONNECTED:
                _wsConnected = false;
                break;
            case WStype_CONNECTED:
                _wsConnected = true;
                break;
            case WStype_TEXT:
                if (_msgCallback && length > 0) {
                    StaticJsonDocument<512> doc;
                    DeserializationError err = deserializeJson(doc, payload, length);
                    if (!err) {
                        const char* msgType = doc["type"] | "";
                        JsonObjectConst p = doc["payload"].as<JsonObjectConst>();
                        _msgCallback(String(msgType), p);
                    }
                }
                break;
            default:
                break;
        }
    }

private:
    WebSocketsClient _wsClient;
    bool _wifiConnected;
    bool _wsConnected;
    uint32_t _lastWifiAttempt;
    MessageCallback _msgCallback;
};

#endif // MANOEUVRE_NETWORK_MANAGER_H
