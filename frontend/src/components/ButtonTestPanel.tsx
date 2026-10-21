import React, { useState, useEffect } from 'react';
import { ButtonEvent } from '../types';

interface ButtonTestPanelProps {
  lastEvent: ButtonEvent | null;
  onSimulateClick?: (button: 'MODE' | 'ACTION' | 'SYSTEM', action: string) => void;
}

export const ButtonTestPanel: React.FC<ButtonTestPanelProps> = ({ lastEvent, onSimulateClick }) => {
  const [activeButtons, setActiveButtons] = useState<{ [key: string]: boolean }>({
    MODE: false,
    ACTION: false,
    SYSTEM: false,
  });

  useEffect(() => {
    if (lastEvent) {
      setActiveButtons((prev) => ({ ...prev, [lastEvent.button]: true }));
      const timer = setTimeout(() => {
        setActiveButtons((prev) => ({ ...prev, [lastEvent.button]: false }));
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [lastEvent]);

  const buttons = [
    {
      id: 'MODE',
      label: 'Button A: MODE',
      pin: 'GPIO 14',
      desc: 'Cycle Mode / Hold for Slide Nav',
      color: 'border-blue-500 bg-blue-500/20 text-blue-300',
      activeColor: 'bg-blue-500 text-white shadow-lg shadow-blue-500/50 scale-105',
    },
    {
      id: 'ACTION',
      label: 'Button B: ACTION',
      pin: 'GPIO 27',
      desc: 'Draw / Highlight / Mic / Zoom',
      color: 'border-emerald-500 bg-emerald-500/20 text-emerald-300',
      activeColor: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/50 scale-105',
    },
    {
      id: 'SYSTEM',
      label: 'Button C: SYSTEM',
      pin: 'GPIO 26',
      desc: 'Coach / Recap / Calibrate',
      color: 'border-purple-500 bg-purple-500/20 text-purple-300',
      activeColor: 'bg-purple-500 text-white shadow-lg shadow-purple-500/50 scale-105',
    },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Physical Hardware Telemetry: 3-Button Test Bench
        </h3>
        {lastEvent && (
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            {lastEvent.button} → {lastEvent.action} ({lastEvent.duration_ms}ms)
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {buttons.map((btn) => {
          const isActive = activeButtons[btn.id];
          return (
            <div
              key={btn.id}
              onClick={() => onSimulateClick?.(btn.id as any, 'single_press')}
              className={`border rounded-lg p-3 cursor-pointer transition-all duration-150 select-none ${
                isActive ? btn.activeColor : `${btn.color} hover:bg-slate-800/80`
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold">{btn.label}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40">
                  {btn.pin}
                </span>
              </div>
              <p className="text-[11px] opacity-80 leading-snug">{btn.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
