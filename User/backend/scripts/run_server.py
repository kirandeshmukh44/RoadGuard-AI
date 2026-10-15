import subprocess
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
subprocess.run([sys.executable, "main.py"], cwd=BACKEND_DIR, check=False)
