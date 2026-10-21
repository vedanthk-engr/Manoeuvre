const BASE_URL = 'http://127.0.0.1:8000';

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`API Error ${res.status}: ${errorBody}`);
  }
  return res.json();
}

export const api = {
  // Dashboard
  getDashboardSummary: () => fetchJson<any>('/api/dashboard/summary'),

  // Device
  getDeviceStatus: () => fetchJson<any>('/api/device/status'),
  configureDevice: (config: { sensitivity?: number; dead_zone?: number; smoothing?: number; enabled?: boolean }) =>
    fetchJson<any>('/api/device/configure', { method: 'POST', body: JSON.stringify(config) }),
  calibrateDevice: () => fetchJson<any>('/api/device/calibrate', { method: 'POST' }),
  setDeviceMode: (target_mode: string) => fetchJson<any>('/api/device/mode', { method: 'POST', body: JSON.stringify({ target_mode }) }),

  // Presentation
  getPresentationState: () => fetchJson<any>('/api/presentation/state'),
  listPresentations: () => fetchJson<any[]>('/api/presentation/list'),
  selectPresentation: (id: string) => fetchJson<any>(`/api/presentation/select/${id}`, { method: 'POST' }),
  nextSlide: () => fetchJson<any>('/api/presentation/next', { method: 'POST' }),
  prevSlide: () => fetchJson<any>('/api/presentation/prev', { method: 'POST' }),
  gotoSlide: (idx: number) => fetchJson<any>(`/api/presentation/goto/${idx}`, { method: 'POST' }),
  uploadPresentation: async (file: File, title?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    const res = await fetch(`${BASE_URL}/api/presentation/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Sessions
  getActiveSession: () => fetchJson<any>('/api/session/active'),
  listSessions: (limit: number = 20) => fetchJson<any[]>(`/api/session/list?limit=${limit}`),
  startSession: (title: string, presentation_id?: string) =>
    fetchJson<any>('/api/session/start', { method: 'POST', body: JSON.stringify({ title, presentation_id }) }),
  endSession: (generate_recap: boolean = true) =>
    fetchJson<any>('/api/session/end', { method: 'POST', body: JSON.stringify({ generate_recap }) }),

  // Annotations
  getAnnotations: (sessionId: string, slideIndex: number) =>
    fetchJson<any[]>(`/api/annotations/${sessionId}/${slideIndex}`),
  createAnnotation: (payload: { annotation_type: string; color: string; stroke_width: number; points: any[]; slide_index: number }) =>
    fetchJson<any>('/api/annotations/', { method: 'POST', body: JSON.stringify(payload) }),
  undoAnnotation: (sessionId: string, slideIndex: number) =>
    fetchJson<any>(`/api/annotations/undo/${sessionId}/${slideIndex}`, { method: 'POST' }),
  clearAnnotations: (sessionId: string, slideIndex: number) =>
    fetchJson<any>(`/api/annotations/clear/${sessionId}/${slideIndex}`, { method: 'POST' }),

  // AI & Speech
  executeAiQuery: (action: string, slideIndex?: number, customPrompt?: string, focus?: string) =>
    fetchJson<any>('/api/ai/query', {
      method: 'POST',
      body: JSON.stringify({ action, slide_index: slideIndex, custom_prompt: customPrompt, focus }),
    }),
  toggleSpeechRecording: () => fetchJson<any>('/api/ai/speech/toggle', { method: 'POST' }),
  getAiHistory: (sessionId: string) => fetchJson<any[]>(`/api/ai/history/${sessionId}`),

  // Analytics
  getSessionAnalytics: (sessionId: string) => fetchJson<any>(`/api/analytics/session/${sessionId}`),

  // Settings
  getSettings: () => fetchJson<any>('/api/settings/'),
  updateSettings: (updates: any) => fetchJson<any>('/api/settings/', { method: 'POST', body: JSON.stringify(updates) }),
};
