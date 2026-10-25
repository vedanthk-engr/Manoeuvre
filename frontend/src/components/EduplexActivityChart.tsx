import React, { useState } from 'react';
import { TrendingUp, ChevronDown } from 'lucide-react';
import { activityData } from '../data/eduplexData';

type Timeframe = 'Weekly' | 'Monthly' | 'Daily';

export const EduplexActivityChart: React.FC = () => {
  const [timeframe, setTimeframe] = useState<Timeframe>('Weekly');
  const [showDropdown, setShowDropdown] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(4); // Default Thursday

  const currentData = activityData[timeframe];
  const maxHours = Math.max(...currentData.map((d) => d.hours), 8);

  const selectedItem = hoveredIndex !== null && currentData[hoveredIndex]
    ? currentData[hoveredIndex]
    : currentData[4] || currentData[0];

  return (
    <div className="bg-white rounded-2xl p-4 border border-[#eef0f4] flex flex-col justify-between shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-[#171821] mb-1">
            Hours Activity
          </h3>
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-semibold">
            <TrendingUp className="w-2.5 h-2.5" />
            <span>+3% increase than last week</span>
          </div>
        </div>

        {/* Timeframe Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d8fa55]"
            aria-expanded={showDropdown}
            aria-haspopup="listbox"
          >
            <span>{timeframe}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-1 w-28 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-30">
              {(['Weekly', 'Monthly', 'Daily'] as Timeframe[]).map((tf) => (
                <button
                  key={tf}
                  onClick={() => {
                    setTimeframe(tf);
                    setShowDropdown(false);
                    setHoveredIndex(tf === 'Weekly' ? 4 : 2);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs font-medium transition-colors ${
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
        {/* Y-Axis Grid Lines & Labels */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] font-medium text-slate-400 pl-1">
          {['8h', '6h', '4h', '2h', '1h'].map((val, idx) => (
            <div key={idx} className="flex items-center gap-2 w-full">
              <span className="w-4 text-right">{val}</span>
              <div className="flex-1 border-b border-dashed border-slate-100" />
            </div>
          ))}
        </div>

        {/* Interactive Bar Columns Container */}
        <div className="absolute inset-y-0 left-8 right-2 flex items-end justify-between px-2 pb-5">
          {currentData.map((item, index) => {
            const isTarget = hoveredIndex === index;
            // Height calculation relative to 8h
            const heightPercent = Math.min(Math.max((item.hours / 8) * 85, 8), 92);

            return (
              <div
                key={item.day}
                className="flex flex-col items-center flex-1 h-full justify-end relative cursor-pointer group"
                onMouseEnter={() => setHoveredIndex(index)}
                onClick={() => setHoveredIndex(index)}
              >
                {/* Floating Tooltip pinned to active bar */}
                {isTarget && (
                  <div
                    className="absolute z-20 flex flex-col items-center pointer-events-none animate-in fade-in zoom-in-95 duration-150"
                    style={{ bottom: `calc(${heightPercent}% + 6px)` }}
                  >
                    <div className="bg-[#181a24] text-white px-2 py-1 rounded-md text-[10px] font-semibold whitespace-nowrap shadow-lg flex items-center gap-1.5 border border-slate-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#d8fa55] animate-pulse" />
                      <span>{item.durationStr}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-300">{item.fullDate}</span>
                    </div>
                    {/* Dotted indicator line down to bar */}
                    <div className="w-[1px] h-3 border-l border-dashed border-slate-400/80 my-0.5" />
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

                {/* X-Axis Day Label */}
                <span
                  className={`text-[10px] font-semibold mt-2 transition-colors ${
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
