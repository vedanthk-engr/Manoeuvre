# Manoeuvre: AI-Powered Wearable Teaching Assistant

Manoeuvre is a wearable hardware and native desktop application ecosystem designed for professors and educators. It combines an ESP32-based wearable glove controller with a desktop teaching suite (Manoeuvre Studio and transparent Manoeuvre Overlay).

---

## Key Features

- **Gesture-Assisted Presentation & Cursor Control**: Tilt-based slide navigation and smooth relative cursor movement via an onboard 6-axis MPU6050 IMU.
- **Physical Wearable Glove**: ESP32 controller featuring a 1.3-inch SH1106 OLED display, 3 tactile buttons with debounced single/double/long press actions, and Wi-Fi WebSocket telemetry.
- **Dynamic Interaction Modes**:
  - `CURSOR`: Relative pointer movement, precision toggle, and instant zoom.
  - `ANNOTATE`: Press-to-draw on-screen vector strokes, with undo/redo and slide persistence.
  - `HIGHLIGHT`: Contextual OCR block and text selection highlighting.
  - `VOICE`: Push-to-talk lecture assistant with transcription, slide explanation, analogy generation, and quiz synthesis.
- **Teaching Coach & Analytics**: Continuous non-intrusive tracking of lecture duration, slide timing, transition frequency, and automated data-backed lecture recaps.
- **Privacy & Local-First**: SQLite persistence, decoupled AI adapters (Google Gemini, OpenAI, or Offline Mock), and zero secret leaks.

---

## Quickstart

See [docs/BUILD_AND_INSTALL.md](docs/BUILD_AND_INSTALL.md) for full setup instructions.

```powershell
# 1. Setup Backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt

# 2. Run Backend
py -m uvicorn backend.main:app --port 8000 --reload

# 3. Run Hardware Simulator (Offline Testing)
py scripts/device_simulator.py --interactive

# 4. Setup & Run Frontend
cd frontend
npm install
npm run dev
```

---

## Documentation

- [System Architecture](docs/ARCHITECTURE.md)
- [Hardware & Wiring Specification](docs/HARDWARE.md)
- [Device Communication Protocol v1](docs/PROTOCOL.md)
- [Database Schema & Migrations](docs/DATABASE.md)
- [AI, Speech & OCR Integration](docs/AI_INTEGRATION.md)
- [Testing & Verification Guide](docs/TESTING.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [Implementation Audit](docs/IMPLEMENTATION_AUDIT.md)
- [Implementation Status](docs/IMPLEMENTATION_STATUS.md)
