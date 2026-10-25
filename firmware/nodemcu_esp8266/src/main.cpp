/**
 * MANOEUVRE GLOVE FIRMWARE — INTEGRATED NODEMCU ESP8266 IMPLEMENTATION
 * 
 * Target: NodeMCU ESP8266 (ESP-12E / ESP-12F)
 * IMU Sensor: GY-91 / MPU6500 6-DoF I2C (WHO_AM_I = 0x70, compatible with 0x68/0x71)
 * 
 * Hardware Mapping:
 *   SDA   -> D2 (GPIO4)
 *   SCL   -> D1 (GPIO5)
 *   MODE   -> D5 (GPIO14) [Active-low, INPUT_PULLUP]
 *   ACTION -> D6 (GPIO12) [Active-low, INPUT_PULLUP]
 *   SYSTEM -> D7 (GPIO13) [Active-low, INPUT_PULLUP]
 * 
 * Communication:
 *   ArduinoWebsockets client connecting to Manoeuvre Core at ws://<WS_HOST>:<WS_PORT><WS_PATH>
 */

#include <ESP8266WiFi.h>
#include <Wire.h>
#include <string.h>
#include <ArduinoWebsockets.h>
#include "Config.h"

using namespace websockets;

// =====================================================
// GLOBAL STATE & ENUMS
// =====================================================

WebsocketsClient ws;

enum Mode : uint8_t {
    CURSOR = 0,
    ANNOTATE,
    HIGHLIGHT,
    VOICE
};

const char* MODE_NAMES[] = {
    "CURSOR", "ANNOTATE", "HIGHLIGHT", "VOICE"
};

Mode currentMode = CURSOR;

bool wsConnected = false;
bool imuReady = false;
bool neutralCalibrated = false;
bool teachingCoachEnabled = false;
bool slideNavigationActive = false;
bool annotationMouseHeld = false;

uint8_t imuAddress = IMU_ADDRESS_PRIMARY;

float neutralAx = 0;
float neutralAy = 0;
float neutralAz = 0;

// Gyroscope zero-rate offsets measured while stationary at startup
float gyroBiasX = 0;
float gyroBiasY = 0;
float gyroBiasZ = 0;

float filteredX = 0;
float filteredY = 0;

unsigned long lastWifiAttempt = 0;
unsigned long lastWsAttempt = 0;
unsigned long lastSensorRead = 0;
unsigned long lastMotionEvent = 0;
unsigned long lastDiagnosticPrint = 0;

// Instrumentation & Diagnostics
unsigned long motionSamplesSent = 0;
unsigned long sensorReadErrors = 0;
unsigned long samplesPerSecMeasured = 0;

// =====================================================
// BUTTON DATA STRUCTURE
// =====================================================

struct Button {
    uint8_t pin;
    const char* name;
    bool stableState;
    bool lastReading;
    unsigned long debounceAt;
    unsigned long pressedAt;
    unsigned long lastReleaseAt;
    uint8_t clickCount;
    bool longHandled;
};

Button modeButton   = { PIN_BTN_MODE,   "MODE",   HIGH, HIGH, 0, 0, 0, 0, false };
Button actionButton = { PIN_BTN_ACTION, "ACTION", HIGH, HIGH, 0, 0, 0, 0, false };
Button systemButton = { PIN_BTN_SYSTEM, "SYSTEM", HIGH, HIGH, 0, 0, 0, 0, false };

// Forward Declarations
void sendEvent(const char* type, const String& extra = "");
void initializeIMU();
void calibrateGyroBias();
void calibrateNeutral();

// =====================================================
// WEBSOCKET TRANSMISSION
// =====================================================

void sendEvent(const char* type, const String& extra) {
    String payload;
    payload.reserve(180);

    payload = "{\"type\":\"";
    payload += type;
    payload += "\",\"mode\":\"";
    payload += MODE_NAMES[currentMode];
    payload += "\",\"millis\":";
    payload += String(millis());

    if (extra.length() > 0) {
        payload += ",";
        payload += extra;
    }

    payload += "}";

    // Continuous motion events are intentionally omitted from Serial output
    // to keep the 115200 baud UART responsive at ~100 Hz without dropping samples.
    if (strcmp(type, "CURSOR_MOVE") != 0) {
        Serial.print(F("EVENT: "));
        Serial.println(payload);
    } else {
        motionSamplesSent++;
    }

    if (wsConnected) {
        if (!ws.send(payload)) {
            Serial.println(F("[WS] Send failed"));
        }
    }
}

