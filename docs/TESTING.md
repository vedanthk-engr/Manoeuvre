# Manoeuvre: Testing & Verification Strategy

## 1. Test Levels & Methodology

To ensure high reliability without requiring physical hardware at all times, Manoeuvre implements a multi-tiered testing strategy:

```
[Level 1: Unit Tests]
  - Backend: Protocol validation, state machine transitions, SQLite migrations, repository CRUD.
  - Frontend: Component rendering, mock API integration, store updates.
  - Firmware Logic: Pure C++ / Python test fixtures for button timing & state machine transitions.

[Level 2: Hardware Simulation & Protocol Verification]
  - Device Simulator: Emulates ESP32 connecting to ws://localhost:8000/ws/device.
  - Verifies full JSON protocol handshake, heartbeat, button events, tilt gestures, and motion deltas.

[Level 3: Integration & System Tests]
  - End-to-end flow: Simulator -> Backend -> Presentation slide change -> SQLite event logged -> Teaching coach metrics updated.

[Level 4: Physical Hardware Validation (When hardware is connected)]
  - Arduino Serial Monitor diagnostics.
  - Live button test panel in Manoeuvre Studio.
```

---

## 2. Test Execution Commands

### Running Backend Tests:
```powershell
py -m pytest backend/tests -v
```

### Running Frontend Tests:
```powershell
cd frontend
npm run test:run
```

### Running Hardware Simulation Smoke Test:
```powershell
py scripts/device_simulator.py --smoke-test
```
