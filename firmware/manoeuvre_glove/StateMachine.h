#ifndef MANOEUVRE_STATE_MACHINE_H
#define MANOEUVRE_STATE_MACHINE_H

#include <Arduino.h>
#include "ButtonDebouncer.h"

enum PrimaryMode {
    MODE_CURSOR,
    MODE_ANNOTATE,
    MODE_HIGHLIGHT,
    MODE_VOICE
};

enum SemanticAction {
    ACTION_NONE,
    ACTION_MODE_CYCLE,
    ACTION_SLIDE_NAV_ENTER,
    ACTION_SLIDE_NAV_EXIT,
    ACTION_SLIDE_NEXT,
    ACTION_SLIDE_PREV,
    ACTION_TOGGLE_ZOOM,
    ACTION_PRECISION_START,
    ACTION_PRECISION_END,
    ACTION_DRAW_START,
    ACTION_DRAW_END,
    ACTION_CLEAR_ANNOTATIONS,
    ACTION_HIGHLIGHT_SINGLE,
    ACTION_HIGHLIGHT_START,
    ACTION_HIGHLIGHT_END,
    ACTION_VOICE_RECORD_START,
    ACTION_VOICE_RECORD_END,
    ACTION_TOGGLE_COACH,
    ACTION_REQUEST_RECAP,
    ACTION_TRIGGER_CALIBRATION
};

class StateMachine {
public:
    StateMachine()
        : _primaryMode(MODE_CURSOR),
          _savedModeBeforeNav(MODE_CURSOR),
          _inTemporarySlideNav(false),
          _precisionActive(false),
          _drawingActive(false),
          _continuousHighlightActive(false),
          _recordingActive(false),
          _coachActive(false),
          _zoomActive(false),
          _lastTiltNavTime(0) {}

    PrimaryMode getPrimaryMode() const { return _primaryMode; }
    bool isInTemporarySlideNav() const { return _inTemporarySlideNav; }
    bool isPrecisionActive() const { return _precisionActive; }
    bool isDrawingActive() const { return _drawingActive; }
    bool isRecordingActive() const { return _recordingActive; }
    bool isCoachActive() const { return _coachActive; }
    bool isZoomActive() const { return _zoomActive; }

    const char* getModeString() const {
        if (_inTemporarySlideNav) return "SLIDE NAV";
        switch (_primaryMode) {
            case MODE_CURSOR: return "CURSOR";
            case MODE_ANNOTATE: return "ANNOTATE";
            case MODE_HIGHLIGHT: return "HIGHLIGHT";
            case MODE_VOICE: return "VOICE";
            default: return "UNKNOWN";
        }
    }

    SemanticAction handleButtonEvent(const ButtonEvent& event) {
        switch (event.button) {
            case BTN_ID_MODE:
                return handleModeButton(event);
            case BTN_ID_ACTION:
                return handleActionButton(event);
            case BTN_ID_SYSTEM:
                return handleSystemButton(event);
            default:
                return ACTION_NONE;
        }
    }

    SemanticAction handleTilt(float pitch, float roll, uint32_t now) {
        if (!_inTemporarySlideNav) return ACTION_NONE;

        if ((now - _lastTiltNavTime) < TILT_COOLDOWN_MS) {
            return ACTION_NONE;
        }

        // Tilt right (roll > threshold) -> NEXT slide
        if (roll > TILT_THRESHOLD_DEGREES) {
            _lastTiltNavTime = now;
            return ACTION_SLIDE_NEXT;
        }
        // Tilt left (roll < -threshold) -> PREV slide
        else if (roll < -TILT_THRESHOLD_DEGREES) {
            _lastTiltNavTime = now;
            return ACTION_SLIDE_PREV;
        }

        return ACTION_NONE;
    }

