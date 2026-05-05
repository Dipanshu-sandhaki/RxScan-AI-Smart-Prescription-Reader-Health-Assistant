"""
RxScan AI — Auth Database Module
SQLite database for user authentication
"""

import os
import sqlite3
import hashlib
from datetime import datetime
from typing import Optional, Dict, Any

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
DB_PATH = os.path.join(DATA_DIR, "auth.db")

# Ensure data directory exists
os.makedirs(DATA_DIR, exist_ok=True)


def get_db_connection() -> sqlite3.Connection:
    """Get SQLite database connection"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initialize database tables"""
    conn = get_db_connection()
    try:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL,
                last_login TEXT
            )
        """)
        conn.commit()
    finally:
        conn.close()


def hash_password(password: str) -> str:
    """Hash password using SHA256 (use bcrypt in production)"""
    return hashlib.sha256(password.encode()).hexdigest()


def create_user(user_id: str, name: str, email: str, password: str) -> Dict[str, Any]:
    """Create a new user in the database"""
    conn = get_db_connection()
    try:
        created_at = datetime.utcnow().isoformat()
        password_hash = hash_password(password)
        
        conn.execute(
            "INSERT INTO users (id, name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
            (user_id, name, email.lower(), password_hash, created_at)
        )
        conn.commit()
        
        return {
            "id": user_id,
            "name": name,
            "email": email.lower(),
            "created_at": created_at
        }
    except sqlite3.IntegrityError as e:
        if "UNIQUE constraint failed: users.email" in str(e):
            raise ValueError("Email already registered")
        raise
    finally:
        conn.close()


def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Get user by email address"""
    conn = get_db_connection()
    try:
        cursor = conn.execute(
            "SELECT id, name, email, password_hash, created_at FROM users WHERE email = ?",
            (email.lower(),)
        )
        row = cursor.fetchone()
        
        if row:
            return dict(row)
        return None
    finally:
        conn.close()


def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Get user by ID"""
    conn = get_db_connection()
    try:
        cursor = conn.execute(
            "SELECT id, name, email, created_at FROM users WHERE id = ?",
            (user_id,)
        )
        row = cursor.fetchone()
        
        if row:
            return dict(row)
        return None
    finally:
        conn.close()


def verify_password(password: str, password_hash: str) -> bool:
    """Verify password against stored hash"""
    return hash_password(password) == password_hash


def update_last_login(user_id: str):
    """Update user's last login timestamp"""
    conn = get_db_connection()
    try:
        conn.execute(
            "UPDATE users SET last_login = ? WHERE id = ?",
            (datetime.utcnow().isoformat(), user_id)
        )
        conn.commit()
    finally:
        conn.close()


def delete_user(user_id: str) -> bool:
    """Delete user from database permanently"""
    conn = get_db_connection()
    try:
        cursor = conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()


# Initialize database on module load
init_db()
