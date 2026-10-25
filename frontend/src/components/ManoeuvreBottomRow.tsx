import React, { useState } from 'react';
import { ChevronDown, Plus, PenTool, Highlighter, Sparkles, CheckCircle2 } from 'lucide-react';
import {
  initialActiveLectures,
  initialAnnotationsRecaps,
  LectureItem,
  AnnotationRecapItem,
} from '../data/manoeuvreData';

/* =========================================================================
   1. ACTIVE & RECENT LECTURE SESSIONS
   ========================================================================= */
export const ManoeuvreActiveLectures: React.FC<{
  onStartNewSession: () => void;
  onSelectLecture: (lec: LectureItem) => void;
  searchQuery?: string;
}> = ({ onStartNewSession, onSelectLecture, searchQuery = '' }) => {
  const [filter, setFilter] = useState<'Active' | 'Completed' | 'All'>('Active');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const filteredLectures = initialActiveLectures
    .filter((lec) => {
      if (filter === 'Active') return lec.progressPercent < 100;
      if (filter === 'Completed') return lec.progressPercent >= 100;
      return true;
    })
    .filter((lec) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        lec.title.toLowerCase().includes(q) ||
        lec.instructor.toLowerCase().includes(q) ||
        lec.courseCode.toLowerCase().includes(q)
      );
    });

  const renderProgressCircle = (progress: number = 0) => {
    const size = 36;
    const strokeWidth = 3.5;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <div className="flex items-center gap-2">
        <div className="relative w-8 h-8 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#e2e8f0"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#22c55e"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-500 ease-out"
            />
          </svg>
        </div>
        <span className="text-xs font-bold text-slate-800">{progress}%</span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl p-3.5 border border-[#eef0f4] flex flex-col justify-between shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-xs sm:text-sm font-bold text-[#171821]">Active & Recent Lectures</h3>

        <div className="flex items-center gap-2">
          {/* Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200 transition-colors"
            >
              <span>{filter}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showFilterDropdown && (
              <div className="absolute right-0 mt-1 w-24 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-30">
                {(['Active', 'Completed', 'All'] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setFilter(opt);
                      setShowFilterDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-1 text-[11px] font-medium transition-colors ${
                      filter === opt ? 'bg-[#d8fa55]/30 text-slate-950 font-bold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onStartNewSession}
            className="w-5 h-5 rounded-full bg-[#d8fa55] hover:bg-[#cbf53d] text-slate-950 flex items-center justify-center shadow-sm hover:scale-110 transition-all focus:outline-none"
            title="Start New Lecture Session"
          >
            <Plus className="w-3 h-3 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Lectures List */}
      <div className="space-y-2">
        {filteredLectures.length === 0 ? (
          <div className="text-center py-4 text-xs text-slate-400">
            No matching lecture sessions found.
          </div>
        ) : (
          filteredLectures.map((lec) => (
          <div
            key={lec.id}
            onClick={() => onSelectLecture(lec)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectLecture(lec)}
            className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                  lec.iconType === 'embedded'
                    ? 'bg-[#ede9fe] text-[#7c3aed]'
                    : 'bg-[#ffe4e6] text-[#f43f5e]'
                }`}
              >
                {lec.courseCode.slice(0, 3)}
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#171821] group-hover:text-indigo-600 transition-colors leading-tight">
                  {lec.title}
                </h4>
                <p className="text-[10px] text-slate-400 font-medium">
                  {lec.instructor}
                </p>
              </div>
            </div>

            <div className="text-left hidden sm:block">
              <span className="text-[9px] text-slate-400 block font-medium">Duration</span>
              <span className="text-xs font-semibold text-slate-800">{lec.remainingDuration}</span>
            </div>

            <div>{renderProgressCircle(lec.progressPercent)}</div>
          </div>
        )))}
      </div>
    </div>
  );
};

/* =========================================================================
   2. SLIDE ANNOTATIONS & AI RECAPS
   ========================================================================= */
export const ManoeuvreAnnotationsRecaps: React.FC<{
  onOpenAnnotationManager: () => void;
  onSelectRecap: (recap: AnnotationRecapItem) => void;
}> = ({ onOpenAnnotationManager, onSelectRecap }) => {
  const [recaps, setRecaps] = useState<AnnotationRecapItem[]>(initialAnnotationsRecaps);

  const toggleRecapStatus = (id: string) => {
    setRecaps((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const nextStatus: AnnotationRecapItem['status'] =
          r.status === 'Annotated'
            ? 'Highlighted'
            : r.status === 'Highlighted'
            ? 'Generated'
            : 'Annotated';
        return { ...r, status: nextStatus };
      })
    );
  };

  const renderRecapIcon = (iconType: string) => {
    switch (iconType) {
      case 'stroke':
        return (
          <div className="w-7 h-7 rounded-lg bg-[#ede9fe] text-[#7c3aed] flex items-center justify-center">
            <PenTool className="w-3.5 h-3.5" />
          </div>
        );
      case 'ocr':
        return (
          <div className="w-7 h-7 rounded-lg bg-[#dcfce7] text-[#15803d] flex items-center justify-center">
            <Highlighter className="w-3.5 h-3.5" />
          </div>
        );
      case 'analogy':
        return (
          <div className="w-7 h-7 rounded-lg bg-[#ffedd5] text-[#c2410c] flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        );
      default:
        return (
          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        );
    }
  };

  const getStatusBadge = (status: AnnotationRecapItem['status']) => {
    switch (status) {
      case 'Annotated':
        return 'bg-[#ede9fe] text-[#7c3aed] hover:bg-[#ddd6fe]';
      case 'Highlighted':
        return 'bg-[#dcfce7] text-[#15803d] hover:bg-[#bbf7d0]';
      case 'Generated':
        return 'bg-[#ffedd5] text-[#c2410c] hover:bg-[#fed7aa]';
    }
  };

  return (
    <div className="bg-white rounded-2xl p-3.5 border border-[#eef0f4] flex flex-col justify-between shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-xs sm:text-sm font-bold text-[#171821]">Slide Annotations & AI Recaps</h3>

        <button
          onClick={onOpenAnnotationManager}
          className="w-5 h-5 rounded-full bg-[#d8fa55] hover:bg-[#cbf53d] text-slate-950 flex items-center justify-center shadow-sm hover:scale-110 transition-all focus:outline-none"
          title="Open Annotation Manager"
        >
          <Plus className="w-3 h-3 stroke-[2.5]" />
        </button>
      </div>

      {/* Recaps List */}
      <div className="space-y-1.5">
        {recaps.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-50 transition-colors group"
          >
            <div
              className="flex items-center gap-2.5 cursor-pointer"
              onClick={() => onSelectRecap(item)}
            >
              {renderRecapIcon(item.iconType)}
              <div>
                <h4 className="text-xs font-bold text-[#171821] group-hover:text-indigo-600 transition-colors leading-tight">
                  {item.title}
                </h4>
                <p className="text-[10px] text-slate-400 font-medium">
                  {item.meta}
                </p>
              </div>
            </div>

            <button
              onClick={() => toggleRecapStatus(item.id)}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition-all focus:outline-none ${getStatusBadge(
                item.status
              )}`}
              title="Click to cycle status"
            >
              {item.status}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
