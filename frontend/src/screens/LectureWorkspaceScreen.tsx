import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Trash2,
  RotateCcw,
  Sparkles,
  Activity,
  Layers,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { api } from '../services/api';
import { wsService, SocketStatus } from '../services/websocket';
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
  const [isZoomed, setIsZoomed] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Diagnostic HUD metrics
  const [hudHz, setHudHz] = useState(0);
  const [hudSocketStatus, setHudSocketStatus] = useState<SocketStatus>('DISCONNECTED');
  const [hudActivePoints, setHudActivePoints] = useState(0);
  const [hudIsDrawing, setHudIsDrawing] = useState(false);
  const [hudLastEvent, setHudLastEvent] = useState<string>('None');
  const [hudLastEventTime, setHudLastEventTime] = useState<number | null>(null);
  const [hudLastCoords, setHudLastCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hudLastError, setHudLastError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Active stroke refs for high-frequency sampling without React state batching drops
  const activeStrokeRef = useRef<number[][]>([]);
  const isDrawingRef = useRef<boolean>(false);
  const currentColorRef = useRef<string>(currentColor);
  const currentWidthRef = useRef<number>(currentWidth);
  const activeModeRef = useRef<PrimaryMode>(activeMode);

  currentColorRef.current = currentColor;
  currentWidthRef.current = currentWidth;
  activeModeRef.current = activeMode;

  const currentSlide = presentation?.current_slide;
  const slideIndex = presentation?.current_slide_index || 1;
  const totalSlides = presentation?.total_slides || 1;

  // Redraw all saved annotations onto canvas
  const redrawCanvas = useCallback((savedAnnots: any[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    savedAnnots.forEach((annot) => {
      try {
        const pts: number[][] =
          typeof annot.points_json === 'string'
            ? JSON.parse(annot.points_json)
            : annot.points_json;
        if (!pts || pts.length < 2) return;
        ctx.beginPath();
        ctx.strokeStyle = annot.color || '#EF4444';
        ctx.lineWidth = annot.stroke_width || 3.0;
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
  }, []);

  const loadAnnotations = async () => {
    try {
      const activeSess = await api.getActiveSession();
      if (activeSess?.active && activeSess.session) {
        const data = await api.getAnnotations(activeSess.session.id, slideIndex);
        setAnnotations(data || []);
        redrawCanvas(data || []);
      }
    } catch (err) {
      // Ignored if no session
    }
  };

  useEffect(() => {
    loadAnnotations();
  }, [slideIndex]);

  useEffect(() => {
    redrawCanvas(annotations);
  }, [annotations, redrawCanvas]);

  // Stroke lifecycle primitives
  const startStroke = (normX: number, normY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    isDrawingRef.current = true;
    activeStrokeRef.current = [[normX, normY]];
    setHudIsDrawing(true);
    setHudActivePoints(1);
    setHudLastCoords({ x: normX, y: normY });

    // Draw single dot on touch/down
    ctx.beginPath();
    ctx.fillStyle = currentColorRef.current;
    ctx.arc(normX * canvas.width, normY * canvas.height, currentWidthRef.current / 2, 0, Math.PI * 2);
    ctx.fill();
  };

  const addPoint = (normX: number, normY: number) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pts = activeStrokeRef.current;
    if (pts.length === 0) {
      startStroke(normX, normY);
      return;
    }

    const lastPt = pts[pts.length - 1];
    pts.push([normX, normY]);
    setHudActivePoints(pts.length);
    setHudLastCoords({ x: normX, y: normY });

    // Incremental direct 2D line segment rendering (O(1), zero React re-render overhead)
    ctx.beginPath();
    ctx.strokeStyle = currentColorRef.current;
    ctx.lineWidth = currentWidthRef.current;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(lastPt[0] * canvas.width, lastPt[1] * canvas.height);
    ctx.lineTo(normX * canvas.width, normY * canvas.height);
    ctx.stroke();
  };

  const finishStroke = useCallback(async () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    setHudIsDrawing(false);

    const pts = [...activeStrokeRef.current];
    activeStrokeRef.current = [];
    setHudActivePoints(0);

    if (pts.length > 1) {
      try {
        const activeSess = await api.getActiveSession();
        if (activeSess?.active && activeSess.session) {
          const newAnnot = await api.createAnnotation({
            annotation_type: 'stroke',
            color: currentColorRef.current,
            stroke_width: currentWidthRef.current,
            points: pts,
            slide_index: slideIndex,
          });
          setAnnotations((prev) => [...prev, newAnnot]);
        } else {
          // Local session preview
          setAnnotations((prev) => [
            ...prev,
            {
              id: 'local_' + Date.now(),
              color: currentColorRef.current,
              stroke_width: currentWidthRef.current,
              points_json: JSON.stringify(pts),
              slide_index: slideIndex,
            },
          ]);
        }
      } catch (err) {
        console.error('Failed to commit annotation stroke:', err);
      }
    } else {
      // Clear lone dot if any
      redrawCanvas(annotations);
    }
  }, [annotations, slideIndex, redrawCanvas]);

  // Safely end stroke on mode changes away from ANNOTATE
  useEffect(() => {
    if (activeMode !== 'ANNOTATE') {
      finishStroke();
    }
  }, [activeMode, finishStroke]);

  // Window blur or focus loss terminates any active stroke safely
  useEffect(() => {
    const handleBlur = () => {
      finishStroke();
    };
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('blur', handleBlur);
    };
  }, [finishStroke]);

  // WebSocket Subscription: listen to hardware glove annotation triggers & diagnostics
  useEffect(() => {
    const unsubStatus = wsService.onStatusChange((st) => {
      setHudSocketStatus(st);
      setHudLastError(wsService.getLastError());
    });

    const unsubMsg = wsService.subscribe((msg: any) => {
      const type = msg.type;
      setHudLastEvent(type || 'unknown');
      setHudLastEventTime(Date.now());

      if (type === 'annotation_start') {
        if (activeModeRef.current === 'ANNOTATE' && !isDrawingRef.current) {
          // Initialize hardware annotation stroke from center/last known coord
          startStroke(hudLastCoords.x || 0.5, hudLastCoords.y || 0.5);
        }
      } else if (type === 'annotation_end') {
        finishStroke();
      } else if (type === 'device_disconnected') {
        finishStroke();
      } else if (type === 'mode_changed') {
        if (msg.payload?.new_mode !== 'ANNOTATE') {
          finishStroke();
        }
      }
    });

    // 1-second diagnostic refresh interval
    const diagInterval = setInterval(() => {
      setHudHz(wsService.getCurrentHz());
      setHudLastError(wsService.getLastError());
    }, 500);

    return () => {
      unsubStatus();
      unsubMsg();
      clearInterval(diagInterval);
      finishStroke();
    };
  }, [finishStroke, hudLastCoords.x, hudLastCoords.y]);

  // HTML5 Pointer Events handlers with Pointer Capture
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeMode !== 'ANNOTATE') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {
      // In case pointer capture fails
    }

    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    startStroke(x, y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    addPoint(x, y);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (err) {
        // Pointer capture release
      }
    }
    finishStroke();
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (err) {
        // Pointer capture release
      }
    }
    finishStroke();
  };

  const handleClear = async () => {
    const activeSess = await api.getActiveSession();
    if (activeSess?.active && activeSess.session) {
      await api.clearAnnotations(activeSess.session.id, slideIndex);
    }
    setAnnotations([]);
    redrawCanvas([]);
  };

  const handleUndo = async () => {
    const activeSess = await api.getActiveSession();
    if (activeSess?.active && activeSess.session) {
      await api.undoAnnotation(activeSess.session.id, slideIndex);
    }
    setAnnotations((prev) => {
      const next = prev.slice(0, -1);
      redrawCanvas(next);
      return next;
    });
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
    <div className="h-full flex flex-col bg-slate-950 overflow-hidden select-none relative">
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

          {/* Developer Diagnostic HUD Toggle */}
          <button
            onClick={() => setShowDiagnostics((prev) => !prev)}
            title="Toggle Live Diagnostic HUD"
            className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors border ${
              showDiagnostics
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span className="font-mono text-[11px]">HUD</span>
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
                <span>
                  Page {slideIndex} of {totalSlides}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">
                {currentSlide?.title || `Slide ${slideIndex}: Interactive Presentation View`}
              </h2>
              <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap max-h-[320px] overflow-hidden">
                {currentSlide?.extracted_text || (
                  <div className="space-y-4 py-8">
                    <p className="text-slate-400">
                      Welcome to Manoeuvre Lecture Workspace. Connect your NodeMCU ESP8266 glove or use the
                      Virtual Simulator to interact with this slide.
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-slate-400 text-xs">
                      <li>Hold ACTION button (D6) in ANNOTATE mode to draw continuous vector strokes.</li>
                      <li>Double-click ACTION in ANNOTATE mode to clear slide annotations.</li>
                      <li>Tilt wrist left or right in SLIDE NAV mode to navigate slides.</li>
                      <li>Hold ACTION in VOICE mode to record lecture audio and ask AI questions.</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="text-[10px] text-slate-500 flex justify-between border-t border-slate-800/60 pt-2">
              <span>Manoeuvre AI Core Vector Layer (Continuous High-Frequency Stream)</span>
              <span>Coordinates: Normalized [0.0 - 1.0]</span>
            </div>
          </div>

          {/* Transparent Vector Annotation Drawing Layer with HTML5 Pointer Capture */}
          <canvas
            ref={canvasRef}
            width={1280}
            height={800}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            className={`absolute inset-0 w-full h-full z-10 touch-none ${
              activeMode === 'ANNOTATE' ? 'cursor-crosshair' : 'cursor-default pointer-events-none'
            }`}
          />
        </div>
      </div>

      {/* Developer Diagnostic HUD Floating Panel */}
      {showDiagnostics && (
        <div className="absolute bottom-4 right-4 z-50 bg-slate-900/95 border border-slate-700/80 rounded-lg p-3 text-xs font-mono shadow-2xl backdrop-blur-md w-72 text-slate-300">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 font-bold text-white">
            <span className="flex items-center space-x-1.5 text-amber-400">
              <Activity className="w-3.5 h-3.5" />
              <span>Diagnostic HUD</span>
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] ${
                hudSocketStatus === 'CONNECTED'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              {hudSocketStatus}
            </span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Stream Rate:</span>
              <span className="font-bold text-emerald-400">{hudHz} Hz</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Current Mode:</span>
              <span className="text-white font-semibold">{activeMode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Annotation State:</span>
              <span
                className={`font-semibold ${
                  hudIsDrawing ? 'text-amber-400 animate-pulse' : 'text-slate-400'
                }`}
              >
                {hudIsDrawing ? 'ACTIVE STROKE' : 'IDLE'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Active Stroke Points:</span>
              <span className="font-bold text-white">{hudActivePoints} pts</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Last Event:</span>
              <span className="text-slate-200 truncate max-w-[130px]">{hudLastEvent}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Last Normalized Pt:</span>
              <span className="text-slate-300">
                {hudLastCoords.x.toFixed(3)}, {hudLastCoords.y.toFixed(3)}
              </span>
            </div>
            {hudLastError && (
              <div className="pt-1 border-t border-slate-800 text-[10px] text-rose-400 truncate">
                Err: {hudLastError}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