void onWsMessage(WebsocketsMessage message) {
    Serial.print(F("[WS] Server message: "));
    Serial.println(message.data());
}

void onWsEvent(WebsocketsEvent event, String data) {
    if (event == WebsocketsEvent::ConnectionOpened) {
        wsConnected = true;
        Serial.println(F("WS_EVENT: CONNECTION_OPENED"));
    } else if (event == WebsocketsEvent::ConnectionClosed) {
        wsConnected = false;
        Serial.println(F("WS_EVENT: CONNECTION_CLOSED"));
        // Disconnect safety: immediately terminate any active drawing stroke
        if (annotationMouseHeld) {
            annotationMouseHeld = false;
        }
    }
}

// =====================================================
// NETWORK & WEBSOCKET LIFECYCLE
// =====================================================

void maintainWiFi() {
    if (WiFi.status() == WL_CONNECTED) {
        return;
    }

    wsConnected = false;

    if (millis() - lastWifiAttempt < WIFI_RETRY_MS) {
        return;
    }

    lastWifiAttempt = millis();
    Serial.printf("[WIFI] Connecting to SSID: '%s'...\n", WIFI_SSID);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
}

void maintainWebSocket() {
    if (WiFi.status() != WL_CONNECTED) {
        wsConnected = false;
        return;
    }

    if (ws.available()) {
        wsConnected = true;
        return;
    }

    wsConnected = false;

    if (millis() - lastWsAttempt < WS_RETRY_MS) {
        return;
    }

    lastWsAttempt = millis();
    String targetUrl = getWsUrl();
    Serial.printf("[WS] Connecting to %s ...\n", targetUrl.c_str());

    if (ws.connect(targetUrl)) {
        wsConnected = true;
        Serial.println(F("WS_CONNECTED"));

        sendEvent(
            "DEVICE_CONNECTED",
            String("\"device\":\"Manoeuvre NodeMCU ESP8266\",\"ip\":\"") +
            WiFi.localIP().toString() + "\""
        );
    } else {
        Serial.println(F("[WS] Connection failed; retrying in 3s"));
    }
}

// =====================================================
// IMU REGISTER ACCESS & DRIVER
// =====================================================

bool readRegisters(uint8_t reg, uint8_t* buffer, uint8_t count) {
    Wire.beginTransmission(imuAddress);
    Wire.write(reg);

    if (Wire.endTransmission(false) != 0) {
        return false;
    }

    uint8_t received = Wire.requestFrom(imuAddress, count);
    if (received != count) {
        return false;
    }

    for (uint8_t i = 0; i < count; i++) {
        buffer[i] = Wire.read();
    }

    return true;
}

bool writeRegister(uint8_t reg, uint8_t value) {
    Wire.beginTransmission(imuAddress);
    Wire.write(reg);
    Wire.write(value);
    return Wire.endTransmission() == 0;
}

int16_t toInt16(uint8_t highByte, uint8_t lowByte) {
    return (int16_t)(((uint16_t)highByte << 8) | lowByte);
}

bool readAcceleration(float& ax, float& ay, float& az) {
    uint8_t data[6];
    if (!readRegisters(REG_ACCEL_XOUT_H, data, 6)) {
        return false;
    }
    // ±2g full-scale range: 16384 LSB/g
    ax = toInt16(data[0], data[1]) / 16384.0f;
    ay = toInt16(data[2], data[3]) / 16384.0f;
    az = toInt16(data[4], data[5]) / 16384.0f;
    return true;
}

bool readGyroscope(float& gx, float& gy, float& gz) {
    uint8_t data[6];
    if (!readRegisters(REG_GYRO_XOUT_H, data, 6)) {
        return false;
    }
    // ±250 deg/s full-scale range: 131.0 LSB/(deg/s)
    gx = toInt16(data[0], data[1]) / 131.0f;
    gy = toInt16(data[2], data[3]) / 131.0f;
    gz = toInt16(data[4], data[5]) / 131.0f;
    return true;
}

