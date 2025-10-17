# 🚀 Hướng Dẫn Deploy Node.js - Hum's Pizza

## 📋 Checklist Trước Khi Deploy

- [ ] Build code mới nhất (`npm run build`)
- [ ] Database PostgreSQL đã setup trên production
- [ ] Environment variables đã chuẩn bị
- [ ] Domain đã trỏ về server

---

## 🔧 BƯỚC 1: Chuẩn Bị Files

### Files cần upload lên server:

```
/your-app/
├── dist/
│   ├── index.js           ← Node.js server (REQUIRED)
│   ├── public/            ← Static assets
│   └── attached_assets/   ← Uploaded images
├── node_modules/          ← Dependencies (hoặc chạy npm install trên server)
├── package.json           ← Dependencies list
├── package-lock.json      ← Lock file
└── .env                   ← Environment variables
```

### Cách upload:
```bash
# Trên local (Replit), zip files
zip -r humspizza-deploy.zip dist/ package.json package-lock.json .env

# Upload lên server qua FTP/SFTP
# Unzip trên server
unzip humspizza-deploy.zip -d /var/www/humspizza
```

---

## 🔐 BƯỚC 2: Setup Environment Variables

Tạo file `.env` trên production server:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/humspizza_db

# Session
SESSION_SECRET=your-production-secret-key-here-change-this

# Environment
NODE_ENV=production
PORT=3000

# Domain (quan trọng cho SEO!)
DOMAIN=https://humspizza.com
```

**⚠️ QUAN TRỌNG**: 
- Thay `DATABASE_URL` bằng PostgreSQL connection string thực tế
- Tạo `SESSION_SECRET` ngẫu nhiên mạnh (dùng: `openssl rand -base64 32`)

---

## 📦 BƯỚC 3: Install Dependencies

```bash
# SSH vào server
ssh user@your-server.com

# Di chuyển vào thư mục app
cd /var/www/humspizza

# Install dependencies (production only)
npm install --production

# Hoặc nếu đã upload node_modules thì skip bước này
```

---

## 🗄️ BƯỚC 4: Setup Database

```bash
# Push database schema
npm run db:push

# Hoặc nếu warning về data loss:
npm run db:push -- --force
```

**Lưu ý**: Database cần:
- PostgreSQL 14+ 
- Extension: `uuid-ossp` hoặc `gen_random_uuid()` support

---

## 🚀 BƯỚC 5: Chạy Server

### A. Chạy thử nghiệm:
```bash
NODE_ENV=production node dist/index.js
```

### B. Setup PM2 (Process Manager - khuyến nghị):
```bash
# Install PM2 globally
npm install -g pm2

# Chạy app với PM2
pm2 start dist/index.js --name "humspizza" --env production

# Auto-restart khi server reboot
pm2 startup
pm2 save

# Xem logs
pm2 logs humspizza

# Restart app
pm2 restart humspizza
```

---

## 🌐 BƯỚC 6: Setup Nginx Reverse Proxy

Tạo file `/etc/nginx/sites-available/humspizza.com`:

```nginx
server {
    listen 80;
    server_name humspizza.com www.humspizza.com;

    # Force HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name humspizza.com www.humspizza.com;

    # SSL Certificate (dùng Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/humspizza.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/humspizza.com/privkey.pem;

    # Reverse proxy to Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static assets caching
    location /assets/ {
        proxy_pass http://localhost:3000/assets/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API routes
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Kích hoạt site:**
```bash
sudo ln -s /etc/nginx/sites-available/humspizza.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔒 BƯỚC 7: Setup SSL Certificate

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Tạo SSL certificate
sudo certbot --nginx -d humspizza.com -d www.humspizza.com

# Auto-renew
sudo certbot renew --dry-run
```

---

## ✅ BƯỚC 8: Kiểm Tra SEO

### Test crawler response:
```bash
# Test home page
curl -H "User-Agent: facebookexternalhit/1.1" https://humspizza.com/ | grep og:image

# Test about page
curl -H "User-Agent: facebookexternalhit/1.1" https://humspizza.com/about | grep og:title

# Test blog post
curl -H "User-Agent: facebookexternalhit/1.1" https://humspizza.com/news/[slug] | grep og:title
```

**Kết quả mong đợi**: Mỗi trang có meta tags KHÁC NHAU!

---

## 🧹 BƯỚC 9: Clear Facebook Cache

1. Truy cập: https://developers.facebook.com/tools/debug/
2. Nhập URL: `https://humspizza.com/`
3. Click **"Scrape Again"**
4. Kiểm tra preview - phải thấy OG image và title đúng
5. Lặp lại với các trang khác

---

## 🔄 Update Code Sau Này

```bash
# 1. Build mới trên Replit
npm run build

# 2. Upload dist/index.js mới lên server
scp dist/index.js user@server:/var/www/humspizza/dist/

# 3. Restart server
pm2 restart humspizza

# 4. Clear CDN/Cache nếu có
```

---

## 🐛 Troubleshooting

### Server không start:
```bash
# Xem logs
pm2 logs humspizza

# Kiểm tra port đang dùng
sudo lsof -i :3000
```

### Database connection error:
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Kiểm tra .env
cat .env | grep DATABASE_URL
```

### SEO không hiển thị:
```bash
# Test server response
curl -I https://humspizza.com/

# Kiểm tra middleware đang chạy
curl -H "User-Agent: facebookexternalhit/1.1" https://humspizza.com/ | head -30
```

---

## 📊 Monitoring

### PM2 Dashboard:
```bash
pm2 monit
```

### Server logs:
```bash
# Real-time logs
pm2 logs humspizza --lines 100

# Error logs only
pm2 logs humspizza --err
```

---

## 🎯 Checklist Hoàn Thành

- [ ] Node.js server đang chạy (check: `pm2 list`)
- [ ] Nginx đã reverse proxy đúng
- [ ] SSL certificate active (https://)
- [ ] Database connected
- [ ] SEO metadata khác nhau cho mỗi trang
- [ ] Facebook Sharing Debugger pass
- [ ] Uploaded images hiển thị đúng

---

## 📞 Support

Nếu gặp vấn đề:
1. Check PM2 logs: `pm2 logs humspizza`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Test locally: `NODE_ENV=production node dist/index.js`

**Good luck! 🚀**
