#!/bin/bash

# Cross-platform startup script for the application
# Works on Linux, macOS, and WSL/Windows

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Function to check if process is running
is_running() {
    pgrep -f "$1" > /dev/null 2>&1
    return $?
}

# Function to kill processes
cleanup() {
    log_info "Shutting down services..."
    pkill -f "go run main.go" || true
    pkill -f "vite" || true
    wait
    log_info "Services stopped"
}

# Trap to cleanup on exit
trap cleanup EXIT INT TERM

# Ensure we're in the project root
cd "$PROJECT_ROOT"

log_info "Starting application..."
log_info "Project root: $PROJECT_ROOT"

# Check for Go
if ! command -v go &> /dev/null; then
    log_error "Go is not installed. Please install Go from https://golang.org/dl/"
    exit 1
fi

# Check for Node.js
if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed. Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Install dependencies if not already installed
if [ ! -d "backend/go.mod" ]; then
    log_info "Downloading Go dependencies..."
    cd "$PROJECT_ROOT/backend"
    go mod download
    cd "$PROJECT_ROOT"
fi

if [ ! -d "frontend/node_modules" ]; then
    log_info "Installing Node.js dependencies..."
    cd "$PROJECT_ROOT/frontend"
    npm install
    cd "$PROJECT_ROOT"
fi

# Start backend
log_info "Starting backend server..."
cd "$PROJECT_ROOT/backend"
go run main.go &
BACKEND_PID=$!
log_info "Backend PID: $BACKEND_PID"

# Wait a moment for backend to start
sleep 2

# Check if backend started successfully
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    log_error "Backend failed to start"
    exit 1
fi

# Start frontend
log_info "Starting frontend development server..."
cd "$PROJECT_ROOT/frontend"
npm run dev &
FRONTEND_PID=$!
log_info "Frontend PID: $FRONTEND_PID"

log_info "Services started successfully!"
log_info "Backend: http://localhost:8080"
log_info "Frontend: http://localhost:5174"
log_info "Press Ctrl+C to stop all services"

# Wait for processes
wait
