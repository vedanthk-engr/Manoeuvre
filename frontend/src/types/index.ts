export type PrimaryMode = 'CURSOR' | 'ANNOTATE' | 'HIGHLIGHT' | 'VOICE' | 'SLIDE NAV';

export interface DeviceInfo {
  id: string;
  device_name: string;
  mac_address?: string;
  firmware_version?: string;
  hardware_version?: string;
  last_seen_at?: string;
  is_active: number;
}

export interface PresentationState {
  presentation_loaded: boolean;
  presentation_id: string | null;
  title: string | null;
  current_slide_index: number;
  total_slides: number;
  current_slide?: {
    id: string;
    slide_index: number;
    title: string;
    extracted_text: string;
    ocr_layout_json?: string;
  } | null;
}

export interface LectureSession {
  id: string;
  title: string;
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED';
  started_at: string;
  ended_at?: string;
  total_duration_seconds: number;
  total_slides_viewed: number;
  total_annotations_count: number;
  total_ai_queries_count: number;
  recap_summary?: string;
}

export interface Annotation {
  id: string;
  slide_index: number;
  annotation_type: 'stroke' | 'highlight' | 'laser';
  color: string;
  stroke_width: number;
  points_json: string;
  created_at: string;
}

export interface UserSettings {
  user_id: string;
  theme: string;
  cursor_sensitivity: number;
  cursor_dead_zone: number;
  cursor_smoothing: number;
  zoom_factor: number;
  highlight_color: string;
  overlay_opacity: number;
  button_hold_threshold_ms: number;
  ai_provider: string;
  ai_model: string;
  gemini_api_key?: string;
  gemini_api_key_masked?: string;
  openai_api_key?: string;
  openai_api_key_masked?: string;
  language: string;
  save_transcripts: number;
  save_ai_interactions: number;
  ws_port: number;
}

export interface ButtonEvent {
  button: 'MODE' | 'ACTION' | 'SYSTEM';
  action: 'single_press' | 'double_press' | 'long_press' | 'press_down' | 'release';
  mode: string;
  state: string;
  duration_ms: number;
}
