#!/bin/bash

# Quick start script for demo-material app

echo "🚀 ng-signalify Material Demo - Quick Start"
echo "==========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    echo "Please run this script from apps/demo-material directory"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    echo "Please install Node.js (>=18.0.0) from https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed"
    exit 1
fi

echo "✓ npm version: $(npm --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
echo "This may take a few minutes..."
npm install

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Error: Failed to install dependencies"
    exit 1
fi

echo ""
echo "✅ Installation complete!"
echo ""
echo "You can now run the following commands:"
echo "  npm start        - Start development server"
echo "  npm run build    - Build for production"
echo "  npm run watch    - Build and watch for changes"
echo ""
echo "🌐 Development server will be available at:"
echo "   http://localhost:4200"
echo ""
echo "Happy coding! 🎉"
