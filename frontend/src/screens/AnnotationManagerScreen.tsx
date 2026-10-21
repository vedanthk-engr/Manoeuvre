import React, { useState, useEffect } from 'react';
import { Edit3, Trash2, RotateCcw, Layers, FileText } from 'lucide-react';
import { api } from '../services/api';
import { PresentationState } from '../types';

interface AnnotationManagerScreenProps {
  presentation: PresentationState | null;
}

export const AnnotationManagerScreen: React.FC<AnnotationManagerScreenProps> = ({ presentation }) => {
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any>(null);
  const slideIndex = presentation?.current_slide_index || 1;

  useEffect(() => {
    loadData();
  }, [slideIndex]);

  const loadData = async () => {
    try {
      const sess = await api.getActiveSession();
      if (sess?.active && sess.session) {
        setActiveSession(sess.session);
        const data = await api.getAnnotations(sess.session.id, slideIndex);
        setAnnotations(data || []);
      }
    } catch (err) {
      console.error('Failed to load annotations:', err);
    }
  };

  const handleClear = async () => {
    if (activeSession) {
      await api.clearAnnotations(activeSession.id, slideIndex);
      setAnnotations([]);
    }
  };

  const handleUndo = async () => {
    if (activeSession) {
      await api.undoAnnotation(activeSession.id, slideIndex);
      setAnnotations((prev) => prev.slice(0, -1));
    }
  };

  return (
    <div className="p-6 h-full flex flex-col space-y-6 overflow-hidden">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Annotation Manager</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Slide-by-slide vector drawing inspection, history, and stroke management.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleUndo}
            disabled={annotations.length === 0}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-lg text-xs font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Undo Stroke</span>
          </button>
          <button
            onClick={handleClear}
            disabled={annotations.length === 0}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Slide Annotations</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Left: Stroke List */}
        <div className="col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col min-h-0">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Strokes on Slide {slideIndex} ({annotations.length})
            </h2>
          </div>

          <div className="space-y-2 overflow-y-auto flex-1 pr-1">
            {annotations.map((ann, idx) => {
              const pts = typeof ann.points_json === 'string' ? JSON.parse(ann.points_json) : ann.points_json;
              return (
                <div
                  key={ann.id || idx}
                  className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <span
                      className="w-4 h-4 rounded-full border border-slate-700"
                      style={{ backgroundColor: ann.color }}
                    />
                    <div>
                      <div className="font-semibold text-white">Stroke #{idx + 1}</div>
                      <div className="text-[11px] text-slate-400">
                        {pts.length} points • Width: {ann.stroke_width}px
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {ann.annotation_type || 'stroke'}
                  </span>
                </div>
              );
            })}

            {annotations.length === 0 && (
              <div className="py-16 text-center text-slate-500 text-xs">
                No vector annotations created on this slide yet. Switch to ANNOTATE mode on the glove to draw!
              </div>
            )}
          </div>
        </div>

        {/* Right: Slide Meta info */}
        <div className="col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
            Active Slide Metadata
          </h2>
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Presentation:</span>
              <span className="text-slate-200 font-medium truncate max-w-xs">
                {presentation?.title || 'No presentation'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Current Slide:</span>
              <span className="text-slate-200 font-mono">
                {slideIndex} / {presentation?.total_slides || 1}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Active Lecture Session:</span>
              <span className="text-emerald-400 font-medium">
                {activeSession ? activeSession.title : 'None (Standalone)'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
