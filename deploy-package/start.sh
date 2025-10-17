#!/bin/bash
# Quick start script cho server

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ File .env không tồn tại!"
    echo "Chạy: cp .env.example .env"
    echo "Sau đó edit .env với thông tin database của bạn"
    exit 1
fi

# Install dependencies if needed
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install --production
fi

# Push database schema
echo "🗄️ Pushing database schema..."
npm run db:push || npm run db:push -- --force

# Start with PM2
echo "🚀 Starting server with PM2..."
pm2 start dist/index.js --name "humspizza" --env production
pm2 save

echo ""
echo "✅ Server started!"
echo "📊 View status: pm2 list"
echo "📋 View logs: pm2 logs humspizza"
