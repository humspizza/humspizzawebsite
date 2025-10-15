#!/bin/bash

echo "🧪 Testing production build..."
echo ""

# Start production server in background
cd dist
NODE_ENV=production node index.js > /tmp/prod-server.log 2>&1 &
PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 5

# Test API endpoints
echo ""
echo "Testing API routes:"
echo "-------------------"

# Test 1: Get menu items
echo -n "GET /api/menu-items ... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/menu-items)
if [ "$STATUS" = "200" ]; then
  echo "✅ $STATUS"
else
  echo "❌ $STATUS"
fi

# Test 2: Get categories
echo -n "GET /api/categories ... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/categories)
if [ "$STATUS" = "200" ]; then
  echo "✅ $STATUS"
else
  echo "❌ $STATUS"
fi

# Test 3: Get blog posts
echo -n "GET /api/blog-posts ... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/blog-posts)
if [ "$STATUS" = "200" ]; then
  echo "✅ $STATUS"
else
  echo "❌ $STATUS"
fi

# Test 4: Get home content
echo -n "GET /api/home-content ... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/home-content)
if [ "$STATUS" = "200" ]; then
  echo "✅ $STATUS"
else
  echo "❌ $STATUS"
fi

# Test 5: Static assets
echo -n "GET /api/assets/logo.humpizza.png ... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/assets/logo.humpizza.png)
if [ "$STATUS" = "200" ]; then
  echo "✅ $STATUS"
else
  echo "❌ $STATUS"
fi

echo ""
echo "📋 Server logs (last 20 lines):"
echo "-------------------"
tail -20 /tmp/prod-server.log

# Kill test server
kill $PID 2>/dev/null
wait $PID 2>/dev/null

echo ""
echo "✅ Production API test complete!"
