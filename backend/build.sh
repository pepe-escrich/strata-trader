#!/bin/bash
set -e

echo "🚀 Building Strata Trader Backend..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building NestJS application..."
npm run build

echo "✅ Build completed successfully!"
