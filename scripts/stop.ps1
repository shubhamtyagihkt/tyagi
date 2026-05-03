# PowerShell stop script for Tyagi application
# Stops both backend and frontend processes

param(
    [switch]$Force = $false,
    [switch]$Quiet = $false
)

# Color functions
function Write-Info {
    if (-not $Quiet) {
        Write-Host "[INFO]" -ForegroundColor Green -NoNewline
        Write-Host " $args"
    }
}

function Write-Error-Custom {
    Write-Host "[ERROR]" -ForegroundColor Red -NoNewline
    Write-Host " $args"
}

function Write-Warn {
    Write-Host "[WARN]" -ForegroundColor Yellow -NoNewline
    Write-Host " $args"
}

function Write-Success {
    Write-Host "[SUCCESS]" -ForegroundColor Green -NoNewline
    Write-Host " $args"
}

function Write-Debug {
    if (-not $Quiet) {
        Write-Host "[DEBUG]" -ForegroundColor Blue -NoNewline
        Write-Host " $args"
    }
}

# Function to get processes by command line
function Get-ProcessesByCommand {
    param([string]$Pattern)

    try {
        $processes = Get-WmiObject Win32_Process | Where-Object {
            $_.CommandLine -like "*$Pattern*"
        }
        return $processes
    } catch {
        Write-Error-Custom "Failed to query processes: $_"
        return $null
    }
}

# Function to kill processes
function Stop-Processes {
    param(
        [string]$Pattern,
        [string]$Description,
        [switch]$ForceKill = $false
    )

    Write-Info "Looking for $Description processes..."

    $processes = Get-ProcessesByCommand -Pattern $Pattern

    if (-not $processes -or $processes.Count -eq 0) {
        Write-Debug "No $Description processes found"
        return 0
    }

    Write-Info "Found $($processes.Count) $Description process(es)"

    $killedCount = 0

    foreach ($process in $processes) {
        try {
            Write-Info "Stopping $Description process (PID: $($process.ProcessId), Command: $($process.CommandLine))"

            if ($ForceKill) {
                $process.Terminate()
                Write-Success "Force killed $Description process (PID: $($process.ProcessId))"
            } else {
                # Try graceful stop first
                Stop-Process -Id $process.ProcessId -ErrorAction SilentlyContinue

                # Wait a moment
                Start-Sleep -Milliseconds 500

                # Check if still running
                $stillRunning = Get-Process -Id $process.ProcessId -ErrorAction SilentlyContinue
                if ($stillRunning) {
                    Write-Warn "$Description process still running, force killing..."
                    Stop-Process -Id $process.ProcessId -Force
                }
                Write-Success "Stopped $Description process (PID: $($process.ProcessId))"
            }

            $killedCount++
        } catch {
            Write-Error-Custom "Failed to stop $Description process (PID: $($process.ProcessId)): $_"
        }
    }

    return $killedCount
}

# Function to check if port is in use
function Test-Port {
    param([int]$Port, [string]$Description)

    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue
        if ($connection.TcpTestSucceeded) {
            Write-Warn "Port $Port ($Description) is still in use"
            return $true
        } else {
            Write-Success "Port $Port ($Description) is free"
            return $false
        }
    } catch {
        Write-Debug "Could not check port $Port ($Description): $_"
        return $false
    }
}

if (-not $Quiet) {
    Write-Host ""
    Write-Host "=============================================================="
    Write-Host "        Stopping Tyagi Application (PowerShell)" -ForegroundColor Red
    Write-Host "=============================================================="
    Write-Host ""
}

$backendStopped = 0
$frontendStopped = 0

# Stop backend processes
$backendStopped = Stop-Processes -Pattern "go run main.go" -Description "backend" -ForceKill:$Force

# Also try to stop compiled Go binaries
$backendStopped += Stop-Processes -Pattern "go-build.*main" -Description "backend (compiled)" -ForceKill:$Force

# Try to stop production binary
$backendStopped += Stop-Processes -Pattern "bin\\backend" -Description "backend binary" -ForceKill:$Force

# Stop frontend processes
$frontendStopped = Stop-Processes -Pattern "npm run dev" -Description "frontend" -ForceKill:$Force

# Also try to stop vite processes
Stop-Processes -Pattern "vite" -Description "vite" -ForceKill:$Force | Out-Null

# Check ports
if (-not $Quiet) {
    Write-Host ""
    Write-Info "Checking ports..."
}
Test-Port -Port 8080 -Description "backend" | Out-Null
Test-Port -Port 5174 -Description "frontend" | Out-Null

# Summary
$totalStopped = $backendStopped + $frontendStopped

if (-not $Quiet) {
    Write-Host ""
    Write-Host "=============================================================="
}

if ($totalStopped -gt 0) {
    Write-Success "Successfully stopped $totalStopped process(es)"
} else {
    Write-Warn "No Tyagi processes were found running"
}

if (-not $Quiet) {
    Write-Host "=============================================================="
    Write-Host ""
}

# Final check for any remaining processes
$remainingGo = Get-ProcessesByCommand -Pattern "go run main.go"
$remainingCompiled = Get-ProcessesByCommand -Pattern "go-build.*main"
$remainingBinary = Get-ProcessesByCommand -Pattern "bin\\backend"
$remainingNpm = Get-ProcessesByCommand -Pattern "npm run dev"
$remainingVite = Get-ProcessesByCommand -Pattern "vite"

if ($remainingGo -or $remainingCompiled -or $remainingBinary -or $remainingNpm -or $remainingVite) {
    Write-Warn "Some processes may still be running:"
    if ($remainingGo) { Write-Host "  - Backend (go run): $($remainingGo.ProcessId -join ', ')" }
    if ($remainingCompiled) { Write-Host "  - Backend (compiled): $($remainingCompiled.ProcessId -join ', ')" }
    if ($remainingBinary) { Write-Host "  - Backend (binary): $($remainingBinary.ProcessId -join ', ')" }
    if ($remainingNpm) { Write-Host "  - Frontend: $($remainingNpm.ProcessId -join ', ')" }
    if ($remainingVite) { Write-Host "  - Vite: $($remainingVite.ProcessId -join ', ')" }
    Write-Info "You may need to manually stop these processes"
} else {
    Write-Success "All Tyagi processes have been stopped"
}

if (-not $Quiet) {
    Write-Host ""
}