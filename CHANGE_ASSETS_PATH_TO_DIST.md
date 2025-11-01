# ✅ Thay Đổi Assets Path: `/api/assets/*` → `/dist/attached_assets/*`

## 🎯 Lý Do Thay Đổi

**Môi trường deployment:** Nginx + Passenger

**Vấn đề:**
- Server chạy từ thư mục `dist/` (không phải root)
- Files được upload vào: `dist/attached_assets/`
- URL cũ `/api/assets/*` không match với cấu trúc thư mục thực tế

**Giải pháp:**
- Thay đổi URL từ `/api/assets/*` thành `/dist/attached_assets/*`
- Đảm bảo URL path match với file system path

---

## 📝 Các Files Đã Thay Đổi

### 1. Backend Files

#### `server/fileUpload.ts` (line 71-72)
```typescript
// OLD:
export function getUploadedFileUrl(filename: string): string {
  return `/api/assets/${filename}`;
}

// NEW:
export function getUploadedFileUrl(filename: string): string {
  return `/dist/attached_assets/${filename}`;
}
```

#### `server/routes.ts` (line 1742)
```typescript
// OLD:
app.use('/api/assets', express.static(assetsPath, { ... }));

// NEW:
app.use('/dist/attached_assets', express.static(assetsPath, { ... }));
```

#### `server/routes.ts` (line 1528)
```typescript
// OLD:
videoUrl = `/api/assets/${video.fileName}`;

// NEW:
videoUrl = `/dist/attached_assets/${video.fileName}`;
```

### 2. Frontend Files

#### `client/src/lib/imageUtils.ts` (line 17)
```typescript
// OLD:
if (url.startsWith('/api/assets/')) {
  return url;
}

// NEW:
if (url.startsWith('/dist/attached_assets/')) {
  return url;
}
```

#### `client/src/pages/admin/blog-management.tsx` (line 315)
```typescript
// OLD:
if (match[1].startsWith('/objects/') || match[1].startsWith('/api/assets/')) {

// NEW:
if (match[1].startsWith('/objects/') || match[1].startsWith('/dist/attached_assets/')) {
```

---

## 🧪 Testing

### Development Mode
```bash
npm run dev
# Server serves from: /api/assets/ (development routes)
```

### Production Mode
```bash
npm run build
node dist/index.js
# Server serves from: /dist/attached_assets/ (production routes)
```

### Test Upload
1. Upload một video/hình ảnh qua admin panel
2. Kiểm tra URL trả về: `/dist/attached_assets/{uuid}.ext`
3. Verify file tồn tại tại: `dist/attached_assets/{uuid}.ext`
4. Test trên website: File phải hiển thị đúng

### Expected Behavior

**Upload Response:**
```json
{
  "url": "/dist/attached_assets/abc-123-xyz.mp4"
}
```

**File System:**
```
dist/
├── attached_assets/
│   └── abc-123-xyz.mp4  ← File exists here
└── index.js
```

**Browser Request:**
```
GET /dist/attached_assets/abc-123-xyz.mp4
→ 200 OK (hoặc 206 Partial Content cho video)
```

---

## 🚀 Deployment Instructions

### Bước 1: Build Production

```bash
npm run build
```

### Bước 2: Upload Code Lên Server

```bash
# Sử dụng git, FTP, hoặc scp
scp -r dist/ user@server:/var/www/humpizza/
```

### Bước 3: Start Server (Nginx + Passenger)

**QUAN TRỌNG:** Server phải chạy từ thư mục `dist/`

Passenger config (ví dụ):
```ruby
# config.ru hoặc passenger config
app_root '/var/www/humpizza/dist'
startup_file 'index.js'
```

Hoặc chạy manual từ thư mục dist:
```bash
cd /var/www/humpizza/dist
node index.js
```

### Bước 4: Verify

```bash
# Kiểm tra assets directory
ls -lh /var/www/humpizza/dist/attached_assets/

# Test API
curl -I http://localhost:5000/dist/attached_assets/test-file.mp4

# Kết quả mong đợi: 200 OK hoặc 206 Partial Content
```

---

## 📊 URL Mapping

| Loại File | Upload Path | Serve URL | File System Path |
|-----------|-------------|-----------|------------------|
| Video | Upload qua API | `/dist/attached_assets/abc.mp4` | `dist/attached_assets/abc.mp4` |
| Image | Upload qua API | `/dist/attached_assets/def.jpg` | `dist/attached_assets/def.jpg` |
| Static | Tĩnh từ build | `/public/...` | `dist/public/...` |

