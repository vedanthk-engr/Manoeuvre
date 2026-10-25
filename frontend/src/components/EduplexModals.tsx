import React, { useState } from 'react';
import {
  X,
  QrCode,
  Download,
  Smartphone,
  Check,
  Star,
  Sparkles,
  Radio,
  Tv,
  PenTool,
  Mic,
  MousePointer,
  Highlighter,
} from 'lucide-react';
import { Course, ScheduleItem, Assignment } from '../data/eduplexData';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/* =========================================================================
   1. MOBILE APP DOWNLOAD MODAL
   ========================================================================= */
export const MobileAppModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-app-modal-title"
    >
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#d8fa55] text-slate-950 flex items-center justify-center mx-auto mb-3 shadow-md">
            <Smartphone className="w-6 h-6 stroke-[2.2]" />
          </div>
          <h3 id="mobile-app-modal-title" className="text-lg font-bold text-slate-900">
            Download Eduplex Mobile
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Take your courses on the go, receive instant assignment alerts, and pair your wearable controller.
          </p>
        </div>

        {/* QR Code Demo */}
        <div className="bg-[#f8f9fb] p-5 rounded-2xl border border-slate-100 flex flex-col items-center justify-center mb-5">
          <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200">
            <QrCode className="w-28 h-28 text-slate-900" />
          </div>
          <span className="text-[11px] font-semibold text-slate-600 mt-2">
            Scan with iPhone or Android Camera
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <a
            href="#ios"
            onClick={(e) => {
              e.preventDefault();
              alert('Opening Apple App Store download link...');
            }}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Apple App Store</span>
          </a>
          <a
            href="#android"
            onClick={(e) => {
              e.preventDefault();
              alert('Opening Google Play Store download link...');
            }}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Google Play Store</span>
          </a>
        </div>

        <div className="text-center">
          <span className="text-[11px] text-slate-400">
            Supports iOS 16+, Android 12+ and Manoeuvre Bluetooth ESP32
          </span>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   2. GO PREMIUM MODAL
   ========================================================================= */
export const GoPremiumModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  const [activated, setActivated] = useState(false);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="premium-modal-title"
    >
      <div className="bg-[#181a24] text-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-700 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#d8fa55]/10 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
            <div className="w-4 h-4 rounded-full border-[2.5px] border-[#181a24] border-t-transparent" />
          </div>
          <span className="text-xs font-bold tracking-widest text-[#d8fa55] uppercase">
            Eduplex Pro Lifetime
          </span>
        </div>

        <h3 id="premium-modal-title" className="text-2xl font-black text-white mb-2">
          Unlock Unlimited Mastery
        </h3>
        <p className="text-sm text-slate-400 mb-6">
          Get lifetime access to 25,000+ masterclasses, interactive lecture recording, and custom AI teaching copilots.
        </p>

        {/* Benefits list */}
        <div className="space-y-3 mb-8">
          {[
            'Unlimited access to all courses, certifications, and code labs',
            'Full gesture wearable glove pairing & slide presenter overlay',
            'Real-time lecture transcription, summarization & quiz generation',
            'Offline video sync & downloadable course assets',
            'Direct 1-on-1 mentor guidance & verified student badge',
          ].map((benefit, i) => (
            <div key={i} className="flex items-center gap-3 text-xs sm:text-sm text-slate-300">
              <div className="w-5 h-5 rounded-full bg-[#d8fa55] text-slate-950 flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <span>{benefit}</span>
            </div>
          ))}
        </div>

        {/* Price & Action */}
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">One-time payment</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">$149</span>
              <span className="text-xs line-through text-slate-500">$399</span>
              <span className="text-[10px] font-bold text-[#d8fa55] bg-[#d8fa55]/10 px-2 py-0.5 rounded-full">
                Save 62%
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              setActivated(true);
              setTimeout(() => {
                alert('Congratulations! Eduplex Pro Lifetime access is now activated.');
                onClose();
              }, 600);
            }}
            disabled={activated}
            className="px-5 py-2.5 rounded-full bg-[#d8fa55] hover:bg-[#cbf53d] text-slate-950 font-bold text-xs shadow-lg transition-transform hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {activated ? 'Activating...' : 'Get Instant Access'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   3. ADD COURSE / ASSIGNMENT MODAL
   ========================================================================= */
interface AddModalProps extends ModalProps {
  onAddAssignment: (assignment: Partial<Assignment>) => void;
  onAddCourse: (course: Partial<Course>) => void;
  defaultType?: 'assignment' | 'course';
}

