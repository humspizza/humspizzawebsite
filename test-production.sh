#!/bin/bash

echo "================================================"
echo "🔨 Testing Production Build"
echo "================================================"
echo ""

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist/
echo "✅ Done"
echo ""

# Build the project
echo "🔨 Building project..."
npm run build
BUILD_EXIT_CODE=$?

if [ $BUILD_EXIT_CODE -ne 0 ]; then
  echo "❌ Build failed with exit code $BUILD_EXIT_CODE"
  exit 1
fi

echo "✅ Build completed successfully"
echo ""

# Check dist folder
echo "📁 Checking dist folder..."
ls -lh dist/ | head -10
echo ""

# Check if attached_assets exists at root
echo "📁 Checking root attached_assets..."
ls -la attached_assets/ | head -5
echo ""

# Start production server in background
echo "🚀 Starting production server..."
NODE_ENV=production node dist/index.js &
SERVER_PID=$!

# Wait for server to start
sleep 5

# Test API endpoints
echo ""
echo "🧪 Testing API endpoints..."
echo "-----------------------------------"

echo "1. Testing homepage..."
curl -s -w "Status: %{http_code}\n" -o /dev/null "http://localhost:5000/"

echo "2. Testing assets..."
curl -s -w "Status: %{http_code}\n" -o /dev/null "http://localhost:5000/api/assets/26e34fbd-4bf6-477e-8caf-52c5d1d86286.png"

echo "3. Testing SEO API..."
curl -s -w "Status: %{http_code}\n" -o /dev/null "http://localhost:5000/api/seo/pages/home/vi"

echo ""
echo "-----------------------------------"

# Kill server
echo "🛑 Stopping production server..."
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null

echo ""
echo "================================================"
echo "✅ Production test completed"
echo "================================================"
