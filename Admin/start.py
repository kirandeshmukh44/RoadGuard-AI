import subprocess
import sys
import os
import time

def start_admin_module():
    print("Starting Admin Module - Backend and Frontend...")
    print()
    
    # Start both services through the package scripts so they share the
    # Admin backend virtual environment and matching frontend port/proxy.
    frontend_process = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend"),
        shell=True
    )
    print(f"Admin services started with PID: {frontend_process.pid}")
    
    print()
    print("Admin Module Started!")
    print("Backend: http://127.0.0.1:8006")
    print("Frontend: http://127.0.0.1:5175")
    print()
    print("Press Ctrl+C to stop both services")
    
    try:
        frontend_process.wait()
    except KeyboardInterrupt:
        print("\nStopping services...")
        frontend_process.terminate()
        print("Services stopped.")

if __name__ == "__main__":
    start_admin_module()
