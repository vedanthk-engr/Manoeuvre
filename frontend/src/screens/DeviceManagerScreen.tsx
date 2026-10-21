import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Wifi,
  Sliders,
  RotateCcw,
  Play,
  CheckCircle2,
  RefreshCw,
  Terminal,
} from 'lucide-react';
import { api } from '../services/api';
import { ButtonTestPanel } from '../components/ButtonTestPanel';
import { ButtonEvent, PrimaryMode } from '../types';

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
  const [deviceStatus, setDeviceStatus] = useState<any>(null);
  const [sensitivity, setSensitivity] = useState(1.5);
  const [deadZone, setDeadZone] = useState(0.12);
  const [smoothing, setSmoothing] = useState(0.75);
  const [calibrating, setCalibrating] = useState(false);
  const [saveNotice, setSaveNotice] = useState('');

  useEffect(() => {
    loadStatus();
  }, [isDeviceConnected]);

  const loadStatus = async () => {
    try {
      const data = await api.getDeviceStatus();
      setDeviceStatus(data);
      if (data?.cursor_settings) {
        setSensitivity(data.cursor_settings.sensitivity);
        setDeadZone(data.cursor_settings.dead_zone);
        setSmoothing(data.cursor_settings.smoothing);
      }
    } catch (err) {
      console.error('Failed to load device status:', err);
    }
  };

  const handleUpdateConfig = async () => {
    try {
      await api.configureDevice({
        sensitivity,
        dead_zone: deadZone,
        smoothing,
      });
      setSaveNotice('Settings updated successfully!');
      setTimeout(() => setSaveNotice(''), 2500);
    } catch (err) {
      console.error('Failed to configure device:', err);
    }
  };

  const handleCalibrate = async () => {
    setCalibrating(true);
    try {
      await api.calibrateDevice();
      setSaveNotice('IMU Calibration command sent to device.');
    } catch (err) {
      console.error('Failed to trigger calibration:', err);
    } finally {
      setTimeout(() => {
        setCalibrating(false);
        setSaveNotice('');
      }, 3000);
    }
  };

  return (
    <div className="p-6 h-full overflow-y-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Wearable Device Manager</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time telemetry, 3-button diagnostics, calibration, and sensitivity tuning.
          </p>
        </div>
        <button
          onClick={loadStatus}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Hardware Status Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-lg ${isDeviceConnected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center space-x-2">
                <span>Manoeuvre Wearable Glove (ESP32)</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isDeviceConnected
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {isDeviceConnected ? 'ONLINE' : 'DISCONNECTED'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Target: ESP32 Dev Module | Protocol: v1 | Transport: Wi-Fi WebSocket
              </p>
            </div>
          </div>
          <button
            onClick={handleCalibrate}
            disabled={calibrating}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-all shadow-sm"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${calibrating ? 'animate-spin' : ''}`} />
            <span>{calibrating ? 'Calibrating IMU...' : 'Calibrate MPU6050'}</span>
          </button>
        </div>

        {/* Telemetry Grid */}
        <div className="grid grid-cols-4 gap-4 mt-4 text-xs">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-500">Device ID</span>
            <div className="font-mono font-bold text-slate-200 mt-1">
              {deviceStatus?.device_info?.id || 'glove-01'}
            </div>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-500">MAC Address</span>
            <div className="font-mono font-bold text-slate-200 mt-1">
              {deviceStatus?.device_info?.mac_address || 'AA:BB:CC:DD:EE:01'}
            </div>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-500">Firmware Build</span>
            <div className="font-mono font-bold text-slate-200 mt-1">
              {deviceStatus?.device_info?.firmware_version || '1.0.0 (Production)'}
            </div>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-500">Active Mode</span>
            <div className="font-mono font-bold text-emerald-400 mt-1">{activeMode}</div>
          </div>
        </div>
      </div>

      {/* Button Diagnostics Bench */}
      <ButtonTestPanel
        lastEvent={lastButtonEvent}
        onSimulateClick={(btn, action) => onSimulateButton(btn, action)}
      />

      {/* Sensitivity & Input Tuning */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-slate-300" />
            <h2 className="text-sm font-bold text-white">Motion Sensitivity & Dead-Zone Processing</h2>
          </div>
          {saveNotice && (
            <span className="text-xs text-emerald-400 flex items-center space-x-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{saveNotice}</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-6 pt-2">
          {/* Sensitivity Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Cursor Sensitivity</span>
              <span className="font-mono text-emerald-400">{sensitivity.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="4.0"
              step="0.1"
              value={sensitivity}
              onChange={(e) => setSensitivity(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Multiplier applied to relative gyro angular velocity.
            </p>
          </div>

          {/* Dead Zone Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">IMU Dead Zone</span>
              <span className="font-mono text-emerald-400">{deadZone.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.02"
              max="0.5"
              step="0.02"
              value={deadZone}
              onChange={(e) => setDeadZone(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Suppresses micro-jitter when holding hand stationary.
            </p>
          </div>

          {/* Smoothing Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Motion Smoothing (Alpha)</span>
              <span className="font-mono text-emerald-400">{(smoothing * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.95"
              step="0.05"
              value={smoothing}
              onChange={(e) => setSmoothing(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Low-pass filter coefficient for butter-smooth trajectories.
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleUpdateConfig}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-all shadow-sm"
          >
            Apply Sensitivity Settings
          </button>
        </div>
      </div>

      {/* Integrated Virtual Hardware Simulator (Offline Testing) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center space-x-2 mb-3">
          <Terminal className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold text-white">Virtual Hardware Simulator Controls</h2>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Test presentation workflows without physical hardware. Triggers canonical protocol events directly into Manoeuvre Core.
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onSimulateNav('PREVIOUS')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700"
          >
            ← Slide Prev (Tilt Left)
          </button>
          <button
            onClick={() => onSimulateNav('NEXT')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700"
          >
            Slide Next (Tilt Right) →
          </button>
          <button
            onClick={() => onSimulateButton('MODE', 'single_press')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-300 rounded-lg text-xs font-medium border border-blue-500/30"
          >
            Cycle Mode (MODE Click)
          </button>
          <button
            onClick={() => onSimulateButton('ACTION', 'single_press')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-lg text-xs font-medium border border-emerald-500/30"
          >
            Toggle Zoom (ACTION Click)
          </button>
          <button
            onClick={() => onSimulateButton('SYSTEM', 'single_press')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 rounded-lg text-xs font-medium border border-purple-500/30"
          >
            Toggle Coach (SYSTEM Click)
          </button>
        </div>
      </div>
    </div>
  );
};