---

## 🔄 Migration Notes

### Nếu Bạn Có Data Cũ

Nếu database có URLs cũ dạng `/api/assets/*`:

**Option 1: Update Database (Khuyến nghị)**

```sql
-- Update all old URLs to new format
UPDATE home_content 
SET hero_video_url = REPLACE(hero_video_url, '/api/assets/', '/dist/attached_assets/')
WHERE hero_video_url LIKE '/api/assets/%';

UPDATE home_content 
SET reservation_video_url = REPLACE(reservation_video_url, '/api/assets/', '/dist/attached_assets/')
WHERE reservation_video_url LIKE '/api/assets/%';

UPDATE menu_items 
SET image_url = REPLACE(image_url, '/api/assets/', '/dist/attached_assets/')
WHERE image_url LIKE '/api/assets/%';

UPDATE blog_posts 
SET image_url = REPLACE(image_url, '/api/assets/', '/dist/attached_assets/')
WHERE image_url LIKE '/api/assets/%';

-- Repeat for all tables with asset URLs
```

**Option 2: Redirect (Temporary)**

Thêm redirect rule trong Nginx:
```nginx
# Temporary redirect for old URLs
location /api/assets/ {
    rewrite ^/api/assets/(.*)$ /dist/attached_assets/$1 permanent;
}
```

---

## ⚠️ Breaking Changes

**CẢNH BÁO:** Thay đổi này là **BREAKING CHANGE**!

**Ảnh hưởng:**
- ✅ Code mới: URLs tự động dùng `/dist/attached_assets/`
- ❌ Data cũ: URLs trong database vẫn là `/api/assets/` → Cần migrate

**Giải pháp:**
1. Update database URLs (SQL script ở trên)
2. Hoặc thêm redirect rule trong Nginx
3. Re-upload assets nếu cần

---

## 🆘 Troubleshooting

### Vấn đề: 404 Not Found

**Nguyên nhân:**
- File không tồn tại trong `dist/attached_assets/`
- Server không serve từ đúng path

**Giải pháp:**
```bash
# Kiểm tra file tồn tại
ls -lh dist/attached_assets/abc-123.mp4

# Kiểm tra server logs
# Phải thấy: 📁 Assets path: /var/www/humpizza/dist/attached_assets

# Test serve trực tiếp
curl -I http://localhost:5000/dist/attached_assets/abc-123.mp4
```

### Vấn đề: URL Vẫn Là `/api/assets/`

**Nguyên nhân:**
- Code cũ chưa rebuild
- Database có URLs cũ

**Giải pháp:**
```bash
# Rebuild
npm run build

# Restart server
pm2 restart app

# Update database URLs (SQL ở trên)
```

### Vấn đề: Server Chạy Từ Sai Thư Mục

**Nguyên nhân:**
- Passenger/PM2 config sai working directory

**Giải pháp:**
```bash
# Passenger: Update config.ru
app_root '/var/www/humpizza/dist'

# PM2: Chỉ định cwd
pm2 start index.js --name app --cwd /var/www/humpizza/dist
```

---

## ✅ Checklist

Sau khi deploy, verify:

- [ ] Server chạy từ thư mục `dist/`
- [ ] Assets path logs: `📁 Assets path: .../dist/attached_assets`
- [ ] Upload file mới → URL trả về `/dist/attached_assets/...`
- [ ] File được lưu vào `dist/attached_assets/`
- [ ] Request `/dist/attached_assets/file.mp4` → 200/206 OK
- [ ] Website hiển thị video/hình ảnh đúng
- [ ] Database URLs đã migrate (nếu có data cũ)

---

## 📌 Summary

**Thay đổi:**
- ❌ OLD: `/api/assets/{filename}`
- ✅ NEW: `/dist/attached_assets/{filename}`

**Lý do:**
- Nginx + Passenger deployment
- Server chạy từ `dist/` directory
- Match URL với file system path

**Impact:**
- Backend: `server/fileUpload.ts`, `server/routes.ts`
- Frontend: `client/src/lib/imageUtils.ts`, blog management
- Database: Cần migrate URLs cũ

**Next Steps:**
1. ✅ Code đã update
2. ✅ Build đã test
3. 🔄 Deploy lên production server
4. 🔄 Migrate database URLs (nếu cần)
5. ✅ Verify trên production

🎉 **Hoàn tất!**
