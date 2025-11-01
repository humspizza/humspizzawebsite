#!/bin/bash

echo "🧪 Testing Production Build Setup"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check attached_assets exists at root
echo -n "1. Checking attached_assets at project root... "
if [ -d "attached_assets" ]; then
    FILE_COUNT=$(ls attached_assets | wc -l)
    echo -e "${GREEN}✓${NC} Found $FILE_COUNT files"
else
    echo -e "${RED}✗${NC} Directory not found!"
    exit 1
fi

# Test 2: Run build
echo -n "2. Running production build... "
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Build successful"
else
    echo -e "${RED}✗${NC} Build failed!"
    exit 1
fi

# Test 3: Check dist folder structure
echo -n "3. Verifying dist/ structure... "
if [ -d "dist" ] && [ -f "dist/index.js" ] && [ -d "dist/public" ]; then
    echo -e "${GREEN}✓${NC} Structure correct"
else
    echo -e "${RED}✗${NC} Missing files in dist/"
    exit 1
fi

# Test 4: Check attached_assets NOT in dist (should read from parent)
echo -n "4. Verifying attached_assets NOT copied to dist/... "
if [ ! -d "dist/attached_assets" ]; then
    echo -e "${GREEN}✓${NC} Correct! Files stay at root"
else
    echo -e "${YELLOW}⚠${NC} Found dist/attached_assets (not needed, will be ignored)"
fi

# Test 5: Verify folder structure
echo ""
echo "📁 Final Folder Structure:"
echo "=================================="
echo "project-root/"
echo "  ├── attached_assets/     ($FILE_COUNT files)"
echo "  └── dist/"
echo "      ├── index.js         (server reads ../attached_assets/)"
echo "      └── public/"
echo ""

echo -e "${GREEN}✅ All tests passed!${NC}"
echo ""
echo "📦 Ready for production deployment:"
echo "   - Upload ENTIRE project folder to server"
echo "   - Run: NODE_ENV=production node dist/index.js"
echo "   - Server will read files from ../attached_assets/"
