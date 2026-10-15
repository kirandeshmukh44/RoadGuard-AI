import subprocess
import sys
import os
import time

def start_admin_module():
    print("Starting Admin Module - Backend and Frontend...")
    print()
    
    # Start Backend
    print("Starting Backend...")
    venv_python = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend", "venv", "Scripts", "python.exe")
    backend_process = subprocess.Popen(
        [venv_python, "main.py"],
        cwd=os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
    )
    print(f"Backend started with PID: {backend_process.pid}")
    
    # Wait for backend to initialize
    time.sleep(3)
    
    # Start Frontend
    print("Starting Frontend...")
    frontend_process = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend"),
        shell=True
    )
    print(f"Frontend started with PID: {frontend_process.pid}")
    
    print()
    print("Admin Module Started!")
    print("Backend: http://localhost:8006")
    print("Frontend: http://localhost:5175")
    print()
    print("Press Ctrl+C to stop both services")
    
    try:
        # Wait for both processes
        backend_process.wait()
        frontend_process.wait()
    except KeyboardInterrupt:
        print("\nStopping services...")
        backend_process.terminate()
        frontend_process.terminate()
        print("Services stopped.")

if __name__ == "__main__":
    start_admin_module()
