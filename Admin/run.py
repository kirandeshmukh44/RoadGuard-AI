"""
╔══════════════════════════════════════════════════════════════╗
║          RoadGuard AI - Admin Module Auto Setup              ║
║                                                              ║
║  Just run:  python run.py                                    ║
║  That's it! Everything will be set up automatically.         ║
╚══════════════════════════════════════════════════════════════╝

This script will automatically:
  1. Check Python & Node.js are installed
  2. Create Python virtual environment (if not exists)
  3. Install all Python packages (if not installed)
  4. Install Node.js packages (if not installed)
  5. Start Backend server  →  http://localhost:8006
  6. Start Frontend server →  http://localhost:5175
  7. Open the admin panel in your browser automatically

NOTE: User module (run.py in User/ folder) must also be running
      because Admin reads data from the User's database.
"""

import subprocess
import sys
import os
import time
import shutil
import platform
import sqlite3

# ─── Paths ────────────────────────────────────────────────────────────────────
ROOT_DIR      = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR   = os.path.join(ROOT_DIR, "backend")
FRONTEND_DIR  = os.path.join(ROOT_DIR, "frontend")
VENV_DIR      = os.path.join(BACKEND_DIR, "venv")
REQ_FILE      = os.path.join(BACKEND_DIR, "requirements.txt")

# User module backend (Admin reads from this database)
USER_BACKEND_DIR = os.path.join(os.path.dirname(ROOT_DIR), "User", "backend")
USER_DB_PATH     = os.path.join(USER_BACKEND_DIR, "road_monitoring.db")

IS_WIN = platform.system() == "Windows"
VENV_PYTHON  = os.path.join(VENV_DIR, "Scripts", "python.exe") if IS_WIN else os.path.join(VENV_DIR, "bin", "python")
VENV_PIP     = os.path.join(VENV_DIR, "Scripts", "pip.exe")    if IS_WIN else os.path.join(VENV_DIR, "bin", "pip")

BACKEND_URL  = "http://localhost:8006"
FRONTEND_URL = "http://localhost:5175"
BACKEND_PORT = "8006"

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
    result = run([VENV_PYTHON, "-c", "import fastapi, jose, bcrypt"], capture=True, check=False)
    if result.returncode == 0:
        ok("Python packages already installed — skipping")
        return
    print("   Installing packages from requirements.txt...")
    print("   (This may take 1-3 minutes on first run)")
    # Upgrade pip first
    run([VENV_PIP, "install", "--upgrade", "pip", "-q"])
    # Install requirements
    run([VENV_PIP, "install", "-r", REQ_FILE, "-q"])
    ok("Python packages installed successfully")

def install_node_packages():
    step("Installing Node.js packages for Admin frontend...")
    node_modules = os.path.join(FRONTEND_DIR, "node_modules")
    if os.path.isdir(node_modules) and os.path.isdir(os.path.join(node_modules, "react")):
        ok("Node packages already installed — skipping")
        return
    print("   Running npm install (this takes ~2-3 minutes on first run)...")
    run(["npm", "install"], cwd=FRONTEND_DIR)
    ok("Node packages installed successfully")

def ensure_database():
    """Make sure the shared database exists (even if User module not started yet)."""
    step("Checking shared database...")
    if os.path.isfile(USER_DB_PATH):
        ok(f"Database found: {USER_DB_PATH}")
    else:
        warn("User module database not found yet.")
        warn("Start User module first (cd User && python run.py)")
        warn("Admin will still start, but data will appear after User module runs.")

def create_admin_user():
    """Create default admin if database exists but no admin user."""
    if not os.path.isfile(USER_DB_PATH):
        return

    try:
        con = sqlite3.connect(USER_DB_PATH)
        cur = con.cursor()
        cur.execute("SELECT id FROM users WHERE role='admin' LIMIT 1")
        row = cur.fetchone()
        con.close()

        if row:
            ok("Admin user already exists in database")
        else:
            warn("No admin user found. Run 'python create_admin.py' in User/backend/ to create one.")
    except Exception:
        pass  # DB might not have tables yet

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

def start_backend():
    """Start the Admin FastAPI backend."""
    print(f"   Starting Admin Backend on port {BACKEND_PORT}...")
    env = os.environ.copy()
    env["ADMIN_API_PORT"] = BACKEND_PORT
    process = subprocess.Popen(
        [VENV_PYTHON, "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", BACKEND_PORT, "--reload"],
        cwd=BACKEND_DIR,
        env=env,
    )
    ok(f"Backend started (PID: {process.pid})")
    return process

def start_frontend():
    """Start the Admin Vite frontend."""
    print("   Starting Admin Frontend on port 5175...")
    env = os.environ.copy()
    env["ADMIN_API_PORT"] = BACKEND_PORT
    process = subprocess.Popen(
        ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5175"],
        cwd=FRONTEND_DIR,
        shell=IS_WIN,
        env=env,
    )
    ok(f"Frontend started (PID: {process.pid})")
    return process

# ─── Main ─────────────────────────────────────────────────────────────────────
def main():
    banner("RoadGuard AI — Admin Module Setup & Start")
    print(f"\n  Project: {ROOT_DIR}")
    print("  This script will auto-install everything needed.\n")

    # 1. Check prerequisites
    check_python()
    check_node()

    # 2. Setup
    setup_venv()
    install_python_packages()
    install_node_packages()
    ensure_database()
    create_admin_user()

    # 3. Launch
    banner("Starting RoadGuard AI — Admin Module")
    backend_process  = start_backend()
    time.sleep(2)
    frontend_process = start_frontend()

    print()
    print("  ┌─────────────────────────────────────────────┐")
    print("  │  ✔  RoadGuard AI Admin is running!          │")
    print("  │                                             │")
    print(f"  │  Admin Panel →  {FRONTEND_URL}         │")
    print(f"  │  API Docs    →  {BACKEND_URL}/docs     │")
    print("  │                                             │")
    print("  │  Default Login:                             │")
    print("  │    Username: admin                          │")
    print("  │    Password: admin123                       │")
    print("  │                                             │")
    print("  │  Press Ctrl+C to stop all servers           │")
    print("  └─────────────────────────────────────────────┘")

    # Open browser
    import threading
    threading.Thread(target=open_browser, daemon=True).start()

    # Keep running until user stops
    try:
        while True:
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
