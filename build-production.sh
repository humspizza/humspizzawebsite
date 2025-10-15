#!/bin/bash

# Production Build Script for Hum's Pizza
# This script ensures proper file structure for deployment

echo "🏗️  Starting production build..."

# Step 1: Build the application
echo "📦 Building frontend and backend..."
npm run build

# Step 2: Fix deployment structure
echo "🔧 Fixing deployment file structure..."
node fix-deployment.js

# Step 3: Verify structure
echo "✅ Verifying deployment structure..."
if [ -f "dist/index.html" ]; then
    echo "✓ index.html found in dist/"
else
    echo "❌ index.html NOT found in dist/ - deployment may fail"
    exit 1
fi

if [ -f "dist/index.js" ]; then
    echo "✓ server bundle found in dist/"
else
    echo "❌ server bundle NOT found in dist/ - deployment may fail"
    exit 1
fi

echo "🎉 Production build completed successfully!"
echo "📁 Files are ready for deployment in dist/ directory"
echo ""
echo "To deploy:"
echo "1. Upload dist/ contents to your server"
echo "2. Run: NODE_ENV=production node index.js"