import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  ListChecks,
  HelpCircle,
  Lightbulb,
  Mic,
  Send,
  CheckCircle2,
  Copy,
  Check,
  Zap,
  Layers,
  Terminal,
} from 'lucide-react';
import { api } from '../services/api';
import { PresentationState } from '../types';

interface AIWorkspaceScreenProps {
  presentation: PresentationState | null;
  initialAction?: string;
}

export const AIWorkspaceScreen: React.FC<AIWorkspaceScreenProps> = ({
  presentation,
  initialAction = 'explain',
}) => {
  const [selectedAction, setSelectedAction] = useState<string>(initialAction);
  const [customPrompt, setCustomPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>({
    text: `### Overview: Operating Systems Process Scheduling\n\n- **CPU Scheduling**: Decides which ready process gets CPU time using preemptive or cooperative scheduling.\n- **Turnaround vs Response Time**: Optimizing for batch throughput differs fundamentally from interactive responsiveness.\n- **Real-World Analogy**: Think of the CPU scheduler as an airport air-traffic controller coordinating runway takeoffs for incoming jets with varying priorities.`,
    action: 'explain',
    latency_ms: 320,
    slide_index: 4,
  });
  const [isRecording, setIsRecording] = useState(false);
  const [copied, setCopied] = useState(false);

  const actions = [
    {
      id: 'explain',
      title: 'Explain Slide',
      desc: 'Intuitive conceptual breakdown of key slide terms.',
      icon: BookOpen,
      color: 'bg-purple-50 text-purple-700',
    },
    {
      id: 'summarize',
      title: 'Summarize Key Takeaways',
      desc: '3 concise bullet points for quick student note-taking.',
      icon: ListChecks,
      color: 'bg-emerald-50 text-emerald-700',
    },
    {
      id: 'mcq',
      title: 'Generate Quick Quiz',
      desc: 'Instant multiple-choice quiz questions with answer keys.',
      icon: HelpCircle,
      color: 'bg-indigo-50 text-indigo-700',
    },
    {
      id: 'analogy',
      title: 'Conceptual Analogy',
      desc: 'Memorable real-life analogy explaining technical abstractions.',
      icon: Lightbulb,
      color: 'bg-amber-50 text-amber-700',
    },
  ];

  const handleExecuteAction = async (actionId: string) => {
    setSelectedAction(actionId);
    setLoading(true);
    try {
      const res = await api.queryAI(actionId, customPrompt || undefined);
      setResponse(res);
    } catch (err: any) {
      console.warn('AI query offline fallback:', err);
      // Fallback response for offline lecture mode
      const mockResponses: Record<string, string> = {
        explain: `### Concept Breakdown: Process State Transitions\n\n1. **Ready Queue**: Processes loaded in RAM awaiting CPU dispatch.\n2. **Running State**: Process actively executing instructions on the core.\n3. **Waiting/Blocked**: I/O operations pending completion before returning to Ready.`,
        summarize: `### Slide Summary\n\n- Context switching incurs hardware register save/restore overhead.\n- Preemptive scheduling guarantees fair CPU slice allocation.\n- Real-time systems require bounded interrupt latency.`,
        mcq: `### Comprehension Quiz (Slide 4)\n\n**Q1:** What is the primary purpose of preemptive CPU scheduling?\n- A) To eliminate memory paging\n- B) To ensure no single process starves others of CPU time *(Correct)*\n- C) To disable hardware interrupts\n- D) To optimize disk seek operations`,
        analogy: `### Classroom Analogy\n\nThink of the CPU as a single chef in a busy restaurant kitchen, and processes as different orders. Cooperative scheduling means the chef finishes cooking a whole steak before touching a salad. Preemptive scheduling means the chef pauses the simmer to quickly chop a tomato so no guest waits too long!`,
      };
      setResponse({
        text: mockResponses[actionId] || 'Analysis complete for current slide.',
        action: actionId,
        latency_ms: 180,
        slide_index: presentation?.current_slide_index ?? 1,
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (response?.text) {
      navigator.clipboard.writeText(response.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            AI Teaching Copilot Workspace
          </h2>
          <p className="text-xs text-slate-500">
            Real-time slide explanation, speech-to-text audio synthesis, analogy generation, and quiz synthesis
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Neural Engine Online</span>
          </div>

          <button
            onClick={() => setIsRecording(!isRecording)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-all ${
              isRecording
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-[#d8fa55] hover:bg-[#cbf53d] text-slate-950'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>{isRecording ? 'Listening (Glove Voice)...' : 'Push-to-Talk (Voice)'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Action Deck & Slide Context (Left) + Response Window (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Actions & Active Slide Context */}
        <div className="lg:col-span-5 space-y-4">
          {/* Quick AI Action Cards */}
          <div className="bg-white rounded-2xl p-4 border border-[#eef0f4] shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              One-Touch Teaching Prompts
            </h3>

            <div className="space-y-2">
              {actions.map((act) => {
                const Icon = act.icon;
                const isCur = selectedAction === act.id;

                return (
                  <button
                    key={act.id}
                    onClick={() => handleExecuteAction(act.id)}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-start gap-3 group ${
                      isCur
                        ? 'bg-[#d8fa55]/20 border-[#d8fa55] shadow-sm'
                        : 'bg-white border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${act.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {act.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 leading-snug mt-0.5">
                        {act.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Slide Context Card */}
          <div className="bg-white rounded-2xl p-4 border border-[#eef0f4] shadow-sm">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                <h4 className="text-xs font-bold text-slate-800">
                  Active Slide Context
                </h4>
              </div>
              <span className="text-[10px] font-bold text-slate-500">
                Slide {(presentation?.current_slide_index ?? 0) + 1}
              </span>
            </div>

            <p className="text-xs font-semibold text-slate-900 mb-1">
              {presentation?.current_slide?.title || 'Operating Systems: Process Scheduling'}
            </p>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 font-mono text-[10px] text-slate-600 max-h-24 overflow-y-auto leading-relaxed">
              {presentation?.current_slide?.extracted_text ||
                'Preemptive scheduling, ready queues, round-robin quantum, priority inversion, and context switching overhead.'}
            </div>
          </div>
        </div>

        {/* Right Column: AI Output Canvas */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-4 border border-[#eef0f4] shadow-sm flex flex-col justify-between min-h-[500px]">
          <div>
            {/* Output Header */}
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#d8fa55]" />
                <h3 className="text-sm font-bold text-slate-900">
                  Teaching Response & Lecture Notes
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {response?.latency_ms && (
                  <span className="text-[10px] font-mono text-slate-400">
                    {response.latency_ms}ms
                  </span>
                )}
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Generated Response */}
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 min-h-[340px] max-h-[380px] overflow-y-auto font-sans text-xs text-slate-800 leading-relaxed space-y-2 select-text">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                  <Sparkles className="w-6 h-6 animate-spin text-[#d8fa55] mb-2" />
                  <p className="text-xs font-semibold">Synthesizing pedagogic explanation...</p>
                </div>
              ) : (
                <div className="whitespace-pre-wrap">
                  {response?.text || 'Select an action or push-to-talk to generate explanations.'}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Custom Prompt Input */}
          <div className="pt-3 border-t border-slate-100 mt-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (customPrompt.trim()) {
                  handleExecuteAction(selectedAction);
                }
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Ask custom question about this slide (e.g. Give 2 real-world code examples)..."
                className="flex-1 px-4 py-2 text-xs rounded-full bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
              <button
                type="submit"
                disabled={loading || !customPrompt.trim()}
                className="px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold shadow flex items-center gap-1.5 transition-transform active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Ask AI</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
