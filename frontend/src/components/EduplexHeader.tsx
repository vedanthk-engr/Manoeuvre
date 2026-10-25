import React, { useState } from 'react';
import {
  Search,
  X,
  Maximize2,
  Minimize2,
  Check,
  User,
  LogOut,
  GraduationCap,
} from 'lucide-react';

interface EduplexHeaderProps {
  userName?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isFramed: boolean;
  onToggleFrame: () => void;
  onOpenProfile?: () => void;
  onOpenNotifications?: () => void;
  activeRole?: string;
}

export const EduplexHeader: React.FC<EduplexHeaderProps> = ({
  userName = 'Taylor',
  searchQuery,
  onSearchChange,
  isFramed,
  onToggleFrame,
  activeRole = 'Student & Educator',
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
      {/* Welcome Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171821] tracking-tight font-sans flex items-center gap-2">
          <span>Welcome back {userName}</span>
          <span className="inline-block hover:rotate-12 transition-transform cursor-default" role="img" aria-label="Waving hand">
            👋
          </span>
        </h1>
      </div>

      {/* Right Controls: Search bar, Frame Toggle, Profile Avatar */}
      <div className="flex items-center gap-3">
        {/* Search Bar */}
        <div className="relative">
          <label htmlFor="course-search" className="sr-only">
            Search courses
          </label>
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              id="course-search"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search courses"
              className="w-48 sm:w-64 pl-9 pr-8 py-2 rounded-full text-xs sm:text-sm bg-[#f4f5f7] hover:bg-[#eceef2] focus:bg-white text-slate-900 placeholder:text-slate-400 border border-transparent focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#d8fa55] transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* View Mode Toggle: Framed Lavender Canvas vs Fullscreen */}
        <button
          onClick={onToggleFrame}
          title={isFramed ? 'Switch to Fullscreen' : 'Switch to Canvas Frame'}
          className="p-2 rounded-full bg-[#f4f5f7] hover:bg-slate-200 text-slate-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d8fa55]"
          aria-label={isFramed ? 'Switch to Fullscreen' : 'Switch to Canvas Frame'}
        >
          {isFramed ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
        </button>

        {/* User Profile Avatar with Interactive Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            aria-expanded={showProfileMenu}
            aria-haspopup="menu"
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm hover:ring-2 hover:ring-[#d8fa55] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d8fa55]"
            aria-label="User profile and account settings"
          >
            {/* Custom stylized profile avatar SVG with purple/pink hairstyle matching image */}
            <svg viewBox="0 0 100 100" className="w-full h-full bg-[#e2d9fc]">
              <defs>
                <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ec4899" />
                  <stop offset="60%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#4f46e5" />
                </linearGradient>
                <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffd3b6" />
                  <stop offset="100%" stopColor="#ffaaa5" />
                </linearGradient>
              </defs>
              {/* Background gradient circle */}
              <circle cx="50" cy="50" r="50" fill="#f5d0fe" />
              {/* Hair Back */}
              <ellipse cx="50" cy="42" rx="36" ry="38" fill="url(#hairGrad)" />
              {/* Shoulders */}
              <path d="M 20 100 C 20 75, 80 75, 80 100 Z" fill="#312e81" />
              {/* Neck & Face */}
              <rect x="42" y="55" width="16" height="20" rx="4" fill="url(#skinGrad)" />
              <ellipse cx="50" cy="48" rx="22" ry="24" fill="url(#skinGrad)" />
              {/* Hair Front Bangs */}
              <path d="M 28 36 C 35 24, 65 24, 72 36 C 68 45, 52 46, 50 38 C 48 46, 32 45, 28 36 Z" fill="url(#hairGrad)" />
              {/* Cute Eyes & Smile */}
              <circle cx="43" cy="48" r="2.5" fill="#1e1b4b" />
              <circle cx="57" cy="48" r="2.5" fill="#1e1b4b" />
              <path d="M 46 56 Q 50 60 54 56" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
          </button>

          {showProfileMenu && (
            <div
              className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              role="menu"
            >
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-sm font-bold text-slate-900">{userName} Jenkins</p>
                <p className="text-xs text-slate-500">{activeRole}</p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-semibold text-emerald-600">Eduplex Pro Plan</span>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => setShowProfileMenu(false)}
                  className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  role="menuitem"
                >
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Edit Profile
                </button>
                <button
                  onClick={() => setShowProfileMenu(false)}
                  className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  role="menuitem"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                  Learning Goals & Records
                </button>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={() => setShowProfileMenu(false)}
                  className="w-full text-left px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                  role="menuitem"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
