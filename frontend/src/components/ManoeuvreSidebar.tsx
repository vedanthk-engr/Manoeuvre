import React from 'react';
import {
  LayoutGrid,
  Cpu,
  Presentation,
  Airplay,
  Sparkles,
  PenTool,
  TrendingUp,
  Settings,
  ArrowUpRight,
  Radio,
} from 'lucide-react';
import { PrimaryMode } from '../types';

export type ManoeuvreTab =
  | 'dashboard'
  | 'device'
  | 'presentation'
  | 'workspace'
  | 'ai'
  | 'annotations'
  | 'coach'
  | 'settings';

interface ManoeuvreSidebarProps {
  activeTab: ManoeuvreTab;
  onSelectTab: (tab: ManoeuvreTab) => void;
  isDeviceConnected: boolean;
  activeMode: PrimaryMode;
  onOpenHardwareModal: () => void;
  sessionActive?: boolean;
}

export const ManoeuvreSidebar: React.FC<ManoeuvreSidebarProps> = ({
  activeTab,
  onSelectTab,
  isDeviceConnected,
  activeMode,
  onOpenHardwareModal,
  sessionActive = false,
}) => {
  const navItems = [
    { id: 'dashboard' as ManoeuvreTab, label: 'Dashboard', icon: LayoutGrid },
    { id: 'device' as ManoeuvreTab, label: 'Device Manager', icon: Cpu, badgeText: isDeviceConnected ? 'ON' : undefined },
    { id: 'presentation' as ManoeuvreTab, label: 'Presentations', icon: Presentation },
    { id: 'workspace' as ManoeuvreTab, label: 'Lecture Workspace', icon: Airplay, badgeText: sessionActive ? 'LIVE' : undefined },
    { id: 'ai' as ManoeuvreTab, label: 'AI Workspace', icon: Sparkles },
    { id: 'annotations' as ManoeuvreTab, label: 'Annotations', icon: PenTool },
    { id: 'coach' as ManoeuvreTab, label: 'Teaching Coach', icon: TrendingUp },
    { id: 'settings' as ManoeuvreTab, label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className="w-64 bg-[#181a24] text-slate-300 flex flex-col justify-between p-5 select-none border-r border-[#242838]/40 transition-all duration-300 flex-shrink-0"
      aria-label="Manoeuvre Studio Navigation"
    >
      <div>
        {/* Brand Header */}
        <div className="mb-7 px-1">
          <span className="text-2xl font-black tracking-tight text-white font-sans block leading-none">
            Manoeuvre
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5" role="navigation" aria-label="Main menu">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all duration-200 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d8fa55] ${
                  isActive
                    ? 'bg-[#d8fa55] text-slate-950 shadow-md font-bold'
                    : 'text-[#8e93a6] hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-slate-950 stroke-[2.4]' : 'text-[#8e93a6] group-hover:text-white'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badgeText && (
                  <span
                    className={`px-1.5 py-0.5 text-[9px] font-black rounded-full min-w-[18px] text-center ${
                      isActive
                        ? 'bg-slate-950 text-white'
                        : item.badgeText === 'LIVE'
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-emerald-500 text-slate-950'
                    }`}
                  >
                    {item.badgeText}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Promo Card: "Wearable Glove Companion" */}
      <div className="mt-5">
        <button
          onClick={onOpenHardwareModal}
          className="w-full text-left bg-[#d8fa55] hover:bg-[#d0f545] text-slate-950 p-3.5 rounded-2xl relative overflow-hidden transition-all duration-300 group hover:shadow-xl hover:shadow-[#d8fa55]/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#d8fa55]"
          aria-label="Wearable Glove Companion"
        >
          {/* Top circle button with arrow */}
          <div className="flex justify-between items-start mb-2">
            <div className="w-8 h-8">
              {/* Telemetry wave lines */}
              <svg
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-7 h-7 text-slate-900/80 stroke-current"
              >
                <path
                  d="M6 14 C10 10, 14 18, 18 14 C22 10, 26 18, 30 14"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M6 22 C10 18, 14 26, 18 22 C22 18, 26 26, 30 22"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <div className="w-7 h-7 rounded-full bg-white text-slate-950 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </div>

          <p className="text-xs font-bold text-slate-950 leading-snug">
            Wearable Glove Sync
          </p>
          <p className="text-[10px] text-slate-800/80 font-semibold mt-0.5">
            WS: 10.190.151.30:8000
          </p>

          {/* Decorative mini corner dots */}
          <div className="absolute right-3 bottom-3 flex flex-col gap-1 opacity-35">
            <div className="w-3.5 h-0.5 bg-slate-900 rounded-full" />
            <div className="w-3.5 h-0.5 bg-slate-900 rounded-full" />
            <div className="w-2.5 h-0.5 bg-slate-900 rounded-full" />
          </div>
        </button>
      </div>
    </aside>
  );
};
