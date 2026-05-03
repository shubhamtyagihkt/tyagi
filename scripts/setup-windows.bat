@echo off
REM Windows Setup Script - Registers Tyagi as startup task
REM Run as Administrator: Right-click cmd.exe → Run as administrator → cd to this folder → setup-windows.bat

setlocal enabledelayedexpansion

echo.
echo ==============================================================
echo        Tyagi Windows Startup Setup
echo ==============================================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] This script must be run as Administrator
    echo Please right-click cmd.exe and select "Run as administrator"
    pause
    exit /b 1
)

REM Get the full path of the project directory
for %%I in (.) do set PROJECT_ROOT=%%~dpnI
set SCRIPT_PATH=%cd%\run.bat

echo [INFO] Project root: %PROJECT_ROOT%
echo [INFO] Script path: %SCRIPT_PATH%
echo.

REM Check prerequisites
where go >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Go is not installed. Please install Go from https://golang.org/dl/
    pause
    exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [SUCCESS] Prerequisites found
echo.
echo Choose how to set up startup:
echo.
echo 1. Create scheduled task (recommended)
echo 2. Add to startup folder
echo 3. Add VBS script to startup folder (silent mode)
echo 4. Cancel
echo.

set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" (
    call :setup_scheduled_task
) else if "%choice%"=="2" (
    call :setup_startup_folder
) else if "%choice%"=="3" (
    call :setup_vbs_startup
) else if "%choice%"=="4" (
    echo Cancelled
    exit /b 0
) else (
    echo Invalid choice
    exit /b 1
)

exit /b 0

:setup_scheduled_task
echo.
echo [INFO] Creating scheduled task...
echo.

REM Delete existing task if it exists
schtasks /delete "Tyagi Application" /f >nul 2>&1

REM Create new task
schtasks /create /tn "Tyagi Application" /tr "cmd /c %SCRIPT_PATH%" /sc onstart /rl highest /f

if errorlevel 1 (
    echo [ERROR] Failed to create scheduled task
    pause
    exit /b 1
)

echo [SUCCESS] Scheduled task created!
echo.
echo Task Details:
echo   Name: Tyagi Application
echo   Trigger: At system startup
echo   Action: Run %SCRIPT_PATH%
echo.
echo The application will start automatically on next system restart.
echo.
pause
exit /b 0

:setup_startup_folder
echo.
echo [INFO] Setting up startup folder...
echo.

set STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set SHORTCUT_PATH=%STARTUP_FOLDER%\Tyagi.lnk

REM Create shortcut using PowerShell
powershell -NoProfile -Command "^
  $WshShell = New-Object -ComObject WScript.Shell; ^
  $Shortcut = $WshShell.CreateShortcut('%SHORTCUT_PATH%'); ^
  $Shortcut.TargetPath = 'cmd.exe'; ^
  $Shortcut.Arguments = '/c %SCRIPT_PATH%'; ^
  $Shortcut.WorkingDirectory = '%cd%'; ^
  $Shortcut.Description = 'Tyagi Application Startup'; ^
  $Shortcut.Save()
"

if errorlevel 1 (
    echo [ERROR] Failed to create shortcut
    pause
    exit /b 1
)

echo [SUCCESS] Shortcut created at:
echo   %STARTUP_FOLDER%\Tyagi.lnk
echo.
echo The application will start when you next log in.
echo.
pause
exit /b 0

:setup_vbs_startup
echo.
echo [INFO] Setting up VBS startup script...
echo.

set STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set VBS_PATH=%STARTUP_FOLDER%\tyagi-startup.vbs

REM Copy VBS script to startup folder
if exist "%cd%\tyagi-startup.vbs" (
    copy "%cd%\tyagi-startup.vbs" "%VBS_PATH%"
    if errorlevel 1 (
        echo [ERROR] Failed to copy VBS script
        pause
        exit /b 1
    )
    
    echo [SUCCESS] VBS script copied to startup folder
    echo   %VBS_PATH%
    echo.
    echo The application will start silently (no windows) on next system restart.
    echo.
) else (
    echo [ERROR] tyagi-startup.vbs not found in current directory
    pause
    exit /b 1
)

pause
exit /b 0
