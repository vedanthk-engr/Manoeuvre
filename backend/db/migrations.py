"""
Manoeuvre SQLite Schema Migrations Runner
Executes idempotent table and index creation matching docs/DATABASE.md
"""

import sqlite3
from backend.core.logging import logger
from backend.db.database import db_manager

SCHEMA_SQL = """
-- 1. User Profiles
CREATE TABLE IF NOT EXISTS user_profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. User Settings
CREATE TABLE IF NOT EXISTS user_settings (
    user_id TEXT PRIMARY KEY,
    theme TEXT DEFAULT 'dark',
    cursor_sensitivity REAL DEFAULT 1.5,
    cursor_dead_zone REAL DEFAULT 0.12,
    cursor_smoothing REAL DEFAULT 0.75,
    zoom_factor REAL DEFAULT 2.0,
    highlight_color TEXT DEFAULT '#FACC15',
    overlay_opacity REAL DEFAULT 0.85,
    button_hold_threshold_ms INTEGER DEFAULT 500,
    ai_provider TEXT DEFAULT 'mock',
    ai_model TEXT DEFAULT 'gemini-1.5-flash',
    gemini_api_key TEXT DEFAULT '',
    openai_api_key TEXT DEFAULT '',
    language TEXT DEFAULT 'en',
    save_transcripts BOOLEAN DEFAULT 1,
    save_ai_interactions BOOLEAN DEFAULT 1,
    ws_port INTEGER DEFAULT 8000,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);

-- 3. Devices
CREATE TABLE IF NOT EXISTS devices (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    device_name TEXT NOT NULL,
    mac_address TEXT UNIQUE,
    firmware_version TEXT,
    hardware_version TEXT,
    last_seen_at TIMESTAMP,
    is_active BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);

-- 4. Presentations
CREATE TABLE IF NOT EXISTS presentations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    page_count INTEGER NOT NULL DEFAULT 0,
    file_size_bytes INTEGER DEFAULT 0,
    checksum TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);

-- 5. Slides
CREATE TABLE IF NOT EXISTS slides (
    id TEXT PRIMARY KEY,
    presentation_id TEXT NOT NULL,
    slide_index INTEGER NOT NULL,
    title TEXT,
    extracted_text TEXT,
    ocr_layout_json TEXT,
    thumbnail_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(presentation_id) REFERENCES presentations(id) ON DELETE CASCADE,
    UNIQUE(presentation_id, slide_index)
);

-- 6. Lecture Sessions
CREATE TABLE IF NOT EXISTS lecture_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    presentation_id TEXT,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    total_duration_seconds INTEGER DEFAULT 0,
    total_slides_viewed INTEGER DEFAULT 0,
    total_annotations_count INTEGER DEFAULT 0,
    total_ai_queries_count INTEGER DEFAULT 0,
    recap_summary TEXT,
    FOREIGN KEY(user_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY(presentation_id) REFERENCES presentations(id) ON DELETE SET NULL
);

-- 7. Annotations
CREATE TABLE IF NOT EXISTS annotations (
    id TEXT PRIMARY KEY,
    lecture_session_id TEXT NOT NULL,
    presentation_id TEXT,
    slide_index INTEGER NOT NULL,
    annotation_type TEXT NOT NULL,
    color TEXT NOT NULL,
    stroke_width REAL NOT NULL,
    points_json TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(lecture_session_id) REFERENCES lecture_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY(presentation_id) REFERENCES presentations(id) ON DELETE SET NULL
);

-- 8. Lecture Events
CREATE TABLE IF NOT EXISTS lecture_events (
    id TEXT PRIMARY KEY,
    lecture_session_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    slide_index INTEGER,
    data_json TEXT,
    timestamp_ms INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(lecture_session_id) REFERENCES lecture_sessions(id) ON DELETE CASCADE
);

-- 9. Transcripts
CREATE TABLE IF NOT EXISTS transcripts (
    id TEXT PRIMARY KEY,
    lecture_session_id TEXT NOT NULL,
    slide_index INTEGER,
    audio_duration_seconds REAL,
    raw_transcript TEXT NOT NULL,
    confidence REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(lecture_session_id) REFERENCES lecture_sessions(id) ON DELETE CASCADE
);

-- 10. AI Interactions
CREATE TABLE IF NOT EXISTS ai_interactions (
    id TEXT PRIMARY KEY,
    lecture_session_id TEXT NOT NULL,
    slide_index INTEGER,
    query_type TEXT NOT NULL,
    prompt TEXT NOT NULL,
    response_text TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    latency_ms INTEGER,
    tokens_used INTEGER,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(lecture_session_id) REFERENCES lecture_sessions(id) ON DELETE CASCADE
);

-- 11. AI Summaries
CREATE TABLE IF NOT EXISTS ai_summaries (
    id TEXT PRIMARY KEY,
    ai_interaction_id TEXT NOT NULL UNIQUE,
    key_takeaways_json TEXT NOT NULL,
    main_concept TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(ai_interaction_id) REFERENCES ai_interactions(id) ON DELETE CASCADE
);

-- 12. AI Questions
CREATE TABLE IF NOT EXISTS ai_questions (
    id TEXT PRIMARY KEY,
    ai_interaction_id TEXT NOT NULL UNIQUE,
    question_type TEXT NOT NULL,
    content_json TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(ai_interaction_id) REFERENCES ai_interactions(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user ON lecture_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON lecture_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_annotations_session_slide ON annotations(lecture_session_id, slide_index);
CREATE INDEX IF NOT EXISTS idx_events_session ON lecture_events(lecture_session_id);
CREATE INDEX IF NOT EXISTS idx_slides_pres_idx ON slides(presentation_id, slide_index);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_session ON ai_interactions(lecture_session_id);
"""

DEFAULT_USER_ID = "usr_default"

def run_migrations():
    """Initializes tables, creates indexes, and seeds default user and settings."""
    logger.info("[DB] Running schema migrations...")
    with db_manager.connection() as conn:
        conn.executescript(SCHEMA_SQL)
        
        # Seed default user profile if not present
        cur = conn.execute("SELECT id FROM user_profiles WHERE id = ?", (DEFAULT_USER_ID,))
        if not cur.fetchone():
            conn.execute(
                "INSERT INTO user_profiles (id, name, email) VALUES (?, ?, ?)",
                (DEFAULT_USER_ID, "Professor", "professor@manoeuvre.local")
            )
            conn.execute(
                """INSERT INTO user_settings (
                    user_id, theme, cursor_sensitivity, cursor_dead_zone,
                    cursor_smoothing, zoom_factor, highlight_color, overlay_opacity,
                    ai_provider, ai_model
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (DEFAULT_USER_ID, "dark", 1.5, 0.12, 0.75, 2.0, "#FACC15", 0.85, "mock", "gemini-1.5-flash")
            )
            logger.info("[DB] Default user profile and settings seeded.")
    logger.info("[DB] Migrations executed successfully.")
