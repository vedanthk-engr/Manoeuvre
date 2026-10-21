import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, CheckCircle2, Shield, Sliders, Cpu, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { UserSettings } from '../types';

export const SettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState<Partial<UserSettings>>({
    theme: 'dark',
    cursor_sensitivity: 1.5,
    cursor_dead_zone: 0.12,
    cursor_smoothing: 0.75,
    zoom_factor: 2.0,
    highlight_color: '#FACC15',
    overlay_opacity: 0.85,
    ai_provider: 'mock',
    ai_model: 'gemini-1.5-flash',
    gemini_api_key: '',
    openai_api_key: '',
  });

  const [saving, setSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await api.getSettings();
      setSettings(data);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateSettings(settings);
      setSaveNotice('Settings successfully saved to database!');
      setTimeout(() => setSaveNotice(''), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 h-full overflow-y-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">System Settings</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure hardware sensitivity, AI provider keys, overlay appearance, and local storage.
          </p>
        </div>

        {saveNotice && (
          <span className="text-xs text-emerald-400 flex items-center space-x-1.5 font-semibold bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{saveNotice}</span>
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
        {/* Section 1: AI Provider Configuration */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-bold text-white">AI Engine & Model Configuration</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-300 font-semibold mb-1.5 block">AI Provider</label>
              <select
                value={settings.ai_provider || 'mock'}
                onChange={(e) => setSettings({ ...settings, ai_provider: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="mock">Offline / Local Mock Provider (No API Key Required)</option>
                <option value="gemini">Google Gemini API</option>
                <option value="openai">OpenAI API</option>
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Local mock provider generates deterministic teaching responses offline.
              </p>
            </div>

            <div>
              <label className="text-slate-300 font-semibold mb-1.5 block">AI Model Identifier</label>
              <input
                type="text"
                value={settings.ai_model || ''}
                onChange={(e) => setSettings({ ...settings, ai_model: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                placeholder="e.g. gemini-1.5-flash or gpt-4o-mini"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold mb-1.5 block">Google Gemini API Key</label>
              <input
                type="password"
                value={settings.gemini_api_key || ''}
                onChange={(e) => setSettings({ ...settings, gemini_api_key: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                placeholder={settings.gemini_api_key_masked || 'Enter GEMINI_API_KEY'}
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold mb-1.5 block">OpenAI API Key</label>
              <input
                type="password"
                value={settings.openai_api_key || ''}
                onChange={(e) => setSettings({ ...settings, openai_api_key: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                placeholder={settings.openai_api_key_masked || 'Enter OPENAI_API_KEY'}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Hardware & Motion Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">Wearable Hardware & Pointer Settings</h2>
          </div>

          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-300 font-semibold mb-1.5 block">Cursor Sensitivity</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="5.0"
                value={settings.cursor_sensitivity || 1.5}
                onChange={(e) => setSettings({ ...settings, cursor_sensitivity: parseFloat(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold mb-1.5 block">IMU Dead Zone</label>
              <input
                type="number"
                step="0.01"
                min="0.0"
                max="1.0"
                value={settings.cursor_dead_zone || 0.12}
                onChange={(e) => setSettings({ ...settings, cursor_dead_zone: parseFloat(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold mb-1.5 block">Motion Smoothing (0-1)</label>
              <input
                type="number"
                step="0.05"
                min="0.0"
                max="0.95"
                value={settings.cursor_smoothing || 0.75}
                onChange={(e) => setSettings({ ...settings, cursor_smoothing: parseFloat(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-900/30"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};
