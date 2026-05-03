# Tyagi Application - Getting Started

This guide helps you set up and run the Tyagi application on your machine.

## Requirements

- **Go** 1.25+ (https://golang.org/dl/)
- **Node.js** 18+ (https://nodejs.org/)
- **Git** (https://git-scm.com/)

## Installation

### 1. Install Prerequisites

#### Windows
1. Download and install [Go](https://golang.org/dl/) (select Windows installer)
2. Download and install [Node.js LTS](https://nodejs.org/) (select Windows installer)
3. Download and install [Git](https://git-scm.com/) (select Windows installer)

#### macOS
```bash
# Using Homebrew
brew install go node git

# Or download installers from official websites
```

#### Linux
```bash
# Ubuntu/Debian
sudo apt-get install golang-go nodejs npm git

# Fedora/RHEL
sudo dnf install go nodejs npm git

# Arch
sudo pacman -S go nodejs npm git
```

### 2. Verify Installation

```bash
# Check Go
go version

# Check Node.js
node --version
npm --version

# Check Git
git --version
```

## Running the Application

### Quick Start

#### Windows
```cmd
cd path\to\tyagi
scripts\run.bat
```

#### macOS/Linux/WSL
```bash
cd /path/to/tyagi
chmod +x scripts/run.sh
./scripts/run.sh
```

#### Using Makefile (All Platforms)
```bash
cd /path/to/tyagi
make dev    # Run with hot reload
```

### Separate Terminals (Recommended for Development)

**Terminal 1 - Backend:**
```bash
cd backend
go run main.go
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## Accessing the Application

- **Frontend:** http://localhost:5174
- **Backend:** http://localhost:8080

## Windows Startup Setup

To automatically start Tyagi when your computer boots, run the setup script:

### Method 1: Automated Setup (Recommended)

1. **Right-click Command Prompt** and select "Run as administrator"
2. **Navigate to the project folder:**
   ```cmd
   cd C:\path\to\tyagi\scripts
   setup-windows.bat
   ```
3. **Choose option 1** for Task Scheduler (recommended)

### Method 2: Manual Task Scheduler Setup

1. Press `Win + R` and type `taskschd.msc`
2. Click "Create Basic Task"
3. Fill in:
   - **Name:** Tyagi Application
   - **Trigger:** When the computer starts
   - **Action:** Start a program
   - **Program:** `C:\Windows\System32\cmd.exe`
   - **Arguments:** `/c "C:\path\to\tyagi\scripts\run.bat"`
4. Edit the task properties and enable "Run with highest privileges"

### Method 3: Startup Folder

1. Press `Win + R` and type `shell:startup`
2. Create a shortcut to `scripts/run.bat` in this folder
3. Right-click the shortcut → Properties:
   - **Target:** `cmd.exe /c "C:\path\to\tyagi\scripts\run.bat"`
   - **Run as administrator:** Enable in Advanced

See `scripts/README.md` for more detailed instructions.

## Project Structure

```
tyagi/
├── backend/              # Go/Gin backend API server
│   ├── main.go          # Entry point
│   ├── go.mod           # Go dependencies
│   ├── db/              # Database code
│   ├── handlers/        # HTTP request handlers
│   ├── models/          # Data models
│   └── router/          # Route definitions
├── frontend/            # React/Vite frontend
│   ├── src/             # Source code
│   │   ├── pages/       # Page components
│   │   ├── components/  # Reusable components
│   │   └── lib/         # Utilities and API client
│   ├── package.json     # Node.js dependencies
│   └── vite.config.js   # Vite configuration
├── scripts/             # Startup scripts
│   ├── run.sh          # Unix/Linux/Mac startup
│   ├── run.bat         # Windows startup
│   ├── run.ps1         # PowerShell startup
│   ├── setup-windows.bat # Windows setup helper
│   └── README.md       # Script documentation
├── Makefile            # Build targets
└── README.md           # This file
```

## Common Commands

### Development

```bash
# Run both services with hot reload
make dev

# Run only backend
make run-backend

# Run only frontend
make run-frontend

# Install dependencies
make install-deps
```

### Building

```bash
# Build backend binary
make build-backend

# Build frontend for production
make build-frontend

# Build both
make build
```

### Maintenance

```bash
# Clean build artifacts
make clean

# View all available commands
make help
```

## Troubleshooting

### Backend issues

**Port 8080 already in use:**
```bash
# Find process using port 8080
lsof -i :8080          # Mac/Linux
netstat -ano | findstr :8080  # Windows

# Kill the process
kill -9 <PID>          # Mac/Linux
taskkill /PID <PID> /F # Windows
```

**Go dependencies error:**
```bash
cd backend
go mod download
go mod tidy
```

### Frontend issues

**Node modules corruption:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**Port 5174 already in use:**
```bash
# Clear npm/vite cache
npm cache clean --force
cd frontend
npm run dev -- --port 5175  # Use different port
```

### Go not found

Ensure Go is in your PATH:
```bash
go version
```

If not found:
- Reinstall Go from https://golang.org/dl/
- Restart your terminal/command prompt
- Restart your computer

### Node not found

Ensure Node.js is in your PATH:
```bash
node --version
npm --version
```

If not found:
- Reinstall Node.js from https://nodejs.org/
- Restart your terminal/command prompt

## Database Configuration

The application uses SQLite. Database settings are stored in `config.json`:

```json
{
  "database_path": "autoparts.db"
}
```

To use a different database, use the "Select DB" option in the frontend UI.

## Environment Variables

Optional configuration:

```bash
# Backend
export PORT=8080
export GIN_MODE=release    # or "debug"

# Frontend
export VITE_API_BASE_URL=http://localhost:8080/api
```

## Performance Tips

1. **Use development mode** for active coding:
   ```bash
   make dev
   ```

2. **Keep both services running** - they work together

3. **Clear browser cache** if UI isn't updating:
   - Chrome/Firefox: Press Ctrl+Shift+Delete
   - Safari: Develop → Empty Caches

4. **Check browser console** for frontend errors:
   - Press F12 to open Developer Tools
   - Check the Console tab

5. **Check terminal output** for backend errors

## Getting Help

Check the logs for error details:
- **Backend logs:** Terminal running backend
- **Frontend logs:** Terminal running frontend and browser console
- **Application logs:** Check `scripts/README.md` for logs location

## File Permissions (Linux/Mac)

Make scripts executable:
```bash
chmod +x scripts/run.sh
chmod +x scripts/setup-windows.bat  # Not needed on Linux/Mac
```

## Next Steps

1. Start the application (see "Running the Application")
2. Open http://localhost:5174 in your browser
3. Explore the dashboard and features
4. Check `scripts/README.md` for Windows startup configuration

---

For more details on startup scripts, see [scripts/README.md](scripts/README.md)
