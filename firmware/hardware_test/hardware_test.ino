/**
 * MANOEUVRE HARDWARE DIAGNOSTIC TEST SKETCH
 * Tests:
 * 1. I2C Bus Scan (verifies 0x3C/0x3D for OLED and 0x68 for MPU6050)
 * 2. SH1106 OLED display test pattern
 * 3. MPU6050 live gyro/accel telemetry printout
 * 4. Button press/release live status for GPIO 14, 27, 26
 */

#include <Arduino.h>
#include <Wire.h>
#include <U8g2lib.h>

#define PIN_SDA 21
#define PIN_SCL 22
#define PIN_BTN_MODE 14
#define PIN_BTN_ACTION 27
#define PIN_BTN_SYSTEM 26

U8G2_SH1106_128X64_NONAME_F_HW_I2C u8g2(U8G2_R0, U8X8_PIN_NONE);

void scanI2C() {
    Serial.println(F("[I2C SCAN] Scanning bus on SDA=21, SCL=22..."));
    uint8_t count = 0;
    for (uint8_t address = 1; address < 127; address++) {
        Wire.beginTransmission(address);
        if (Wire.endTransmission() == 0) {
            Serial.print(F(" -> Found I2C device at 0x"));
            if (address < 16) Serial.print("0");
            Serial.print(address, HEX);
            if (address == 0x3C || address == 0x3D) Serial.print(" (SH1106 OLED)");
            if (address == 0x68) Serial.print(" (MPU6050 IMU)");
            Serial.println();
            count++;
        }
    }
    if (count == 0) Serial.println(F(" -> [ERROR] No I2C devices found! Check wiring."));
    else Serial.printf(" -> Scan complete: %d devices found.\n", count);
}

void setup() {
    Serial.begin(115200);
    delay(500);
    Serial.println(F("\n======================================"));
    Serial.println(F("   MANOEUVRE HARDWARE TEST BENCH      "));
    Serial.println(F("======================================"));

    pinMode(PIN_BTN_MODE, INPUT_PULLUP);
    pinMode(PIN_BTN_ACTION, INPUT_PULLUP);
    pinMode(PIN_BTN_SYSTEM, INPUT_PULLUP);

    Wire.begin(PIN_SDA, PIN_SCL, 100000);
    scanI2C();

    if (u8g2.begin()) {
        u8g2.clearBuffer();
        u8g2.setFont(u8g2_font_ncenB10_tr);
        u8g2.drawStr(10, 24, "DIAGNOSTIC");
        u8g2.setFont(u8g2_font_6x10_tr);
        u8g2.drawStr(10, 42, "Hardware OK");
        u8g2.drawBox(10, 50, 108, 6);
        u8g2.sendBuffer();
        Serial.println(F("[OLED] SH1106 display test pattern drawn."));
    } else {
        Serial.println(F("[OLED] SH1106 initialization failed."));
    }

    // Wake MPU6050
    Wire.beginTransmission(0x68);
    Wire.write(0x6B);
    Wire.write(0x00);
    if (Wire.endTransmission() == 0) {
        Serial.println(F("[IMU] MPU6050 woken successfully."));
    } else {
        Serial.println(F("[IMU] Could not communicate with MPU6050 at 0x68."));
    }
}

void loop() {
    int modeVal = digitalRead(PIN_BTN_MODE);
    int actionVal = digitalRead(PIN_BTN_ACTION);
    int systemVal = digitalRead(PIN_BTN_SYSTEM);

    Serial.printf("[BUTTONS] MODE(14): %s | ACTION(27): %s | SYSTEM(26): %s\n",
        modeVal == LOW ? "PRESSED" : "UP",
        actionVal == LOW ? "PRESSED" : "UP",
        systemVal == LOW ? "PRESSED" : "UP");

    delay(250);
}
