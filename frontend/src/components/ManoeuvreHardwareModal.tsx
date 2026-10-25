import React from 'react';
import {
  X,
  Radio,
  Tv,
  PenTool,
  Mic,
  MousePointer,
  Highlighter,
  Sliders,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { PrimaryMode } from '../types';

interface HardwareModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDeviceConnected: boolean;
  activeMode: PrimaryMode;
  onSetMode: (mode: PrimaryMode) => void;
  onNavigateToDeviceManager: () => void;
  onNavigateToWorkspace: () => void;
}

export const ManoeuvreHardwareModal: React.FC<HardwareModalProps> = ({
  isOpen,
  onClose,
  isDeviceConnected,
  activeMode,
  onSetMode,
  onNavigateToDeviceManager,
  onNavigateToWorkspace,
}) => {
  if (!isOpen) return null;

  const modes: { id: PrimaryMode; label: string; icon: any; desc: string }[] = [
    { id: 'CURSOR', label: 'Cursor Mode', icon: MousePointer, desc: 'Relative pointer control via onboard 6-axis MPU6050' },
    { id: 'ANNOTATE', label: 'Vector Annotate', icon: PenTool, desc: 'Press-to-draw on-screen vector strokes' },
    { id: 'HIGHLIGHT', label: 'OCR Highlight', icon: Highlighter, desc: 'Contextual OCR text block selection' },
    { id: 'VOICE', label: 'AI Voice Assistant', icon: Mic, desc: 'Push-to-talk speech-to-text & analogy generator' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="manoeuvre-hardware-modal-title"
    >
      <div className="bg-[#12141c] text-slate-100 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-800 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-[#d8fa55]/20 text-[#d8fa55] flex items-center justify-center border border-[#d8fa55]/30">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 id="manoeuvre-hardware-modal-title" className="text-base font-bold text-white">
              Manoeuvre Wearable Hardware Hub
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Target: ws://10.190.151.30:8000/ws/device
            </p>
          </div>
        </div>

        {/* Connection State Panel */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span
              className={`w-3 h-3 rounded-full ${
                isDeviceConnected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-rose-500'
              }`}
            />
            <div>
              <span className="text-xs font-bold text-white block">
                {isDeviceConnected ? 'ESP8266 / ESP32 Glove: Online' : 'Wearable Controller: Standby / Offline'}
              </span>
              <span className="text-[11px] text-slate-400">
                {isDeviceConnected
                  ? '6-Axis IMU (MPU6050) & 3-Button Telemetry Active'
                  : 'Run scripts/device_simulator.py or connect wearable hardware'}
              </span>
            </div>
          </div>

          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#d8fa55]/10 text-[#d8fa55] border border-[#d8fa55]/30">
            {activeMode}
          </span>
        </div>

        {/* Interaction Modes */}
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
          Glove Modes (Single Press MODE Button)
        </h4>
        <div className="grid grid-cols-2 gap-2 mb-5">
          {modes.map((m) => {
            const Icon = m.icon;
            const isCur = activeMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onSetMode(m.id)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  isCur
                    ? 'bg-[#d8fa55] text-slate-950 border-[#d8fa55] font-semibold shadow-md'
                    : 'bg-slate-900/60 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold">{m.label}</span>
                </div>
                <p className={`text-[10px] line-clamp-1 ${isCur ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
                  {m.desc}
                </p>
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            onClick={() => {
              onClose();
              onNavigateToDeviceManager();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Open Test Bench</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onNavigateToWorkspace();
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#d8fa55] hover:bg-[#cbf53d] text-slate-950 text-xs font-bold shadow-md transition-all"
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Enter Lecture Studio</span>
          </button>
        </div>
      </div>
    </div>
  );
};
