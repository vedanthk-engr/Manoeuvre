#ifndef MANOEUVRE_BUTTON_DEBOUNCER_H
#define MANOEUVRE_BUTTON_DEBOUNCER_H

#include <Arduino.h>
#include "Config.h"

enum ButtonId {
    BTN_ID_MODE,
    BTN_ID_ACTION,
    BTN_ID_SYSTEM
};

enum ButtonEventType {
    BTN_EVENT_NONE,
    BTN_EVENT_PRESS_DOWN,
    BTN_EVENT_RELEASE,
    BTN_EVENT_SINGLE_PRESS,
    BTN_EVENT_DOUBLE_PRESS,
    BTN_EVENT_LONG_PRESS
};

struct ButtonEvent {
    ButtonId button;
    ButtonEventType type;
    uint32_t duration_ms;
};

class ButtonDebouncer {
public:
    explicit ButtonDebouncer(uint8_t pin, ButtonId id) 
        : _pin(pin), _id(id), _state(HIGH), _lastRawState(HIGH),
          _lastDebounceTime(0), _pressStartTime(0), _lastReleaseTime(0),
          _clickCount(0), _longPressEmitted(false), _isPressed(false) {}

    void begin() {
        pinMode(_pin, INPUT_PULLUP);
        _lastRawState = digitalRead(_pin);
        _state = _lastRawState;
    }

    bool update(uint32_t now, ButtonEvent& outEvent) {
        int raw = digitalRead(_pin);
        outEvent.type = BTN_EVENT_NONE;
        outEvent.button = _id;
        outEvent.duration_ms = 0;

        if (raw != _lastRawState) {
            _lastDebounceTime = now;
        }
        _lastRawState = raw;

        if ((now - _lastDebounceTime) > DEBOUNCE_DELAY_MS) {
            if (raw != _state) {
                _state = raw;
                if (_state == LOW) {
                    // Transition to PRESSED
                    _isPressed = true;
                    _pressStartTime = now;
                    _longPressEmitted = false;
                    outEvent.type = BTN_EVENT_PRESS_DOWN;
                    return true;
                } else {
                    // Transition to RELEASED
                    _isPressed = false;
                    uint32_t pressDuration = now - _pressStartTime;
                    outEvent.type = BTN_EVENT_RELEASE;
                    outEvent.duration_ms = pressDuration;

                    if (!_longPressEmitted) {
                        _clickCount++;
                        _lastReleaseTime = now;
                    }
                    return true;
                }
            }
        }

        // Long press check while holding down
        if (_isPressed && !_longPressEmitted) {
            if ((now - _pressStartTime) >= LONG_PRESS_THRESHOLD_MS) {
                _longPressEmitted = true;
                _clickCount = 0; // Cancel single/double click
                outEvent.type = BTN_EVENT_LONG_PRESS;
                outEvent.duration_ms = now - _pressStartTime;
                return true;
            }
        }

        // Single or double click resolution after release
        if (!_isPressed && _clickCount > 0) {
            if ((now - _lastReleaseTime) > DOUBLE_PRESS_WINDOW_MS) {
                if (_clickCount == 1) {
                    outEvent.type = BTN_EVENT_SINGLE_PRESS;
                    _clickCount = 0;
                    return true;
                } else if (_clickCount >= 2) {
                    outEvent.type = BTN_EVENT_DOUBLE_PRESS;
                    _clickCount = 0;
                    return true;
                }
            }
        }

        return false;
    }

    bool isPressed() const { return _isPressed; }
    ButtonId getId() const { return _id; }

private:
    uint8_t _pin;
    ButtonId _id;
    int _state;
    int _lastRawState;
    uint32_t _lastDebounceTime;
    uint32_t _pressStartTime;
    uint32_t _lastReleaseTime;
    uint8_t _clickCount;
    bool _longPressEmitted;
    bool _isPressed;
};

#endif // MANOEUVRE_BUTTON_DEBOUNCER_H
