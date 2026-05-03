# Startup Scripts

This folder contains scripts to build and run the Tyagi application on different platforms.

## Quick Start

### On macOS/Linux/WSL
```bash
chmod +x run.sh
./run.sh
```

### On Windows (Command Prompt)
```cmd
scripts\run.bat
```

### On Windows (PowerShell)
```powershell
powershell -ExecutionPolicy Bypass -File scripts/run.ps1
```

### Using Makefile (All Platforms)
```bash
make dev          # Run with hot reload (backend & frontend)
make run-backend  # Run backend only
make run-frontend # Run frontend only
make build        # Build both backend and frontend
make install-deps # Install all dependencies
```

---

## Setup for Windows Startup

### Option 1: Using Task Scheduler (Recommended)

1. **Press `Win + R`** and type `taskschd.msc` to open Task Scheduler

2. **Click "Create Basic Task"** in the right panel

3. **Fill in the details:**
   - Name: `Tyagi Application`
   - Description: `Start Tyagi backend and frontend services`

4. **Set the trigger:**
   - Select "When the computer starts"
   - Click "Next"

5. **Set the action:**
   - Action: "Start a program"
   - Program/script: `C:\Windows\System32\cmd.exe`
   - Add arguments: `/c "C:\path\to\tyagi\scripts\run.bat"`
   - Start in: `C:\path\to\tyagi`
   - Click "Next"

6. **Finish the wizard**

7. **Edit the task (right-click → Properties):**
   - General tab: Check "Run whether user is logged in or not"
   - General tab: Check "Run with highest privileges" (if needed)
   - Conditions tab: Uncheck "Stop if computer switches to battery power"

### Option 2: Using Startup Folder

1. **Press `Win + R`** and type `shell:startup`

2. **Create a shortcut** to `scripts/run.bat` in this folder

3. **Edit the shortcut properties:**
   - Target: `cmd.exe /c "C:\path\to\tyagi\scripts\run.bat"`
   - Start in: `C:\path\to\tyagi`
   - Advanced → Check "Run as administrator"

### Option 3: Using Registry (Advanced Users)

1. **Press `Win + R`** and type `regedit`

2. **Navigate to:** `HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Run`

3. **Create a new String Value:**
   - Name: `Tyagi`
   - Value: `C:\Windows\System32\cmd.exe /c "C:\path\to\tyagi\scripts\run.bat"`

### Option 4: Using PowerShell Scheduled Task (Advanced)

```powershell
$action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument '/c "C:\path\to\tyagi\scripts\run.bat"' -WorkingDirectory "C:\path\to\tyagi"
$trigger = New-ScheduledTaskTrigger -AtStartup
Register-ScheduledTask -TaskName "Tyagi Application" -Action $action -Trigger $trigger -RunLevel Highest
```

---

## Prerequisites

### Required Software
- **Go 1.25+** - Download from https://golang.org/dl/
- **Node.js 18+** - Download from https://nodejs.org/
- **Git** - Download from https://git-scm.com/

### Installation Steps

1. **Install Go:**
   - Download the installer
   - Run it and follow the setup wizard
   - Verify: Open cmd and type `go version`

2. **Install Node.js:**
   - Download the LTS version
   - Run the installer
   - Verify: Open cmd and type `node --version` and `npm --version`

3. **Clone/Setup Project:**
   ```bash
   cd your\path\to\tyagi
   git init
   git remote add origin <repository-url>
   git pull origin main
   ```

---

## Troubleshooting

### Backend won't start
- Check if port 8080 is already in use: `netstat -ano | findstr :8080` (Windows)
- Kill process: `taskkill /PID <PID> /F`
- Check Go installation: `go version`

### Frontend won't start
- Check if port 5174 is in use
- Delete `node_modules` folder and run `npm install` again
- Clear npm cache: `npm cache clean --force`

### Task Scheduler task fails silently
- Check Windows Event Viewer for error details
- Run the script manually to see the error messages
- Ensure the path to the script is correct (use full path)
- Check file permissions on the script

### PowerShell execution policy error
Run this command first:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## Environment Variables

Optional environment variables you can set:

```bash
# Backend
export PORT=8080                    # Backend server port
export GIN_MODE=release             # Go/Gin mode (debug or release)

# Frontend
export VITE_API_BASE_URL=http://localhost:8080/api  # Backend API URL
```

---

## Script Details

### run.sh (macOS/Linux/WSL)
- Automatically detects and uses bash/sh
- Handles process cleanup on exit (Ctrl+C)
- Colored output for better readability
- Checks for Go and Node.js installation
- Downloads dependencies automatically

### run.bat (Windows Command Prompt)
- Opens backend and frontend in separate windows
- Checks for prerequisites
- Automatic dependency installation
- Returns error codes for troubleshooting

### run.ps1 (Windows PowerShell)
- More modern PowerShell implementation
- Background execution support
- Process ID tracking
- Colored output

### Makefile (Cross-platform)
- Standard Make targets for building and running
- Works on Windows with `make` or `nmake` installed
- Supports both development and production builds

---

## Stopping the Services

### On macOS/Linux/WSL
- Press `Ctrl+C` in the terminal running `run.sh`

### On Windows
- Close the cmd/PowerShell windows
- Or use: `taskkill /F /IM go.exe` and `taskkill /F /IM node.exe`

---

## Notes

- First run will take longer due to dependency installation
- Keep both backend and frontend running together
- Backend listens on `http://localhost:8080`
- Frontend is accessible on `http://localhost:5174`
- Check the console output for any errors or warnings