void calibrateGyroBias() {
    Serial.println(F("[IMU] Calibrating gyroscope bias: keep glove completely stationary..."));
    float sx = 0, sy = 0, sz = 0;
    uint8_t valid = 0;

    for (uint8_t i = 0; i < 100; i++) {
        float gx, gy, gz;
        if (readGyroscope(gx, gy, gz)) {
            sx += gx;
            sy += gy;
            sz += gz;
            valid++;
        }
        delay(5);
        yield();
    }

    if (valid >= 70) {
        gyroBiasX = sx / valid;
        gyroBiasY = sy / valid;
        gyroBiasZ = sz / valid;
        Serial.printf("[IMU] GYRO_CALIBRATION_COMPLETE (Bias: X=%.2f, Y=%.2f, Z=%.2f)\n", gyroBiasX, gyroBiasY, gyroBiasZ);
    } else {
        Serial.println(F("[IMU] [WARN] GYRO_CALIBRATION_FAILED (Insufficient valid samples)"));
    }
}

void initializeIMU() {
    Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);
    Wire.setClock(400000);

    // Probe primary (0x68) and secondary (0x69) addresses
    uint8_t addrs[] = { IMU_ADDRESS_PRIMARY, IMU_ADDRESS_SECONDARY };
    bool foundBusDevice = false;

    for (uint8_t i = 0; i < 2; i++) {
        Wire.beginTransmission(addrs[i]);
        if (Wire.endTransmission() == 0) {
            imuAddress = addrs[i];
            foundBusDevice = true;
            break;
        }
    }

    if (!foundBusDevice) {
        Serial.println(F("[IMU] [ERROR] No I2C response at 0x68 or 0x69! Check SDA(D2)/SCL(D1) wiring."));
        imuReady = false;
        return;
    }

    uint8_t whoAmI = 0;
    if (!readRegisters(REG_WHO_AM_I, &whoAmI, 1)) {
        Serial.println(F("[IMU] [ERROR] Failed to read WHO_AM_I register."));
        imuReady = false;
        return;
    }

    Serial.printf("[IMU] Detected sensor at 0x%02X, WHO_AM_I = 0x%02X\n", imuAddress, whoAmI);
    if (whoAmI == MPU6500_IDENTITY) {
        Serial.println(F("[IMU] Confirmed GY-91 / MPU6500 sensor (identity 0x70)."));
    } else if (whoAmI == MPU6050_IDENTITY) {
        Serial.println(F("[IMU] Detected MPU6050 sensor (identity 0x68)."));
    } else if (whoAmI == MPU9250_IDENTITY) {
        Serial.println(F("[IMU] Detected MPU9250 sensor (identity 0x71)."));
    } else {
        Serial.printf("[IMU] Note: Non-standard identity 0x%02X. Proceeding with standard MPU registers.\n", whoAmI);
    }

    // Wake up sensor: clear sleep bit in PWR_MGMT_1 (0x6B)
    if (!writeRegister(REG_PWR_MGMT_1, 0x00)) {
        Serial.println(F("[IMU] [ERROR] Failed to wake sensor via PWR_MGMT_1."));
        imuReady = false;
        return;
    }

    delay(100);

    float ax, ay, az;
    imuReady = readAcceleration(ax, ay, az);
    Serial.println(imuReady ? F("[IMU] IMU_READY") : F("[IMU] IMU_READ_FAILED"));

    if (imuReady) {
        calibrateGyroBias();
    }
}

