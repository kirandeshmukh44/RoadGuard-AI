import sqlite3
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[2]

for db_file in ['pothole_detection.db', 'road_monitoring.db']:
    db_path = BACKEND_DIR / db_file
    if not db_path.exists():
        continue
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    print(db_file + ':', tables)
    conn.close()
