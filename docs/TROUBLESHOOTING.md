# Manoeuvre Troubleshooting Guide

## 1. Device & Hardware Troubleshooting

### Issue: OLED Display remains dark
- **Cause**: Incorrect I2C address, missing 3.3V power, or wrong driver selected in firmware.
- **Remedy**:
  1. Verify wiring: ESP32 GPIO 21 to SDA, GPIO 22 to SCL.
  2. Verify OLED module power is 3.3V (do not supply 5V unless board has onboard regulator).
  3. Ensure U8g2 constructor is `U8G2_SH1106_128X64_NONAME_F_HW_I2C` (SSD1306 drivers will fail or display corrupted pixels).
  4. Run an I2C scanner sketch to confirm device appears at `0x3C` or `0x3D`.

### Issue: IMU gives flat or zero readings
- **Cause**: MPU6050 address conflict or uninitialized wire.
- **Remedy**:
  1. Ensure MPU6050 AD0 pin is pulled to GND for address `0x68`.
  2. Perform IMU calibration via long-press on SYSTEM button (or trigger from Device Manager in Manoeuvre Studio).

### Issue: Device fails to connect to WebSocket server
- **Cause**: ESP32 is on a different Wi-Fi subnet or port 8000 is blocked by Windows Firewall.
- **Remedy**:
  1. Confirm ESP32 and host PC are connected to the same 2.4GHz Wi-Fi network.
  2. Check host IP address (`ipconfig`) and update `Config.h` in firmware.
  3. Allow Python/Uvicorn through Windows Defender Firewall for private networks.

---

## 2. Desktop & Backend Troubleshooting

### Issue: Cursor does not move when receiving motion deltas
- **Cause**: Cursor control disabled in Settings, dead-zone threshold too high, or Windows permission restriction.
- **Remedy**:
  1. In Manoeuvre Studio -> Settings, ensure Cursor Sensitivity > 0.
  2. Check that active mode is `CURSOR` (motion is deliberately ignored in other modes to prevent accidental cursor disruption).
  3. Run application with normal desktop user permissions.

### Issue: AI requests fail with "API Key Missing"
- **Cause**: Environment variable or settings profile does not contain valid key for the chosen provider.
- **Remedy**:
  1. Open Manoeuvre Studio -> Settings -> AI Provider.
  2. Enter valid API Key for Google Gemini or OpenAI, or select **Mock / Offline Provider** for local demonstration.
