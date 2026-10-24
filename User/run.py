"""
╔══════════════════════════════════════════════════════════════╗
║          RoadGuard AI - User Module Auto Setup               ║
║                                                              ║
║  Just run:  python run.py                                    ║
║  That's it! Everything will be set up automatically.         ║
╚══════════════════════════════════════════════════════════════╝

This script will automatically:
  1. Check Python & Node.js are installed
  2. Create Python virtual environment (if not exists)
  3. Install all Python packages (if not installed)
  4. Install Node.js packages (if not installed)
  5. Start Backend server  →  http://localhost:8005
  6. Start Frontend server →  http://localhost:5173
  7. Open the app in your browser automatically
"""

import subprocess
import sys
import os
import time
import shutil
import platform

# ─── Paths ────────────────────────────────────────────────────────────────────
ROOT_DIR     = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR  = os.path.join(ROOT_DIR, "backend")
FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")
VENV_DIR     = os.path.join(BACKEND_DIR, "venv")
REQ_FILE     = os.path.join(BACKEND_DIR, "requirements.txt")

IS_WIN = platform.system() == "Windows"
VENV_PYTHON  = os.path.join(VENV_DIR, "Scripts", "python.exe") if IS_WIN else os.path.join(VENV_DIR, "bin", "python")
VENV_PIP     = os.path.join(VENV_DIR, "Scripts", "pip.exe")    if IS_WIN else os.path.join(VENV_DIR, "bin", "pip")

BACKEND_URL  = "http://localhost:8005"
FRONTEND_URL = "http://localhost:5173"
BACKEND_PORT = "8005"

# ─── Helpers ──────────────────────────────────────────────────────────────────
def banner(msg):
    print(f"\n{'═'*60}")
    print(f"  {msg}")
    print(f"{'═'*60}")

def step(msg):
    print(f"\n▶  {msg}")

def ok(msg):
    print(f"   ✔  {msg}")

def warn(msg):
    print(f"   ⚠  {msg}")

def err(msg):
    print(f"   ✘  {msg}")

def run(cmd, cwd=None, check=True, capture=False):
    """Run a command and return result."""
    kwargs = dict(cwd=cwd or ROOT_DIR, shell=IS_WIN)
    if capture:
        kwargs["stdout"] = subprocess.PIPE
        kwargs["stderr"] = subprocess.PIPE
    result = subprocess.run(cmd, **kwargs)
    if check and result.returncode != 0:
        raise RuntimeError(f"Command failed: {' '.join(cmd) if isinstance(cmd, list) else cmd}")
    return result

# ─── Checks ───────────────────────────────────────────────────────────────────
def check_python():
    step("Checking Python version...")
    ver = sys.version_info
    if ver.major < 3 or (ver.major == 3 and ver.minor < 8):
        err(f"Python 3.8+ required. You have {ver.major}.{ver.minor}")
        sys.exit(1)
    ok(f"Python {ver.major}.{ver.minor}.{ver.micro} found")

def check_node():
    step("Checking Node.js...")
    if shutil.which("node") is None:
        err("Node.js not found! Please install from https://nodejs.org")
        print("\n   Download and install Node.js LTS, then run this script again.")
        input("\nPress Enter to exit...")
        sys.exit(1)
    result = run(["node", "--version"], capture=True, check=False)
    version = result.stdout.decode().strip() if result.stdout else "unknown"
    ok(f"Node.js {version} found")

    if shutil.which("npm") is None:
        err("npm not found! Please reinstall Node.js")
        sys.exit(1)
    ok("npm found")

# ─── Setup ────────────────────────────────────────────────────────────────────
def setup_venv():
    step("Setting up Python virtual environment...")
    if os.path.isfile(VENV_PYTHON):
        ok("Virtual environment already exists — skipping")
        return
    print("   Creating venv (this takes ~30 seconds)...")
    run([sys.executable, "-m", "venv", VENV_DIR], cwd=BACKEND_DIR)
    ok("Virtual environment created")

def install_python_packages():
    step("Installing Python packages...")
    # Check if already installed by testing a key package
    result = run([VENV_PYTHON, "-c", "import fastapi, ultralytics"], capture=True, check=False)
    if result.returncode == 0:
        ok("Python packages already installed — skipping")
        return
    print("   Installing packages from requirements.txt...")
    print("   (This may take 5-15 minutes on first run — please wait)")
    print()
    # Upgrade pip first
    run([VENV_PIP, "install", "--upgrade", "pip", "-q"])
    # Install requirements
    run([VENV_PIP, "install", "-r", REQ_FILE, "-q"])
    ok("Python packages installed successfully")

