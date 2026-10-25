import React from 'react';
import { Course, ScheduleItem, Assignment } from '../data/eduplexData';
import { EduplexHeader } from './EduplexHeader';
import { EduplexNewCourses } from './EduplexNewCourses';
import { EduplexActivityChart } from './EduplexActivityChart';
import { EduplexDailySchedule } from './EduplexDailySchedule';
import { EduplexCalendar } from './EduplexCalendar';
import { EduplexCoursesTaken } from './EduplexCoursesTaken';
import { EduplexAssignments } from './EduplexAssignments';

interface EduplexDashboardViewProps {
  userName?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isFramed: boolean;
  onToggleFrame: () => void;
  newCourses: Course[];
  activeCourses: Course[];
  schedule: ScheduleItem[];
  assignments: Assignment[];
  onSelectCourse: (course: Course) => void;
  onViewAllCourses: () => void;
  onGoPremium: () => void;
  onSelectScheduleItem: (item: ScheduleItem) => void;
  onSelectDate: (day: number, month: string, year: number) => void;
  onAddCourse: () => void;
  onAddAssignment: () => void;
  onToggleAssignmentStatus: (id: string) => void;
  onSelectAssignment: (asg: Assignment) => void;
}

export const EduplexDashboardView: React.FC<EduplexDashboardViewProps> = ({
  userName = 'Taylor',
  searchQuery,
  onSearchChange,
  isFramed,
  onToggleFrame,
  newCourses,
  activeCourses,
  schedule,
  assignments,
  onSelectCourse,
  onViewAllCourses,
  onGoPremium,
  onSelectScheduleItem,
  onSelectDate,
  onAddCourse,
  onAddAssignment,
  onToggleAssignmentStatus,
  onSelectAssignment,
}) => {
  // Real-time filtering based on search query
  const filteredNewCourses = newCourses.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredActiveCourses = activeCourses.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.instructor && c.instructor.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredAssignments = assignments.filter((a) =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col justify-between max-w-7xl mx-auto w-full">
      {/* Top Header Row */}
      <EduplexHeader
        userName={userName}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        isFramed={isFramed}
        onToggleFrame={onToggleFrame}
      />

      {/* Row 1: New Courses + Go Premium banner */}
      <EduplexNewCourses
        courses={filteredNewCourses.length > 0 ? filteredNewCourses : newCourses}
        onSelectCourse={onSelectCourse}
        onViewAllCourses={onViewAllCourses}
        onGoPremium={onGoPremium}
      />

      {/* Row 2: Middle Section (Hours Activity, Daily Schedule, Calendar) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3.5">
        {/* Hours Activity (5 cols on lg) */}
        <div className="md:col-span-12 lg:col-span-5">
          <EduplexActivityChart />
        </div>

        {/* Daily Schedule (4 cols on lg) */}
        <div className="md:col-span-6 lg:col-span-4">
          <EduplexDailySchedule
            schedule={schedule}
            onSelectScheduleItem={onSelectScheduleItem}
          />
        </div>

        {/* Calendar (3 cols on lg) */}
        <div className="md:col-span-6 lg:col-span-3">
          <EduplexCalendar onSelectDate={onSelectDate} />
        </div>
      </div>

      {/* Row 3: Bottom Section (Course You're Taking + Assignments) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Course You're Taking (7 cols on lg) */}
        <div className="lg:col-span-7">
          <EduplexCoursesTaken
            courses={filteredActiveCourses.length > 0 ? filteredActiveCourses : activeCourses}
            onSelectCourse={onSelectCourse}
            onAddCourse={onAddCourse}
          />
        </div>

        {/* Assignments (5 cols on lg) */}
        <div className="lg:col-span-5">
          <EduplexAssignments
            assignments={filteredAssignments.length > 0 ? filteredAssignments : assignments}
            onToggleStatus={onToggleAssignmentStatus}
            onAddAssignment={onAddAssignment}
            onSelectAssignment={onSelectAssignment}
          />
        </div>
      </div>
    </div>
  );
};
