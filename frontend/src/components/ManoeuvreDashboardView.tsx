import React from 'react';
import { ManoeuvreHeader } from './ManoeuvreHeader';
import { ManoeuvreTopCards } from './ManoeuvreTopCards';
import {
  ManoeuvreActivityChart,
  ManoeuvreSlideAgenda,
  ManoeuvreSlideNavigator,
} from './ManoeuvreMiddleRow';
import {
  ManoeuvreActiveLectures,
  ManoeuvreAnnotationsRecaps,
} from './ManoeuvreBottomRow';
import { PresentationState, PrimaryMode } from '../types';
import { LectureItem, AnnotationRecapItem } from '../data/manoeuvreData';

interface ManoeuvreDashboardViewProps {
  professorName?: string;
  isDeviceConnected: boolean;
  activeMode: PrimaryMode;
  presentation: PresentationState | null;
  sessionActive: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onStartSession: (title: string) => void;
  onNavigate: (tab: any) => void;
  onSelectSlide: (slideIdx: number) => void;
}

export const ManoeuvreDashboardView: React.FC<ManoeuvreDashboardViewProps> = ({
  professorName = 'Professor',
  isDeviceConnected,
  activeMode,
  presentation,
  sessionActive,
  searchQuery,
  onSearchChange,
  onStartSession,
  onNavigate,
  onSelectSlide,
}) => {
  return (
    <div className="flex-1 flex flex-col justify-between max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <ManoeuvreHeader
        professorName={professorName}
        lectureTitle={presentation?.title || 'AI-Assisted Lecture Suite'}
        isDeviceConnected={isDeviceConnected}
        activeMode={activeMode}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        onOpenSettings={() => onNavigate('settings')}
        onOpenWorkspace={() => onNavigate('workspace')}
        onOpenPresentations={() => onNavigate('presentation')}
      />

      {/* Row 1: Hardware & Slide Deck Cards + Live Lecture Session Card */}
      <ManoeuvreTopCards
        presentation={presentation}
        isDeviceConnected={isDeviceConnected}
        activeMode={activeMode}
        sessionActive={sessionActive}
        onStartSession={onStartSession}
        onNavigate={onNavigate}
      />

      {/* Row 2: Gesture & IMU Activity, Slide Agenda, Slide Navigator */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3.5">
        <div className="md:col-span-12 lg:col-span-5">
          <ManoeuvreActivityChart />
        </div>

        <div className="md:col-span-6 lg:col-span-4">
          <ManoeuvreSlideAgenda
            onSelectSlide={onSelectSlide}
            presentation={presentation}
            searchQuery={searchQuery}
          />
        </div>

        <div className="md:col-span-6 lg:col-span-3">
          <ManoeuvreSlideNavigator
            currentSlide={(presentation?.current_slide_index ?? 0) + 1}
            totalSlides={presentation?.total_slides || 24}
            onSelectSlide={onSelectSlide}
          />
        </div>
      </div>

      {/* Row 3: Active & Recent Lectures + Slide Annotations & Recaps */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-7">
          <ManoeuvreActiveLectures
            searchQuery={searchQuery}
            onStartNewSession={() => {
              onStartSession('New CS Lecture');
              onNavigate('workspace');
            }}
            onSelectLecture={(lec: LectureItem) => onNavigate('workspace')}
          />
        </div>

        <div className="lg:col-span-5">
          <ManoeuvreAnnotationsRecaps
            onOpenAnnotationManager={() => onNavigate('annotations')}
            onSelectRecap={(recap: AnnotationRecapItem) => onNavigate('annotations')}
          />
        </div>
      </div>
    </div>
  );
};
