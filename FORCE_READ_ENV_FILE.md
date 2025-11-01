# ✅ FIXED: Force Read NODE_ENV from .env File

## 🎯 Vấn Đề

Trước đây, code đọc `NODE_ENV` từ `process.env.NODE_ENV`. Trong production server, nếu không export biến này, app sẽ:
- ❌ `isProduction = false` 
- ❌ Upload vào `/dist/attached_assets/` (sai!)
- ❌ Phải export `NODE_ENV=production` mỗi lần restart

## ✅ Giải Pháp

**File: `server/fileUpload.ts`**

Giống như `server/db.ts`, giờ code **force đọc NODE_ENV từ file .env**:

```typescript
// IMPORTANT: Force read NODE_ENV from .env file
// This prevents issues when NODE_ENV is not exported in production environment
let nodeEnv = process.env.NODE_ENV;

try {
  // Try reading from current directory first, then parent directory (for dist/)
  let envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    // If running from dist/, try parent directory
    envPath = path.resolve(process.cwd(), '..', '.env');
  }
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/^NODE_ENV=(.+)$/m);
    if (match && match[1]) {
      nodeEnv = match[1].trim();
      console.log('✅ Using NODE_ENV from .env file:', nodeEnv);
    }
  }
} catch (error) {
  console.log('⚠️ Could not read NODE_ENV from .env file, using environment variable:', nodeEnv);
}

const isProduction = nodeEnv === 'production';
```

## 🔍 Cách Hoạt Động

### 1. Tìm File .env

Code thử 2 vị trí:
1. **Current directory** (`./env`) - cho development mode
2. **Parent directory** (`../env`) - cho production mode (server chạy từ dist/)

### 2. Parse NODE_ENV

Đọc file và extract giá trị `NODE_ENV` bằng regex:
```javascript
NODE_ENV=production  → nodeEnv = "production"
```

### 3. Set isProduction

```javascript
const isProduction = nodeEnv === 'production';
```

### 4. Upload Path Logic

```javascript
const attachedAssetsDir = isProduction
  ? path.join(__dirname, '..', 'attached_assets')  // Production: ../attached_assets
  : path.join(process.cwd(), 'attached_assets');    // Development: ./attached_assets
```

## 📂 Production File Structure

```
/var/www/vhosts/humspizza.com/httpdocs/
├── .env                      ← NODE_ENV=production
│   NODE_ENV=production
│   DATABASE_URL=postgresql://...
│
├── attached_assets/          ← Files stored here
│   ├── uuid1.mp4
│   └── uuid2.jpg
│
└── dist/                     ← Server runs from here
    ├── index.js
    └── .env (optional)       ← Can also put .env here
```

## ✅ Verification

### Development Mode

```bash
# .env file
NODE_ENV=development

# Server logs
✅ Using NODE_ENV from .env file: development
📁 Assets upload path: /home/runner/workspace/attached_assets
📁 Assets serve path: /home/runner/workspace/attached_assets
```

### Production Mode (Without Export)

```bash
# NO export NODE_ENV needed!

# .env file
NODE_ENV=production

# Server logs
✅ Using NODE_ENV from .env file: production
📁 Assets upload path: /var/www/.../attached_assets  # ../attached_assets from dist/
```

## 🚀 Production Deployment

### Before (Required Export)

```bash
❌ export NODE_ENV=production  # Required every time!
cd /var/www/.../dist
node index.js
```

### After (Automatic)

```bash
✅ # No export needed!
cd /var/www/.../httpdocs

# Ensure .env exists
cat > .env << EOF
NODE_ENV=production
DATABASE_URL=postgresql://...
EOF

# Start app
cd dist
node index.js

# Will automatically read NODE_ENV from ../env
```

## 📋 Checklist

Trên production server:

- [x] File `.env` tồn tại (ở root hoặc trong dist/)
- [x] `.env` có dòng `NODE_ENV=production`
- [x] Không cần export biến môi trường
- [x] Upload path tự động: `../attached_assets/`
- [x] Database URL cũng đọc từ `.env`

## 🎯 Summary

### Trước
- ❌ Phải export `NODE_ENV=production`
- ❌ Nếu quên export → upload sai path
- ❌ Mỗi lần restart phải nhớ export

### Sau
- ✅ Tự động đọc từ file `.env`
- ✅ Không cần export biến môi trường
- ✅ Upload đúng path ngay cả khi không export
- ✅ Consistent với cách đọc DATABASE_URL

## 🔗 Related Files

- `server/db.ts` - Force read DATABASE_URL from .env
- `server/fileUpload.ts` - Force read NODE_ENV from .env
- `server/index.ts` - Uses fileUpload module

---

**Giờ production server không cần export NODE_ENV nữa - chỉ cần file .env!** 🎉
