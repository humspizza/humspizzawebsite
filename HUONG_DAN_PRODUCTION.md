# Hướng Dẫn Sửa Lỗi Production Build & Preview Mode

## 🐛 Vấn Đề

Khi chạy `npm run build` và `npm run start`, gặp lỗi 404 và ảnh không hiển thị trong preview mode.

## 🔍 Nguyên Nhân

1. **Development mode**: Server chạy từ `/home/runner/workspace/`
   - Assets path: `/home/runner/workspace/attached_assets/` ✅

2. **Production mode**: Server chạy từ `/home/runner/workspace/dist/`
   - Assets path CŨ: `/home/runner/workspace/dist/attached_assets/` ❌
   - Assets path MỚI: `/home/runner/workspace/attached_assets/` ✅

3. **Vấn đề**: 
   - Folder `dist/attached_assets/` chỉ có file cũ (favicon, logo)
   - Không có uploaded images mới (các file được upload qua admin)
   - Production build không tự động copy `attached_assets/` vào `dist/`

## ✅ Giải Pháp Đã Thực Hiện

### 1. Sửa Assets Path Handling (server/routes.ts)

```javascript
// CŨ - Luôn trỏ vào cwd/attached_assets
const assetsPath = path.join(process.cwd(), 'attached_assets');

// MỚI - Phân biệt dev và production
const isDev = process.env.NODE_ENV === 'development';
const assetsPath = isDev
  ? path.join(process.cwd(), 'attached_assets')           // Dev: /workspace/attached_assets
  : path.join(process.cwd(), '..', 'attached_assets');    // Prod: /workspace/attached_assets (từ dist/ lên 1 cấp)
```

### 2. Thêm Debug Logging

```javascript
console.log('📁 Assets path:', assetsPath);
console.log('📁 Current working directory:', process.cwd());
console.log('📁 NODE_ENV:', process.env.NODE_ENV);
```

## 🧪 Cách Test Production Mode

### Option 1: Sử dụng Script Tự Động

```bash
./test-production.sh
```

### Option 2: Test Thủ Công

```bash
# 1. Build project
npm run build

# 2. Start production server
npm run start

# 3. Test trong tab mới
curl http://localhost:5000/api/assets/26e34fbd-4bf6-477e-8caf-52c5d1d86286.png
curl http://localhost:5000/api/seo/pages/home/vi
```

## 📋 Checklist Kiểm Tra

- [ ] `npm run build` chạy thành công không lỗi
- [ ] `npm run start` khởi động server production
- [ ] Logs hiển thị đúng Assets path
- [ ] Ảnh homepage hiển thị (`/api/assets/26e34fbd-...png`)
- [ ] OG images hiển thị đúng
- [ ] API endpoints trả về 200 (không 404)

## 🔧 Troubleshooting

### Lỗi: "Cannot find module"
```bash
# Xóa dist và build lại
rm -rf dist/
npm run build
```

### Lỗi: Images 404 trong production
```bash
# Kiểm tra assets path trong logs
grep "Assets path" logs.txt

# Nếu path sai, kiểm tra NODE_ENV
echo $NODE_ENV
```

### Preview Mode không hiển thị ảnh

Preview mode có thể đang chạy production build. Giải pháp:
1. Đảm bảo `attached_assets/` folder tồn tại ở root
2. Kiểm tra permissions: `ls -la attached_assets/`
3. Restart preview server

## 📝 Lưu Ý Quan Trọng

1. **KHÔNG XÓA** folder `attached_assets/` ở root level
2. **KHÔNG DI CHUYỂN** uploaded images vào `dist/attached_assets/`
3. Production server sẽ **TỰ ĐỘNG** tìm assets ở root level
4. Mỗi lần upload ảnh mới, nó sẽ lưu vào `attached_assets/` (root level)

## 🚀 Deploy to Production (Publishing)

Khi publish app lên production (Replit Deployments):

1. Đảm bảo `attached_assets/` folder được include
2. Set environment variable: `NODE_ENV=production`
3. Server sẽ tự động serve assets từ root level

## 🆘 Cần Giúp Đỡ?

Nếu vẫn gặp lỗi:
1. Chạy `./test-production.sh` và gửi kết quả
2. Kiểm tra logs: `grep "Assets path" <log_file>`
3. Kiểm tra folder: `ls -la attached_assets/ | head -10`
