@echo off
echo Starting User Module - Backend and Frontend...
echo.
echo Starting Backend...
start "User Backend" cmd /k "cd backend && venv\Scripts\python.exe main.py"
timeout /t 3 /nobreak > nul
echo.
echo Starting Frontend...
start "User Frontend" cmd /k "cd frontend && npm run dev"
echo.
echo User Module Started!
echo Backend: http://localhost:8005
echo Frontend: http://localhost:5173
pause
