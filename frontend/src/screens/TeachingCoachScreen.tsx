import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Clock,
  Activity,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';

export const TeachingCoachScreen: React.FC = () => {
  const [activeSession, setActiveSession] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [recap, setRecap] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCoachData();
  }, []);

  const loadCoachData = async () => {
    setLoading(true);
    try {
      const sess = await api.getActiveSession();
      if (sess?.active && sess.session) {
        setActiveSession(sess.session);
        const data = await api.getSessionAnalytics(sess.session.id);
        setAnalytics(data);
        setRecap(data.recap_summary || '');
      } else {
        // Load recent session
        const recents = await api.listSessions(1);
        if (recents.length > 0) {
          const data = await api.getSessionAnalytics(recents[0].id);
          setAnalytics(data);
          setRecap(data.recap_summary || '');
        }
      }
    } catch (err) {
      console.error('Failed to load coach data:', err);
    } finally {
      setLoading(false);
    }
  };

  const durationMin = analytics ? Math.round(analytics.duration_seconds / 60) : 0;
  const pacingStatus = analytics?.pacing_evaluation || 'OPTIMAL';

  return (
    <div className="p-6 h-full overflow-y-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Teaching Coach</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Objective lecture pacing metrics, slide transition tracking, and automated recaps.
          </p>
        </div>
        <button
          onClick={loadCoachData}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-4 gap-4">
        {/* Pacing Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider">Pacing Evaluation</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-white flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span>{pacingStatus}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Avg: <span className="text-white font-mono">{analytics?.avg_time_per_slide_sec || 0}s</span> per slide
          </p>
        </div>

        {/* Duration Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider">Lecture Duration</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-lg font-bold text-white">
            {durationMin} mins
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Status: {activeSession ? 'Session Active' : 'Completed'}
          </p>
        </div>

        {/* Slide Transitions Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider">Slide Coverage</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-lg font-bold text-white">
            {analytics?.slides_viewed || 1} slides
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {analytics?.transitions_count || 0} slide changes logged
          </p>
        </div>

        {/* Interaction Density Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider">Teaching Interactions</span>
            <GraduationCap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg font-bold text-white">
            {analytics?.annotations_count || 0} annotations
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {analytics?.ai_queries_count || 0} AI inquiries processed
          </p>
        </div>
      </div>

      {/* Recap & Pedagogical Insights Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-bold text-white">Data-Backed Lecture Recap & Insights</h2>
        </div>

        <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap select-text">
          {recap ? (
            recap
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs">
              Lecture recap will be automatically compiled upon ending an active session or pressing double-click on Button C (SYSTEM).
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
