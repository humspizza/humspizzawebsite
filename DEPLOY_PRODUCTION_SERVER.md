# Hướng Dẫn Deploy Lên Production Server

## 📋 Yêu Cầu Trước Khi Deploy

- ✅ Node.js 18+ đã cài đặt
- ✅ Database server đang chạy (`s88d63.cloudnetwork.vn` hoặc `103.138.88.63`)
- ✅ Database user có đủ quyền (đã cấp quyền ALL)
- ✅ Port 5000 available (hoặc custom port)

---

## 🚀 Bước 1: Upload Code Lên Server

### Option 1: Git Clone
```bash
cd /var/www
git clone <your-repo-url> humpizza
cd humpizza
```

### Option 2: Upload Trực Tiếp
```bash
# Upload project folder qua FTP/SFTP
# Hoặc dùng scp:
scp -r /local/path/to/project user@server:/var/www/humpizza
```

---

## 🔧 Bước 2: Cài Đặt Dependencies

```bash
cd /var/www/humpizza

# Install dependencies
npm install
```

---

## 🔐 Bước 3: Set Environment Variables

### Option A: Dùng File .env (Khuyến nghị)

Tạo file `.env` trong thư mục root:

```bash
nano .env
```

Thêm nội dung:
```env
DATABASE_URL=postgresql://hum94111_pizza_user:F~xd@c9H5exFxh7x@s88d63.cloudnetwork.vn/hum94111_pizza?sslmode=none
SESSION_SECRET=aqxj5psmtxo8wX8YXJ8VbNFnmncFnWlIlXgLX0TU+C5JmxtXEhGalaxqwdiZ4oQyJ1Z9WDv3yqpLrlf46iks+g==
NODE_ENV=production
```

**LƯU Ý:** Có thể dùng IP thay domain nếu cần:
```env
DATABASE_URL=postgresql://hum94111_pizza_user:F~xd@c9H5exFxh7x@103.138.88.63/hum94111_pizza?sslmode=none
```

### Option B: Export Trực Tiếp

```bash
export DATABASE_URL="postgresql://hum94111_pizza_user:F~xd@c9H5exFxh7x@s88d63.cloudnetwork.vn/hum94111_pizza?sslmode=none"
export SESSION_SECRET="aqxj5psmtxo8wX8YXJ8VbNFnmncFnWlIlXgLX0TU+C5JmxtXEhGalaxqwdiZ4oQyJ1Z9WDv3yqpLrlf46iks+g=="
export NODE_ENV="production"
```

---

## 🔨 Bước 4: Build Production

```bash
# Build frontend và backend
npm run build

# Kiểm tra build folder
ls -lh dist/
```

**Kết quả mong đợi:**
```
dist/
├── index.js        (Backend compiled)
├── client/         (Frontend static files)
└── ...
```

---

## 🚀 Bước 5: Start Production Server

### Option 1: Chạy Trực Tiếp (Testing)

```bash
NODE_ENV=production node dist/index.js
```

**Kiểm tra logs:**
- ✅ Phải thấy: `🔓 SSL disabled for custom database connection`
- ✅ Phải thấy: `✓ User seeding completed`
- ✅ Phải thấy: `[express] serving on port 5000`

### Option 2: Dùng PM2 (Khuyến nghị cho Production)

```bash
# Install PM2 globally
npm install -g pm2

# Start app với PM2
pm2 start dist/index.js --name humpizza-api

# Auto-start on system reboot
pm2 startup
pm2 save

# Xem logs
pm2 logs humpizza-api

# Xem status
pm2 status
```

### Option 3: Dùng Screen (Alternative)

```bash
# Tạo screen session
screen -S humpizza

# Start app
NODE_ENV=production node dist/index.js

# Detach: Ctrl+A, D
# Reattach: screen -r humpizza
```

---

## 🧪 Bước 6: Test Production Server

```bash
# Test homepage
curl http://localhost:5000/

# Test API
curl http://localhost:5000/api/categories

# Test database connection
curl http://localhost:5000/api/home-content

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Nếu tất cả trả về 200 OK → Deploy thành công!** ✅

---

## 🌐 Bước 7: Setup Nginx (Optional - Recommended)

Tạo file config:

```bash
sudo nano /etc/nginx/sites-available/humpizza
```

Thêm nội dung:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Serve static files
    location / {
        root /var/www/humpizza/dist/client;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to Node.js
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Serve uploaded assets
    location /api/assets {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/humpizza /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 📋 Checklist Deploy

- [ ] Code đã upload lên server
- [ ] `npm install` chạy thành công
- [ ] `.env` file đã tạo với DATABASE_URL đúng
- [ ] `npm run build` chạy không lỗi
- [ ] Thư mục `dist/` đã được tạo
- [ ] Start server thấy message "SSL disabled for custom database connection"
- [ ] Test API endpoints trả về dữ liệu
- [ ] PM2 đang chạy app
- [ ] Nginx đã cấu hình (nếu dùng)

---

## 🔧 Troubleshooting

### Lỗi: "Hostname/IP does not match certificate's altnames"

✅ **Đã Fix!** Code hiện tại tự động tắt SSL cho cả:
- IP: `103.138.88.63`
- Domain: `s88d63.cloudnetwork.vn`

**Kiểm tra logs phải thấy:**
```
🔓 SSL disabled for custom database connection
```

### Lỗi: "permission denied for table"

```bash
# Login vào database
psql -U postgres -h s88d63.cloudnetwork.vn

# Cấp quyền
\c hum94111_pizza
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO hum94111_pizza_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO hum94111_pizza_user;
```

### Lỗi: "EADDRINUSE: port 5000 already in use"

```bash
# Tìm process đang dùng port
lsof -ti:5000

# Kill process
kill -9 $(lsof -ti:5000)

# Hoặc đổi port trong code
```

### Lỗi: "Cannot find module"

```bash
# Re-install dependencies
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 🔄 Update Code Sau Deploy

```bash
# Pull latest code
git pull origin main

# Install new dependencies (nếu có)
npm install

# Rebuild
npm run build

# Restart PM2
pm2 restart humpizza-api

# Hoặc restart manual
# Kill old process, start new
```

---

## 📝 Logs & Monitoring

### PM2 Logs
```bash
# Xem logs real-time
pm2 logs humpizza-api

# Xem logs with timestamp
pm2 logs humpizza-api --timestamp

# Clear logs
pm2 flush
```

### Manual Logs
```bash
# Redirect logs to file
NODE_ENV=production node dist/index.js > logs.txt 2>&1

# Tail logs
tail -f logs.txt
```

---

## 🆘 Support

Nếu gặp vấn đề:

1. Kiểm tra logs: `pm2 logs` hoặc `tail -f logs.txt`
2. Kiểm tra DATABASE_URL có đúng format không
3. Test database connection: `psql -U hum94111_pizza_user -h s88d63.cloudnetwork.vn`
4. Đảm bảo port 5000 không bị firewall block

---

## ✅ Production Ready

Sau khi hoàn thành tất cả bước trên:
- ✅ App chạy ổn định trên production
- ✅ Database kết nối thành công (không lỗi SSL)
- ✅ PM2 auto-restart khi crash
- ✅ Nginx serve static files và proxy API
- ✅ Ready for production traffic!

🎉 **Chúc mừng! App của bạn đã deploy thành công!**
