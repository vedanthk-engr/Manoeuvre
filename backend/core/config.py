"""
Manoeuvre Core Configuration
Uses pydantic_settings to load from environment variables and local .env files.
"""

from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    APP_NAME: str = "Manoeuvre Core"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Server Network
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    CORS_ORIGINS: list[str] = ["*"]

    # Database
    DB_PATH: str = str(BASE_DIR / "manoeuvre.db")

    # Uploads & Assets
    UPLOADS_DIR: str = str(BASE_DIR / "uploads")

    # AI Keys (can be set via env or in UI Settings)
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    DEFAULT_AI_PROVIDER: str = "mock"  # "mock", "gemini", "openai"
    DEFAULT_AI_MODEL: str = "gemini-1.5-flash"

    # Input Control
    ENABLE_VIRTUAL_CURSOR: bool = True
    DEFAULT_CURSOR_SENSITIVITY: float = 1.5
    DEFAULT_CURSOR_DEAD_ZONE: float = 0.12
    DEFAULT_CURSOR_SMOOTHING: float = 0.75

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