    void setMode(PrimaryMode mode) {
        _primaryMode = mode;
        _inTemporarySlideNav = false;
    }

private:
    SemanticAction handleModeButton(const ButtonEvent& event) {
        if (event.type == BTN_EVENT_SINGLE_PRESS) {
            if (!_inTemporarySlideNav) {
                // Cycle mode: CURSOR -> ANNOTATE -> HIGHLIGHT -> VOICE -> CURSOR
                _primaryMode = static_cast<PrimaryMode>((_primaryMode + 1) % 4);
                return ACTION_MODE_CYCLE;
            }
        } else if (event.type == BTN_EVENT_LONG_PRESS) {
            // Enter temporary slide navigation
            if (!_inTemporarySlideNav) {
                _savedModeBeforeNav = _primaryMode;
                _inTemporarySlideNav = true;
                return ACTION_SLIDE_NAV_ENTER;
            }
        } else if (event.type == BTN_EVENT_RELEASE) {
            // Releasing MODE button exits temporary slide navigation
            if (_inTemporarySlideNav) {
                _inTemporarySlideNav = false;
                _primaryMode = _savedModeBeforeNav;
                return ACTION_SLIDE_NAV_EXIT;
            }
        }
        return ACTION_NONE;
    }

    SemanticAction handleActionButton(const ButtonEvent& event) {
        if (_inTemporarySlideNav) return ACTION_NONE;

        switch (_primaryMode) {
            case MODE_CURSOR:
                if (event.type == BTN_EVENT_SINGLE_PRESS) {
                    _zoomActive = !_zoomActive;
                    return ACTION_TOGGLE_ZOOM;
                } else if (event.type == BTN_EVENT_PRESS_DOWN) {
                    _precisionActive = true;
                    return ACTION_PRECISION_START;
                } else if (event.type == BTN_EVENT_RELEASE) {
                    _precisionActive = false;
                    return ACTION_PRECISION_END;
                }
                break;

            case MODE_ANNOTATE:
                if (event.type == BTN_EVENT_PRESS_DOWN) {
                    _drawingActive = true;
                    return ACTION_DRAW_START;
                } else if (event.type == BTN_EVENT_RELEASE) {
                    _drawingActive = false;
                    return ACTION_DRAW_END;
                } else if (event.type == BTN_EVENT_DOUBLE_PRESS) {
                    return ACTION_CLEAR_ANNOTATIONS;
                }
                break;

            case MODE_HIGHLIGHT:
                if (event.type == BTN_EVENT_SINGLE_PRESS) {
                    return ACTION_HIGHLIGHT_SINGLE;
                } else if (event.type == BTN_EVENT_PRESS_DOWN) {
                    _continuousHighlightActive = true;
                    return ACTION_HIGHLIGHT_START;
                } else if (event.type == BTN_EVENT_RELEASE) {
                    _continuousHighlightActive = false;
                    return ACTION_HIGHLIGHT_END;
                }
                break;

            case MODE_VOICE:
                if (event.type == BTN_EVENT_PRESS_DOWN) {
                    _recordingActive = true;
                    return ACTION_VOICE_RECORD_START;
                } else if (event.type == BTN_EVENT_RELEASE) {
                    _recordingActive = false;
                    return ACTION_VOICE_RECORD_END;
                }
                break;
        }

        return ACTION_NONE;
    }

    SemanticAction handleSystemButton(const ButtonEvent& event) {
        if (event.type == BTN_EVENT_SINGLE_PRESS) {
            _coachActive = !_coachActive;
            return ACTION_TOGGLE_COACH;
        } else if (event.type == BTN_EVENT_DOUBLE_PRESS) {
            return ACTION_REQUEST_RECAP;
        } else if (event.type == BTN_EVENT_LONG_PRESS) {
            return ACTION_TRIGGER_CALIBRATION;
        }
        return ACTION_NONE;
    }

private:
    PrimaryMode _primaryMode;
    PrimaryMode _savedModeBeforeNav;
    bool _inTemporarySlideNav;
    bool _precisionActive;
    bool _drawingActive;
    bool _continuousHighlightActive;
    bool _recordingActive;
    bool _coachActive;
    bool _zoomActive;
    uint32_t _lastTiltNavTime;
};

#endif // MANOEUVRE_STATE_MACHINE_H
