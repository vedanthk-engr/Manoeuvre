import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  ListChecks,
  HelpCircle,
  Lightbulb,
  Code2,
  FileSpreadsheet,
  Mic,
  Send,
  Clock,
  Zap,
  CheckCircle2,
  Copy,
} from 'lucide-react';
import { api } from '../services/api';
import { PresentationState } from '../types';

interface AIWorkspaceScreenProps {
  presentation: PresentationState | null;
  initialAction?: string;
}

export const AIWorkspaceScreen: React.FC<AIWorkspaceScreenProps> = ({
  presentation,
  initialAction,
}) => {
  const [selectedAction, setSelectedAction] = useState<string>(initialAction || 'explain');
  const [customPrompt, setCustomPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [copied, setCopied] = useState(false);

  const actions = [
    {
      id: 'explain',
      title: 'Explain Slide',
      desc: 'Intuitive breakdown of key concepts for students.',
      icon: BookOpen,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    },
    {
      id: 'summarize',
      title: 'Summarize Slide',
      desc: '3 concise takeaways with bolded keywords.',
      icon: ListChecks,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      id: 'mcq',
      title: 'Generate MCQs',
      desc: 'Class comprehension quiz questions with answer keys.',
      icon: HelpCircle,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    },
    {
      id: 'analogy',
      title: 'Conceptual Analogy',
      desc: 'Relatable everyday metaphors to ground complex ideas.',
      icon: Lightbulb,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
    {
      id: 'code',
      title: 'Code Example',
      desc: 'Educational, commented implementation in Python.',
      icon: Code2,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    },
    {
      id: 'recap',
      title: 'Session Recap',
      desc: 'Executive summary of topics, duration, and pacing.',
      icon: FileSpreadsheet,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    },
  ];

  const handleExecute = async (actionId?: string) => {
    const act = actionId || selectedAction;
    setLoading(true);
    setResponse(null);
    try {
      const res = await api.executeAiQuery(
        act,
        presentation?.current_slide_index,
        customPrompt.trim() || undefined
      );
      setResponse(res);
    } catch (err: any) {
      setResponse({
        response_text: `### AI Query Error\n\n${err.message || 'Could not complete AI request.'}`,
        provider: 'system',
        model: 'none',
        latency_ms: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!response?.response_text) return;
    navigator.clipboard.writeText(response.response_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleVoice = async () => {
    try {
      const res = await api.toggleSpeechRecording();
      setIsRecording(res.status === 'RECORDING');
      if (res.transcript) {
        setCustomPrompt(res.transcript);
        handleExecute('explain');
      }
    } catch (err) {
      console.error('Voice toggle error:', err);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col space-y-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">AI Teaching Assistant</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Slide comprehension, multiple choice generation, analogies, and lecture summaries.
          </p>
        </div>

        {/* Voice Push-to-Talk Simulation */}
        <button
          onClick={handleToggleVoice}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
            isRecording
              ? 'bg-rose-500 border-rose-400 text-white animate-pulse'
              : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
          }`}
        >
          <Mic className="w-3.5 h-3.5" />
          <span>{isRecording ? 'Listening (Release to Submit)...' : 'Simulate Voice (Push-to-Talk)'}</span>
        </button>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Left: Action Selection & Custom Prompt */}
        <div className="col-span-5 flex flex-col space-y-4 min-h-0 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-2.5">
            {actions.map((act) => {
              const Icon = act.icon;
              const isSelected = selectedAction === act.id;
              return (
                <div
                  key={act.id}
                  onClick={() => {
                    setSelectedAction(act.id);
                    handleExecute(act.id);
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-800 border-emerald-500/50 shadow-md shadow-emerald-950/20'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1.5">
                    <div className={`p-1.5 rounded-md ${act.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-white">{act.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">{act.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Custom Question Input */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Custom Question or Slide Prompt
            </label>
            <textarea
              rows={3}
              placeholder="Ask anything about the active slide (e.g. 'Generate 2 discussion questions for class')..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
            />
            <div className="flex justify-end">
              <button
                onClick={() => handleExecute()}
                disabled={loading}
                className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-all shadow-sm"
              >
                <Send className="w-3 h-3" />
                <span>{loading ? 'Processing...' : 'Submit to AI'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: AI Output Console */}
        <div className="col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col min-h-0">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-bold text-white">AI Assistant Output</h2>
            </div>

            {response && (
              <div className="flex items-center space-x-3 text-xs">
                <div className="flex items-center space-x-1 text-slate-400">
                  <Clock className="w-3 h-3" />
                  <span>{response.latency_ms} ms</span>
                </div>
                <div className="flex items-center space-x-1 text-slate-400">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>{response.tokens_used || 150} tokens</span>
                </div>
                <button
                  onClick={handleCopy}
                  className="p-1 rounded hover:bg-slate-800 text-slate-300 transition-colors"
                  title="Copy markdown text"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>

          {/* Response Container */}
          <div className="flex-1 overflow-y-auto pr-1 text-xs text-slate-300 leading-relaxed font-sans space-y-3 whitespace-pre-wrap select-text">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center space-y-3 text-slate-400">
                <Sparkles className="w-6 h-6 text-purple-400 animate-spin" />
                <span>Synthesizing response for active slide...</span>
              </div>
            ) : response ? (
              <div className="prose prose-invert max-w-none text-slate-200">
                {response.response_text}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center space-y-2 text-slate-500">
                <Sparkles className="w-8 h-8 opacity-40 text-purple-400" />
                <p>Select any AI action on the left to analyze the current slide.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
