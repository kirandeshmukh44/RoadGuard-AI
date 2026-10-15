@echo off
echo ========================================================
echo   AI Pothole Detection - Starting Dedicated Admin Module
echo ========================================================

echo 1. Launching Admin Backend (Python / FastAPI on port 8006)...
start "Admin-Backend-8006" cmd /k "cd backend && python main.py"

echo 2. Launching Admin Frontend (React / Vite on port 5174)...
start "Admin-Frontend-5174" cmd /k "cd frontend && npm run dev"

echo.
echo Admin Portal will be available at: http://localhost:5174
echo Admin API will be available at: http://localhost:8006/docs
echo ========================================================
pause
