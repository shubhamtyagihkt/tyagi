# Cross-platform startup script for Windows (PowerShell)
# Run with: powershell -ExecutionPolicy Bypass -File run.ps1

param(
    [switch]$Background = $false,
    [switch]$Cleanup = $false
)

# Color functions
function Write-Info {
    Write-Host "[INFO]" -ForegroundColor Green -NoNewline
    Write-Host " $args"
}

function Write-Error-Custom {
    Write-Host "[ERROR]" -ForegroundColor Red -NoNewline
    Write-Host " $args"
}

function Write-Warn {
    Write-Host "[WARN]" -ForegroundColor Yellow -NoNewline
    Write-Host " $args"
}

# Get script and project root
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

Write-Host ""
Write-Host "=============================================================="
Write-Host "        Starting Tyagi Application (PowerShell)" -ForegroundColor Cyan
Write-Host "=============================================================="
Write-Host ""

# Check if Go is installed
$GoInstalled = $null -ne (Get-Command go -ErrorAction SilentlyContinue)
if (-not $GoInstalled) {
    Write-Error-Custom "Go is not installed. Please install Go from https://golang.org/dl/"
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if Node.js is installed
$NodeInstalled = $null -ne (Get-Command node -ErrorAction SilentlyContinue)
if (-not $NodeInstalled) {
    Write-Error-Custom "Node.js is not installed. Please install Node.js from https://nodejs.org/"
    Read-Host "Press Enter to exit"
    exit 1
}

# Download Go dependencies
Write-Info "Checking Go dependencies..."
Push-Location "$ProjectRoot\backend"
& go mod download 2>$null
Pop-Location

# Install Node dependencies
if (-not (Test-Path "$ProjectRoot\frontend\node_modules")) {
    Write-Info "Installing Node.js dependencies..."
    Push-Location "$ProjectRoot\frontend"
    & npm install
    Pop-Location
}

Write-Info "Starting backend server..."
$BackendProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/k cd /d '$ProjectRoot\backend' && go run main.go" `
    -WindowStyle Normal -PassThru -NoNewWindow:$Background

Start-Sleep -Seconds 3

if ($BackendProcess.HasExited) {
    Write-Error-Custom "Backend failed to start"
    exit 1
}

Write-Info "Starting frontend development server..."
$FrontendProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/k cd /d '$ProjectRoot\frontend' && npm run dev" `
    -WindowStyle Normal -PassThru -NoNewWindow:$Background

Write-Host ""
Write-Host "=============================================================="
Write-Host "[SUCCESS] Services started successfully" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:8080"
Write-Host "Frontend: http://localhost:5174"
Write-Host ""
Write-Host "Process IDs:"
Write-Host "  Backend:  $($BackendProcess.Id)"
Write-Host "  Frontend: $($FrontendProcess.Id)"
Write-Host ""
Write-Host "To stop services, close the command windows or run:"
Write-Host "  Stop-Process -Id $($BackendProcess.Id)"
Write-Host "  Stop-Process -Id $($FrontendProcess.Id)"
Write-Host "=============================================================="
Write-Host ""

if (-not $Background) {
    Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow
    
    # Wait for processes
    $BackendProcess | Wait-Process
    $FrontendProcess | Wait-Process
}
