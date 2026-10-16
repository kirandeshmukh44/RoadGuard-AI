@echo off
echo ========================================================
echo   AI Pothole Detection - Starting Dedicated Admin Module
echo ========================================================

echo 1. Launching Admin Frontend and Backend with the project virtual environment...

cd /d "%~dp0"
npm run dev

echo.
echo Admin Portal will be available at: http://127.0.0.1:5175
echo Admin API will be available at: http://localhost:8006/docs
echo ========================================================
pause
