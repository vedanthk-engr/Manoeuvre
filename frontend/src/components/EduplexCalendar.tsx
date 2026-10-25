import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface EduplexCalendarProps {
  onSelectDate?: (date: number, month: string, year: number) => void;
}

export const EduplexCalendar: React.FC<EduplexCalendarProps> = ({ onSelectDate }) => {
  const [currentMonthIndex, setCurrentMonthIndex] = useState(7); // August (0-indexed: 7)
  const [currentYear, setCurrentYear] = useState(2023);
  const [selectedDay, setSelectedDay] = useState<number>(17); // 17 August 2023 as in image

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (currentMonthIndex === 0) {
      setCurrentMonthIndex(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonthIndex((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex === 11) {
      setCurrentMonthIndex(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonthIndex((m) => m + 1);
    }
  };

  const handleDateClick = (day: number) => {
    setSelectedDay(day);
    if (onSelectDate) {
      onSelectDate(day, months[currentMonthIndex], currentYear);
    }
  };

  // Static calendar representation matching the August 2023 screenshot
  // Row 1: 28, 29, 30, 31 (prev month), 1, 2, 3
  const prevMonthDays = [28, 29, 30, 31];
  const currentMonthDays = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="bg-white rounded-2xl p-4 border border-[#eef0f4] flex flex-col justify-between shadow-sm">
      {/* Month Navigator Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <button
          onClick={handlePrevMonth}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d8fa55]"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <span className="text-xs font-bold text-[#171821]">
          {months[currentMonthIndex]}, {currentYear}
        </span>

        <button
          onClick={handleNextMonth}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d8fa55]"
          aria-label="Next month"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-slate-400 mb-2">
        <span>S</span>
        <span>M</span>
        <span>T</span>
        <span>W</span>
        <span>T</span>
        <span>F</span>
        <span>S</span>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium">
        {/* Leading days from previous month in faded text */}
        {prevMonthDays.map((d) => (
          <div
            key={`prev-${d}`}
            className="w-6 h-6 mx-auto flex items-center justify-center text-slate-300 pointer-events-none"
          >
            {d}
          </div>
        ))}

        {/* Current Month Days */}
        {currentMonthDays.map((d) => {
          const isSelected = selectedDay === d && currentMonthIndex === 7 && currentYear === 2023;

          return (
            <button
              key={`curr-${d}`}
              onClick={() => handleDateClick(d)}
              className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center text-[11px] transition-all focus:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 ${
                isSelected
                  ? 'bg-[#d8fa55] text-slate-950 font-bold shadow-sm scale-110'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
              aria-label={`${d} ${months[currentMonthIndex]} ${currentYear}${isSelected ? ' (Selected)' : ''}`}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
};
