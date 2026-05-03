# Tyagi - Business Management System

A full-stack business management application built with Go backend and React frontend, featuring expense tracking, sales management, SKU management, and financial reporting.

## Features

- **Expense Management**: Track and categorize business expenses
- **Sales Management**: Monitor sales by category, subcategory, and product
- **SKU Management**: Manage product inventory and details
- **Financial Reports**: Generate comprehensive financial reports
- **Dashboard**: Visual analytics with sales trends and top products
- **Database Management**: SQLite database with configurable paths

## Tech Stack

- **Backend**: Go 1.25+ with Gin framework
- **Frontend**: React with Vite
- **Database**: SQLite
- **Build System**: Makefile with cross-platform support

## Quick Start

### Prerequisites

- Go 1.25 or later
- Node.js 18 or later
- Make (optional, for using Makefile)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd tyagi
   ```

2. Install dependencies:
   ```bash
   make install-deps
   # or manually:
   # cd backend && go mod download
   # cd frontend && npm install
   ```

3. Build the application:
   ```bash
   make build
   ```

4. Run in development mode:
   ```bash
   make dev
   ```

The application will be available at:
- Frontend: http://localhost:5174
- Backend API: http://localhost:8080

## Usage

### Running the Application

#### Using Makefile (Recommended)

```bash
# Development mode (with hot reload)
make dev

# Production mode
make run

# Run specific components
make run-backend    # Backend only
make run-frontend   # Frontend only

# Stop services
make stop           # Stop all
make stop-backend   # Stop backend only
make stop-frontend  # Stop frontend only
```

#### Using Scripts

The project includes cross-platform scripts in the `scripts/` directory:

**Unix/Linux/macOS:**
```bash
# Run
./scripts/run.sh

# Stop
./scripts/stop.sh
```

**Windows:**
```batch
# Run
scripts\run.bat

# Stop
scripts\stop.bat
```

**PowerShell:**
```powershell
# Run
.\scripts\run.ps1

# Stop
.\scripts\stop.ps1
```

### Windows Startup Automation

To automatically start Tyagi on Windows boot:

1. Run the setup script as administrator:
   ```batch
   scripts\setup-windows.bat
   ```

2. Choose your preferred startup method:
   - Task Scheduler (recommended)
   - Startup folder
   - Registry (Run key)

### Sample Data Upload

To populate your database with sample data for testing:

```bash
# Using Makefile (recommended)
make upload-sample-data

# Or run directly
./scripts/upload-sample-data.sh

# Or with Node.js
node scripts/upload-sample-data.js
```

This will upload approximately 1000 sample entries including:
- 200 SKUs (products and services across various categories)
- 300 Purchase records
- 400 Sales records (items and services)
- 50 Expense records
- 20 Investment records

Data covers various time periods (today, yesterday, this week, past weeks) and scenarios (low stock, high sales, investments, expenses).

**Note**: Ensure the backend server is running before uploading sample data.

### Database Configuration

The application uses SQLite database with configurable paths:

1. On first run, you'll be prompted to select a database file
2. Enter either:
   - Absolute path: `/path/to/database.db`
   - Relative path: `data/database.db`
   - Home directory: `~/Desktop/database.db`

The database path is stored in `config.json` in the project root.

## Project Structure

```
tyagi/
├── backend/           # Go backend
│   ├── handlers/      # API handlers
│   ├── models/        # Data models
│   ├── router/        # Route definitions
│   ├── utils/         # Utility functions
│   └── db/           # Database configuration
├── frontend/          # React frontend
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── pages/      # Page components
│   │   └── lib/        # Utility libraries
│   └── public/        # Static assets
├── scripts/           # Cross-platform scripts
│   ├── run.sh         # Unix/Linux/macOS run script
│   ├── stop.sh        # Unix/Linux/macOS stop script
│   ├── run.bat        # Windows batch run script
│   ├── stop.bat       # Windows batch stop script
│   ├── run.ps1        # PowerShell run script
│   ├── stop.ps1       # PowerShell stop script
│   └── setup-windows.bat # Windows startup setup
├── bin/               # Build output (generated)
├── config.json        # Database configuration (generated)
└── Makefile          # Build automation
```

## API Endpoints

- `GET /api/skus` - Get all SKUs
- `POST /api/skus` - Create new SKU
- `GET /api/expenses` - Get expenses
- `POST /api/expenses` - Create expense
- `GET /api/sales` - Get sales data
- `POST /api/sales` - Create sale
- `GET /api/finance` - Get financial data
- `GET /api/reports` - Get reports
- `POST /api/database/select` - Select database file

## Development

### Backend Development

```bash
cd backend
go run main.go
```

### Frontend Development

```bash
cd frontend
npm run dev
```

### Building

```bash
# Build everything
make build

# Build backend only
make build-backend

# Build frontend only
make build-frontend
```

## Troubleshooting

### Common Issues

1. **Port already in use**: Use `make stop` to stop running processes
2. **Database connection failed**: Check the database path in `config.json`
3. **Build failures**: Ensure Go and Node.js are properly installed
4. **Windows startup issues**: Run setup script as administrator

### Logs

- Backend logs are displayed in the terminal
- Frontend logs are available in browser developer tools
- Use `make stop` to cleanly shut down services

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.