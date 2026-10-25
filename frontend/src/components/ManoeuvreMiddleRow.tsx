import React, { useState } from 'react';
import {
  TrendingUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Layers,
  PenTool,
  Sparkles,
} from 'lucide-react';
import { gestureActivityData, initialSlideTopics, SlideTopicItem } from '../data/manoeuvreData';

type Timeframe = 'Weekly' | 'Session' | 'Daily';

/* =========================================================================
   1. GESTURE & IMU ACTIVITY CHART
   ========================================================================= */
export const ManoeuvreActivityChart: React.FC = () => {
  const [timeframe, setTimeframe] = useState<Timeframe>('Weekly');
  const [showDropdown, setShowDropdown] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(4); // Thursday / Slide 4

  const currentData = gestureActivityData[timeframe];
  const maxVal = Math.max(...currentData.map((d) => d.hours), 60);

  return (
    <div className="bg-white rounded-2xl p-3.5 border border-[#eef0f4] flex flex-col justify-between shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-[#171821] mb-0.5">
            Gesture & IMU Activity
          </h3>
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-semibold">
            <TrendingUp className="w-2.5 h-2.5" />
            <span>+14% transition smoothness</span>
          </div>
        </div>

        {/* Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 transition-colors"
          >
            <span>{timeframe}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-1 w-24 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-30">
              {(['Weekly', 'Session', 'Daily'] as Timeframe[]).map((tf) => (
                <button
                  key={tf}
                  onClick={() => {
                    setTimeframe(tf);
                    setShowDropdown(false);
                    setHoveredIndex(tf === 'Weekly' ? 4 : 3);
                  }}
                  className={`w-full text-left px-3 py-1 text-[11px] font-medium transition-colors ${
                    timeframe === tf
                      ? 'bg-[#d8fa55]/30 text-slate-950 font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="relative h-36 mt-1 select-none">
        {/* Y-Axis Grid */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[9px] font-medium text-slate-400 pl-1">
          {['60g', '45g', '30g', '15g', '0g'].map((val, idx) => (
            <div key={idx} className="flex items-center gap-1.5 w-full">
              <span className="w-4 text-right">{val}</span>
              <div className="flex-1 border-b border-dashed border-slate-100" />
            </div>
          ))}
        </div>

        {/* Interactive Bars */}
        <div className="absolute inset-y-0 left-7 right-2 flex items-end justify-between px-2 pb-4">
          {currentData.map((item, index) => {
            const isTarget = hoveredIndex === index;
            const heightPercent = Math.min(Math.max((item.hours / 65) * 88, 8), 92);

            return (
              <div
                key={item.day}
                className="flex flex-col items-center flex-1 h-full justify-end relative cursor-pointer group"
                onMouseEnter={() => setHoveredIndex(index)}
                onClick={() => setHoveredIndex(index)}
              >
                {/* Tooltip */}
                {isTarget && (
                  <div
                    className="absolute z-20 flex flex-col items-center pointer-events-none animate-in fade-in zoom-in-95 duration-150"
                    style={{ bottom: `calc(${heightPercent}% + 5px)` }}
                  >
                    <div className="bg-[#181a24] text-white px-2 py-0.5 rounded-md text-[9px] font-semibold whitespace-nowrap shadow-lg flex items-center gap-1.5 border border-slate-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#d8fa55] animate-pulse" />
                      <span>{item.durationStr}</span>
                    </div>
                    <div className="w-[1px] h-2.5 border-l border-dashed border-slate-400/80 my-0.5" />
                  </div>
                )}

                {/* Dark Rounded Bar */}
                <div
                  className={`w-2.5 sm:w-3.5 rounded-full transition-all duration-300 ${
                    isTarget
                      ? 'bg-slate-950 scale-y-105 shadow-md'
                      : 'bg-[#181a24] hover:bg-slate-800 opacity-90'
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />

                <span
                  className={`text-[9px] font-semibold mt-1.5 transition-colors ${
                    isTarget ? 'text-slate-950 font-bold' : 'text-slate-400'
                  }`}
                >
                  {item.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   2. LECTURE OUTLINE & AGENDA
   ========================================================================= */
export const ManoeuvreSlideAgenda: React.FC<{
  onSelectSlide: (slideIdx: number) => void;
  presentation?: any;
  searchQuery?: string;
}> = ({ onSelectSlide, presentation, searchQuery = '' }) => {
  const renderTopicIcon = (iconType: string) => {
    switch (iconType) {
      case 'architecture':
        return (
          <div className="w-7 h-7 rounded-lg bg-[#ffedd5] text-[#ea580c] flex items-center justify-center">
            <Layers className="w-3.5 h-3.5" />
          </div>
        );
      case 'imu':
        return (
          <div className="w-7 h-7 rounded-lg bg-[#ede9fe] text-[#7c3aed] flex items-center justify-center">
            <Cpu className="w-3.5 h-3.5" />
          </div>
        );
      case 'annotation':
        return (
          <div className="w-7 h-7 rounded-lg bg-[#ecfccb] text-[#65a30d] flex items-center justify-center">
            <PenTool className="w-3.5 h-3.5" />
          </div>
        );
      case 'ai':
        return (
          <div className="w-7 h-7 rounded-lg bg-[#fef3c7] text-[#d97706] flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        );
      default:
        return (
          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
            <Layers className="w-3.5 h-3.5" />
          </div>
        );
    }
  };

  const filteredTopics = initialSlideTopics.filter((item) =>
    searchQuery
      ? item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  return (
    <div className="bg-white rounded-2xl p-3.5 border border-[#eef0f4] flex flex-col justify-between shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs sm:text-sm font-bold text-[#171821]">Slide Deck Agenda</h3>
        {presentation?.title && (
          <span className="text-[10px] text-slate-400 font-semibold truncate max-w-[110px]">
            {presentation.title}
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        {filteredTopics.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectSlide(item.slideIndex)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectSlide(item.slideIndex)}
            className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d8fa55]"
          >
            <div className="flex items-center gap-2.5">
              {renderTopicIcon(item.iconType)}
              <div>
                <h4 className="text-[11px] font-bold text-[#171821] group-hover:text-indigo-600 transition-colors leading-tight">
                  {item.title}
                </h4>
                <p className="text-[9px] text-slate-400 font-medium">
                  {item.subtitle}
                </p>
              </div>
            </div>

            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
          </div>
        ))}
      </div>
    </div>
  );
};

/* =========================================================================
   3. INTERACTIVE SLIDE NAVIGATOR & SCHEDULE
   ========================================================================= */
export const ManoeuvreSlideNavigator: React.FC<{
  currentSlide: number;
  totalSlides?: number;
  onSelectSlide: (slideIdx: number) => void;
}> = ({ currentSlide, totalSlides = 24, onSelectSlide }) => {
  const [deckPage, setDeckPage] = useState(1);
  const pageSize = 24;
  const maxPages = Math.max(1, Math.ceil(totalSlides / pageSize));
  const currentPage = Math.min(deckPage, maxPages);
  const startIdx = (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(totalSlides, currentPage * pageSize);
  const slides = Array.from({ length: Math.max(1, endIdx - startIdx + 1) }, (_, i) => startIdx + i);

  return (
    <div className="bg-white rounded-2xl p-3.5 border border-[#eef0f4] flex flex-col justify-between shadow-sm">
      {/* Navigator Header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <button
          onClick={() => setDeckPage((p) => Math.max(1, p - 1))}
          disabled={currentPage <= 1}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 transition-colors"
          aria-label="Previous slide group"
        >
          <ChevronLeft className="w-3 h-3" />
        </button>

        <span className="text-[11px] font-bold text-[#171821]">
          Slides {startIdx} - {endIdx} of {totalSlides}
        </span>

        <button
          onClick={() => setDeckPage((p) => Math.min(maxPages, p + 1))}
          disabled={currentPage >= maxPages}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 transition-colors"
          aria-label="Next slide group"
        >
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Slide Type Markers */}
      <div className="grid grid-cols-6 gap-1 text-center text-[8px] font-bold uppercase tracking-wider text-slate-400 mb-1">
        <span>IN</span>
        <span>IMU</span>
        <span>INK</span>
        <span>OCR</span>
        <span>AI</span>
        <span>REV</span>
      </div>

      {/* Slide Grid */}
      <div className="grid grid-cols-6 gap-1.5 text-center text-[10px] font-medium">
        {slides.map((s) => {
          const isSelected = s === currentSlide;

          return (
            <button
              key={s}
              onClick={() => onSelectSlide(s)}
              className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center text-[10px] transition-all focus:outline-none ${
                isSelected
                  ? 'bg-[#d8fa55] text-slate-950 font-black shadow-sm scale-110 ring-2 ring-[#d8fa55]'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
              title={`Jump to Slide ${s}`}
            >
              {s}
            </button>
          );
        })}
      </div>
    </div>
  );
};
