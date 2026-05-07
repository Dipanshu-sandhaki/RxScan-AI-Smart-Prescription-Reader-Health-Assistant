# backend/db/history_db.py
import os
import sqlite3
import json
import uuid
from datetime import datetime
from typing import List, Dict, Any

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
DB_PATH = os.path.join(DATA_DIR, "auth.db") # Reusing auth.db to keep it simple

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_history_table():
    conn = get_db_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS scan_history (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            doctor_info JSON,
            medicines JSON,
            scan_confidence REAL,
            created_at TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()

def save_scan(user_id: str, scan_data: dict) -> str:
    conn = get_db_connection()
    scan_id = str(uuid.uuid4())
    created_at = datetime.utcnow().isoformat()
    
    doctor_info = json.dumps(scan_data.get("doctor_info", {}))
    medicines = json.dumps(scan_data.get("medicines", []))
    confidence = scan_data.get("scan_confidence", 0)

    conn.execute(
        "INSERT INTO scan_history (id, user_id, doctor_info, medicines, scan_confidence, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        (scan_id, user_id, doctor_info, medicines, confidence, created_at)
    )
    conn.commit()
    conn.close()
    return scan_id

def get_user_history(user_id: str) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.execute("SELECT * FROM scan_history WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
    rows = cursor.fetchall()
    conn.close()
    
    history = []
    for row in rows:
        history.append({
            "id": row["id"],
            "doctor_info": json.loads(row["doctor_info"]),
            "medicines": json.loads(row["medicines"]),
            "scan_confidence": row["scan_confidence"],
            "created_at": row["created_at"]
        })
    return history

def delete_scans(user_id: str, scan_ids: List[str]):
    if not scan_ids: return
    conn = get_db_connection()
    # Create placeholders (?, ?, ?) based on list length
    placeholders = ",".join("?" * len(scan_ids))
    query = f"DELETE FROM scan_history WHERE user_id = ? AND id IN ({placeholders})"
    
    conn.execute(query, [user_id] + scan_ids)
    conn.commit()
    conn.close()