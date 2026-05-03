@echo off
REM Cross-platform startup script for Windows
REM Starts both backend and frontend servers

setlocal enabledelayedexpansion

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR%..

REM Colors (using echo with color codes for Windows 10+)
echo.
echo ==============================================================
echo        Starting Tyagi Application (Windows)
echo ==============================================================
echo.

REM Check if Go is installed
where go >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Go is not installed. Please install Go from https://golang.org/dl/
    pause
    exit /b 1
)

REM Check if Node.js is installed
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Install Go dependencies if needed
if not exist "%PROJECT_ROOT%\backend\vendor" (
    echo [INFO] Downloading Go dependencies...
    cd /d "%PROJECT_ROOT%\backend"
    call go mod download
    if errorlevel 1 (
        echo [ERROR] Failed to download Go dependencies
        pause
        exit /b 1
    )
)

REM Install Node dependencies if needed
if not exist "%PROJECT_ROOT%\frontend\node_modules" (
    echo [INFO] Installing Node.js dependencies...
    cd /d "%PROJECT_ROOT%\frontend"
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install Node.js dependencies
        pause
        exit /b 1
    )
)

REM Create a temporary batch file to run backend and frontend in separate windows
set TEMP_BATCH=%TEMP%\tyagi_run.bat
(
    echo @echo off
    echo title Backend Server - Tyagi
    echo cd /d "%PROJECT_ROOT%\backend"
    echo echo [INFO] Starting backend server on port 8080...
    echo go run main.go
    echo pause
) > "%TEMP_BATCH%"

REM Start backend in a new window
echo [INFO] Starting backend server...
start "Backend - Tyagi" cmd /k "%TEMP_BATCH%"

REM Wait a moment for backend to start
timeout /t 3 /nobreak

REM Start frontend in a new window
echo [INFO] Starting frontend development server...
cd /d "%PROJECT_ROOT%\frontend"
start "Frontend - Tyagi" cmd /k "npm run dev & pause"

echo.
echo ==============================================================
echo [SUCCESS] Services started in separate windows
echo.
echo Backend:  http://localhost:8080
echo Frontend: http://localhost:5174
echo.
echo Close the windows to stop the services
echo ==============================================================
echo.

REM Clean up temp file
timeout /t 2 /nobreak
if exist "%TEMP_BATCH%" del "%TEMP_BATCH%"

pause
