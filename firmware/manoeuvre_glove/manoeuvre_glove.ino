/**
 * MANOEUVRE GLOVE FIRMWARE
 * Target: ESP32 Dev Module
 * Display: 1.3" SH1106 OLED (I2C SDA:21, SCL:22) via U8g2
 * IMU: MPU6050 6-DoF (I2C SDA:21, SCL:22)
 * Buttons: MODE (GPIO 14), ACTION (GPIO 27), SYSTEM (GPIO 26) with INPUT_PULLUP
 */

#include <Arduino.h>
#include "Config.h"
#include "ButtonDebouncer.h"
#include "StateMachine.h"
#include "IMUManager.h"
#include "DisplayManager.h"
#include "Protocol.h"
#include "NetworkManager.h"

// Hardware instances
ButtonDebouncer btnMode(PIN_BTN_MODE, BTN_ID_MODE);
ButtonDebouncer btnAction(PIN_BTN_ACTION, BTN_ID_ACTION);
ButtonDebouncer btnSystem(PIN_BTN_SYSTEM, BTN_ID_SYSTEM);

StateMachine stateMachine;
IMUManager imu;
DisplayManager display;
NetworkManager network;

// Global tracking
uint32_t seqNumber = 1;
uint32_t lastHeartbeatTime = 0;
bool isInitialHelloSent = false;

// Forward declaration of server message callback
void onServerMessage(const String& type, JsonObjectConst payload) {
    if (type == "set_mode") {
        const char* target = payload["target_mode"] | "CURSOR";
        if (strcmp(target, "CURSOR") == 0) stateMachine.setMode(MODE_CURSOR);
        else if (strcmp(target, "ANNOTATE") == 0) stateMachine.setMode(MODE_ANNOTATE);
        else if (strcmp(target, "HIGHLIGHT") == 0) stateMachine.setMode(MODE_HIGHLIGHT);
        else if (strcmp(target, "VOICE") == 0) stateMachine.setMode(MODE_VOICE);
        display.setMode(stateMachine.getModeString());
    } else if (type == "display_notification") {
        const char* title = payload["title"] | "Notice";
        uint32_t duration = payload["duration_ms"] | 2000;
        display.notify(title, duration);
    } else if (type == "server_hello") {
        uint16_t current = payload["slide_index"] | 0;
        uint16_t total = payload["total_slides"] | 0;
        display.setSlideInfo(current, total);
        display.notify("Connected", 1500);
    } else if (type == "calibrate_imu") {
        display.notify("Calibrating...", 2000);
        imu.calibrate(250);
        display.notify("Calibrated!", 1500);
    }
}

void setup() {
    Serial.begin(115200);
    delay(200);
    Serial.println(F("\n=================================="));
    Serial.println(F("   MANOEUVRE WEARABLE GLOVE v1.0  "));
    Serial.println(F("=================================="));

    // 1. Initialize Buttons
    btnMode.begin();
    btnAction.begin();
    btnSystem.begin();

    // 2. Initialize OLED Display
    if (!display.begin()) {
        Serial.println(F("[ERROR] SH1106 OLED initialization failed!"));
    } else {
        Serial.println(F("[OK] SH1106 OLED initialized."));
    }

    // 3. Initialize MPU6050 IMU
    if (!imu.begin()) {
        Serial.println(F("[WARN] MPU6050 IMU not responding on I2C address 0x68!"));
        display.notify("IMU Error!", 2500);
    } else {
        Serial.println(F("[OK] MPU6050 IMU initialized. Calibrating..."));
        display.notify("Calibrating IMU", 1500);
        imu.calibrate(150);
        display.notify("Ready", 1000);
    }

    // 4. Initialize Network & WebSockets
    network.begin(onServerMessage);
    Serial.println(F("[OK] Network manager started."));
}

