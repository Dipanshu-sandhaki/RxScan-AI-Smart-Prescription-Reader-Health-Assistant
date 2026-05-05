import sqlite3

c = sqlite3.connect('auth.db')

print("Tables in database:")
for t in c.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall():
    print(f"  - {t[0]}")

print("\nUsers:")
for row in c.execute("SELECT id, name, email, created_at FROM users").fetchall():
    print(f"  ID: {row[0]}, Name: {row[1]}, Email: {row[2]}, Created: {row[3]}")
