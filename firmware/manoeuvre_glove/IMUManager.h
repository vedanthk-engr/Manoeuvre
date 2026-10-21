#ifndef MANOEUVRE_IMU_MANAGER_H
#define MANOEUVRE_IMU_MANAGER_H

#include <Arduino.h>
#include <Wire.h>
#include "Config.h"

struct MotionData {
    float dx;
    float dy;
    float pitch;
    float roll;
    float yaw;
    bool isValid;
};

class IMUManager {
public:
    IMUManager()
        : _calibrated(false),
          _accelXOffset(0), _accelYOffset(0), _accelZOffset(0),
          _gyroXOffset(0), _gyroYOffset(0), _gyroZOffset(0),
          _filteredGx(0.0f), _filteredGy(0.0f), _filteredGz(0.0f),
          _sensitivity(DEFAULT_SENSITIVITY),
          _deadZone(DEFAULT_DEAD_ZONE),
          _smoothing(DEFAULT_SMOOTHING),
          _lastSampleTime(0) {}

    bool begin() {
        Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL, 400000);
        
        // Wake up MPU6050 by clearing sleep bit (register 0x6B)
        Wire.beginTransmission(MPU6050_I2C_ADDR);
        Wire.write(0x6B);
        Wire.write(0x00);
        if (Wire.endTransmission() != 0) {
            return false; // I2C communication failed
        }

        // Set Gyro full scale range to ±500 deg/s (register 0x1B, value 0x08)
        Wire.beginTransmission(MPU6050_I2C_ADDR);
        Wire.write(0x1B);
        Wire.write(0x08);
        Wire.endTransmission();

        // Set Accel full scale range to ±4g (register 0x1C, value 0x08)
        Wire.beginTransmission(MPU6050_I2C_ADDR);
        Wire.write(0x1C);
        Wire.write(0x08);
        Wire.endTransmission();

        // Set Digital Low Pass Filter (DLPF) to ~44Hz (register 0x1A, value 0x03)
        Wire.beginTransmission(MPU6050_I2C_ADDR);
        Wire.write(0x1A);
        Wire.write(0x03);
        Wire.endTransmission();

        return true;
    }

    void calibrate(uint16_t sampleCount = 200) {
        int32_t gxSum = 0, gySum = 0, gzSum = 0;
        int32_t axSum = 0, aySum = 0, azSum = 0;

        for (uint16_t i = 0; i < sampleCount; i++) {
            int16_t ax, ay, az, gx, gy, gz;
            if (readRaw(ax, ay, az, gx, gy, gz)) {
                axSum += ax;
                aySum += ay;
                azSum += az;
                gxSum += gx;
                gySum += gy;
                gzSum += gz;
            }
            delay(3);
        }

        _accelXOffset = axSum / sampleCount;
        _accelYOffset = aySum / sampleCount;
        _accelZOffset = (azSum / sampleCount) - 8192; // 8192 LSB/g at ±4g
        _gyroXOffset  = gxSum / sampleCount;
        _gyroYOffset  = gySum / sampleCount;
        _gyroZOffset  = gzSum / sampleCount;

        _calibrated = true;
    }

    bool update(uint32_t now, MotionData& outData) {
        if ((now - _lastSampleTime) < IMU_SAMPLE_INTERVAL_MS) {
            outData.isValid = false;
            return false;
        }
        _lastSampleTime = now;

        int16_t rawAx, rawAy, rawAz, rawGx, rawGy, rawGz;
        if (!readRaw(rawAx, rawAy, rawAz, rawGx, rawGy, rawGz)) {
            outData.isValid = false;
            return false;
        }

        // Apply calibration offsets
        float ax = (rawAx - _accelXOffset) / 8192.0f; // in g
        float ay = (rawAy - _accelYOffset) / 8192.0f;
        float az = (rawAz - _accelZOffset) / 8192.0f;

        // Gyro sensitivity: 65.5 LSB/(deg/s) at ±500 deg/s
        float gx = (rawGx - _gyroXOffset) / 65.5f;
        float gy = (rawGy - _gyroYOffset) / 65.5f;
        float gz = (rawGz - _gyroZOffset) / 65.5f;

        // Exponential smoothing filter
        _filteredGx = (_smoothing * _filteredGx) + ((1.0f - _smoothing) * gx);
        _filteredGy = (_smoothing * _filteredGy) + ((1.0f - _smoothing) * gy);
        _filteredGz = (_smoothing * _filteredGz) + ((1.0f - _smoothing) * gz);

        // Dead-zone processing
        float procGz = (fabs(_filteredGz) < _deadZone) ? 0.0f : _filteredGz;
        float procGy = (fabs(_filteredGy) < _deadZone) ? 0.0f : _filteredGy;

        // Relative cursor delta: Gyro Z -> horizontal (dx), Gyro Y -> vertical (dy)
        outData.dx = procGz * _sensitivity;
        outData.dy = -procGy * _sensitivity;

        // Calculate pitch and roll angles in degrees
        outData.pitch = atan2(-ax, sqrt(ay * ay + az * az)) * (180.0f / PI);
        outData.roll  = atan2(ay, az) * (180.0f / PI);
        outData.yaw   = 0.0f; // Yaw estimated via relative integration
        outData.isValid = true;

        return true;
    }

    void setSensitivity(float s) { _sensitivity = s; }
    void setDeadZone(float dz) { _deadZone = dz; }
    void setSmoothing(float sm) { _smoothing = sm; }
    bool isCalibrated() const { return _calibrated; }

private:
    bool readRaw(int16_t& ax, int16_t& ay, int16_t& az, int16_t& gx, int16_t& gy, int16_t& gz) {
        Wire.beginTransmission(MPU6050_I2C_ADDR);
        Wire.write(0x3B); // Starting register for Accel X High
        if (Wire.endTransmission(false) != 0) return false;

        if (Wire.requestFrom((uint8_t)MPU6050_I2C_ADDR, (uint8_t)14) != 14) {
            return false;
        }

        ax = (Wire.read() << 8) | Wire.read();
        ay = (Wire.read() << 8) | Wire.read();
        az = (Wire.read() << 8) | Wire.read();
        Wire.read(); Wire.read(); // Skip temperature
        gx = (Wire.read() << 8) | Wire.read();
        gy = (Wire.read() << 8) | Wire.read();
        gz = (Wire.read() << 8) | Wire.read();
        return true;
    }

private:
    bool _calibrated;
    int16_t _accelXOffset, _accelYOffset, _accelZOffset;
    int16_t _gyroXOffset, _gyroYOffset, _gyroZOffset;
    float _filteredGx, _filteredGy, _filteredGz;
    float _sensitivity;
    float _deadZone;
    float _smoothing;
    uint32_t _lastSampleTime;
};

#endif // MANOEUVRE_IMU_MANAGER_H
