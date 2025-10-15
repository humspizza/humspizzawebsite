# 🎯 GIẢI QUYẾT LỖI PRODUCTION BUILD

## ❌ Lỗi ban đầu
```
Pre-transform error: Failed to load url /src/main.tsx
502 response: application did not send a complete response
```

## ✅ Nguyên nhân & Giải pháp

### Nguyên nhân
Server chạy **Vite dev mode** trong production thay vì serve static files

### Giải pháp
1. ✅ Đảm bảo `NODE_ENV=production` được set
2. ✅ Copy `attached_assets/` vào `dist/` folder
3. ✅ Sử dụng build script mới

## 🚀 Cách Deploy Production

### Bước 1: Build
```bash
./build-production.sh
```

### Bước 2: Kiểm tra dist/
```
dist/
├── index.js              # Backend bundle
├── public/               # Frontend static files
│   ├── index.html
│   └── assets/
└── attached_assets/      # Media files (QUAN TRỌNG!)
    ├── logo.humpizza.png
    ├── hero.landingpage.mp4
    └── ...
```

### Bước 3: Deploy
```bash
# Copy dist/ lên server
scp -r dist/* user@server:/var/www/humspizza/

# Trên server, chạy:
cd /var/www/humspizza
NODE_ENV=production node index.js

# Hoặc dùng PM2:
pm2 start index.js --name humspizza --env production
```

## ⚠️ QUAN TRỌNG

### 1. LUÔN set NODE_ENV=production
```bash
# ✅ ĐÚNG
NODE_ENV=production node index.js

# ❌ SAI (sẽ chạy Vite dev mode)
node index.js
```

### 2. PHẢI copy attached_assets
```bash
# Build script đã tự động copy
cp -r attached_assets dist/attached_assets
```

### 3. Database URL
Tạo `.env` trong `dist/`:
```env
DATABASE_URL=postgresql://user:pass@host/db
SESSION_SECRET=production-secret
NODE_ENV=production
PORT=5000
```

## 🧪 Test Production Local

```bash
# Build
./build-production.sh

# Stop dev server trước
# Ctrl+C trong terminal đang chạy npm run dev

# Chạy production
cd dist
NODE_ENV=production node index.js
```

## 📋 Checklist Deploy

- [ ] Chạy `./build-production.sh` thành công
- [ ] Folder `dist/attached_assets/` tồn tại và có files
- [ ] File `dist/index.js` tồn tại
- [ ] Folder `dist/public/` có index.html
- [ ] Copy `.env` với DATABASE_URL production
- [ ] Set `NODE_ENV=production` khi chạy
- [ ] Test trên server production
- [ ] Verify assets load (logo, videos)

## 🐛 Troubleshooting

### Lỗi: "Failed to load url /src/main.tsx"
→ Chưa set `NODE_ENV=production`

### Lỗi: 404 trên images/videos  
→ Chưa copy `attached_assets` vào `dist/`

### Lỗi: "Could not find the build directory"
→ Chưa chạy `vite build`

### Lỗi: Database connection failed
→ Kiểm tra `.env` trong `dist/` folder
