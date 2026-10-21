#ifndef MANOEUVRE_DISPLAY_MANAGER_H
#define MANOEUVRE_DISPLAY_MANAGER_H

#include <Arduino.h>
#include <U8g2lib.h>
#include "Config.h"

class DisplayManager {
public:
    DisplayManager()
        : _u8g2(U8G2_R0, /* reset=*/ U8X8_PIN_NONE),
          _wifiConnected(false),
          _wsConnected(false),
          _calibrated(false),
          _slideCurrent(0),
          _slideTotal(0),
          _notifyUntil(0),
          _lastRefresh(0) {
        strncpy(_modeStr, "CURSOR", sizeof(_modeStr));
        strncpy(_notifyMsg, "", sizeof(_notifyMsg));
        strncpy(_slideTitle, "No Slide", sizeof(_slideTitle));
    }

    bool begin() {
        if (!_u8g2.begin()) {
            return false;
        }
        _u8g2.setBusClock(400000);
        showSplash();
        return true;
    }

    void showSplash() {
        _u8g2.clearBuffer();
        _u8g2.setFont(u8g2_font_ncenB10_tr);
        _u8g2.drawStr(12, 28, "MANOEUVRE");
        _u8g2.setFont(u8g2_font_6x10_tr);
        _u8g2.drawStr(16, 44, "Wearable AI Glove");
        _u8g2.drawStr(34, 58, "v1.0.0");
        _u8g2.sendBuffer();
    }

    void setStatus(bool wifi, bool ws, bool calibrated) {
        _wifiConnected = wifi;
        _wsConnected = ws;
        _calibrated = calibrated;
    }

    void setMode(const char* mode) {
        strncpy(_modeStr, mode, sizeof(_modeStr) - 1);
        _modeStr[sizeof(_modeStr) - 1] = '\0';
    }

    void setSlideInfo(uint16_t current, uint16_t total, const char* title = nullptr) {
        _slideCurrent = current;
        _slideTotal = total;
        if (title) {
            strncpy(_slideTitle, title, sizeof(_slideTitle) - 1);
            _slideTitle[sizeof(_slideTitle) - 1] = '\0';
        }
    }

    void notify(const char* message, uint32_t durationMs = 2000) {
        strncpy(_notifyMsg, message, sizeof(_notifyMsg) - 1);
        _notifyMsg[sizeof(_notifyMsg) - 1] = '\0';
        _notifyUntil = millis() + durationMs;
    }

    void render(uint32_t now) {
        if ((now - _lastRefresh) < OLED_REFRESH_INTERVAL_MS) {
            return;
        }
        _lastRefresh = now;

        _u8g2.clearBuffer();

        // 1. Top Status Bar (Height: 12px)
        _u8g2.setFont(u8g2_font_5x7_tr);
        _u8g2.drawStr(2, 9, "MNVR");

        // Wi-Fi Icon / Indicator
        if (_wifiConnected) {
            _u8g2.drawStr(36, 9, "WF:OK");
        } else {
            _u8g2.drawStr(36, 9, "WF:--");
        }

        // WS Icon / Indicator
        if (_wsConnected) {
            _u8g2.drawStr(72, 9, "WS:LIVE");
        } else {
            _u8g2.drawStr(72, 9, "WS:OFF");
        }

        // Calibrated indicator
        if (_calibrated) {
            _u8g2.drawStr(112, 9, "CAL");
        } else {
            _u8g2.drawStr(112, 9, "!C");
        }

        _u8g2.drawHLine(0, 12, 128);

        // 2. Middle Mode Banner (Height: 26px)
        if (now < _notifyUntil && strlen(_notifyMsg) > 0) {
            // Display active notification popup
            _u8g2.setFont(u8g2_font_7x14B_tr);
            _u8g2.drawStr(6, 32, _notifyMsg);
        } else {
            _u8g2.setFont(u8g2_font_helvB12_tr);
            _u8g2.drawStr(4, 32, _modeStr);

            // Sub-status badge on the right
            _u8g2.setFont(u8g2_font_5x8_tr);
            if (strcmp(_modeStr, "SLIDE NAV") == 0) {
                _u8g2.drawStr(80, 26, "< TILT >");
            } else if (strcmp(_modeStr, "VOICE") == 0) {
                _u8g2.drawStr(80, 26, "[HOLD MIC]");
            } else if (strcmp(_modeStr, "ANNOTATE") == 0) {
                _u8g2.drawStr(80, 26, "[HOLD DRAW]");
            } else if (strcmp(_modeStr, "CURSOR") == 0) {
                _u8g2.drawStr(80, 26, "[PRECISION]");
            }
        }

        _u8g2.drawHLine(0, 42, 128);

        // 3. Bottom Slide Status & Context (Height: 22px)
        _u8g2.setFont(u8g2_font_6x10_tr);
        if (_slideTotal > 0) {
            char slideStr[24];
            snprintf(slideStr, sizeof(slideStr), "Slide %u/%u", _slideCurrent, _slideTotal);
            _u8g2.drawStr(4, 56, slideStr);
        } else {
            _u8g2.drawStr(4, 56, "Ready for Lecture");
        }

        _u8g2.sendBuffer();
    }

private:
    U8G2_SH1106_128X64_NONAME_F_HW_I2C _u8g2;
    bool _wifiConnected;
    bool _wsConnected;
    bool _calibrated;
    char _modeStr[16];
    char _notifyMsg[32];
    char _slideTitle[32];
    uint16_t _slideCurrent;
    uint16_t _slideTotal;
    uint32_t _notifyUntil;
    uint32_t _lastRefresh;
};

#endif // MANOEUVRE_DISPLAY_MANAGER_H
