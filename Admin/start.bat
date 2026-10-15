@echo off
echo Starting Admin Module - Backend and Frontend...
echo.
echo Starting Backend...
start "Admin Backend" cmd /k "cd backend && venv\Scripts\python.exe main.py"
timeout /t 3 /nobreak > nul
echo.
echo Starting Frontend...
start "Admin Frontend" cmd /k "cd frontend && npm run dev"
echo.
echo Admin Module Started!
echo Backend: http://localhost:8006
echo Frontend: http://localhost:5175
pause