void handleButton(ButtonDebouncer& debouncer, uint32_t now) {
    ButtonEvent evt;
    if (debouncer.update(now, evt)) {
        const char* prevModeStr = stateMachine.getModeString();
        SemanticAction act = stateMachine.handleButtonEvent(evt);

        // Serialize and transmit raw button event
        String json = ProtocolHelper::serializeButtonEvent(
            now, seqNumber++, evt.button, evt.type, 
            stateMachine.getModeString(), evt.duration_ms
        );
        network.send(json);

        // Handle mode change notifications
        if (act == ACTION_MODE_CYCLE) {
            String modeJson = ProtocolHelper::serializeModeChange(
                now, seqNumber++, prevModeStr, stateMachine.getModeString(), false
            );
            network.send(modeJson);
            display.setMode(stateMachine.getModeString());
        } else if (act == ACTION_SLIDE_NAV_ENTER) {
            String modeJson = ProtocolHelper::serializeModeChange(
                now, seqNumber++, prevModeStr, "SLIDE NAV", true
            );
            network.send(modeJson);
            display.setMode("SLIDE NAV");
        } else if (act == ACTION_SLIDE_NAV_EXIT) {
            String modeJson = ProtocolHelper::serializeModeChange(
                now, seqNumber++, "SLIDE NAV", stateMachine.getModeString(), false
            );
            network.send(modeJson);
            display.setMode(stateMachine.getModeString());
        } else if (act == ACTION_TRIGGER_CALIBRATION) {
            display.notify("Calibrating...", 2000);
            imu.calibrate(200);
            display.notify("Calibrated OK", 1500);
        } else if (act == ACTION_TOGGLE_ZOOM) {
            display.notify(stateMachine.isZoomActive() ? "Zoom ON" : "Zoom OFF", 1000);
        } else if (act == ACTION_TOGGLE_COACH) {
            display.notify(stateMachine.isCoachActive() ? "Coach ON" : "Coach OFF", 1000);
        } else if (act == ACTION_VOICE_RECORD_START) {
            display.notify("Recording...", 30000);
        } else if (act == ACTION_VOICE_RECORD_END) {
            display.notify("Processing...", 2000);
        }
    }
}

void loop() {
    uint32_t now = millis();

    // 1. Maintain Network & WebSockets
    network.update(now);

    // Send Handshake on first connection
    if (network.isWsConnected()) {
        if (!isInitialHelloSent) {
            isInitialHelloSent = true;
            String hello = ProtocolHelper::serializeHello(
                now, network.getIpAddress().c_str(), network.getMacAddress().c_str()
            );
            network.send(hello);
        }
    } else {
        isInitialHelloSent = false;
    }

    // 2. Poll Buttons
    handleButton(btnMode, now);
    handleButton(btnAction, now);
    handleButton(btnSystem, now);

    // 3. Update IMU & Motion Processing
    MotionData m;
    if (imu.update(now, m)) {
        if (stateMachine.isInTemporarySlideNav()) {
            SemanticAction tiltAction = stateMachine.handleTilt(m.pitch, m.roll, now);
            if (tiltAction == ACTION_SLIDE_NEXT) {
                String navJson = ProtocolHelper::serializeSlideNav(now, seqNumber++, "NEXT", m.roll);
                network.send(navJson);
                display.notify("Slide > NEXT", 800);
            } else if (tiltAction == ACTION_SLIDE_PREV) {
                String navJson = ProtocolHelper::serializeSlideNav(now, seqNumber++, "PREVIOUS", m.roll);
                network.send(navJson);
                display.notify("Slide < PREV", 800);
            }
        } else if (stateMachine.getPrimaryMode() == MODE_CURSOR || stateMachine.isDrawingActive()) {
            // Stream motion delta to desktop
            String motionJson = ProtocolHelper::serializeMotion(
                now, seqNumber++, m, stateMachine.isPrecisionActive()
            );
            network.send(motionJson);
        }
    }

    // 4. Send Periodic Heartbeat
    if ((now - lastHeartbeatTime) >= HEARTBEAT_INTERVAL_MS) {
        lastHeartbeatTime = now;
        if (network.isWsConnected()) {
            String hb = ProtocolHelper::serializeHeartbeat(
                now, seqNumber++, network.getRssi(), ESP.getFreeHeap()
            );
            network.send(hb);
        }
    }

    // 5. Update OLED Display
    display.setStatus(network.isWifiConnected(), network.isWsConnected(), imu.isCalibrated());
    display.render(now);
}
