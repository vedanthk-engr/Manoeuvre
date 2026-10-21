# Manoeuvre Glove: Hardware Engineering Specification

## 1. Components & Wiring Overview

| Component | Model / Spec | Interface | ESP32 GPIO Pin | Description / Electrical Characteristics |
|---|---|---|---|---|
| **Microcontroller** | ESP32 Dev Module (WROOM-32) | - | - | Dual-core Tensilica Xtensa 32-bit LX6 @ 240MHz, 2.4GHz Wi-Fi 802.11b/g/n |
| **Display** | 1.3-inch SH1106 OLED (128x64) | I2C | SDA: GPIO 21<br>SCL: GPIO 22 | Monochrome blue or white, I2C address `0x3C` (or `0x3D`), 3.3V VCC |
| **Motion Sensor** | MPU6050 6-Axis Accelerometer & Gyro | I2C | SDA: GPIO 21<br>SCL: GPIO 22 | 3-axis gyro (±250, ±500, ±1000, ±2000°/s), 3-axis accel (±2g..±16g), address `0x68` |
| **Button A (MODE)** | Tactile Push Button | GPIO Input | GPIO 14 | Active-LOW, internal pull-up (`INPUT_PULLUP`), connected to GND |
| **Button B (ACTION)** | Tactile Push Button | GPIO Input | GPIO 27 | Active-LOW, internal pull-up (`INPUT_PULLUP`), connected to GND |
| **Button C (SYSTEM)** | Tactile Push Button | GPIO Input | GPIO 26 | Active-LOW, internal pull-up (`INPUT_PULLUP`), connected to GND |
| **Power Supply** | 3.7V LiPo or USB 5V | Power | VIN / 3V3 / GND | Onboard LDO regulates to 3.3V for ESP32, OLED, and MPU6050 |

## 2. I2C Bus Configuration
Both the SH1106 OLED and the MPU6050 share the hardware I2C bus:
- **I2C SDA**: GPIO 21
- **I2C SCL**: GPIO 22
- **Clock Speed**: 400kHz (Fast Mode) supported, recommended 100kHz-400kHz.
- **Pull-ups**: Breakout boards typically include 4.7kΩ pull-up resistors to 3.3V.

> [!IMPORTANT]
> The SH1106 display uses a 132x64 driver RAM internally with 128x64 visible display area (offset column 2). Initializing with an SSD1306 driver will result in shifted pixels or right-edge noise. Use `U8G2_SH1106_128X64_NONAME_F_HW_I2C` in U8g2.

## 3. Button Interaction Mapping & State Machine

```
              [Single Press] -> Cycle Mode (CURSOR -> ANNOTATE -> HIGHLIGHT -> VOICE -> CURSOR)
Button A: MODE
              [Long Press Hold] -> Temporary Slide Nav (Tilt Right: Next, Tilt Left: Prev, Release: Restore Mode)

              CURSOR Mode    -> Single: Toggle Zoom | Hold: Precision Cursor
Button B: ACTION ANNOTATE Mode  -> Hold: Draw | Release: Stop Draw | Double: Clear Annotations
              HIGHLIGHT Mode -> Single: Highlight Selected Block | Hold: Continuous Highlight
              VOICE Mode     -> Hold: Start Audio Recording | Release: Stop & Transcribe

              [Single Press] -> Toggle Teaching Coach
Button C: SYSTEM [Double Press] -> Request Lecture Recap
              [Long Press]   -> Trigger IMU Calibration
```

## 4. Debounce & Timing Thresholds
- **Debounce Interval**: 25 ms
- **Double Press Interval Window**: 300 ms
- **Long Press Threshold**: 500 ms
- **Tilt Slide Nav Trigger Angle**: ±25° pitch/roll deflection with 150ms dead-time between successive slide steps.

## 5. Arduino IDE Flashing & Setup Guide
1. **Board Package**: Install `esp32` by Espressif in Arduino Boards Manager (version 2.0.11 or later).
2. **Select Board**: Tools -> Board -> ESP32 Arduino -> "ESP32 Dev Module".
3. **Libraries Required**:
   - `U8g2` by oliver (SH1106 display driver)
   - `WebSockets` by Markus Sattler (WebSocket client)
   - `ArduinoJson` by Benoit Blanchon (v6 or v7)
4. **Flash Settings**:
   - Flash Frequency: 80MHz
   - Flash Mode: QIO
   - Partition Scheme: Default 4MB with spiffs (1.2MB APP/1.5MB SPIFFS)
   - Upload Speed: 921600 or 115200 baud.