export const AddModal: React.FC<AddModalProps> = ({
  isOpen,
  onClose,
  onAddAssignment,
  onAddCourse,
  defaultType = 'assignment',
}) => {
  const [tab, setTab] = useState<'assignment' | 'course'>(defaultType);
  const [title, setTitle] = useState('');
  const [dueOrLessons, setDueOrLessons] = useState('');
  const [categoryOrStatus, setCategoryOrStatus] = useState('In progress');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (tab === 'assignment') {
      onAddAssignment({
        title,
        due: dueOrLessons || 'Tomorrow, 11:59 PM',
        status: categoryOrStatus as Assignment['status'],
        iconType: 'donut',
        color: '#16a34a',
        bgColor: '#dcfce7',
      });
    } else {
      onAddCourse({
        title,
        lessons: parseInt(dueOrLessons, 10) || 10,
        category: categoryOrStatus || 'General',
        type: categoryOrStatus || 'Lecture Course',
        rating: 5.0,
        iconType: '3d',
        color: '#8b5cf6',
        bgColor: '#ede9fe',
        remaining: '10h 00 min',
        progress: 0,
      });
    }
    setTitle('');
    setDueOrLessons('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-modal-title"
    >
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tab switch */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-5">
          <button
            type="button"
            onClick={() => setTab('assignment')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
              tab === 'assignment'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            New Assignment
          </button>
          <button
            type="button"
            onClick={() => setTab('course')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
              tab === 'course'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Enroll in Course
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 mb-6">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {tab === 'assignment' ? 'Assignment Title' : 'Course Name'}
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  tab === 'assignment'
                    ? 'e.g. HCI Heuristic Evaluation'
                    : 'e.g. Advanced Motion Design'
                }
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#d8fa55] focus:border-transparent"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {tab === 'assignment' ? 'Due Date & Time' : 'Number of Lessons'}
              </label>
              <input
                type="text"
                value={dueOrLessons}
                onChange={(e) => setDueOrLessons(e.target.value)}
                placeholder={
                  tab === 'assignment'
                    ? 'e.g. 24 August, 05:00 PM'
                    : 'e.g. 16'
                }
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#d8fa55] focus:border-transparent"
              />
            </div>

            {tab === 'assignment' ? (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Status
                </label>
                <select
                  value={categoryOrStatus}
                  onChange={(e) => setCategoryOrStatus(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#d8fa55] focus:border-transparent bg-white"
                >
                  <option value="In progress">In progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Upcoming">Upcoming</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Category / Discipline
                </label>
                <input
                  type="text"
                  value={categoryOrStatus}
                  onChange={(e) => setCategoryOrStatus(e.target.value)}
                  placeholder="e.g. UI/UX Design, Engineering, AI"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#d8fa55] focus:border-transparent"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#d8fa55] hover:bg-[#cbf53d] text-slate-950 shadow"
            >
              {tab === 'assignment' ? 'Create Assignment' : 'Add Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* =========================================================================
   4. MANOEUVRE WEARABLE GLOVE & LECTURE STUDIO HUB
   ========================================================================= */
interface ManoeuvreHubProps extends ModalProps {
  isDeviceConnected: boolean;
  activeMode: string;
  onSetMode: (mode: string) => void;
  onNavigateToStudio: () => void;
}

export const ManoeuvreHubModal: React.FC<ManoeuvreHubProps> = ({
  isOpen,
  onClose,
  isDeviceConnected,
  activeMode,
  onSetMode,
  onNavigateToStudio,
}) => {
  if (!isOpen) return null;

  const modes = [
    { id: 'CURSOR', label: 'Cursor Mode', icon: MousePointer, desc: 'Relative pointer control via IMU' },
    { id: 'ANNOTATE', label: 'Vector Annotate', icon: PenTool, desc: 'Freehand slide ink & drawing' },
    { id: 'HIGHLIGHT', label: 'OCR Highlight', icon: Highlighter, desc: 'Contextual smart text selection' },
    { id: 'VOICE', label: 'Voice Assistant', icon: Mic, desc: 'AI lecture Q&A & speech-to-text' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="manoeuvre-hub-title"
    >
      <div className="bg-[#12141c] text-slate-100 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-800 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 id="manoeuvre-hub-title" className="text-lg font-bold text-white">
              Manoeuvre Wearable Controller Hub
            </h3>
            <p className="text-xs text-slate-400">
              ESP32 Glove Telemetry & Native Presentation Studio
            </p>
          </div>
        </div>

        {/* Connection Status Box */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <span
              className={`w-3 h-3 rounded-full ${
                isDeviceConnected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-rose-500'
              }`}
            />
            <div>
              <span className="text-xs font-bold text-white block">
                {isDeviceConnected ? 'ESP32 Glove: Online' : 'Hardware Controller: Disconnected'}
              </span>
              <span className="text-[11px] text-slate-400">
                {isDeviceConnected
                  ? '6-Axis IMU (MPU6050) • SH1106 OLED Display Active'
                  : 'Start scripts/device_simulator.py or power on wearable glove'}
              </span>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#d8fa55]/10 text-[#d8fa55] border border-[#d8fa55]/30">
            Active Mode: {activeMode}
          </span>
        </div>

        {/* Primary Modes Grid */}
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
          Controller Interaction Modes
        </h4>
        <div className="grid grid-cols-2 gap-2.5 mb-6">
          {modes.map((m) => {
            const Icon = m.icon;
            const isCur = activeMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onSetMode(m.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isCur
                    ? 'bg-[#d8fa55] text-slate-950 border-[#d8fa55] font-semibold shadow-md'
                    : 'bg-slate-900/60 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-bold">{m.label}</span>
                </div>
                <p className={`text-[10px] ${isCur ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
                  {m.desc}
                </p>
              </button>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <span className="text-[11px] text-slate-400">
            Press wearable hardware MODE button to cycle
          </span>

          <button
            onClick={() => {
              onClose();
              onNavigateToStudio();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all"
          >
            <Tv className="w-4 h-4" />
            <span>Open Lecture Studio</span>
          </button>
        </div>
      </div>
    </div>
  );
};
