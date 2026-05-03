.PHONY: help build run dev clean install-deps build-backend build-frontend run-backend run-frontend stop stop-backend stop-frontend upload-sample-data

help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  help              - Show this help message"
	@echo "  install-deps      - Install dependencies for both backend and frontend"
	@echo "  build             - Build both backend and frontend"
	@echo "  build-backend     - Build backend only"
	@echo "  build-frontend    - Build frontend only"
	@echo "  run               - Run both backend and frontend (production)"
	@echo "  dev               - Run both backend and frontend (development with hot reload)"
	@echo "  run-backend       - Run backend only"
	@echo "  run-frontend      - Run frontend only"
	@echo "  stop              - Stop both backend and frontend"
	@echo "  stop-backend      - Stop backend only"
	@echo "  stop-frontend     - Stop frontend only"
	@echo "  upload-sample-data - Upload ~1000 sample entries for testing"
	@echo "  clean             - Clean build artifacts"

install-deps:
	@echo "Installing dependencies..."
	cd backend && go mod download
	cd frontend && npm install

build: build-backend build-frontend
	@echo "Build complete!"

build-backend:
	@echo "Building backend..."
	cd backend && go build -o ../bin/backend main.go

build-frontend:
	@echo "Building frontend..."
	cd frontend && npm run build

run: build
	@echo "Starting services..."
	@if [ "$$(uname)" = "Windows_NT" ] || [ "$$(uname -s)" = "MINGW64_NT" ]; then \
		echo "Windows detected - use 'make run-backend' and 'make run-frontend' in separate terminals"; \
	else \
		./bin/backend & \
		cd frontend && npm run preview; \
	fi

dev:
	@echo "Starting development servers..."
	@if [ "$$(uname)" = "Windows_NT" ] || [ "$$(uname -s)" = "MINGW64_NT" ]; then \
		echo "Windows detected - use 'make run-backend' and 'make run-frontend' in separate terminals"; \
	else \
		cd backend && go run main.go & \
		cd frontend && npm run dev; \
	fi

run-backend:
	@echo "Starting backend server..."
	cd backend && go run main.go

run-frontend:
	@echo "Starting frontend development server..."
	cd frontend && npm run dev

stop:
	@echo "Stopping Tyagi application..."
	@if command -v bash >/dev/null 2>&1; then \
		bash scripts/stop.sh; \
	else \
		echo "bash not found, trying with sh..."; \
		sh scripts/stop.sh; \
	fi

stop-backend:
	@echo "Stopping backend..."
	@if command -v bash >/dev/null 2>&1; then \
		bash scripts/stop.sh --backend-only; \
	else \
		echo "bash not found, trying with sh..."; \
		sh scripts/stop.sh --backend-only; \
	fi

stop-frontend:
	@echo "Stopping frontend..."
	@if command -v bash >/dev/null 2>&1; then \
		bash scripts/stop.sh --frontend-only; \
	else \
		echo "bash not found, trying with sh..."; \
		sh scripts/stop.sh --frontend-only; \
	fi

upload-sample-data:
	@echo "Uploading sample data..."
	@if command -v bash >/dev/null 2>&1; then \
		bash scripts/upload-sample-data.sh; \
	else \
		echo "bash not found, trying with sh..."; \
		sh scripts/upload-sample-data.sh; \
	fi

clean:
	@echo "Cleaning..."
	rm -rf bin/
	cd frontend && rm -rf dist node_modules
	cd backend && go clean

.DEFAULT_GOAL := help
