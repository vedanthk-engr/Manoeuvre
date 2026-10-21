import React, { useEffect, useState } from 'react';
import {
  Play,
  Presentation,
  Cpu,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { api } from '../services/api';
import { PrimaryMode } from '../types';

interface DashboardScreenProps {
  onNavigate: (tab: string) => void;
  isDeviceConnected: boolean;
  activeMode: PrimaryMode;
  onStartSession: (title: string) => void;
  sessionActive: boolean;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigate,
  isDeviceConnected,
  activeMode,
  onStartSession,
  sessionActive,
}) => {
  const [summary, setSummary] = useState<any>(null);
  const [lectureTitleInput, setLectureTitleInput] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      const data = await api.getDashboardSummary();
      setSummary(data);
    } catch (err) {
      console.error('Failed to load dashboard summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lectureTitleInput.trim()) return;
    onStartSession(lectureTitleInput.trim());
    setLectureTitleInput('');
    onNavigate('workspace');
  };

  return (
    <div className="p-6 h-full overflow-y-auto space-y-6">
      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Manoeuvre Teaching Platform v1.0</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Welcome to your AI-Assisted Teaching Suite
          </h1>
          <p className="text-slate-400 text-sm mt-1 leading-relaxed">
            Control slides with natural wrist tilt, annotate in real-time, invoke pedagogic AI
            explanations, and capture continuous lecture pacing analytics.
          </p>

          {/* Quick Session Launcher */}
          {!sessionActive ? (
            <form onSubmit={handleQuickStart} className="mt-5 flex items-center space-x-3 max-w-md">
              <input
                type="text"
                placeholder="Enter lecture session title (e.g. CS101: Lecture 4)..."
                value={lectureTitleInput}
                onChange={(e) => setLectureTitleInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <button
                type="submit"
                disabled={!lectureTitleInput.trim()}
                className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-all shadow-md shadow-emerald-900/30"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Session</span>
              </button>
            </form>
          ) : (
            <div className="mt-5 flex items-center space-x-3">
              <button
                onClick={() => onNavigate('workspace')}
                className="flex items-center space-x-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition-all shadow-md"
              >
                <Presentation className="w-4 h-4" />
                <span>Resume Active Lecture Workspace</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Metrics & System Health Grid */}
      <div className="grid grid-cols-4 gap-4">
        {/* Device Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Wearable Hardware</span>
            <Cpu className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <div className="text-lg font-bold text-white flex items-center space-x-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isDeviceConnected ? 'bg-emerald-400' : 'bg-rose-500'}`}></span>
              <span>{isDeviceConnected ? 'ESP32 Connected' : 'Device Offline'}</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Active Mode: <span className="text-emerald-400 font-semibold">{activeMode}</span>
            </p>
          </div>
          <button
            onClick={() => onNavigate('device')}
            className="mt-3 text-xs text-slate-400 hover:text-emerald-400 flex items-center space-x-1 transition-colors"
          >
            <span>Device Manager</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Presentation State */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Slide Deck</span>
            <FileText className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-3">
            <div className="text-lg font-bold text-white truncate">
              {summary?.presentation?.title || 'No Deck Selected'}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {summary?.presentation?.total_slides
                ? `Slide ${summary.presentation.current_slide_index} of ${summary.presentation.total_slides}`
                : 'Upload or select a PDF presentation'}
            </p>
          </div>
          <button
            onClick={() => onNavigate('presentation')}
            className="mt-3 text-xs text-slate-400 hover:text-blue-400 flex items-center space-x-1 transition-colors"
          >
            <span>Presentations</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* AI Service */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Teaching Engine</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-3">
            <div className="text-lg font-bold text-white capitalize">
              {summary?.ai_status?.provider || 'Mock Offline'}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Model: <span className="text-purple-400 font-mono">{summary?.ai_status?.model || 'Ready'}</span>
            </p>
          </div>
          <button
            onClick={() => onNavigate('ai')}
            className="mt-3 text-xs text-slate-400 hover:text-purple-400 flex items-center space-x-1 transition-colors"
          >
            <span>Open AI Workspace</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Teaching Coach */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Teaching Coach</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <div className="text-lg font-bold text-white">
              {sessionActive ? 'Pacing Active' : 'Session Ready'}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Duration & transition analytics tracking
            </p>
          </div>
          <button
            onClick={() => onNavigate('coach')}
            className="mt-3 text-xs text-slate-400 hover:text-amber-400 flex items-center space-x-1 transition-colors"
          >
            <span>View Coach Insights</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Recent Lectures & Sessions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-200">Recent Lecture Sessions</h2>
          <button
            onClick={() => onNavigate('analytics')}
            className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
          >
            View all history →
          </button>
        </div>

        {summary?.recent_sessions?.length > 0 ? (
          <div className="divide-y divide-slate-800">
            {summary.recent_sessions.map((sess: any) => (
              <div key={sess.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">{sess.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5 flex items-center space-x-3">
                    <span>Started: {new Date(sess.started_at).toLocaleDateString()}</span>
                    <span>Duration: {Math.round(sess.total_duration_seconds / 60)} mins</span>
                    <span>Slides: {sess.total_slides_viewed}</span>
                    <span>Annotations: {sess.total_annotations_count}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      sess.status === 'ACTIVE'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {sess.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-500 text-xs">
            No previous lecture sessions recorded yet. Start your first session above!
          </div>
        )}
      </div>
    </div>
  );
};
