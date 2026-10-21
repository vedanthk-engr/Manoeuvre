"""
Thread-safe SQLite Database Manager
Enforces WAL mode, foreign key constraints, and clean transaction contexts.
"""

import sqlite3
from contextlib import contextmanager
from typing import Generator
from pathlib import Path
from backend.core.config import settings
from backend.core.logging import logger

class DatabaseManager:
    def __init__(self, db_path: str = settings.DB_PATH):
        self.db_path = db_path
        # Ensure parent directory exists
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)

    def get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(
            self.db_path,
            check_same_thread=False,
            timeout=10.0
        )
        conn.row_factory = sqlite3.Row
        # Enable WAL mode for high concurrency
        conn.execute("PRAGMA journal_mode=WAL;")
        # Enforce foreign key constraints
        conn.execute("PRAGMA foreign_keys=ON;")
        return conn

    @contextmanager
    def connection(self) -> Generator[sqlite3.Connection, None, None]:
        conn = self.get_connection()
        try:
            yield conn
            conn.commit()
        except Exception as e:
            conn.rollback()
            logger.error(f"[DB] Transaction failed, rolled back: {e}")
            raise
        finally:
            conn.close()

db_manager = DatabaseManager()
