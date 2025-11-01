#!/bin/bash

echo "🧪 Testing Production Build - Assets URLs"
echo "=========================================="
echo ""

# Build
echo "1. Building project..."
npm run build >/dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi
echo "✅ Build successful"
echo ""

# Start production server
echo "2. Starting production server..."
cd dist
NODE_ENV=production node index.js >/tmp/prod-server.log 2>&1 &
SERVER_PID=$!
cd ..
sleep 3

# Test API
echo "3. Testing API responses..."
RESPONSE=$(curl -s http://localhost:5000/api/hero-videos/status)
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

# Extract URLs
URLS=$(echo "$RESPONSE" | grep -o '"/dist/attached_assets/[^"]*"')
if [ ! -z "$URLS" ]; then
    echo "✅ URLs are correct: /dist/attached_assets/..."
else
    echo "❌ URLs are wrong!"
    echo "$RESPONSE"
fi

# Check logs
echo ""
echo "4. Checking server logs..."
grep "📁 Assets" /tmp/prod-server.log | head -3

# Cleanup
echo ""
echo "5. Cleanup..."
kill $SERVER_PID 2>/dev/null
echo "✅ Test complete"
