import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  ZoomIn,
  Edit2,
  Highlighter,
  Trash2,
  RotateCcw,
  Sparkles,
  Square,
  Activity,
  Layers,
} from 'lucide-react';
import { api } from '../services/api';
import { PresentationState, PrimaryMode } from '../types';

interface LectureWorkspaceScreenProps {
  presentation: PresentationState | null;
  activeMode: PrimaryMode;
  sessionActive: boolean;
  onNavigateAiWithSlide: (action: string) => void;
  onSlideChange: () => void;
}

export const LectureWorkspaceScreen: React.FC<LectureWorkspaceScreenProps> = ({
  presentation,
  activeMode,
  sessionActive,
  onNavigateAiWithSlide,
  onSlideChange,
}) => {
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [currentColor, setCurrentColor] = useState('#EF4444');
  const [currentWidth, setCurrentWidth] = useState(3.0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<number[][]>([]);
  const [isZoomed, setIsZoomed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const currentSlide = presentation?.current_slide;
  const slideIndex = presentation?.current_slide_index || 1;
  const totalSlides = presentation?.total_slides || 1;

  useEffect(() => {
    loadAnnotations();
  }, [slideIndex]);

  const loadAnnotations = async () => {
    // In active session or standalone preview
    try {
      const activeSess = await api.getActiveSession();
      if (activeSess?.active && activeSess.session) {
        const data = await api.getAnnotations(activeSess.session.id, slideIndex);
        setAnnotations(data || []);
      }
    } catch (err) {
      // Ignored if no session
    }
  };

  // Redraw canvas whenever annotations change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render saved annotations
    annotations.forEach((annot) => {
      try {
        const pts: number[][] = typeof annot.points_json === 'string' ? JSON.parse(annot.points_json) : annot.points_json;
        if (pts.length < 2) return;
        ctx.beginPath();
        ctx.strokeStyle = annot.color;
        ctx.lineWidth = annot.stroke_width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(pts[0][0] * canvas.width, pts[0][1] * canvas.height);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i][0] * canvas.width, pts[i][1] * canvas.height);
        }
        ctx.stroke();
      } catch (e) {
        // Parse error ignore
      }
    });

    // Render active drawing stroke
    if (currentStroke.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = currentWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(currentStroke[0][0] * canvas.width, currentStroke[0][1] * canvas.height);
      for (let i = 1; i < currentStroke.length; i++) {
        ctx.lineTo(currentStroke[i][0] * canvas.width, currentStroke[i][1] * canvas.height);
      }
      ctx.stroke();
    }
  }, [annotations, currentStroke, currentColor, currentWidth]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeMode !== 'ANNOTATE') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setIsDrawing(true);
    setCurrentStroke([[x, y]]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setCurrentStroke((prev) => [...prev, [x, y]]);
  };

  const handleMouseUp = async () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentStroke.length > 1) {
      const activeSess = await api.getActiveSession();
      if (activeSess?.active && activeSess.session) {
        try {
          const newAnnot = await api.createAnnotation({
            annotation_type: 'stroke',
            color: currentColor,
            stroke_width: currentWidth,
            points: currentStroke,
            slide_index: slideIndex,
          });
          setAnnotations((prev) => [...prev, newAnnot]);
        } catch (err) {
          console.error('Failed to persist annotation:', err);
        }
      } else {
        // Local preview annotation
        setAnnotations((prev) => [
          ...prev,
          {
            id: 'local_' + Date.now(),
            color: currentColor,
            stroke_width: currentWidth,
            points_json: JSON.stringify(currentStroke),
            slide_index: slideIndex,
          },
        ]);
      }
    }
    setCurrentStroke([]);
  };

  const handleClear = async () => {
    const activeSess = await api.getActiveSession();
    if (activeSess?.active && activeSess.session) {
      await api.clearAnnotations(activeSess.session.id, slideIndex);
    }
    setAnnotations([]);
  };

  const handleUndo = async () => {
    const activeSess = await api.getActiveSession();
    if (activeSess?.active && activeSess.session) {
      await api.undoAnnotation(activeSess.session.id, slideIndex);
    }
    setAnnotations((prev) => prev.slice(0, -1));
  };

  const handlePrev = async () => {
    await api.prevSlide();
    onSlideChange();
  };

  const handleNext = async () => {
    await api.nextSlide();
    onSlideChange();
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 overflow-hidden select-none">
      {/* Top Workspace Toolbar */}
      <div className="h-12 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between shrink-0">
        {/* Navigation & Presentation Title */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <button
              onClick={handlePrev}
              disabled={slideIndex <= 1}
              className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-30 text-slate-300 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold text-white px-2">
              Slide {slideIndex} / {totalSlides}
            </span>
            <button
              onClick={handleNext}
              disabled={slideIndex >= totalSlides}
              className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-30 text-slate-300 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="h-4 w-[1px] bg-slate-800"></div>

          <div className="text-xs font-semibold text-slate-200 truncate max-w-sm">
            {presentation?.title || 'Untitled Lecture Deck'}
          </div>
        </div>

        {/* Annotation & Drawing Controls */}
        <div className="flex items-center space-x-3">
          {/* Colors */}
          <div className="flex items-center space-x-1.5 bg-slate-950 px-2 py-1 rounded-md border border-slate-800">
            {['#EF4444', '#FACC15', '#38BDF8', '#10B981', '#FFFFFF'].map((c) => (
              <button
                key={c}
                onClick={() => setCurrentColor(c)}
                style={{ backgroundColor: c }}
                className={`w-3.5 h-3.5 rounded-full transition-transform ${
                  currentColor === c ? 'scale-125 ring-2 ring-slate-400' : 'opacity-70'
                }`}
              />
            ))}
          </div>

          {/* Stroke Width */}
          <div className="flex items-center space-x-1 bg-slate-950 px-2 py-1 rounded-md border border-slate-800 text-xs">
            {[2, 4, 8].map((w) => (
              <button
                key={w}
                onClick={() => setCurrentWidth(w)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                  currentWidth === w ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-500'
                }`}
              >
                {w}px
              </button>
            ))}
          </div>

          {/* Undo & Clear */}
          <button
            onClick={handleUndo}
            title="Undo last stroke"
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleClear}
            title="Clear all annotations on slide"
            className="p-1.5 rounded hover:bg-rose-500/20 text-rose-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-[1px] bg-slate-800"></div>

          {/* Zoom Toggle */}
          <button
            onClick={() => setIsZoomed(!isZoomed)}
            className={`p-1.5 rounded transition-colors ${
              isZoomed ? 'bg-emerald-500 text-white' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick AI Assist Pill */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigateAiWithSlide('explain')}
            className="flex items-center space-x-1 px-2.5 py-1 bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600 text-purple-300 hover:text-white rounded-md text-xs font-medium transition-all"
          >
            <Sparkles className="w-3 h-3" />
            <span>Explain Slide</span>
          </button>
          <button
            onClick={() => onNavigateAiWithSlide('mcq')}
            className="flex items-center space-x-1 px-2.5 py-1 bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-md text-xs font-medium transition-all"
          >
            <Sparkles className="w-3 h-3" />
            <span>Quiz Class</span>
          </button>
        </div>
      </div>

      {/* Main Slide & Annotation Canvas Area */}
      <div className="flex-1 relative flex items-center justify-center p-6 bg-slate-950 overflow-hidden">
        {/* Slide Card Canvas */}
        <div
          className={`w-full max-w-4xl aspect-[16/10] bg-slate-900 border border-slate-800 rounded-xl shadow-2xl relative overflow-hidden transition-transform duration-200 ${
            isZoomed ? 'scale-125' : 'scale-100'
          }`}
        >
          {/* Slide Text Content & Layout Representation */}
          <div className="p-8 h-full flex flex-col justify-between select-text pointer-events-none">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-3 border-b border-slate-800 pb-2">
                <span>{presentation?.title || 'Manoeuvre Lecture Slide'}</span>
                <span>Page {slideIndex} of {totalSlides}</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">
                {currentSlide?.title || `Slide ${slideIndex}: Interactive Presentation View`}
              </h2>
              <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap max-h-[320px] overflow-hidden">
                {currentSlide?.extracted_text || (
                  <div className="space-y-4 py-8">
                    <p className="text-slate-400">
                      Welcome to Manoeuvre Lecture Workspace. Connect your ESP32 glove or use the Virtual
                      Simulator to interact with this slide.
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-slate-400 text-xs">
                      <li>Hold ACTION button to draw on-screen vector annotations.</li>
                      <li>Double-click ACTION in ANNOTATE mode to clear annotations.</li>
                      <li>Tilt wrist left or right in SLIDE NAV mode to navigate slides.</li>
                      <li>Hold ACTION in VOICE mode to ask questions using AI speech recognition.</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="text-[10px] text-slate-500 flex justify-between border-t border-slate-800/60 pt-2">
              <span>Manoeuvre AI Core Vector Layer</span>
              <span>Coordinates: Normalized [0.0 - 1.0]</span>
            </div>
          </div>

          {/* Transparent Vector Annotation Drawing Layer */}
          <canvas
            ref={canvasRef}
            width={1280}
            height={800}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className={`absolute inset-0 w-full h-full z-10 ${
              activeMode === 'ANNOTATE' ? 'cursor-crosshair' : 'cursor-default pointer-events-none'
            }`}
          />
        </div>
      </div>
    </div>
  );
};
