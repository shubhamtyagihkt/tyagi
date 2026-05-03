#!/bin/bash

# Sample Data Upload Script for Tyagi
# Uploads ~1000 entries of sample data for testing

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

echo "🚀 Tyagi Sample Data Upload Script"
echo "=================================="
echo "This will upload ~1000 sample entries including:"
echo "• 200 SKUs (products and services)"
echo "• 300 Purchase records"
echo "• 400 Sales records (items and services)"
echo "• 50 Expense records"
echo "• 20 Investment records"
echo ""
echo "Data will cover various time periods and scenarios."
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed or not in PATH"
    echo "💡 Please install Node.js to run this script"
    exit 1
fi

# Check if server is running
echo "🔍 Checking if backend server is running..."
if ! curl -s http://localhost:8080/api/sku > /dev/null 2>&1; then
    echo "❌ Backend server is not running at http://localhost:8080"
    echo "💡 Please start the backend server first:"
    echo "   cd backend && go run main.go"
    echo ""
    echo "   Or use the Makefile:"
    echo "   make run-backend"
    exit 1
fi

echo "✅ Backend server is running"
echo ""

# Confirm before proceeding
read -p "⚠️  This will add sample data to your database. Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Operation cancelled"
    exit 0
fi

echo ""
echo "📤 Starting data upload..."
echo "This may take a few minutes..."
echo ""

# Run the upload script
cd "$PROJECT_ROOT"
node scripts/upload-sample-data.js

echo ""
echo "🎉 Sample data upload complete!"
echo "📊 You can now explore the data in your Tyagi application"