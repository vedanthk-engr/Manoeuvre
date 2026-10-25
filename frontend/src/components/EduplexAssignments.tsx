import React from 'react';
import { Assignment } from '../data/eduplexData';
import { Plus, CheckCircle, PieChart, Sparkles } from 'lucide-react';

interface EduplexAssignmentsProps {
  assignments: Assignment[];
  onToggleStatus: (id: string) => void;
  onAddAssignment: () => void;
  onSelectAssignment?: (assignment: Assignment) => void;
}

export const EduplexAssignments: React.FC<EduplexAssignmentsProps> = ({
  assignments,
  onToggleStatus,
  onAddAssignment,
  onSelectAssignment,
}) => {
  const renderAssignmentIcon = (iconType: string) => {
    switch (iconType) {
      case 'dots':
        return (
          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center p-1.5 border border-slate-100">
            {/* Cluster of 4 colored dots */}
            <div className="grid grid-cols-2 gap-1 w-full h-full p-0.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
          </div>
        );
      case 'donut':
        return (
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <PieChart className="w-4 h-4 stroke-[2]" />
          </div>
        );
      case 'diamond':
        return (
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 stroke-[2]" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
            <CheckCircle className="w-4 h-4" />
          </div>
        );
    }
  };

  const getStatusBadgeClass = (status: Assignment['status']) => {
    switch (status) {
      case 'In progress':
        return 'bg-[#ede9fe] text-[#7c3aed] hover:bg-[#ddd6fe]';
      case 'Completed':
        return 'bg-[#dcfce7] text-[#15803d] hover:bg-[#bbf7d0]';
      case 'Upcoming':
        return 'bg-[#ffedd5] text-[#c2410c] hover:bg-[#fed7aa]';
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 border border-[#eef0f4] flex flex-col justify-between shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-[#171821]">Assignments</h3>

        {/* Green "+" Action Button */}
        <button
          onClick={onAddAssignment}
          className="w-6 h-6 rounded-full bg-[#d8fa55] hover:bg-[#cbf53d] text-slate-950 flex items-center justify-center shadow-sm hover:scale-110 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
          title="Create new assignment"
          aria-label="Create new assignment"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      </div>

      {/* Assignments List */}
      <div className="space-y-2.5">
        {assignments.map((asg) => (
          <div
            key={asg.id}
            className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors group"
          >
            {/* Left: Icon & Title */}
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => onSelectAssignment && onSelectAssignment(asg)}
            >
              {renderAssignmentIcon(asg.iconType)}
              <div>
                <h4 className="text-xs font-bold text-[#171821] group-hover:text-indigo-600 transition-colors">
                  {asg.title}
                </h4>
                <p className="text-[10px] text-slate-400 font-medium">
                  {asg.due}
                </p>
              </div>
            </div>

            {/* Right: Status Pill (Interactive: click to toggle status) */}
            <button
              onClick={() => onToggleStatus(asg.id)}
              className={`px-3 py-1 rounded-full text-[10px] font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${getStatusBadgeClass(
                asg.status
              )}`}
              title="Click to toggle status"
              aria-label={`Status: ${asg.status}. Click to cycle.`}
            >
              {asg.status}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
