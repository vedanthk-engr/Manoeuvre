import React from 'react';
import { Course } from '../data/eduplexData';
import { PenTool, CheckCircle2, Camera, Star } from 'lucide-react';

interface EduplexNewCoursesProps {
  courses: Course[];
  onSelectCourse: (course: Course) => void;
  onViewAllCourses: () => void;
  onGoPremium: () => void;
}

export const EduplexNewCourses: React.FC<EduplexNewCoursesProps> = ({
  courses,
  onSelectCourse,
  onViewAllCourses,
  onGoPremium,
}) => {
  const renderCourseIcon = (iconType: string) => {
    switch (iconType) {
      case 'writing':
        return (
          <div className="w-10 h-10 rounded-xl bg-[#fff3eb] text-[#ea580c] flex items-center justify-center">
            <PenTool className="w-5 h-5 stroke-[2]" />
          </div>
        );
      case 'testing':
        return (
          <div className="w-10 h-10 rounded-xl bg-[#f4fce3] text-[#65a30d] flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 stroke-[2]" />
          </div>
        );
      case 'photo':
        return (
          <div className="w-10 h-10 rounded-xl bg-[#f3f0ff] text-[#8b5cf6] flex items-center justify-center">
            <Camera className="w-5 h-5 stroke-[2]" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Star className="w-5 h-5" />
          </div>
        );
    }
  };

  return (
    <section className="mb-4" aria-labelledby="new-courses-heading">
      <div className="flex items-center justify-between mb-2.5">
        <h2 id="new-courses-heading" className="text-sm font-bold text-[#171821]">
          New Courses
        </h2>
        <button
          onClick={onViewAllCourses}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors focus:outline-none focus-visible:underline"
        >
          View All
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 3 Course Cards */}
        {courses.slice(0, 3).map((course) => (
          <div
            key={course.id}
            onClick={() => onSelectCourse(course)}
            tabIndex={0}
            role="button"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectCourse(course);
              }
            }}
            className="bg-white rounded-2xl p-3 sm:p-3.5 border border-[#eef0f4] hover:border-slate-300 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d8fa55]"
            aria-label={`Course: ${course.title}, ${course.lessons} lessons, Rating ${course.rating}`}
          >
            <div>
              {/* Icon & Title */}
              <div className="flex items-center gap-2.5 mb-2.5">
                {renderCourseIcon(course.iconType)}
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#171821] group-hover:text-indigo-600 transition-colors leading-tight">
                    {course.title}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {course.lessons} Lessons
                  </p>
                </div>
              </div>
            </div>

            {/* Rating and Type Metadata */}
            <div className="pt-1.5 border-t border-slate-50 flex items-center justify-between text-[11px]">
              <div>
                <span className="text-[9px] text-slate-400 block font-medium">Rate</span>
                <div className="flex items-center gap-1 font-bold text-slate-800 text-[11px]">
                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                  <span>{course.rating.toFixed(1)}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[9px] text-slate-400 block font-medium">Type</span>
                <span className="font-semibold text-slate-700 text-[10px]">{course.type}</span>
              </div>
            </div>
          </div>
        ))}

        {/* 4th Card: Go Premium Promotional Card */}
        <div className="bg-[#181a24] text-white rounded-2xl p-3 sm:p-3.5 relative overflow-hidden flex flex-col justify-between shadow-lg group">
          {/* Subtle glow / gradient */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

          <div>
            {/* Eduplex Mini Logo */}
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full border border-[#181a24] border-t-transparent" />
              </div>
              <span className="text-[9px] tracking-wider uppercase font-bold text-slate-400">
                Eduplex
              </span>
            </div>

            <h3 className="text-xs sm:text-sm font-bold text-white mb-0.5">Go Premium</h3>
            <p className="text-[10px] text-slate-400 leading-tight max-w-[130px] mb-2">
              Explore 25k+ courses with lifetime membership
            </p>
          </div>

          <div className="flex items-end justify-between relative z-10">
            <button
              onClick={onGoPremium}
              className="px-3 py-1 rounded-full bg-[#d8fa55] hover:bg-[#cbf53d] text-slate-950 font-bold text-[11px] shadow transition-transform group-hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Get Access
            </button>

            {/* Cute Illustration: Person sitting on stacked books reading */}
            <div className="w-16 h-16 -mr-1 -mb-1 flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Stack of books */}
                <rect x="35" y="76" width="55" height="7" rx="2" fill="#334155" />
                <rect x="32" y="83" width="60" height="7" rx="2" fill="#475569" />
                <rect x="30" y="90" width="65" height="7" rx="2" fill="#1e293b" />
                
                {/* Character Sitting */}
                {/* Legs in purple pants */}
                <path d="M 45 68 C 45 74, 55 80, 52 88" stroke="#4338ca" strokeWidth="6" strokeLinecap="round" fill="none" />
                <path d="M 52 68 C 55 75, 62 82, 68 86" stroke="#4338ca" strokeWidth="6" strokeLinecap="round" fill="none" />
                {/* Boots */}
                <ellipse cx="52" cy="89" rx="4" ry="2.5" fill="#0f172a" />
                <ellipse cx="70" cy="87" rx="4" ry="2.5" fill="#0f172a" />

                {/* Torso & lavender sweater */}
                <ellipse cx="50" cy="55" rx="14" ry="15" fill="#a78bfa" />
                
                {/* Book in hands */}
                <path d="M 38 48 L 48 56 L 40 62 Z" fill="#ffffff" />
                <path d="M 48 56 L 58 50 L 58 60 L 48 64 Z" fill="#f1f5f9" />
                
                {/* Head & cute hair */}
                <circle cx="50" cy="35" r="9" fill="#fcd34d" />
                <ellipse cx="48" cy="32" rx="10" ry="8" fill="#d97706" />
                {/* Little reading glasses */}
                <circle cx="48" cy="36" r="2.5" stroke="#1e293b" strokeWidth="1" fill="none" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
