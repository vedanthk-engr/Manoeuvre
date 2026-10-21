import React, { useState, useEffect } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  Play,
  Layers,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';
import { PresentationState } from '../types';

interface PresentationManagerScreenProps {
  onSelectPresentation: (presId: string) => void;
  currentPresentation: PresentationState | null;
  onNavigateToWorkspace: () => void;
}

export const PresentationManagerScreen: React.FC<PresentationManagerScreenProps> = ({
  onSelectPresentation,
  currentPresentation,
  onNavigateToWorkspace,
}) => {
  const [presentations, setPresentations] = useState<any[]>([]);
  const [selectedPresId, setSelectedPresId] = useState<string | null>(null);
  const [slides, setSlides] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    loadPresentations();
  }, []);

  const loadPresentations = async () => {
    try {
      const list = await api.listPresentations();
      setPresentations(list);
      if (list.length > 0 && !selectedPresId) {
        setSelectedPresId(list[0].id);
        loadSlidesForPres(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load presentations:', err);
    }
  };

  const loadSlidesForPres = async (id: string) => {
    try {
      const data = await fetch(`http://127.0.0.1:8000/api/presentation/slides/${id}`).then((r) => r.json());
      setSlides(data);
    } catch (err) {
      console.error('Failed to load slides:', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Please select a valid PDF presentation file.');
      return;
    }

    setUploading(true);
    setUploadError('');
    try {
      await api.uploadPresentation(file);
      await loadPresentations();
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload presentation.');
    } finally {
      setUploading(false);
    }
  };

  const handleSelectActive = async (id: string) => {
    try {
      await api.selectPresentation(id);
      onSelectPresentation(id);
      onNavigateToWorkspace();
    } catch (err) {
      console.error('Failed to select active presentation:', err);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col space-y-6 overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Presentation Manager</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Upload PDF slide decks, inspect extracted layout blocks, and set the active presentation.
          </p>
        </div>

        {/* Upload Button */}
        <label className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 cursor-pointer text-white rounded-lg text-xs font-semibold transition-all shadow-sm">
          <Upload className="w-3.5 h-3.5" />
          <span>{uploading ? 'Processing PDF...' : 'Upload PDF Presentation'}</span>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {uploadError && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
          {uploadError}
        </div>
      )}

      {/* Main Split View */}
      <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Left: Presentation List */}
        <div className="col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col min-h-0">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Slide Decks ({presentations.length})
            </h2>
            <button
              onClick={loadPresentations}
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2 overflow-y-auto flex-1 pr-1">
            {presentations.map((pres) => {
              const isSelected = selectedPresId === pres.id;
              const isActive = currentPresentation?.presentation_id === pres.id;
              return (
                <div
                  key={pres.id}
                  onClick={() => {
                    setSelectedPresId(pres.id);
                    loadSlidesForPres(pres.id);
                  }}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800 border-emerald-500/40 text-white shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2.5">
                      <FileText className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <div>
                        <div className="text-xs font-semibold truncate max-w-[200px]">{pres.title}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {pres.page_count} slides • {Math.round(pres.file_size_bytes / 1024)} KB
                        </div>
                      </div>
                    </div>

                    {isActive && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        ACTIVE
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {presentations.length === 0 && (
              <div className="py-12 text-center text-slate-500 text-xs">
                No presentations found. Click "Upload PDF Presentation" to begin.
              </div>
            )}
          </div>
        </div>

        {/* Right: Slide Inspector & Selection */}
        <div className="col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col min-h-0">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">Slide Layout Inspector</h2>
              <p className="text-xs text-slate-400">
                {slides.length} slides extracted with OCR layout hierarchy
              </p>
            </div>

            {selectedPresId && (
              <button
                onClick={() => handleSelectActive(selectedPresId)}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-all shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Launch in Lecture Workspace</span>
              </button>
            )}
          </div>

          {/* Slide Grid Preview */}
          <div className="grid grid-cols-2 gap-3 overflow-y-auto flex-1 pr-1">
            {slides.map((slide) => (
              <div
                key={slide.id}
                className="bg-slate-950 border border-slate-800 rounded-lg p-3 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                    <span className="font-semibold text-slate-300">Slide {slide.slide_index}</span>
                    <span className="text-[10px] font-mono text-emerald-400">
                      {slide.ocr_layout_json ? 'OCR READY' : 'PLAIN TEXT'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                    {slide.extracted_text || 'No text extracted on this slide.'}
                  </p>
                </div>
              </div>
            ))}

            {slides.length === 0 && (
              <div className="col-span-2 py-16 text-center text-slate-500 text-xs">
                Select a presentation on the left to preview slide contents.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
