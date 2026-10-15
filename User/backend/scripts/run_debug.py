import sys
import os
from pathlib import Path

# Redirect stdout and stderr to a log file
backend_dir = Path(__file__).resolve().parents[1]
log_file = open(backend_dir / "server_debug.log", "w", encoding="utf-8")
sys.stdout = log_file
sys.stderr = log_file

# Now run the main app
import uvicorn
sys.path.insert(0, str(backend_dir))
from app.config import API_PORT
from app.main import app

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=API_PORT, log_level="debug")
