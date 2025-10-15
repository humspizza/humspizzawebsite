#!/bin/bash
set -e

echo "🔨 Building for production..."

# Clean dist folder
rm -rf dist

# Build frontend (outputs to dist/public)
echo "📦 Building frontend..."
NODE_ENV=production vite build

# Build backend (outputs to dist/index.js)
echo "⚙️ Building backend..."
esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# Copy attached_assets to dist for production serving
echo "📂 Copying assets..."
cp -r attached_assets dist/attached_assets

# Copy .env for production (if exists)
if [ -f .env ]; then
  echo "📋 Copying .env..."
  cp .env dist/.env
fi

echo ""
echo "✅ Production build complete!"
echo ""
echo "📦 Build output:"
ls -lh dist/
echo ""
echo "📂 Assets:"
ls -lh dist/attached_assets/ | head -10
echo ""
echo "🚀 To run in production:"
echo "   cd dist && NODE_ENV=production node index.js"
