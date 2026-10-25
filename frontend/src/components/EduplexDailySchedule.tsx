import React from 'react';
import { ScheduleItem } from '../data/eduplexData';
import { ChevronRight, Grid, MapPin, Sparkles, Palette } from 'lucide-react';

interface EduplexDailyScheduleProps {
  schedule: ScheduleItem[];
  onSelectScheduleItem: (item: ScheduleItem) => void;
}

export const EduplexDailySchedule: React.FC<EduplexDailyScheduleProps> = ({
  schedule,
  onSelectScheduleItem,
}) => {
  const renderScheduleIcon = (iconType: string) => {
    switch (iconType) {
      case 'grid':
        return (
          <div className="w-8 h-8 rounded-lg bg-[#ffedd5] text-[#ea580c] flex items-center justify-center">
            <Grid className="w-4 h-4" />
          </div>
        );
      case 'pin':
        return (
          <div className="w-8 h-8 rounded-lg bg-[#ede9fe] text-[#7c3aed] flex items-center justify-center">
            <MapPin className="w-4 h-4" />
          </div>
        );
      case 'flower':
        return (
          <div className="w-8 h-8 rounded-lg bg-[#ecfccb] text-[#65a30d] flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
        );
      case 'palette':
        return (
          <div className="w-8 h-8 rounded-lg bg-[#fef3c7] text-[#d97706] flex items-center justify-center">
            <Palette className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
            <Grid className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 border border-[#eef0f4] flex flex-col justify-between shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-[#171821]">Daily Schedule</h3>
      </div>

      <div className="space-y-1.5">
        {schedule.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectScheduleItem(item)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectScheduleItem(item);
              }
            }}
            className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d8fa55]"
            aria-label={`${item.title}, ${item.subtitle}`}
          >
            <div className="flex items-center gap-3">
              {renderScheduleIcon(item.iconType)}
              <div>
                <h4 className="text-xs font-bold text-[#171821] group-hover:text-indigo-600 transition-colors">
                  {item.title}
                </h4>
                <p className="text-[10px] text-slate-400 font-medium">
                  {item.subtitle}
                </p>
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
          </div>
        ))}
      </div>
    </div>
  );
};
