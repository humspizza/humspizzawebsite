# Fix: Assets Path Mismatch trong Production Build

## 🐛 Vấn Đề

Khi chạy production build (`npm run build` và `node dist/index.js`), hình ảnh và video upload lên website **không hiển thị** mặc dù upload thành công.

### Triệu Chứng:

✅ **Upload thành công:**
```
File được lưu vào: attached_assets/221af01c-77ec-4094-85b3-db1c8386720c.mp4
```

❌ **Nhưng không hiển thị trên website:**
```
Request: /api/assets/221af01c-77ec-4094-85b3-db1c8386720c.mp4
Response: 404 Not Found
```

---

## 🔍 Nguyên Nhân

### Code Cũ (SAI):

**Upload Path (fileUpload.ts):**
```typescript
const attachedAssetsDir = path.join(process.cwd(), 'attached_assets');
// → Upload vào: /workspace/attached_assets/ ✅
```

**Serve Path (routes.ts) - PRODUCTION:**
```typescript
const assetsPath = isDev
  ? path.join(process.cwd(), 'attached_assets')
  : path.join(process.cwd(), '..', 'attached_assets'); // SAI!
// → Serve từ: /workspace/../attached_assets/ = /attached_assets/ ❌
```

### Tại Sao Lỗi?

Code giả định khi chạy production, `process.cwd()` sẽ là `dist/`, nhưng thực tế:

```bash
# Khi chạy:
node dist/index.js

# process.cwd() vẫn là thư mục root, KHÔNG phải dist/
process.cwd() = /var/www/humpizza  (không phải /var/www/humpizza/dist)
```

→ **Upload vào path này, nhưng serve từ path khác = MISMATCH!**

---

## ✅ Giải Pháp

### Code Mới (ĐÚNG):

**Upload Path:** (không đổi)
```typescript
const attachedAssetsDir = path.join(process.cwd(), 'attached_assets');
// → /workspace/attached_assets/
```

**Serve Path:** (ĐÃ SỬA)
```typescript
const assetsPath = path.join(process.cwd(), 'attached_assets');
// → /workspace/attached_assets/ (GIỐNG upload path!)
```

### Kết Quả:

✅ **Upload Path = Serve Path → Hoạt động hoàn hảo!**

| Mode | process.cwd() | Upload Path | Serve Path | Status |
|------|---------------|-------------|------------|---------|
| Development | `/workspace` | `/workspace/attached_assets` | `/workspace/attached_assets` | ✅ Match |
| Production | `/workspace` | `/workspace/attached_assets` | `/workspace/attached_assets` | ✅ Match |

---

## 🧪 Test & Verification

### Test Script 1: Verify Assets Path Logic

```bash
node test-assets-path.js
```

**Output mong đợi:**
```
✅ Assets path: /home/runner/workspace/attached_assets
📁 Upload path: /home/runner/workspace/attached_assets (same for both)
📁 Serve path: /home/runner/workspace/attached_assets (same for both)
```

### Test Script 2: Full Production Test

```bash
./test-production-assets.sh
```

**Output mong đợi:**
```
✅ Build successful
✅ attached_assets directory exists
✅ Test file created: attached_assets/test-file.txt
```

---

## 📋 Deployment Checklist

Khi deploy lên production server:

- [ ] 1. Upload code lên server
- [ ] 2. Tạo thư mục `attached_assets/` (nếu chưa có)
- [ ] 3. Build: `npm run build`
- [ ] 4. **Quan trọng:** Chạy từ thư mục root: `node dist/index.js`
- [ ] 5. Kiểm tra logs thấy: `📁 Assets path: /var/www/humpizza/attached_assets`
- [ ] 6. Upload file test và verify trên website

### ⚠️ LƯU Ý QUAN TRỌNG:

**ĐÚNG:**
```bash
cd /var/www/humpizza
node dist/index.js
# → process.cwd() = /var/www/humpizza
# → Assets path = /var/www/humpizza/attached_assets ✅
```

**SAI:**
```bash
cd /var/www/humpizza/dist
node index.js
# → process.cwd() = /var/www/humpizza/dist
# → Assets path = /var/www/humpizza/dist/attached_assets ❌ SAIIII!
```

---

## 🗂️ Cấu Trúc Thư Mục Production

```
/var/www/humpizza/
├── dist/
│   ├── index.js          (Backend code)
│   ├── client/           (Frontend static files)
│   └── ...
├── attached_assets/      ← Upload và Serve từ đây
│   ├── abc123.mp4
│   ├── def456.jpg
│   └── ...
├── node_modules/
├── .env
└── package.json
```

**Chạy production:**
```bash
cd /var/www/humpizza
NODE_ENV=production node dist/index.js
```

---

## 🔄 Upload/Serve Flow

### Example: Upload Video

1. **User upload video qua admin panel**
   ```
   POST /api/admin/home-content/hero-video
   File: cooking.mp4
   ```

2. **Server save file**
   ```
   Path: /var/www/humpizza/attached_assets/221af01c.mp4
   Returns: { url: "/api/assets/221af01c.mp4" }
   ```

3. **Frontend request video**
   ```
   GET /api/assets/221af01c.mp4
   ```

4. **Server serve file**
   ```
   Read from: /var/www/humpizza/attached_assets/221af01c.mp4
   Response: 200 OK + video data
   ```

✅ **Perfect match! Video hiển thị thành công!**

---

## 🆘 Troubleshooting

### Vấn đề: Video vẫn 404 sau khi fix

**Giải pháp:**

```bash
# 1. Kiểm tra file có tồn tại không
ls -lh attached_assets/

# 2. Kiểm tra assets path trong logs
# Phải thấy: 📁 Assets path: /var/www/humpizza/attached_assets

# 3. Test serve trực tiếp
curl -I http://localhost:5000/api/assets/221af01c.mp4

# 4. Nếu vẫn lỗi, restart server
pm2 restart humpizza-api
```

### Vấn đề: Assets path vẫn sai

**Nguyên nhân:** Bạn đang chạy từ thư mục `dist/`

**Giải pháp:**
```bash
# SAI:
cd /var/www/humpizza/dist
node index.js

# ĐÚNG:
cd /var/www/humpizza
node dist/index.js
```

---

## ✅ Kết Luận

**Fix đã được áp dụng:**
- ✅ Code: `server/routes.ts` line 1737
- ✅ Documentation: `replit.md`
- ✅ Deployment Guide: `DEPLOY_PRODUCTION_SERVER.md`
- ✅ Test Scripts: `test-assets-path.js`, `test-production-assets.sh`

**Kết quả:**
- ✅ Upload và Serve dùng cùng 1 path
- ✅ Hoạt động trong cả development và production
- ✅ Không cần thay đổi code khi deploy

**Next Steps:**
1. Test trên development: ✅ Passed
2. Test trên production: Chờ deploy
3. Verify với user upload thực tế

🎉 **Problem Solved!**
