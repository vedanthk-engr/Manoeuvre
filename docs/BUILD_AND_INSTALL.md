# Manoeuvre: Build, Installation & Development Guide

## 1. Prerequisites
- **Operating System**: Windows 10/11 64-bit
- **Node.js**: v18.0.0 or later (v24.x tested and supported)
- **Python**: 3.10 to 3.14 (Python launcher `py` or standard `python` in PATH)
- **Git**: Installed and configured
- **Arduino IDE**: (Optional, for flashing physical ESP32 hardware) with ESP32 board definitions and U8g2 library.

---

## 2. Quickstart: Full Stack Development

### Step 1: Clone and Setup Environment
```powershell
# Clone repository (if applicable)
cd v:\Project\Manoeuvre

# Create Python virtual environment
py -m venv .venv

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Install backend dependencies
pip install -r backend/requirements.txt
```

### Step 2: Install Frontend Dependencies
```powershell
cd frontend
npm install
cd ..
```

### Step 3: Run Manoeuvre Services

#### A. Run Backend Only:
```powershell
.\.venv\Scripts\Activate.ps1
py -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

#### B. Run Frontend Dev Server Only:
```powershell
cd frontend
npm run dev
```

#### C. Run Hardware Simulator (Offline Testing):
```powershell
.\.venv\Scripts\Activate.ps1
py scripts/device_simulator.py --interactive
```

#### D. Run Complete Test Suite:
```powershell
# Backend tests
py -m pytest backend/tests -v

# Frontend tests
cd frontend
npm run test:run
```

---

## 3. Directory Structure
```
Manoeuvre/
├── .gitignore
├── README.md
├── docs/                   # Complete architectural and engineering specs
├── firmware/               # ESP32 Arduino sketches and headers
│   └── manoeuvre_glove/    # Main glove firmware and modular drivers
├── backend/                # Python / FastAPI core server
│   ├── api/                # REST endpoints
│   ├── core/               # Configuration, security, logging
│   ├── db/                 # SQLite migrations, models, repositories
│   ├── device/             # WebSocket handler, Windows cursor controller
│   ├── presentation/       # PDF loader and slide manager
│   ├── ai/                 # Gemini, OpenAI, and Mock AI providers
│   ├── speech/             # Audio capture & transcription interface
│   ├── ocr/                # Slide text & layout extractor
│   ├── analytics/          # Teaching Coach & session metrics
│   ├── tests/              # Backend pytest test suite
│   ├── main.py             # FastAPI entrypoint
│   └── requirements.txt    # Python dependencies
├── frontend/               # React 18 + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/     # UI design system and reusable components
│   │   ├── screens/        # 9 full application screens
│   │   ├── services/       # REST and WebSocket client adapters
│   │   ├── types/          # Shared TypeScript type definitions
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── electron/               # Electron main and preload scripts
│   ├── main.ts
│   ├── preload.ts
│   └── overlay.ts
└── scripts/                # Hardware simulator and verification tools
    └── device_simulator.py
```
