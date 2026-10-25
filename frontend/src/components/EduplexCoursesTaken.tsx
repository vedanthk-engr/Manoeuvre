import React, { useState } from 'react';
import { Course } from '../data/eduplexData';
import { ChevronDown, Plus } from 'lucide-react';

interface EduplexCoursesTakenProps {
  courses: Course[];
  onSelectCourse: (course: Course) => void;
  onAddCourse: () => void;
}

export const EduplexCoursesTaken: React.FC<EduplexCoursesTakenProps> = ({
  courses,
  onSelectCourse,
  onAddCourse,
}) => {
  const [filter, setFilter] = useState<'Active' | 'Completed' | 'All'>('Active');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const renderProgressCircle = (progress: number = 0) => {
    const size = 38;
    const strokeWidth = 3.5;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <div className="flex items-center gap-2">
        <div className="relative w-9 h-9 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90">
            {/* Background ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#e2e8f0"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Green Progress arc */}
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

  const renderBadgeIcon = (iconType: string) => {
    if (iconType === '3d') {
      return (
        <div className="w-10 h-10 rounded-xl bg-[#ede9fe] flex items-center justify-center text-[#7c3aed]">
          {/* Isometric 3D Cube SVG */}
          <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-current fill-none" strokeWidth="2">
            <path d="M12 3 L20 7.5 L20 16.5 L12 21 L4 16.5 L4 7.5 Z" />
            <path d="M12 12 L20 7.5" />
            <path d="M12 12 L12 21" />
            <path d="M12 12 L4 7.5" />
          </svg>
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-xl bg-[#ffe4e6] flex items-center justify-center text-[#f43f5e]">
        {/* Coral 'Q' icon */}
        <span className="text-lg font-black font-sans leading-none">Q</span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl p-4 border border-[#eef0f4] flex flex-col justify-between shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-[#171821]">Course You're Taking</h3>

        <div className="flex items-center gap-2">
          {/* Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d8fa55]"
              aria-expanded={showFilterDropdown}
            >
              <span>{filter}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showFilterDropdown && (
              <div className="absolute right-0 mt-1 w-28 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-30">
                {(['Active', 'Completed', 'All'] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setFilter(opt);
                      setShowFilterDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-medium transition-colors ${
                      filter === opt
                        ? 'bg-[#d8fa55]/30 text-slate-950 font-bold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Green "+" Action Button */}
          <button
            onClick={onAddCourse}
            className="w-6 h-6 rounded-full bg-[#d8fa55] hover:bg-[#cbf53d] text-slate-950 flex items-center justify-center shadow-sm hover:scale-110 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
            title="Enroll in new course"
            aria-label="Enroll in new course"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Courses List */}
      <div className="space-y-3">
        {courses.map((course) => (
          <div
            key={course.id}
            onClick={() => onSelectCourse(course)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectCourse(course);
              }
            }}
            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d8fa55]"
            aria-label={`${course.title} taught by ${course.instructor}, ${course.remaining} remaining, ${course.progress}% completed`}
          >
            {/* Left: Icon & Title */}
            <div className="flex items-center gap-3">
              {renderBadgeIcon(course.iconType)}
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#171821] group-hover:text-indigo-600 transition-colors">
                  {course.title}
                </h4>
                <p className="text-[11px] text-slate-400 font-medium">
                  {course.instructor}
                </p>
              </div>
            </div>

            {/* Middle: Remaining */}
            <div className="text-left hidden sm:block">
              <span className="text-[10px] text-slate-400 block font-medium">Remaining</span>
              <span className="text-xs font-semibold text-slate-800">{course.remaining}</span>
            </div>

            {/* Right: Circular Progress Meter */}
            <div>{renderProgressCircle(course.progress)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
