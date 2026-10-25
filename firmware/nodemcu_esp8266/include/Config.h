#ifndef MANOEUVRE_ESP8266_CONFIG_H
#define MANOEUVRE_ESP8266_CONFIG_H

#include <Arduino.h>

// ==========================================
// Device Identity & Telemetry
// ==========================================
#define DEVICE_ID "nodemcu-glove-01"
#define HARDWARE_VERSION "NODEMCU-ESP8266-V2"
#define FIRMWARE_VERSION "1.3.0"

// ==========================================
// Authoritative Pin Mappings (NodeMCU ESP8266)
// ==========================================
// I2C Bus: GY-91 / MPU6500 IMU
#define PIN_I2C_SDA D2  // GPIO4
#define PIN_I2C_SCL D1  // GPIO5

// Tactile Buttons (Active-low, INPUT_PULLUP)
#define PIN_BTN_MODE   D5  // GPIO14 (Button A: Mode Select / Slide Nav)
#define PIN_BTN_ACTION D6  // GPIO12 (Button B: Context Action / Draw)
#define PIN_BTN_SYSTEM D7  // GPIO13 (Button C: System / Recenter / Coach)

// ==========================================
// Sensor & IMU Register Addresses
// ==========================================
#define IMU_ADDRESS_PRIMARY   0x68
#define IMU_ADDRESS_SECONDARY 0x69

#define REG_PWR_MGMT_1   0x6B
#define REG_ACCEL_XOUT_H 0x3B
#define REG_GYRO_XOUT_H  0x43
#define REG_WHO_AM_I     0x75

#define MPU6500_IDENTITY 0x70  // Standard MPU6500 identity (GY-91)
#define MPU6050_IDENTITY 0x68  // Standard MPU6050 identity fallback
#define MPU9250_IDENTITY 0x71  // Standard MPU9250 identity fallback

// ==========================================
// Timing & Sensitivity Parameters
// ==========================================
#define DEBOUNCE_MS            35
#define LONG_PRESS_MS          800
#define DOUBLE_PRESS_MS        350
#define MOTION_COOLDOWN_MS     350
#define SENSOR_INTERVAL_MS     10    // ~100 Hz high-frequency motion stream
#define WIFI_RETRY_MS          5000
#define WS_RETRY_MS            3000
#define DIAGNOSTIC_INTERVAL_MS 2500  // Rate-limited diagnostic log

#define MOTION_THRESHOLD       0.28f
#define FILTER_ALPHA           0.35f
#define GYRO_DIVISOR           150.0f // Divisor for cursor sensitivity

// ==========================================
// Wi-Fi & WebSocket Configuration
// ==========================================
// Local Wi-Fi network credentials
#define WIFI_SSID     "test"
#define WIFI_PASSWORD "12345678"

// Backend Host & WebSocket Target
// Default: points to FastAPI backend port 8000 on /ws/device (or /ws)
#define WS_HOST       "10.190.151.30"
#define WS_PORT       8000
#define WS_PATH       "/ws/device"

inline String getWsUrl() {
    return String("ws://") + WS_HOST + ":" + String(WS_PORT) + WS_PATH;
}

#endif // MANOEUVRE_ESP8266_CONFIG_H
