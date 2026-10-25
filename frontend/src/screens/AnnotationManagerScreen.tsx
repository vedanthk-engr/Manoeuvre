import React, { useState, useEffect } from 'react';
import {
  PenTool,
  Trash2,
  RotateCcw,
  Layers,
  FileDown,
  Highlighter,
  CheckCircle2,
  Eye,
} from 'lucide-react';
import { api } from '../services/api';
import { PresentationState } from '../types';

interface AnnotationManagerScreenProps {
  presentation: PresentationState | null;
}

export const AnnotationManagerScreen: React.FC<AnnotationManagerScreenProps> = ({ presentation }) => {
  const [annotations, setAnnotations] = useState<any[]>([
    {
      id: 'st_1',
      slide_index: 4,
      annotation_type: 'stroke',
      color: '#ea580c',
      stroke_width: 3,
      points_json: '[{"x":120,"y":85},{"x":145,"y":110},{"x":210,"y":160}]',
      created_at: '10:32 AM',
    },
    {
      id: 'st_2',
      slide_index: 4,
      annotation_type: 'highlight',
      color: '#22c55e',
      stroke_width: 14,
      points_json: '[{"x":50,"y":200},{"x":380,"y":200}]',
      created_at: '10:35 AM',
    },
  ]);
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
        if (data && data.length > 0) {
          setAnnotations(data);
        }
      }
    } catch (err) {
      console.warn('Load annotations warning:', err);
    }
  };

  const handleClear = async () => {
    if (activeSession) {
      await api.clearAnnotations(activeSession.id, slideIndex);
    }
    setAnnotations([]);
  };

  const handleUndo = async () => {
    if (activeSession) {
      await api.undoAnnotation(activeSession.id, slideIndex);
    }
    setAnnotations((prev) => prev.slice(0, -1));
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Slide Annotation Manager</h2>
          <p className="text-xs text-slate-500">
            Slide-by-slide vector drawing inspection, stroke history, and ink persistence
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleUndo}
            disabled={annotations.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 text-xs font-semibold shadow-sm transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Undo Stroke</span>
          </button>

          <button
            onClick={handleClear}
            disabled={annotations.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 disabled:opacity-40 text-rose-700 text-xs font-semibold border border-rose-200 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Slide</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Stroke List (Left) + Vector Canvas Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Stroke History */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-4 border border-[#eef0f4] shadow-sm">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-700" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Slide {slideIndex} Strokes ({annotations.length})
              </h3>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Live Vector Layer
            </span>
          </div>

          {annotations.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <PenTool className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>No strokes drawn on Slide {slideIndex} yet.</p>
              <p className="text-[10px] text-slate-400 mt-1">Switch glove to ANNOTATE mode to draw.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[380px] overflow-y-auto">
              {annotations.map((ann, idx) => (
                <div
                  key={ann.id || idx}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-4 h-4 rounded-full border border-black/10 flex-shrink-0"
                      style={{ backgroundColor: ann.color }}
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">
                        {ann.annotation_type === 'highlight' ? 'OCR Block Highlight' : 'Vector Pen Stroke'}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Width: {ann.stroke_width}px • Created {ann.created_at || 'Just now'}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    #{idx + 1}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Slide Vector Preview Canvas */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-4 border border-[#eef0f4] shadow-sm flex flex-col justify-between min-h-[460px]">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-slate-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Vector Overlay Canvas Preview
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-700">
                {presentation?.title || 'Lecture Slide'}
              </span>
            </div>

            {/* Canvas mockup showing vector strokes on slide */}
            <div className="relative w-full aspect-video bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center p-6 text-slate-200 select-none">
              {/* Simulated slide text */}
              <div className="max-w-md w-full space-y-3 pointer-events-none opacity-80">
                <div className="w-3/4 h-5 bg-slate-700 rounded" />
                <div className="w-full h-3 bg-slate-800 rounded" />
                <div className="w-5/6 h-3 bg-slate-800 rounded" />
                <div className="w-2/3 h-3 bg-slate-800 rounded" />
              </div>

              {/* Rendered Strokes SVG Overlay */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <path
                  d="M 120 85 Q 160 140 210 160"
                  stroke="#ea580c"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                />
                <line
                  x1="60"
                  y1="180"
                  x2="320"
                  y2="180"
                  stroke="#d8fa55"
                  strokeWidth="12"
                  strokeOpacity="0.4"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-3">
            <span className="text-xs text-slate-500">
              Annotations are saved per-slide and exported with lecture recaps
            </span>
            <button
              onClick={() => alert('Exporting annotated PDF deck with vector layers...')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow transition-all"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Export Annotated Deck</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
