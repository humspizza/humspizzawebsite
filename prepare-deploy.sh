#!/bin/bash

# Script chuẩn bị files để deploy lên production server
# Chạy: bash prepare-deploy.sh

echo "🚀 Chuẩn bị deploy Hum's Pizza..."

# 1. Build code mới nhất
echo ""
echo "📦 Building..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

# 2. Tạo thư mục deploy
rm -rf deploy-package
mkdir -p deploy-package

# 3. Copy files cần thiết
echo ""
echo "📋 Copying files..."
cp -r dist deploy-package/
cp package.json deploy-package/
cp package-lock.json deploy-package/
cp -r node_modules deploy-package/ 2>/dev/null || echo "⚠️ node_modules not found - will install on server"

# 4. Copy environment variables template
echo ""
echo "🔐 Creating .env template..."
cat > deploy-package/.env.example << 'EOF'
# Database Connection
DATABASE_URL=postgresql://username:password@localhost:5432/humspizza_db

# Session Secret (generate with: openssl rand -base64 32)
SESSION_SECRET=CHANGE_THIS_TO_RANDOM_SECRET

# Environment
NODE_ENV=production
PORT=3000

# Domain (important for SEO!)
DOMAIN=https://humspizza.com
EOF

# 5. Tạo README cho deploy package
cat > deploy-package/README.md << 'EOF'
# Hum's Pizza - Production Deploy Package

## Quick Start

1. **Upload toàn bộ folder này lên server**
   ```bash
   scp -r deploy-package user@your-server.com:/var/www/humspizza
   ```

2. **SSH vào server và setup**
   ```bash
   ssh user@your-server.com
   cd /var/www/humspizza
   
   # Copy và edit environment variables
   cp .env.example .env
   nano .env  # Sửa DATABASE_URL, SESSION_SECRET, DOMAIN
   
   # Install dependencies (nếu chưa có node_modules)
   npm install --production
   
   # Push database schema
   npm run db:push
   ```

3. **Chạy server với PM2**
   ```bash
   npm install -g pm2
   pm2 start dist/index.js --name "humspizza" --env production
   pm2 startup
   pm2 save
   ```

4. **Setup Nginx** (xem DEPLOYMENT_GUIDE.md)

5. **Test SEO**
   ```bash
   curl -H "User-Agent: facebookexternalhit/1.1" https://humspizza.com/ | grep og:image
   ```

## Xem hướng dẫn đầy đủ
Đọc file `DEPLOYMENT_GUIDE.md` ở root project
EOF

# 6. Copy deployment guide
cp DEPLOYMENT_GUIDE.md deploy-package/ 2>/dev/null || echo "⚠️ DEPLOYMENT_GUIDE.md not found"

# 7. Tạo script start nhanh cho server
cat > deploy-package/start.sh << 'EOF'
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
EOF

chmod +x deploy-package/start.sh

# 8. Zip deploy package
echo ""
echo "🗜️ Creating zip file..."
cd deploy-package
zip -r ../humspizza-deploy.zip . -q
cd ..

echo ""
echo "✅ Deploy package ready!"
echo ""
echo "📦 Files:"
echo "   - humspizza-deploy.zip (upload file này)"
echo "   - deploy-package/ (hoặc upload folder này)"
echo ""
echo "📋 Next steps:"
echo "   1. Upload humspizza-deploy.zip lên server"
echo "   2. Unzip: unzip humspizza-deploy.zip -d /var/www/humspizza"
echo "   3. Chạy: bash start.sh"
echo "   4. Đọc DEPLOYMENT_GUIDE.md để setup Nginx & SSL"
echo ""
