#ifndef MANOEUVRE_CONFIG_H
#define MANOEUVRE_CONFIG_H

#include <Arduino.h>

// ==========================================
// Device Identity & Protocol
// ==========================================
#define DEVICE_ID "glove-01"
#define HARDWARE_VERSION "ESP32-DEV-V1"
#define FIRMWARE_VERSION "1.0.0"
#define PROTOCOL_VERSION 1

// ==========================================
// Pin Assignments (ESP32 Dev Module)
// ==========================================
// I2C Bus (Shared between SH1106 OLED and MPU6050)
#define PIN_I2C_SDA 21
#define PIN_I2C_SCL 22

// Tactile Buttons (INPUT_PULLUP, active-low to GND)
#define PIN_BTN_MODE   14  // Button A: Mode select / Slide Nav
#define PIN_BTN_ACTION 27  // Button B: Context-dependent actions
#define PIN_BTN_SYSTEM 26  // Button C: Coach / Recap / Calibration

// ==========================================
// Timing & Threshold Parameters (ms)
// ==========================================
#define DEBOUNCE_DELAY_MS        30
#define DOUBLE_PRESS_WINDOW_MS  300
#define LONG_PRESS_THRESHOLD_MS 500
#define HEARTBEAT_INTERVAL_MS  3000
#define IMU_SAMPLE_INTERVAL_MS   20  // 50 Hz motion streaming
#define OLED_REFRESH_INTERVAL_MS 50  // 20 Hz display refresh

// ==========================================
// IMU & Motion Sensitivity Defaults
// ==========================================
#define MPU6050_I2C_ADDR 0x68
#define DEFAULT_SENSITIVITY 1.5f
#define DEFAULT_DEAD_ZONE   0.12f
#define DEFAULT_SMOOTHING   0.75f

// Tilt thresholds for temporary slide navigation
#define TILT_THRESHOLD_DEGREES 22.0f
#define TILT_COOLDOWN_MS       600

// ==========================================
// Wi-Fi & WebSocket Network Configuration
// ==========================================
#define WIFI_SSID_DEFAULT "Manoeuvre_AP"
#define WIFI_PASS_DEFAULT "manoeuvre2026"
#define WS_HOST_DEFAULT   "192.168.1.100"
#define WS_PORT_DEFAULT   8000
#define WS_PATH_DEFAULT   "/ws/device"

#endif // MANOEUVRE_CONFIG_H
