# Manoeuvre: Implementation Audit & Baseline Assessment

**Audit Date**: October 21, 2026  
**Auditor**: Lead Systems & Software Architect  
**Repository State**: Greenfield (Initial Commit)  
**Target Architecture**: ESP32 Wearable Glove + Python/FastAPI Backend + React/TypeScript/Vite/Tailwind Frontend + Electron Desktop Shell with Overlay

---

## 1. Existing Implementation Summary

A thorough inspection of the workspace root (`v:\Project\Manoeuvre`) was conducted:
- **Filesystem**: Empty initial directory prior to Git initialization.
- **Git Repository**: Initialized empty git repository. No legacy branches, tags, or uncommitted files were found.
- **Existing Code**: No legacy firmware, backend services, frontend builds, database schemas, or tests existed in the workspace prior to this audit.
- **System Environment**:
  - Operating System: Windows 11
  - Node.js: `v24.14.0`
  - NPM: `11.9.0`
  - Python: `3.14.3` (accessible via Python launcher `py`)
  - Git: `2.53.0.windows.1`

---

## 2. Working Features Verified Through Inspection or Tests

Because the repository is initialized clean, there are no pre-existing working features from prior commits. All required modules will be constructed and verified incrementally.

---

## 3. Incomplete Features

All modules specified in the Manoeuvre Engineering Specification are currently pending implementation:
- Firmware: Not scaffolded.
- Communication Protocol: Not yet implemented or versioned.
- Desktop Backend: Not scaffolded.
- Database & Migrations: Not scaffolded.
- Desktop Shell & UI: Not scaffolded.
- AI & Speech Services: Not scaffolded.
- Test Suites: Not scaffolded.

---

## 4. Missing Modules Inventory

| Category | Missing Component | Description |
|---|---|---|
| **Firmware** | ESP32 Driver Suite | MPU6050 I2C driver, SH1106 U8g2 driver, 3-button debouncing (`INPUT_PULLUP`), non-blocking loops |
| **Firmware** | Interaction State Machine | CURSOR, ANNOTATE, HIGHLIGHT, VOICE modes; temporary slide navigation on long-press MODE |
| **Firmware** | Network & Protocol Engine | Wi-Fi management, WebSocket client, JSON protocol v1 serialization, heartbeat, reconnection |
| **Protocol** | Protocol Specification & Schemas | Canonical JSON envelope, schema validation, button/motion/status/command models |
| **Backend** | Core Desktop Engine | FastAPI application, async WebSocket endpoint (`/ws/device`), client registry |
| **Backend** | Native Input Controller | Windows relative mouse move/click synthesis with dead-zone, sensitivity, and smoothing |
| **Backend** | Presentation Engine | PDF presentation reader, slide controller, layout parser, slide caching |
| **Backend** | Persistence Layer | SQLite database with migrations; schemas for sessions, presentations, annotations, AI interactions, settings |
| **Backend** | AI & OCR Adapters | Provider-agnostic AI adapters (OpenAI, Gemini, Local Mock/Offline), OCR extraction, Whisper transcription |
| **Backend** | Teaching Coach & Analytics | Lecture timer, slide pacing, annotation/AI counters, recap generator, report exporter |
| **Backend** | Device Hardware Simulator | Standalone Python simulator broadcasting protocol-compliant events for CI/CD and offline verification |
| **Frontend** | Manoeuvre Studio App | React 18+ / Vite / TypeScript / Tailwind CSS with dark theme |
| **Frontend** | Screens & Views | Dashboard, Device Manager, Presentation Manager, Lecture Workspace, AI Workspace, Annotations, Coach, Analytics, Settings |
| **Desktop Shell** | Electron Integration | Secure main & preload script, IPC bridge, backend process manager, transparent overlay window |
| **Testing** | Verification Suites | Unit tests (pytest, vitest), integration tests (device simulator to backend to DB), E2E smoke tests |

---

## 5. Compatibility & Environment Considerations

1. **Python 3.14 Environment**:
   - Python 3.14 is the active runtime on this Windows machine. Some C-extension wheels (like older compiled packages) may lack pre-built wheels for 3.14.
   - We will select robust, pure-python or modern wheels: `fastapi`, `uvicorn`, `websockets`, `pydantic>=2.7`, `sqlite3` (built-in standard library), `pypdf`, `httpx`.
   - Windows native cursor control can use Windows Win32 API (`ctypes.windll.user32.SendInput` or `mouse_event`), which requires zero external binary dependencies and is 100% native and rock-solid on Windows.