void calibrateNeutral() {
    if (!imuReady) {
        Serial.println(F("[CAL] CALIBRATION_FAILED: IMU unavailable"));
        sendEvent("CALIBRATION_FAILED");
        return;
    }

    Serial.println(F("[CAL] Neutral Calibration: hold glove still..."));
    float sx = 0, sy = 0, sz = 0;
    uint8_t validSamples = 0;

    for (uint8_t i = 0; i < 40; i++) {
        float ax, ay, az;
        if (readAcceleration(ax, ay, az)) {
            sx += ax;
            sy += ay;
            sz += az;
            validSamples++;
        }
        delay(10);
        yield();
    }

    if (validSamples < 20) {
        Serial.println(F("[CAL] CALIBRATION_FAILED (Too many bad samples)"));
        sendEvent("CALIBRATION_FAILED");
        return;
    }

    neutralAx = sx / validSamples;
    neutralAy = sy / validSamples;
    neutralAz = sz / validSamples;

    neutralCalibrated = true;
    filteredX = 0;
    filteredY = 0;

    Serial.printf("[CAL] NEUTRAL_CALIBRATION_COMPLETE (Ax=%.3f, Ay=%.3f, Az=%.3f)\n", neutralAx, neutralAy, neutralAz);

    sendEvent(
        "NEUTRAL_CALIBRATED",
        String("\"ax\":") + String(neutralAx, 4) +
        ",\"ay\":" + String(neutralAy, 4) +
        ",\"az\":" + String(neutralAz, 4)
    );
}

// =====================================================
// BUTTON PROCESSING
// =====================================================

void updateButton(Button& b) {
    bool reading = digitalRead(b.pin);

    if (reading != b.lastReading) {
        b.lastReading = reading;
        b.debounceAt = millis();
    }

    if (millis() - b.debounceAt < DEBOUNCE_MS || reading == b.stableState) {
        return;
    }

    b.stableState = reading;

    if (reading == LOW) {
        // Button Pressed (Active-low transition)
        b.pressedAt = millis();
        b.longHandled = false;

        // Start drawing immediately when ACTION is pressed in ANNOTATE mode
        if (&b == &actionButton && currentMode == ANNOTATE && !annotationMouseHeld) {
            annotationMouseHeld = true;
            sendEvent("ANNOTATION_START");
        }
        return;
    }

    // Button Released (Transition back to HIGH)
    unsigned long held = millis() - b.pressedAt;

    // Stop drawing on ACTION release. Do not also count release as a click.
    if (&b == &actionButton && annotationMouseHeld) {
        annotationMouseHeld = false;
        sendEvent("ANNOTATION_END");
        b.clickCount = 0;
        return;
    }

    if (held < LONG_PRESS_MS) {
        b.clickCount++;
        b.lastReleaseAt = millis();
    }
}

bool buttonPressed(const Button& b) {
    return b.stableState == LOW;
}

bool clickWindowExpired(const Button& b) {
    return b.clickCount > 0 && (millis() - b.lastReleaseAt > DOUBLE_PRESS_MS);
}

void handleModeButton() {
    updateButton(modeButton);

    // Long press: temporary slide-navigation mode
    if (buttonPressed(modeButton) && !modeButton.longHandled &&
        (millis() - modeButton.pressedAt >= LONG_PRESS_MS)) {
        modeButton.longHandled = true;
        slideNavigationActive = true;
        Serial.println(F("[BTN] SLIDE_NAVIGATION_ACTIVE"));
        sendEvent("SLIDE_NAVIGATION_START");
    }

    if (!buttonPressed(modeButton) && modeButton.longHandled && slideNavigationActive) {
        slideNavigationActive = false;
        modeButton.longHandled = false;
        Serial.println(F("[BTN] SLIDE_NAVIGATION_ENDED"));
        sendEvent("SLIDE_NAVIGATION_END");
        return;
    }

    // Single click: cycle to next mode
    if (clickWindowExpired(modeButton)) {
        uint8_t clicks = modeButton.clickCount;
        modeButton.clickCount = 0;

        if (clicks == 1) {
            if (annotationMouseHeld) {
                annotationMouseHeld = false;
                sendEvent("ANNOTATION_END");
            }

            currentMode = (Mode)((currentMode + 1) % 4);
            Serial.printf("[BTN] MODE cycled to: %s\n", MODE_NAMES[currentMode]);

            sendEvent(
                "MODE_CHANGED",
                String("\"mode_name\":\"") + MODE_NAMES[currentMode] + "\""
            );
        }
    }
}

