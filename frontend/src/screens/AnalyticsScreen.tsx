import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Search, FileText, Calendar, Clock, Layers } from 'lucide-react';
import { api } from '../services/api';

export const AnalyticsScreen: React.FC = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionAnalytics, setSessionAnalytics] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const list = await api.listSessions(50);
      setSessions(list);
      if (list.length > 0) {
        setSelectedSessionId(list[0].id);
        loadAnalytics(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load session list:', err);
    }
  };

  const loadAnalytics = async (id: string) => {
    try {
      const data = await api.getSessionAnalytics(id);
      setSessionAnalytics(data);
    } catch (err) {
      console.error('Failed to load session analytics:', err);
    }
  };

  const handleExport = (id: string) => {
    window.open(`http://127.0.0.1:8000/api/analytics/session/${id}/export?format=markdown`, '_blank');
  };

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 h-full flex flex-col space-y-6 overflow-hidden">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Lecture History & Analytics</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Historical lecture data, slide timing distributions, and downloadable pedagogical reports.
          </p>
        </div>

        {selectedSessionId && (
          <button
            onClick={() => handleExport(selectedSessionId)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Markdown Report</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Left: Past Sessions Table */}
        <div className="col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col min-h-0">
          {/* Search */}
          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search sessions by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-2 overflow-y-auto flex-1 pr-1">
            {filteredSessions.map((sess) => {
              const isSelected = selectedSessionId === sess.id;
              return (
                <div
                  key={sess.id}
                  onClick={() => {
                    setSelectedSessionId(sess.id);
                    loadAnalytics(sess.id);
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-800 border-emerald-500/40 text-white shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-semibold truncate">{sess.title}</div>
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center space-x-3">
                    <span>{new Date(sess.started_at).toLocaleDateString()}</span>
                    <span>{Math.round(sess.total_duration_seconds / 60)}m</span>
                    <span>{sess.total_slides_viewed} slides</span>
                  </div>
                </div>
              );
            })}

            {filteredSessions.length === 0 && (
              <div className="py-12 text-center text-slate-500 text-xs">No sessions matched.</div>
            )}
          </div>
        </div>

        {/* Right: Selected Session Analytics Breakdown */}
        <div className="col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col overflow-y-auto space-y-4">
          {sessionAnalytics ? (
            <>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-sm font-bold text-white">{sessionAnalytics.title}</h2>
                  <p className="text-xs text-slate-400">
                    Duration: {Math.round(sessionAnalytics.duration_seconds / 60)} mins • Pacing: {sessionAnalytics.pacing_evaluation}
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  ID: {sessionAnalytics.session_id}
                </span>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-500">Slides Viewed</span>
                  <div className="text-base font-bold text-white mt-1">
                    {sessionAnalytics.slides_viewed}
                  </div>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-500">Annotations Drawn</span>
                  <div className="text-base font-bold text-white mt-1">
                    {sessionAnalytics.annotations_count}
                  </div>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-500">AI Teaching Queries</span>
                  <div className="text-base font-bold text-white mt-1">
                    {sessionAnalytics.ai_queries_count}
                  </div>
                </div>
              </div>

              {/* Recap Box */}
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Lecture Recap & Insights
                </span>
                <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap select-text">
                  {sessionAnalytics.recap_summary || 'No recap summary recorded.'}
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs">
              Select a session on the left to inspect analytics.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
