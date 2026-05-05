"""
Monitor Database - Quick User Check
Run this to see all users in the database
"""

import sqlite3
from datetime import datetime

def monitor_database():
    conn = sqlite3.connect('auth.db')
    cursor = conn.cursor()
    
    print("=" * 60)
    print("🔍 RXSCAN AI DATABASE MONITOR")
    print("=" * 60)
    print(f"📅 Checked at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Get all users
    cursor.execute("SELECT id, name, email, created_at FROM users ORDER BY created_at DESC")
    users = cursor.fetchall()
    
    if not users:
        print("❌ No users found in database")
        return
    
    print(f"👥 Total Users: {len(users)}")
    print("-" * 60)
    
    for i, (user_id, name, email, created_at) in enumerate(users, 1):
        print(f"👤 User #{i}")
        print(f"   Name: {name}")
        print(f"   Email: {email}")
        print(f"   ID: {user_id}")
        print(f"   Created: {created_at}")
        print()
    
    print("=" * 60)
    print("✅ Database check completed")
    print("💡 Tip: Run this script after signup to verify user creation")
    print("=" * 60)
    
    conn.close()

if __name__ == "__main__":
    monitor_database()
