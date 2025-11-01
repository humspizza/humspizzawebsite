#!/bin/bash

echo "==================================================="
echo "🧪 TESTING PRODUCTION BUILD WITH .ENV FILE"
echo "==================================================="
echo ""

# Step 1: Check .env exists
echo "📋 Step 1: Checking .env file..."
if [ -f .env ]; then
    echo "✅ .env file exists"
    echo "📝 Contents (secrets hidden):"
    cat .env | sed 's/=.*/=***HIDDEN***/g'
else
    echo "❌ .env file NOT FOUND!"
    exit 1
fi

echo ""

# Step 2: Test .env loading
echo "📋 Step 2: Testing .env loading with Node..."
node test-env.js

echo ""

# Step 3: Check if build exists
echo "📋 Step 3: Checking production build..."
if [ -f dist/index.js ]; then
    echo "✅ Production build exists (dist/index.js)"
    ls -lh dist/index.js
else
    echo "❌ Production build NOT FOUND! Run: npm run build"
    exit 1
fi

echo ""

# Step 4: Test production server startup (without export)
echo "📋 Step 4: Testing production server (should read .env)..."
echo "Note: Will timeout after 5 seconds (normal behavior)"
echo ""

# Kill any existing process on port 5000
echo "🔧 Killing existing process on port 5000..."
pkill -f "node dist/index.js" 2>/dev/null || true
sleep 1

# Start production server in background
echo "🚀 Starting production server..."
NODE_ENV=production timeout 5 node dist/index.js > /tmp/prod-test.log 2>&1 &
PID=$!

# Wait for server to start
sleep 3

# Check logs
echo ""
echo "📊 Production Server Logs:"
echo "---------------------------------------------------"
cat /tmp/prod-test.log | head -20
echo "---------------------------------------------------"

# Check for success indicators
if grep -q "SSL disabled for custom database connection" /tmp/prod-test.log; then
    echo "✅ SSL disabled successfully"
else
    echo "⚠️  SSL disable message not found (might be OK)"
fi

if grep -q "User seeding completed" /tmp/prod-test.log; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection FAILED"
fi

if grep -q "serving on port" /tmp/prod-test.log; then
    echo "✅ Server started successfully"
else
    echo "⚠️  Server might not have started (check if port 5000 is in use)"
fi

# Cleanup
kill $PID 2>/dev/null || true

echo ""
echo "==================================================="
echo "✅ TEST COMPLETE"
echo "==================================================="
echo ""
echo "📌 IMPORTANT FOR PRODUCTION SERVER:"
echo "   1. Upload code to server"
echo "   2. Create .env file with DATABASE_URL"
echo "   3. Run: npm install"
echo "   4. Run: npm run build"
echo "   5. Run: NODE_ENV=production node dist/index.js"
echo ""
echo "   No need to export DATABASE_URL manually!"
echo "   Code will read from .env automatically"
echo "==================================================="
