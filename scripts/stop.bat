@echo off
REM Windows stop script for Tyagi application
REM Stops both backend and frontend processes

setlocal enabledelayedexpansion

echo.
echo ==============================================================
echo        Stopping Tyagi Application (Windows)
echo ==============================================================
echo.

set BACKEND_STOPPED=0
set FRONTEND_STOPPED=0

REM Function to check if process is running
:check_process
set PROCESS_NAME=%~1
set PROCESS_DESC=%~2
tasklist /FI "IMAGENAME eq %PROCESS_NAME%" /NH 2>nul | find /I "%PROCESS_NAME%" >nul
if %errorlevel% equ 0 (
    echo [INFO] %PROCESS_DESC% process is running
    goto :eof
) else (
    echo [DEBUG] No %PROCESS_DESC% processes found
    goto :eof
)

REM Function to kill processes by name
:kill_process
set PROCESS_NAME=%~1
set PROCESS_DESC=%~2
set /a STOPPED_COUNT=0

echo [INFO] Stopping %PROCESS_DESC% processes (%PROCESS_NAME%)...

REM Try graceful termination first
for /f "tokens=2" %%i in ('tasklist /FI "IMAGENAME eq %PROCESS_NAME%" /NH ^| find /I "%PROCESS_NAME%"') do (
    echo [INFO] Sending SIGTERM to %PROCESS_DESC% process (PID: %%i)
    taskkill /PID %%i /T >nul 2>&1
    if !errorlevel! equ 0 (
        echo [SUCCESS] Successfully stopped %PROCESS_DESC% process (PID: %%i)
        set /a STOPPED_COUNT+=1
    ) else (
        echo [WARN] Failed to stop %PROCESS_DESC% process (PID: %%i)
    )
)

REM Wait a moment
timeout /t 2 /nobreak >nul

REM Force kill any remaining processes
for /f "tokens=2" %%i in ('tasklist /FI "IMAGENAME eq %PROCESS_NAME%" /NH ^| find /I "%PROCESS_NAME%"') do (
    echo [WARN] Force killing remaining %PROCESS_DESC% process (PID: %%i)
    taskkill /PID %%i /F >nul 2>&1
    if !errorlevel! equ 0 (
        echo [SUCCESS] Force killed %PROCESS_DESC% process (PID: %%i)
    )
)

goto :eof

REM Stop Go backend processes
call :kill_process go.exe "backend"
set BACKEND_STOPPED=%STOPPED_COUNT%

REM Also try to stop compiled Go binaries
for /f "tokens=2" %%i in ('tasklist /FI "IMAGENAME eq main.exe" /NH ^| find /I "main.exe"') do (
    echo [INFO] Found compiled Go binary process (PID: %%i)
    taskkill /PID %%i /T >nul 2>&1
    if !errorlevel! equ 0 (
        echo [SUCCESS] Successfully stopped compiled Go binary process (PID: %%i)
        set /a BACKEND_STOPPED+=1
    ) else (
        echo [WARN] Failed to stop compiled Go binary process (PID: %%i)
    )
)

REM Stop Node.js frontend processes
call :kill_process node.exe "frontend"
set FRONTEND_STOPPED=%STOPPED_COUNT%

REM Also try to kill npm processes
call :kill_process npm.cmd "npm"
call :kill_process cmd.exe "command prompt"

REM Check ports
echo.
echo [INFO] Checking ports...
netstat -ano | findstr :8080 >nul 2>&1
if %errorlevel% equ 0 (
    echo [WARN] Port 8080 (backend) is still in use
) else (
    echo [SUCCESS] Port 8080 (backend) is free
)

netstat -ano | findstr :5174 >nul 2>&1
if %errorlevel% equ 0 (
    echo [WARN] Port 5174 (frontend) is still in use
) else (
    echo [SUCCESS] Port 5174 (frontend) is free
)

REM Summary
set /a TOTAL_STOPPED=%BACKEND_STOPPED% + %FRONTEND_STOPPED%

echo.
echo ==============================================================
if %TOTAL_STOPPED% gtr 0 (
    echo [SUCCESS] Successfully stopped %TOTAL_STOPPED% process(es)
) else (
    echo [WARN] No Tyagi processes were found running
)
echo ==============================================================
echo.

REM Final check
tasklist /FI "IMAGENAME eq go.exe" /FI "STATUS eq running" /NH | find /I "go.exe" >nul 2>&1
if %errorlevel% equ 0 (
    echo [WARN] Some Go processes may still be running
)

tasklist /FI "IMAGENAME eq node.exe" /FI "STATUS eq running" /NH | find /I "node.exe" >nul 2>&1
if %errorlevel% equ 0 (
    echo [WARN] Some Node.js processes may still be running
)

if %TOTAL_STOPPED% gtr 0 (
    echo [INFO] All Tyagi processes have been stopped
)

pause