import subprocess
import os
import time

def start_user_module():
    print("Starting User Module - Backend and Frontend...")
    print()
    
    # Start Backend
    print("Starting Backend...")
    backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
    python = os.path.join(backend_dir, "venv", "Scripts", "python.exe")
    if not os.path.isfile(python):
        python = "python"
    backend_process = subprocess.Popen([python, "main.py"], cwd=backend_dir)
    print(f"Backend started with PID: {backend_process.pid}")
    
    # Start Frontend
    print("Starting Frontend...")
    frontend_env = os.environ.copy()
    frontend_env["API_PORT"] = frontend_env.get("API_PORT", "8005")
    frontend_process = subprocess.Popen(
        ["npm", "run", "dev", "--", "--host", "127.0.0.1", "--port", "5173"],
        cwd=os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend"),
        env=frontend_env
    )
    print(f"Frontend started with PID: {frontend_process.pid}")
    
    print()
    print("User Module Started!")
    print("Backend: http://localhost:8005")
    print("Frontend: http://localhost:5173")
    print()
    print("Press Ctrl+C to stop both services")
    
    try:
        while backend_process.poll() is None and frontend_process.poll() is None:
            time.sleep(0.5)
    except KeyboardInterrupt:
        print("\nStopping services...")
    finally:
        for process in (frontend_process, backend_process):
            if process.poll() is None:
                process.terminate()
        for process in (frontend_process, backend_process):
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()

if __name__ == "__main__":
    start_user_module()
