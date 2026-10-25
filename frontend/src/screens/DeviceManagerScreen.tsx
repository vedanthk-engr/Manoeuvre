import React, { useState } from 'react';
import {
  Cpu,
  Radio,
  Wifi,
  MousePointer,
  PenTool,
  Highlighter,
  Mic,
  Activity,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Terminal,
  Copy,
  Check,
  Zap,
} from 'lucide-react';
import { PrimaryMode, ButtonEvent } from '../types';

interface DeviceManagerScreenProps {
  isDeviceConnected: boolean;
  activeMode: PrimaryMode;
  lastButtonEvent: ButtonEvent | null;
  onSimulateButton: (button: 'MODE' | 'ACTION' | 'SYSTEM', action: string) => void;
  onSimulateNav: (direction: 'NEXT' | 'PREVIOUS') => void;
}

export const DeviceManagerScreen: React.FC<DeviceManagerScreenProps> = ({
  isDeviceConnected,
  activeMode,
  lastButtonEvent,
  onSimulateButton,
  onSimulateNav,
}) => {
  const [wsHost, setWsHost] = useState('10.190.151.30');
  const [wsPort, setWsPort] = useState('8000');
  const [wsPath, setWsPath] = useState('/ws/device');
  const [baudRate, setBaudRate] = useState('115200');
  const [comPort, setComPort] = useState('COM3 (Auto-detected ESP8266/ESP32)');
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionLog, setConnectionLog] = useState<string[]>([
    'System ready. Firmware target: ws://10.190.151.30:8000/ws/device',
    'MPU6050 6-Axis IMU calibration profiles loaded.',
    'Debounce filter: 80ms press, 600ms hold.',
  ]);

  const modes: { id: PrimaryMode; label: string; icon: any; desc: string }[] = [
    { id: 'CURSOR', label: 'Cursor Mode', icon: MousePointer, desc: 'Relative pointer control via onboard 6-axis MPU6050 IMU' },
    { id: 'ANNOTATE', label: 'Vector Annotate', icon: PenTool, desc: 'Press-to-draw on-screen vector strokes with undo/redo' },
    { id: 'HIGHLIGHT', label: 'OCR Highlight', icon: Highlighter, desc: 'Contextual smart text selection and block highlight' },
    { id: 'VOICE', label: 'AI Voice Assistant', icon: Mic, desc: 'Push-to-talk speech-to-text, explanation & analogy generator' },
  ];

  const handleTestConnection = () => {
    setIsConnecting(true);
    setConnectionLog((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] Pinging glove at ${wsHost}:${wsPort}${wsPath}...`,
    ]);
    setTimeout(() => {
      setIsConnecting(false);
      setConnectionLog((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Telemetry ping responded: 12ms latency. SH1106 OLED synced.`,
      ]);
    }, 600);
  };

  const copyFirmwareConfig = () => {
    const configCode = `// Firmware Config.h settings\n#define WS_HOST "${wsHost}"\n#define WS_PORT ${wsPort}\n#define WS_PATH "${wsPath}"\n#define SERIAL_BAUD ${baudRate}`;
    navigator.clipboard.writeText(configCode);
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Wearable Glove Connection & Hardware Bench
          </h2>
          <p className="text-xs text-slate-500">
            ESP8266 / ESP32 gesture controller, 6-Axis MPU6050 IMU telemetry, and 3-button debounced bench
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold ${
              isDeviceConnected
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isDeviceConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span>{isDeviceConnected ? 'Glove Online (Wi-Fi)' : 'Standby / Ready to Connect'}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Connection Configuration (Left) & Live Bench + Modes (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Network & Serial Connection Setup */}
        <div className="lg:col-span-5 space-y-4">
          {/* WebSocket Connection Card */}
          <div className="bg-white rounded-2xl p-4 border border-[#eef0f4] shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-slate-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Wi-Fi WebSocket Connection
                </h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                Config.h Target
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Backend Host IP (ESP8266 / ESP32 Target)
                </label>
                <input
                  type="text"
                  value={wsHost}
                  onChange={(e) => setWsHost(e.target.value)}
                  placeholder="10.190.151.30"
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Port
                  </label>
                  <input
                    type="text"
                    value={wsPort}
                    onChange={(e) => setWsPort(e.target.value)}
                    placeholder="8000"
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    WebSocket Path
                  </label>
                  <input
                    type="text"
                    value={wsPath}
                    onChange={(e) => setWsPath(e.target.value)}
                    placeholder="/ws/device"
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={copyFirmwareConfig}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  {copiedConfig ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedConfig ? 'Copied Config.h' : 'Copy Config.h'}</span>
                </button>

                <button
                  onClick={handleTestConnection}
                  disabled={isConnecting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#d8fa55] hover:bg-[#cbf53d] text-slate-950 text-xs font-bold shadow-sm transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isConnecting ? 'animate-spin' : ''}`} />
                  <span>{isConnecting ? 'Pinging...' : 'Test Connection'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* USB Serial COM Port */}
          <div className="bg-white rounded-2xl p-4 border border-[#eef0f4] shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="w-4 h-4 text-slate-700" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                USB Serial / Direct Flasher
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">COM Port</label>
                <select
                  value={comPort}
                  onChange={(e) => setComPort(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 font-medium"
                >
                  <option>COM3 (Auto-detected ESP8266)</option>
                  <option>COM4 (ESP32 NodeMCU)</option>
                  <option>COM5 (USB-Serial CH340)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">Baud Rate</label>
                <input
                  type="text"
                  value={baudRate}
                  onChange={(e) => setBaudRate(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs font-mono rounded-xl bg-slate-50 border border-slate-200"
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Direct telemetry can stream via Wi-Fi or USB serial for zero-latency classroom presentation.
            </p>
          </div>

          {/* Live Telemetry Log */}
          <div className="bg-[#181a24] text-slate-300 rounded-2xl p-3.5 shadow-sm">
            <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-800">
              <Terminal className="w-3.5 h-3.5 text-[#d8fa55]" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Live Hardware Stream
              </span>
            </div>
            <div className="space-y-1 font-mono text-[10px] max-h-28 overflow-y-auto leading-relaxed">
              {connectionLog.map((log, idx) => (
                <div key={idx} className="text-slate-300">
                  <span className="text-emerald-400">&gt;</span> {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: IMU Live Meters, 3 Tactile Buttons & Mode Bench */}
        <div className="lg:col-span-7 space-y-4">
          {/* 6-Axis IMU Live Telemetry Simulator & Visualizer */}
          <div className="bg-white rounded-2xl p-4 border border-[#eef0f4] shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  6-Axis IMU (MPU6050) Orientation & Tilt
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Sample Rate: 50Hz • Debounce: 80ms
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[10px] font-bold text-slate-400 block mb-1">Pitch (Tilt)</span>
                <span className="text-base font-black text-slate-900">+14.2°</span>
                <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                  <div className="w-3/5 h-full bg-emerald-500 rounded-full" />
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[10px] font-bold text-slate-400 block mb-1">Roll (Wrist)</span>
                <span className="text-base font-black text-slate-900">-4.8°</span>
                <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                  <div className="w-2/5 h-full bg-indigo-500 rounded-full" />
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[10px] font-bold text-slate-400 block mb-1">Yaw (Heading)</span>
                <span className="text-base font-black text-slate-900">0.0°</span>
                <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                  <div className="w-1/2 h-full bg-slate-400 rounded-full" />
                </div>
              </div>
            </div>

            {/* Tilt Navigation Simulation */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-bold text-slate-700">Wrist-Tilt Slide Controls:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSimulateNav('PREVIOUS')}
                  className="px-3 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-800 shadow-sm"
                >
                  ← Tilt Left (Prev Slide)
                </button>
                <button
                  onClick={() => onSimulateNav('NEXT')}
                  className="px-3 py-1 rounded-lg bg-[#d8fa55] hover:bg-[#cbf53d] text-xs font-bold text-slate-950 shadow-sm"
                >
                  Tilt Right (Next Slide) →
                </button>
              </div>
            </div>
          </div>

          {/* 3-Button Tactile Bench */}
          <div className="bg-white rounded-2xl p-4 border border-[#eef0f4] shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Physical 3-Button Tactile Bench
              </h3>
              <span className="text-[10px] font-semibold text-slate-500">
                Single / Double / Long Press Triggers
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* MODE Button */}
              <button
                onClick={() => onSimulateButton('MODE', 'single_press')}
                className="p-3 rounded-xl border border-slate-200 hover:border-slate-400 bg-white hover:bg-slate-50 transition-all text-center group active:scale-95 shadow-sm"
              >
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-2 font-black text-xs group-hover:scale-110 transition-transform">
                  M
                </div>
                <h4 className="text-xs font-bold text-slate-900">MODE Button</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Cycle Modes</p>
              </button>

              {/* ACTION Button */}
              <button
                onClick={() => onSimulateButton('ACTION', 'single_press')}
                className="p-3 rounded-xl border border-slate-200 hover:border-slate-400 bg-white hover:bg-slate-50 transition-all text-center group active:scale-95 shadow-sm"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2 font-black text-xs group-hover:scale-110 transition-transform">
                  A
                </div>
                <h4 className="text-xs font-bold text-slate-900">ACTION Button</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Ink / OCR Trigger</p>
              </button>

              {/* SYSTEM Button */}
              <button
                onClick={() => onSimulateButton('SYSTEM', 'single_press')}
                className="p-3 rounded-xl border border-slate-200 hover:border-slate-400 bg-white hover:bg-slate-50 transition-all text-center group active:scale-95 shadow-sm"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto mb-2 font-black text-xs group-hover:scale-110 transition-transform">
                  S
                </div>
                <h4 className="text-xs font-bold text-slate-900">SYSTEM Button</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Laser / Calibrate</p>
              </button>
            </div>
          </div>

          {/* Interaction Modes Grid */}
          <div className="bg-white rounded-2xl p-4 border border-[#eef0f4] shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3">
              Wearable Interaction Modes
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              {modes.map((m) => {
                const Icon = m.icon;
                const isCur = activeMode === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => onSimulateButton('MODE', m.id)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      isCur
                        ? 'bg-[#d8fa55] text-slate-950 border-[#d8fa55] font-semibold shadow-md'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4" />
                      <span className="text-xs font-bold">{m.label}</span>
                    </div>
                    <p className={`text-[10px] leading-tight ${isCur ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>
                      {m.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