def install_node_packages():
    step("Installing Node.js packages for frontend...")
    node_modules = os.path.join(FRONTEND_DIR, "node_modules")
    if os.path.isdir(node_modules) and os.path.isdir(os.path.join(node_modules, "react")):
        ok("Node packages already installed — skipping")
        return
    print("   Running npm install (this takes ~2-3 minutes on first run)...")
    run(["npm", "install"], cwd=FRONTEND_DIR)
    ok("Node packages installed successfully")

def create_required_directories():
    """Make sure upload/report/model directories exist."""
    for folder in ["uploads", "reports"]:
        path = os.path.join(BACKEND_DIR, folder)
        os.makedirs(path, exist_ok=True)

def check_ai_model():
    """Check if AI model file exists. Warn if not found."""
    model_path = os.path.join(BACKEND_DIR, "models", "pothole_detection.pt")
    if not os.path.isfile(model_path):
        warn("AI model file not found: models/pothole_detection.pt")
        warn("Detection will not work without it.")
        warn("Ask your team for the model file or run download_model.py")
    else:
        ok("AI model found")

# ─── Launch Servers ───────────────────────────────────────────────────────────
def open_browser():
    """Open browser after a short delay."""
    time.sleep(5)
    url = FRONTEND_URL
    if IS_WIN:
        os.startfile(url)
    elif platform.system() == "Darwin":
        subprocess.Popen(["open", url])
    else:
        subprocess.Popen(["xdg-open", url])

def start_servers():
    step("Starting servers...")

    env = os.environ.copy()
    env["API_PORT"] = BACKEND_PORT

    # Start Backend
    print(f"   Starting Backend on port {BACKEND_PORT}...")
    backend_process = subprocess.Popen(
        [VENV_PYTHON, "main.py"],
        cwd=BACKEND_DIR,
        env=env,
    )
    ok(f"Backend started (PID: {backend_process.pid})")

    # Give backend a moment to start
    time.sleep(2)

    # Start Frontend
    print("   Starting Frontend on port 5173...")
    frontend_process = subprocess.Popen(
        ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"],
        cwd=FRONTEND_DIR,
        shell=IS_WIN,
        env=env,
    )
    ok(f"Frontend started (PID: {frontend_process.pid})")

    return backend_process, frontend_process

# ─── Main ─────────────────────────────────────────────────────────────────────
def main():
    banner("RoadGuard AI — User Module Setup & Start")
    print(f"\n  Project: {ROOT_DIR}")
    print("  This script will auto-install everything needed.\n")

    # 1. Check prerequisites
    check_python()
    check_node()

    # 2. Setup
    setup_venv()
    install_python_packages()
    install_node_packages()
    create_required_directories()
    check_ai_model()

    # 3. Launch
    banner("Starting RoadGuard AI — User Module")
    backend_process, frontend_process = start_servers()

    print()
    print("  ┌─────────────────────────────────────────────┐")
    print("  │  ✔  RoadGuard AI is running!                │")
    print("  │                                             │")
    print(f"  │  User App  →  {FRONTEND_URL}         │")
    print(f"  │  API Docs  →  {BACKEND_URL}/docs     │")
    print("  │                                             │")
    print("  │  Press Ctrl+C to stop all servers           │")
    print("  └─────────────────────────────────────────────┘")

    # Open browser
    import threading
    threading.Thread(target=open_browser, daemon=True).start()

    # Keep running until user stops
    try:
        while True:
            # Check if either process died unexpectedly
            if backend_process.poll() is not None:
                err("Backend stopped unexpectedly!")
                frontend_process.terminate()
                break
            if frontend_process.poll() is not None:
                err("Frontend stopped unexpectedly!")
                backend_process.terminate()
                break
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\n  Stopping servers...")

    finally:
        for name, proc in [("Frontend", frontend_process), ("Backend", backend_process)]:
            if proc.poll() is None:
                proc.terminate()
                try:
                    proc.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    proc.kill()
                print(f"  ✔  {name} stopped")

    print("\n  Goodbye!\n")

if __name__ == "__main__":
    main()
