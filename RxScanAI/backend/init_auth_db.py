"""
Initialize Authentication Database
Run this to create the users table
"""

import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from db.auth_db import init_db

if __name__ == "__main__":
    print("Initializing authentication database...")
    init_db()
    print("✅ Database initialized successfully!")
    
    # Verify table exists
    import sqlite3
    from db.auth_db import DB_PATH
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    
    print(f"Tables in database: {[t[0] for t in tables]}")
    
    if 'users' in [t[0] for t in tables]:
        print("✅ Users table created successfully!")
    else:
        print("❌ Users table not found!")
    
    conn.close()
