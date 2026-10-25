import React, { useState } from 'react';
import {
  Search,
  X,
  Maximize2,
  Minimize2,
  Radio,
  Tv,
  Settings,
  Cpu,
  LogOut,
  Upload,
} from 'lucide-react';
import { PrimaryMode } from '../types';

interface ManoeuvreHeaderProps {
  professorName?: string;
  lectureTitle?: string;
  isDeviceConnected: boolean;
  activeMode: PrimaryMode;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenSettings: () => void;
  onOpenWorkspace: () => void;
  onOpenPresentations?: () => void;
}

export const ManoeuvreHeader: React.FC<ManoeuvreHeaderProps> = ({
  professorName = 'Professor',
  lectureTitle = 'AI-Assisted Lecture Suite',
  isDeviceConnected,
  activeMode,
  searchQuery,
  onSearchChange,
  onOpenSettings,
  onOpenWorkspace,
  onOpenPresentations,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
      {/* Title & Status */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171821] tracking-tight font-sans flex items-center gap-2">
          <span>Welcome back {professorName}</span>
          <span className="inline-block hover:rotate-12 transition-transform cursor-default" role="img" aria-label="Waving hand">
            👋
          </span>
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          {lectureTitle} • Gesture-Assisted Slide Control & Real-time AI
        </p>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Glove Status Pill */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            isDeviceConnected
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isDeviceConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
            }`}
          />
          <span>{isDeviceConnected ? `Glove: ${activeMode}` : 'ESP8266 Offline'}</span>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <label htmlFor="manoeuvre-search" className="sr-only">
            Search slides and lectures
          </label>
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              id="manoeuvre-search"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search slides, notes..."
              className="w-44 sm:w-56 pl-8 pr-7 py-1.5 rounded-full text-xs bg-[#f4f5f7] hover:bg-[#eceef2] focus:bg-white text-slate-900 placeholder:text-slate-400 border border-transparent focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#d8fa55] transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
                aria-label="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Upload PPT / PDF */}
        {onOpenPresentations && (
          <button
            onClick={onOpenPresentations}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#d8fa55] hover:bg-[#cbf53d] text-slate-950 transition-transform hover:scale-105 shadow-sm"
            title="Upload PowerPoint (.pptx) or PDF slide decks"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload Deck</span>
          </button>
        )}

        {/* Professor Profile Avatar */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            aria-expanded={showProfileMenu}
            aria-haspopup="menu"
            className="w-9 h-9 rounded-full overflow-hidden border-2 border-white shadow-sm hover:ring-2 hover:ring-[#d8fa55] transition-all focus:outline-none"
            aria-label="Professor account options"
          >
            <div className="w-full h-full bg-[#181a24] text-[#d8fa55] flex items-center justify-center font-bold text-xs tracking-wider">
              PR
            </div>
          </button>

          {showProfileMenu && (
            <div
              className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              role="menu"
            >
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">Dr. Taylor Jenkins</p>
                <p className="text-[10px] text-slate-500">Lead Instructor • CS Department</p>
                <p className="text-[10px] font-mono text-emerald-600 font-semibold mt-1">
                  Target: 10.190.151.30:8000
                </p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenWorkspace();
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Tv className="w-3.5 h-3.5 text-slate-400" />
                  Live Lecture Workspace
                </button>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenSettings();
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  Hardware & AI Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
