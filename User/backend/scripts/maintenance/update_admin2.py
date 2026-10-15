import sqlite3
from pathlib import Path

db_path = Path(__file__).resolve().parents[2] / 'road_monitoring.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute('SELECT id, username, role FROM users WHERE id = 1')
row = cursor.fetchone()
print('Before:', row)

cursor.execute("UPDATE users SET role = 'admin' WHERE id = 1")
conn.commit()

cursor.execute('SELECT id, username, role FROM users WHERE id = 1')
row = cursor.fetchone()
print('After:', row)

conn.close()
