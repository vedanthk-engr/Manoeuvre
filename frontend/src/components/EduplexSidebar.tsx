import React from 'react';
import {
  LayoutGrid,
  BookOpen,
  Layers,
  MessageSquare,
  Bell,
  CalendarDays,
  Users,
  Settings,
  ArrowUpRight,
  Radio,
} from 'lucide-react';

export type EduplexTab =
  | 'dashboard'
  | 'courses'
  | 'classes'
  | 'messages'
  | 'notifications'
  | 'calendars'
  | 'community'
  | 'settings';

interface EduplexSidebarProps {
  activeTab: EduplexTab;
  onSelectTab: (tab: EduplexTab) => void;
  unreadCount?: number;
  onOpenMobileAppModal: () => void;
  onOpenManoeuvreHub?: () => void;
  isDeviceConnected?: boolean;
}

export const EduplexSidebar: React.FC<EduplexSidebarProps> = ({
  activeTab,
  onSelectTab,
  unreadCount = 2,
  onOpenMobileAppModal,
  onOpenManoeuvreHub,
  isDeviceConnected = false,
}) => {
  const navItems = [
    { id: 'dashboard' as EduplexTab, label: 'Dashboard', icon: LayoutGrid },
    { id: 'courses' as EduplexTab, label: 'My Courses', icon: BookOpen },
    { id: 'classes' as EduplexTab, label: 'My Classes', icon: Layers },
    { id: 'messages' as EduplexTab, label: 'Messages', icon: MessageSquare },
    { id: 'notifications' as EduplexTab, label: 'Notifications', icon: Bell, badge: unreadCount },
    { id: 'calendars' as EduplexTab, label: 'Calendars', icon: CalendarDays },
    { id: 'community' as EduplexTab, label: 'Community', icon: Users },
    { id: 'settings' as EduplexTab, label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className="w-64 bg-[#181a24] text-slate-300 flex flex-col justify-between p-6 select-none border-r border-[#242838]/40 transition-all duration-300"
      aria-label="Eduplex Navigation"
    >
      <div>
        {/* Brand Header */}
        <div className="flex items-center justify-between mb-8 px-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md shadow-black/20">
              <div className="w-4 h-4 rounded-full border-[2.5px] border-[#181a24] border-t-transparent -rotate-45" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white font-sans">
              Eduplex
            </span>
          </div>

          {/* Manoeuvre Wearable status dot */}
          {onOpenManoeuvreHub && (
            <button
              onClick={onOpenManoeuvreHub}
              title={isDeviceConnected ? 'Manoeuvre Glove: Connected' : 'Manoeuvre Glove: Disconnected (Click for Hub)'}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold transition-all ${
                isDeviceConnected
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
              }`}
              aria-label="Wearable Controller Hub"
            >
              <Radio className={`w-3 h-3 ${isDeviceConnected ? 'animate-pulse text-emerald-400' : ''}`} />
              <span>{isDeviceConnected ? 'Glove' : 'Sync'}</span>
            </button>
          )}
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
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d8fa55] ${
                  isActive
                    ? 'bg-[#d8fa55] text-slate-950 shadow-md font-semibold'
                    : 'text-[#8e93a6] hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-slate-950 stroke-[2.4]' : 'text-[#8e93a6] group-hover:text-white'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && item.badge > 0 ? (
                  <span
                    className={`px-1.5 py-0.5 text-[11px] font-bold rounded-full min-w-[20px] text-center ${
                      isActive
                        ? 'bg-slate-950 text-white'
                        : 'bg-[#ff7243] text-white shadow-sm'
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Promo Card: "Download our mobile app" */}
      <div className="mt-6">
        <button
          onClick={onOpenMobileAppModal}
          className="w-full text-left bg-[#d8fa55] hover:bg-[#d0f545] text-slate-950 p-4 rounded-2xl relative overflow-hidden transition-all duration-300 group hover:shadow-xl hover:shadow-[#d8fa55]/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#d8fa55]"
          aria-label="Download our mobile app"
        >
          {/* Top circle button with arrow */}
          <div className="flex justify-between items-start mb-3">
            <div className="w-10 h-10">
              {/* Hand-drawn squiggly decorative notebook icon */}
              <svg
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-9 h-9 text-slate-900/80 stroke-current"
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

            <div className="w-8 h-8 rounded-full bg-white text-slate-950 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>

          <p className="text-sm font-bold text-slate-950 leading-snug pr-2">
            Download our <br />
            mobile app
          </p>

          {/* Decorative mini corner lines */}
          <div className="absolute right-3 bottom-3 flex flex-col gap-1 opacity-40">
            <div className="w-4 h-1 bg-slate-900 rounded-full" />
            <div className="w-4 h-1 bg-slate-900 rounded-full" />
            <div className="w-3 h-1 bg-slate-900 rounded-full" />
            <div className="w-2 h-1 bg-slate-900 rounded-full" />
          </div>
        </button>
      </div>
    </aside>
  );
};
