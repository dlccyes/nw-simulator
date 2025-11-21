.PHONY: help test test-backend test-frontend build build-clean clean install dev dev-backend dev-frontend dev-all lint

# Default target
help:
	@echo "Available commands:"
	@echo "  make test          - Run all tests, build, and clean up"
	@echo "  make test-backend  - Run backend tests only"
	@echo "  make test-frontend - Run frontend tests only"
	@echo "  make build         - Build for production"
	@echo "  make build-clean   - Build for production and clean up artifacts"
	@echo "  make clean         - Clean up build artifacts and cache"
	@echo "  make install       - Install dependencies"
	@echo "  make dev           - Start both backend and frontend development servers"
	@echo "  make dev-backend   - Start backend development server only"
	@echo "  make dev-frontend  - Start frontend development server only"
	@echo "  make dev-all       - Start both backend and frontend development servers"
	@echo "  make lint          - Run linting"

# Test targets
test: test-backend test-frontend build clean
	@echo "✅ All tests completed successfully!"

test-backend:
	@echo "🧪 Running backend tests..."
	npm run test:backend

test-frontend:
	@echo "🧪 Running frontend tests..."
	npm test

# Build targets
build:
	@echo "🏗️ Building for production..."
	npm run build

build-clean: build clean
	@echo "✅ Build completed and artifacts cleaned up!"

# Cleanup targets
clean:
	@echo "🧹 Cleaning up build artifacts..."
	rm -rf dist/
	rm -rf node_modules/.cache/
	rm -rf backend/api/.pytest_cache/
	rm -rf backend/api/__pycache__/
	find . -name "*.pyc" -delete
	find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
	@echo "✅ Cleanup completed!"

# Development targets
install:
	@echo "📦 Installing dependencies..."
	npm install

dev-backend:
	@echo "🚀 Starting backend development server..."
	cd backend && python3 app.py

dev-frontend:
	@echo "🚀 Starting frontend development server..."
	npm run dev

dev-all:
	@echo "🚀 Starting both backend and frontend development servers..."
	@echo "📡 Backend will run on http://localhost:5000"
	@echo "🌐 Frontend will run on http://localhost:5173"
	@echo ""
	@echo "Press Ctrl+C to stop both servers"
	@trap 'kill 0' EXIT; \
	cd backend && python3 app.py & \
	npm run dev & \
	wait

dev: dev-all

lint:
	@echo "🔍 Running linter..."
	npm run lint 
