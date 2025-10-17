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
