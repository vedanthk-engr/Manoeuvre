import React from 'react';
import { Cpu, Presentation, Sparkles, Play, Airplay, ChevronRight, Upload } from 'lucide-react';
import { PresentationState, PrimaryMode } from '../types';

interface ManoeuvreTopCardsProps {
  presentation: PresentationState | null;
  isDeviceConnected: boolean;
  activeMode: PrimaryMode;
  sessionActive: boolean;
  onStartSession: (title: string) => void;
  onNavigate: (tab: string) => void;
}

export const ManoeuvreTopCards: React.FC<ManoeuvreTopCardsProps> = ({
  presentation,
  isDeviceConnected,
  activeMode,
  sessionActive,
  onStartSession,
  onNavigate,
}) => {
  return (
    <section className="mb-4" aria-labelledby="manoeuvre-top-cards-heading">
      <div className="flex items-center justify-between mb-2.5">
        <h2 id="manoeuvre-top-cards-heading" className="text-sm font-bold text-[#171821]">
          Hardware & Presentation Status
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('presentation')}
            className="flex items-center gap-1 text-[11px] font-bold text-slate-900 bg-[#d8fa55] hover:bg-[#cbf53d] px-2.5 py-1 rounded-lg transition-transform hover:scale-105 shadow-sm"
          >
            <Upload className="w-3 h-3" />
            <span>Upload Deck</span>
          </button>
          <button
            onClick={() => onNavigate('presentation')}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            Manage Decks
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Wearable Glove Hardware */}
        <div
          onClick={() => onNavigate('device')}
          tabIndex={0}
          role="button"
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onNavigate('device')}
          className="bg-white rounded-2xl p-3 sm:p-3.5 border border-[#eef0f4] hover:border-slate-300 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d8fa55]"
        >
          <div>
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#fff3eb] text-[#ea580c] flex items-center justify-center">
                <Cpu className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[#171821] group-hover:text-indigo-600 transition-colors leading-tight">
                  Wearable Glove
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">
                  {isDeviceConnected ? 'Connected (Wi-Fi)' : 'ESP8266 / ESP32'}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-1.5 border-t border-slate-50 flex items-center justify-between text-[11px]">
            <div>
              <span className="text-[9px] text-slate-400 block font-medium">Mode</span>
              <span className="font-bold text-slate-800 text-[11px]">{activeMode}</span>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-slate-400 block font-medium">Telemetry</span>
              <span className="font-semibold text-emerald-600 text-[10px]">
                {isDeviceConnected ? '6-Axis IMU' : '10.190.151.30'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Slide Presentation */}
        <div
          onClick={() => onNavigate('presentation')}
          tabIndex={0}
          role="button"
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onNavigate('presentation')}
          className="bg-white rounded-2xl p-3 sm:p-3.5 border border-[#eef0f4] hover:border-slate-300 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d8fa55]"
        >
          <div>
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#f4fce3] text-[#65a30d] flex items-center justify-center">
                <Presentation className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[#171821] group-hover:text-indigo-600 transition-colors leading-tight truncate max-w-[130px]">
                  {presentation?.title || 'Lecture Slide Deck'}
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">
                  {presentation?.total_slides ? `${presentation.total_slides} Slides Loaded` : 'Ready to Load'}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-1.5 border-t border-slate-50 flex items-center justify-between text-[11px]">
            <div>
              <span className="text-[9px] text-slate-400 block font-medium">Current</span>
              <span className="font-bold text-slate-800 text-[11px]">
                Slide {(presentation?.current_slide_index ?? 0) + 1}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-slate-400 block font-medium">Control</span>
              <span className="font-semibold text-slate-700 text-[10px]">Wrist Tilt</span>
            </div>
          </div>
        </div>

        {/* Card 3: AI Teaching Copilot */}
        <div
          onClick={() => onNavigate('ai')}
          tabIndex={0}
          role="button"
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onNavigate('ai')}
          className="bg-white rounded-2xl p-3 sm:p-3.5 border border-[#eef0f4] hover:border-slate-300 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d8fa55]"
        >
          <div>
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#f3f0ff] text-[#8b5cf6] flex items-center justify-center">
                <Sparkles className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[#171821] group-hover:text-indigo-600 transition-colors leading-tight">
                  AI Teaching Copilot
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">
                  Multimodal Neural Engine
                </p>
              </div>
            </div>
          </div>

          <div className="pt-1.5 border-t border-slate-50 flex items-center justify-between text-[11px]">
            <div>
              <span className="text-[9px] text-slate-400 block font-medium">Assistant</span>
              <span className="font-bold text-slate-800 text-[11px]">Voice & OCR</span>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-slate-400 block font-medium">Action</span>
              <span className="font-semibold text-indigo-600 text-[10px]">Instant Explain</span>
            </div>
          </div>
        </div>

        {/* Card 4: Live Lecture Session Card (Dark Card matching screenshot) */}
        <div className="bg-[#181a24] text-white rounded-2xl p-3 sm:p-3.5 relative overflow-hidden flex flex-col justify-between shadow-lg group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#d8fa55]/10 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full border border-[#181a24] border-t-transparent" />
              </div>
              <span className="text-[9px] tracking-wider uppercase font-bold text-[#d8fa55]">
                {sessionActive ? 'SESSION IN PROGRESS' : 'LIVE STUDIO'}
              </span>
            </div>

            <h3 className="text-xs sm:text-sm font-bold text-white mb-0.5">
              {sessionActive ? 'Active Lecture' : 'Live Presentation'}
            </h3>
            <p className="text-[10px] text-slate-400 leading-tight max-w-[130px] mb-2">
              Natural wrist-tilt slide control & real-time telemetry
            </p>
          </div>

          <div className="flex items-end justify-between relative z-10">
            <button
              onClick={() => {
                if (sessionActive) {
                  onNavigate('workspace');
                } else {
                  onStartSession('CS Lecture Session');
                  onNavigate('workspace');
                }
              }}
              className="px-3 py-1 rounded-full bg-[#d8fa55] hover:bg-[#cbf53d] text-slate-950 font-bold text-[11px] shadow transition-transform group-hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-white flex items-center gap-1"
            >
              {sessionActive ? (
                <>
                  <Airplay className="w-3 h-3" />
                  <span>Enter Studio</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" />
                  <span>Start Session</span>
                </>
              )}
            </button>

            {/* Custom SVG: Teacher with wearable glove presenting on slides */}
            <div className="w-16 h-16 -mr-1 -mb-1 flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Projected slide screen */}
                <rect x="35" y="20" width="55" height="35" rx="3" fill="#334155" />
                <rect x="40" y="25" width="45" height="4" rx="1" fill="#d8fa55" />
                <rect x="40" y="32" width="30" height="3" rx="1" fill="#64748b" />
                <rect x="40" y="38" width="38" height="3" rx="1" fill="#64748b" />
                <rect x="40" y="44" width="22" height="3" rx="1" fill="#64748b" />

                {/* Presenter figure */}
                <circle cx="24" cy="40" r="9" fill="#fcd34d" />
                <path d="M 12 75 C 12 55, 36 55, 36 75 Z" fill="#6366f1" />
                {/* Arm pointing forward with wearable glove */}
                <path d="M 28 58 L 48 48" stroke="#6366f1" strokeWidth="5" strokeLinecap="round" fill="none" />
                {/* Wearable glove with glowing pulse */}
                <circle cx="48" cy="48" r="4.5" fill="#d8fa55" />
                <circle cx="48" cy="48" r="7" stroke="#d8fa55" strokeWidth="1" strokeDasharray="2,2" fill="none" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