void handleActionButton() {
    updateButton(actionButton);

    if (buttonPressed(actionButton) && !actionButton.longHandled &&
        (millis() - actionButton.pressedAt >= LONG_PRESS_MS)) {
        actionButton.longHandled = true;
        actionButton.clickCount = 0;
        sendEvent("ACTION_LONG_PRESS");
    }

    if (clickWindowExpired(actionButton)) {
        uint8_t clicks = actionButton.clickCount;
        actionButton.clickCount = 0;

        if (actionButton.longHandled) {
            return;
        }

        if (clicks >= 2) {
            sendEvent("ACTION_DOUBLE_PRESS");
            return;
        }

        switch (currentMode) {
            case CURSOR:
                sendEvent("CURSOR_CLICK");
                break;
            case ANNOTATE:
                // Drawing handled by ACTION press/release in updateButton()
                break;
            case HIGHLIGHT:
                sendEvent("HIGHLIGHT_TOGGLE");
                break;
            case VOICE:
                sendEvent("VOICE_COMMAND", "\"command\":\"START_STOP_LISTENING\"");
                break;
        }
    }

    if (!buttonPressed(actionButton)) {
        actionButton.longHandled = false;
    }
}

void handleSystemButton() {
    updateButton(systemButton);

    // Long press: trigger neutral calibration
    if (buttonPressed(systemButton) && !systemButton.longHandled &&
        (millis() - systemButton.pressedAt >= LONG_PRESS_MS)) {
        systemButton.longHandled = true;
        systemButton.clickCount = 0;
        calibrateNeutral();
        return;
    }

    if (clickWindowExpired(systemButton)) {
        uint8_t clicks = systemButton.clickCount;
        systemButton.clickCount = 0;

        if (systemButton.longHandled) {
            return;
        }

        if (clicks >= 2) {
            sendEvent("LECTURE_RECAP_REQUEST");
        } else {
            teachingCoachEnabled = !teachingCoachEnabled;
            Serial.printf("[BTN] TEACHING_COACH: %s\n", teachingCoachEnabled ? "ON" : "OFF");
            sendEvent(
                "TEACHING_COACH_TOGGLE",
                String("\"enabled\":") + (teachingCoachEnabled ? "true" : "false")
            );
        }
    }

    if (!buttonPressed(systemButton)) {
        systemButton.longHandled = false;
    }
}

// =====================================================
// MOTION PROCESSING (~100 Hz)
// =====================================================

void processMotion() {
    if (!imuReady || slideNavigationActive || (millis() - lastSensorRead < SENSOR_INTERVAL_MS)) {
        return;
    }

    lastSensorRead = millis();

    float ax, ay, az;
    if (!readAcceleration(ax, ay, az)) {
        sensorReadErrors++;
        return;
    }

    if (!neutralCalibrated) {
        neutralAx = ax;
        neutralAy = ay;
        neutralAz = az;
        neutralCalibrated = true;
    }

    // Relative accelerometer offset around neutral position
    float dx = -(ax - neutralAx);
    float dy = ay - neutralAy;

    filteredX = (FILTER_ALPHA * dx) + ((1.0f - FILTER_ALPHA) * filteredX);
    filteredY = (FILTER_ALPHA * dy) + ((1.0f - FILTER_ALPHA) * filteredY);

    // High-frequency cursor displacement derived from calibrated gyro rotation
    if ((currentMode == CURSOR || currentMode == ANNOTATE) && wsConnected) {
        float gx, gy, gz;
        if (readGyroscope(gx, gy, gz)) {
            gx -= gyroBiasX;
            gy -= gyroBiasY;

            // Normalized displacement for Windows input controller
            float cursorDx = -(gy / GYRO_DIVISOR);
            float cursorDy = -(gx / GYRO_DIVISOR);

            String motionFields =
                String("\"dx\":") + String(cursorDx, 4) +
                ",\"dy\":" + String(cursorDy, 4);

            sendEvent("CURSOR_MOVE", motionFields);
        }
    }

    // Threshold-based gesture navigation (LEFT/RIGHT slide navigation)
    if (millis() - lastMotionEvent < MOTION_COOLDOWN_MS) {
        return;
    }

    const char* gesture = nullptr;
    if (filteredX > MOTION_THRESHOLD) {
        gesture = "RIGHT";
    } else if (filteredX < -MOTION_THRESHOLD) {
        gesture = "LEFT";
    } else if (filteredY > MOTION_THRESHOLD) {
        gesture = "FRONT";
    } else if (filteredY < -MOTION_THRESHOLD) {
        gesture = "BACK";
    }

    if (gesture == nullptr) {
        return;
    }

    lastMotionEvent = millis();
    Serial.printf("[GESTURE] %s\n", gesture);

    String fields = String("\"gesture\":\"") + gesture + "\"";
    switch (currentMode) {
        case CURSOR:
            sendEvent("CURSOR_GESTURE", fields);
            break;
        case ANNOTATE:
            sendEvent("ANNOTATION_GESTURE", fields);
            break;
        case HIGHLIGHT:
            sendEvent("HIGHLIGHT_GESTURE", fields);
            break;
        case VOICE:
            sendEvent("VOICE_GESTURE", fields);
            break;
    }
}

