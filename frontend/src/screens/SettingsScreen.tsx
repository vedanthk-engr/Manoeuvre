import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  CheckCircle2,
  Sliders,
  Cpu,
  Sparkles,
  Wifi,
  Save,
} from 'lucide-react';
import { api } from '../services/api';
import { UserSettings } from '../types';

export const SettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState<Partial<UserSettings>>({
    theme: 'light',
    cursor_sensitivity: 1.5,
    cursor_dead_zone: 0.12,
    cursor_smoothing: 0.75,
    zoom_factor: 2.0,
    highlight_color: '#FACC15',
    overlay_opacity: 0.85,
    ai_provider: 'mock',
    ai_model: 'multimodal-v1',
    openai_api_key: '',
    ws_port: 8000,
  });

  const [saving, setSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await api.getSettings();
      if (data) setSettings(data);
    } catch (err) {
      console.warn('Failed to load settings:', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateSettings(settings);
      setSaveNotice('Settings successfully saved to local database!');
      setTimeout(() => setSaveNotice(''), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">System & Hardware Settings</h2>
          <p className="text-xs text-slate-500">
            Configure wearable glove calibration, Wi-Fi endpoints, AI cloud copilot, and overlay preferences
          </p>
        </div>

        {saveNotice && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{saveNotice}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Glove IMU Calibration */}
        <div className="bg-white rounded-2xl p-5 border border-[#eef0f4] shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Cpu className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Wearable IMU Calibration (6-Axis MPU6050)
            </h3>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Cursor Sensitivity</span>
                <span>{settings.cursor_sensitivity}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={settings.cursor_sensitivity || 1.5}
                onChange={(e) => setSettings({ ...settings, cursor_sensitivity: parseFloat(e.target.value) })}
                className="w-full accent-slate-900"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>IMU Gyro Dead Zone</span>
                <span>{settings.cursor_dead_zone} rad/s</span>
              </div>
              <input
                type="range"
                min="0.02"
                max="0.30"
                step="0.02"
                value={settings.cursor_dead_zone || 0.12}
                onChange={(e) => setSettings({ ...settings, cursor_dead_zone: parseFloat(e.target.value) })}
                className="w-full accent-slate-900"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Pointer Smoothing</span>
                <span>{settings.cursor_smoothing}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.95"
                step="0.05"
                value={settings.cursor_smoothing || 0.75}
                onChange={(e) => setSettings({ ...settings, cursor_smoothing: parseFloat(e.target.value) })}
                className="w-full accent-slate-900"
              />
            </div>

            <div className="pt-2">
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Tactile Button Hold Threshold (ms)
              </label>
              <input
                type="number"
                value={settings.button_hold_threshold_ms || 600}
                onChange={(e) => setSettings({ ...settings, button_hold_threshold_ms: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200"
              />
            </div>
          </div>
        </div>

        {/* AI Cloud Copilot Configuration */}
        <div className="bg-white rounded-2xl p-5 border border-[#eef0f4] shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Sparkles className="w-4 h-4 text-[#d8fa55]" />
            <h3 className="text-sm font-bold text-slate-900">
              AI Cloud Copilot Engine
            </h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                AI Provider
              </label>
              <select
                value={settings.ai_provider || 'mock'}
                onChange={(e) => setSettings({ ...settings, ai_provider: e.target.value })}
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 font-semibold"
              >
                <option value="cloud_api">Cloud Multimodal AI (Online)</option>
                <option value="openai">OpenAI API (GPT-4o)</option>
                <option value="mock">Offline Mock Adapter (Zero Secret Leaks)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Model Name
              </label>
              <input
                type="text"
                value={settings.ai_model || 'multimodal-v1'}
                onChange={(e) => setSettings({ ...settings, ai_model: e.target.value })}
                placeholder="e.g. multimodal-v1, gpt-4o"
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Cloud AI API Key
              </label>
              <input
                type="password"
                value={settings.openai_api_key || ''}
                onChange={(e) => setSettings({ ...settings, openai_api_key: e.target.value })}
                placeholder="Enter AI API Key (Stored in local SQLite)"
                className="w-full px-3 py-1.5 text-xs font-mono rounded-xl bg-slate-50 border border-slate-200"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                WebSocket Backend Port (matches Config.h)
              </label>
              <input
                type="number"
                value={settings.ws_port || 8000}
                onChange={(e) => setSettings({ ...settings, ws_port: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-1.5 text-xs font-mono rounded-xl bg-slate-50 border border-slate-200"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
