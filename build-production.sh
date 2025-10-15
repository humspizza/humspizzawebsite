#!/bin/bash
set -e

echo "🔨 Building for production..."

# Clean dist folder
rm -rf dist

# Build frontend (outputs to dist/public)
echo "📦 Building frontend..."
NODE_ENV=production npm run build

# Copy attached_assets to dist for production serving
echo "📂 Copying assets..."
cp -r attached_assets dist/

# Copy .env for production (if exists)
if [ -f .env ]; then
  cp .env dist/
fi

echo "✅ Production build complete!"
echo ""
echo "To run in production:"
echo "  cd dist && NODE_ENV=production node index.js"