// =====================================================
// RATE-LIMITED SYSTEM DIAGNOSTICS (SECTION 4)
// =====================================================

void printRateLimitedDiagnostics() {
    unsigned long now = millis();
    if (now - lastDiagnosticPrint < DIAGNOSTIC_INTERVAL_MS) {
        return;
    }

    unsigned long elapsed = now - lastDiagnosticPrint;
    lastDiagnosticPrint = now;

    samplesPerSecMeasured = (motionSamplesSent * 1000UL) / elapsed;
    motionSamplesSent = 0;

    if (WiFi.status() == WL_CONNECTED) {
        if (wsConnected) {
            Serial.printf("[DIAG] Wi-Fi: OK (%s, RSSI: %d dBm) | WS: CONNECTED | Stream: %lu samples/s | Mode: %s | Errors: %lu\n",
                WiFi.localIP().toString().c_str(), WiFi.RSSI(), samplesPerSecMeasured, MODE_NAMES[currentMode], sensorReadErrors);
        } else {
            Serial.printf("[DIAG] Wi-Fi: OK (%s) | WS: DISCONNECTED (Target: %s) | Retrying...\n",
                WiFi.localIP().toString().c_str(), getWsUrl().c_str());
        }
    } else {
        Serial.printf("[DIAG] Wi-Fi: DISCONNECTED (SSID: %s) | Retrying connection...\n", WIFI_SSID);
    }
}

// =====================================================
// ARDUINO SETUP & LOOP
// =====================================================

void setup() {
    Serial.begin(115200);
    delay(300);

    Serial.println();
    Serial.println(F("=================================================="));
    Serial.println(F("   MANOEUVRE NODEMCU ESP8266 GLOVE FIRMWARE       "));
    Serial.println(F("   Continuous IMU & Precision Vector Engine       "));
    Serial.println(F("=================================================="));

    pinMode(modeButton.pin, INPUT_PULLUP);
    pinMode(actionButton.pin, INPUT_PULLUP);
    pinMode(systemButton.pin, INPUT_PULLUP);
    Serial.println(F("[PINS] MODE(D5), ACTION(D6), SYSTEM(D7) configured as active-low INPUT_PULLUP."));

    initializeIMU();

    WiFi.mode(WIFI_STA);
    WiFi.persistent(false);
    WiFi.setAutoReconnect(true);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    lastWifiAttempt = millis();

    ws.onMessage(onWsMessage);
    ws.onEvent(onWsEvent);

    Serial.printf("[WS] Configured target: %s\n", getWsUrl().c_str());
    Serial.println(F("[SETUP] Firmware initialization complete."));
}

void loop() {
    maintainWiFi();

    if (WiFi.status() == WL_CONNECTED) {
        static bool ipLogged = false;
        if (!ipLogged) {
            ipLogged = true;
            Serial.println(F("[WIFI] WIFI_CONNECTED"));
            Serial.printf("[WIFI] ESP8266 Assigned IP: %s\n", WiFi.localIP().toString().c_str());
            Serial.printf("[WIFI] Gateway IP: %s\n", WiFi.gatewayIP().toString().c_str());
        }

        ws.poll();
        maintainWebSocket();
        ws.poll();
    }

    handleModeButton();
    handleActionButton();
    handleSystemButton();
    processMotion();
    printRateLimitedDiagnostics();

    yield();
}