2. **Node.js 24**:
   - Modern Vite + React 18/19 and Electron compatible. We will configure build scripts with standard ESM/CJS compatibility.
3. **ESP32 Firmware**:
   - Microcontroller target: ESP32 Dev Module.
   - OLED: SH1106 1.3" 128x64 I2C (address 0x3C or 0x3D) via U8g2 library.
   - IMU: MPU6050 (address 0x68).
   - GPIO: MODE (14), ACTION (27), SYSTEM (26), I2C SDA (21), I2C SCL (22).
   - Firmware will be organized in `firmware/manoeuvre_glove/` with modular headers and compile-ready Arduino code, accompanied by hardware verification sketches and pinout guides.

---

## 6. Proposed Implementation Sequence

To satisfy the engineering rules and definition of done, implementation proceeds through 9 sequential, verified phases:

1. **Phase 0: Audit, Architecture & Documentation Base**
   - Complete `docs/ARCHITECTURE.md`, `docs/HARDWARE.md`, `docs/PROTOCOL.md`, `docs/DATABASE.md`, `docs/BUILD_AND_INSTALL.md`.
   - Set up `.gitignore` and workspace structure.
2. **Phase 1: Firmware Architecture & Simulated State Machine**
   - Implement modular ESP32 firmware in `firmware/manoeuvre_glove/`.
   - Implement Button debouncer, IMU calibration/filter, SH1106 OLED display manager, state machine, and WebSocket sender.
   - Implement hardware test sketches and Python test harness verifying state machine transitions.
3. **Phase 2: Canonical Protocol & Hardware Simulator**
   - Create canonical protocol schemas and validation in backend.
   - Build `scripts/device_simulator.py` supporting simulated button clicks, tilts, and motion streaming.
4. **Phase 3: Backend Foundation (FastAPI + SQLite + Input Controller)**
   - Initialize virtual environment, install backend packages.
   - Implement SQLite migrations and repository pattern for all 12 specified entities.
   - Implement FastAPI app with `/ws/device`, REST APIs, and native Windows cursor controller.
   - Run backend pytest suite.
5. **Phase 4: Presentation, Annotations, AI & Analytics Engines**
   - Implement PDF presentation loader and slide controller.
   - Implement Annotation persistence & coordinate normalizer.
   - Implement AI Provider interfaces (Gemini, OpenAI, Mock) and prompt builders.
   - Implement OCR text layout parser and Whisper transcription interface.
   - Implement Teaching Coach analytics and lecture recap generator.
6. **Phase 5: Manoeuvre Studio Desktop Application (Vite + React + TypeScript + Tailwind)**
   - Scaffold frontend in `frontend/`.
   - Build reusable component library and dark-mode design system.
   - Implement all 9 screens: Dashboard, Device Manager, Presentation Manager, Lecture Workspace, AI Workspace, Annotation Manager, Teaching Coach, Analytics/History, Settings.
   - Connect frontend to backend REST and WebSocket APIs.
7. **Phase 6: Electron Desktop Shell & Transparent Overlay Window**
   - Build secure Electron wrapper (`electron/main.ts`, `electron/preload.ts`).
   - Implement transparent always-on-top overlay window with click-through toggle.
8. **Phase 7: End-to-End Integration & Verification**
   - Execute integration workflow: Simulator -> Backend -> Database -> Frontend -> Cursor -> Lecture Report.
   - Validate error handling, reconnection, rate-limiting, and graceful shutdown.
9. **Phase 8: Documentation, Packaging & Final Verification**
   - Complete `docs/IMPLEMENTATION_STATUS.md`, `docs/TESTING.md`, `docs/TROUBLESHOOTING.md`.
   - Verify build commands and package scripts.

---

## 7. Risks and Assumptions

- **Risk**: Physical ESP32 hardware may not be physically plugged into USB during automated execution.
  - **Mitigation**: Implement a dual strategy: full production Arduino-compatible firmware codebase + a high-fidelity hardware simulator that transmits identical WebSocket packets and verifies backend/frontend behavior.
- **Risk**: AI API keys may not be pre-configured in user environment.
  - **Mitigation**: Provide an offline Mock/Development AI adapter that returns structured, informative responses and clearly guides the user on where to input their Gemini/OpenAI API keys in Settings.
- **Risk**: Native Windows input injection permissions.
  - **Mitigation**: Use Windows `SendInput` API via Python `ctypes`, with safety clamps and toggle flags in Device Manager.
