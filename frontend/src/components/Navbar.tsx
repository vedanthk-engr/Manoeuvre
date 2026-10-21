import React from 'react';
import {
  LayoutDashboard,
  Cpu,
  FileText,
  Presentation,
  Sparkles,
  Edit3,
  GraduationCap,
  BarChart3,
  Settings,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { PrimaryMode } from '../types';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  isDeviceConnected: boolean;
  activeMode: PrimaryMode;
  sessionActive: boolean;
  sessionTitle?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  isDeviceConnected,
  activeMode,
  sessionActive,
  sessionTitle,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'device', label: 'Device Manager', icon: Cpu },
    { id: 'presentation', label: 'Presentations', icon: FileText },
    { id: 'workspace', label: 'Lecture Workspace', icon: Presentation },
    { id: 'ai', label: 'AI Workspace', icon: Sparkles },
    { id: 'annotations', label: 'Annotations', icon: Edit3 },
    { id: 'coach', label: 'Teaching Coach', icon: GraduationCap },
    { id: 'analytics', label: 'Analytics & History', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 select-none shrink-0 z-50">
      {/* Brand & Connection Badge */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm tracking-wider">
            M
          </div>
          <span className="font-semibold text-slate-100 text-sm tracking-wide">
            MANOEUVRE <span className="text-xs text-slate-500 font-normal">STUDIO</span>
          </span>
        </div>

        {/* Hardware Status Pill */}
        <div
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            isDeviceConnected
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}
        >
          {isDeviceConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          <span>{isDeviceConnected ? 'GLOVE ONLINE' : 'DISCONNECTED'}</span>
        </div>

        {/* Active Mode Pill */}
        <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
          <span className="text-[10px] text-slate-400 font-normal">MODE:</span>
          <span>{activeMode}</span>
        </div>

        {/* Active Session Badge */}
        {sessionActive && (
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 border border-amber-500/30 text-amber-300 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span>LIVE: {sessionTitle || 'Active Lecture'}</span>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <nav className="flex items-center space-x-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};
