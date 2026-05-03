#!/bin/bash

# Cross-platform stop script for the Tyagi application
# Works on Linux, macOS, and WSL

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_debug() {
    echo -e "${BLUE}[DEBUG]${NC} $1"
}

# Function to check if process is running
is_running() {
    pgrep -f "$1" > /dev/null 2>&1
    return $?
}

# Function to kill processes by pattern
kill_processes() {
    local pattern="$1"
    local process_name="$2"
    local killed_count=0

    log_debug "Looking for processes matching: $pattern"

    # Get PIDs matching the pattern
    local pids=$(pgrep -f "$pattern" 2>/dev/null || true)

    if [ -z "$pids" ]; then
        log_debug "No $process_name processes found"
        return 0
    fi

    log_info "Found $process_name processes: $pids"

    # Kill each process
    for pid in $pids; do
        if kill -TERM "$pid" 2>/dev/null; then
            log_info "Sent SIGTERM to $process_name process (PID: $pid)"
            killed_count=$((killed_count + 1))
        else
            log_warn "Failed to send SIGTERM to $process_name process (PID: $pid)"
        fi
    done

    # Wait a moment for graceful shutdown
    sleep 2

    # Force kill any remaining processes
    local remaining_pids=$(pgrep -f "$pattern" 2>/dev/null || true)
    if [ -n "$remaining_pids" ]; then
        log_warn "Force killing remaining $process_name processes: $remaining_pids"
        for pid in $remaining_pids; do
            if kill -KILL "$pid" 2>/dev/null; then
                log_info "Force killed $process_name process (PID: $pid)"
            fi
        done
    fi

    return $killed_count
}

# Function to check if port is in use
check_port() {
    local port="$1"
    local service="$2"

    if lsof -i :"$port" >/dev/null 2>&1; then
        log_warn "Port $port ($service) is still in use"
        return 1
    else
        log_info "Port $port ($service) is free"
        return 0
    fi
}

log_info "Stopping Tyagi application..."
log_info "Project root: $PROJECT_ROOT"

# Stop backend processes
log_info "Stopping backend processes..."
backend_killed=0

# Try to kill "go run main.go" processes (development)
kill_processes "go run main.go" "backend" && backend_killed=$?

# Also try to kill compiled Go binaries (both development and production)
kill_processes "go-build.*main" "backend (compiled)" && backend_killed=$((backend_killed + $?))

# Try to kill the main binary directly if it's running from bin/
if [ -f "$PROJECT_ROOT/bin/backend" ]; then
    kill_processes "bin/backend" "backend binary" && backend_killed=$((backend_killed + $?))
fi

# Stop frontend processes
log_info "Stopping frontend processes..."
frontend_killed=0
kill_processes "npm run dev" "frontend" && frontend_killed=$?

# Also try to kill vite processes directly
kill_processes "vite" "vite" || true

# Check ports
log_info "Checking ports..."
check_port 8080 "backend"
check_port 5174 "frontend"

# Summary
total_killed=$((backend_killed + frontend_killed))

if [ $total_killed -gt 0 ]; then
    log_info "Successfully stopped $total_killed process(es)"
    echo ""
    echo "=============================================================="
    echo "✅ Tyagi application stopped successfully"
    echo "=============================================================="
else
    log_warn "No Tyagi processes were found running"
fi

# Final check for any remaining processes
remaining=$(pgrep -f "go run main.go\|go-build.*main\|bin/backend\|npm run dev\|vite" 2>/dev/null || true)
if [ -n "$remaining" ]; then
    log_warn "Some processes may still be running: $remaining"
    log_info "You may need to manually kill these processes or wait a moment"
else
    log_info "All Tyagi processes have been stopped"
fi