# ✅ FIXED: Assets Path Issue

## 🐛 Vấn Đề Đã Phát Hiện

Khi chạy `npm run build`, URLs vẫn trả về `/api/assets/...` thay vì `/dist/attached_assets/...`

## 🔍 Nguyên Nhân

1. **ES Modules Issue**: Code dùng `__dirname` nhưng trong ES modules (`type: "module"`), `__dirname` không tồn tại
2. **Duplicate Code**: Có 2 nơi serve static files - trong `routes.ts` và `index.ts`
3. **Wrong Path in Production**: Code dùng `process.cwd()` nên trong production (chạy từ `dist/`) đường dẫn sai

## ✅ Các Fix Đã Áp Dụng

### 1. **Fixed ES Modules `__dirname`**
   
**File: `server/index.ts`**
```typescript
import { fileURLToPath } from "url";

// ES modules compatibility: create __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

### 2. **Fixed Production/Development Paths**

**File: `server/fileUpload.ts`**
```typescript
const isProduction = process.env.NODE_ENV === 'production';
const attachedAssetsDir = isProduction
  ? path.join(__dirname, '..', 'attached_assets')  // dist/../attached_assets
  : path.join(process.cwd(), 'attached_assets');    // ./attached_assets
```

### 3. **Removed Duplicate Code**

**File: `server/routes.ts`**
- ❌ Xóa: Duplicate `express.static()` serving
- ✅ Giữ: Chỉ có trong `index.ts`

### 4. **Added Debug Logging**

```
📁 Assets upload path: /path/to/attached_assets
📁 Assets serve path: /path/to/attached_assets
```

## 🧪 Test Results

### Development Mode
```bash
$ curl http://localhost:5000/api/hero-videos/status
{
  "url": "/dist/attached_assets/uuid.mp4"  ✅
}
```

### Production Build
```bash
$ npm run build
$ cd dist && NODE_ENV=production node index.js
📁 Assets upload path: /home/runner/workspace/attached_assets  ✅
📁 Assets serve path: /home/runner/workspace/attached_assets   ✅

$ curl http://localhost:5000/api/hero-videos/status
{
  "url": "/dist/attached_assets/uuid.mp4"  ✅
}
```

## 📁 Final Architecture

```
project-root/
├── attached_assets/           ← Files stored here (always!)
│   ├── uuid1.mp4
│   └── uuid2.jpg
└── dist/                      ← Build output
    ├── index.js              ← Server runs here
    └── public/
```

### Development (server runs from root)
```javascript
Upload to: ./attached_assets/
Serve from: ./attached_assets/
URL: /dist/attached_assets/uuid.mp4
```

### Production (server runs from dist/)
```javascript
Upload to: ../attached_assets/  (= project-root/attached_assets/)
Serve from: ../attached_assets/
URL: /dist/attached_assets/uuid.mp4
```

## ✅ Verification Checklist

- [x] ES modules `__dirname` fixed
- [x] Production paths correct (`../attached_assets`)
- [x] Development paths correct (`./attached_assets`)
- [x] Duplicate code removed
- [x] URLs in database: `/dist/attached_assets/...`
- [x] API returns correct URLs
- [x] Files serve successfully (HTTP 200)
- [x] Build successful without errors
- [x] No need to copy files to dist/

## 🚀 How to Deploy

```bash
# 1. Build
npm run build

# 2. Upload entire project folder
rsync -avz attached_assets/ dist/ package.json .env user@server:/var/www/app/

# 3. Run on server
cd /var/www/app/dist
NODE_ENV=production node index.js
```

**Important**: Upload `attached_assets/` at PROJECT ROOT, không phải trong `dist/`!

## 📝 Files Modified

- ✅ `server/index.ts` - Added `__dirname` compatibility, serve path
- ✅ `server/fileUpload.ts` - Fixed upload path for production
- ✅ `server/routes.ts` - Removed duplicate static serving
- ✅ `test-production-urls.sh` - Created test script
- ✅ Documentation updated

## 🎯 Result

**All URLs now correctly return `/dist/attached_assets/...` in both development and production!** 🎉
