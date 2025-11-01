# ✅ FIXED: Database Connection & Media URLs

## 🎯 Tổng Quan

Đã fix thành công 2 vấn đề chính:
1. **Database Connection** - App đang connect đúng custom PostgreSQL server
2. **Media URLs** - Tất cả URLs đã được migrate từ `/api/assets/` sang `/dist/attached_assets/`

---

## 🔧 VẤN ĐỀ 1: Database Connection

### ❌ Vấn Đề Ban Đầu

**File `.env` có:**
```env
DATABASE_URL=postgresql://hum94111_pizza_user:***@s88d63.cloudnetwork.vn/hum94111_pizza
```

**Nhưng app thực tế connect tới:**
```
Database: neondb (Replit's built-in Neon database)
Server: ep-gentle-salad-ad5tsrah.c-2.us-east-1.aws.neon.tech
```

### 🔍 Nguyên Nhân

Replit environment variable `DATABASE_URL` đang **override** file `.env`!

Environment variables của Replit có **priority cao hơn** file `.env`.

### ✅ Giải Pháp

**File: `server/db.ts`**

Thêm code force đọc `DATABASE_URL` từ file `.env`:

```typescript
import { readFileSync } from 'fs';
import { resolve } from 'path';

// IMPORTANT: Force use custom database by reading .env file directly
// This prevents Replit's environment variable from overriding our config
let databaseUrl = process.env.DATABASE_URL;

// Force override: Read DATABASE_URL from .env file if exists
try {
  const envPath = resolve(process.cwd(), '.env');
  const envContent = readFileSync(envPath, 'utf-8');
  const match = envContent.match(/^DATABASE_URL=(.+)$/m);
  if (match && match[1]) {
    databaseUrl = match[1].trim();
    console.log('✅ Using DATABASE_URL from .env file (not Replit environment)');
  }
} catch (error) {
  console.log('⚠️ Could not read .env file, using environment variable');
}
```

### 📊 Verification

**Server logs:**
```
✅ Using DATABASE_URL from .env file (not Replit environment)
🔓 SSL disabled for custom database connection
```

**Connected to:**
- Database: `hum94111_pizza`
- User: `hum94111_pizza_user`
- Server: `s88d63.cloudnetwork.vn`

---

## 🔧 VẤN ĐỀ 2: Media URLs

### ❌ Vấn Đề Ban Đầu

Database có URLs cũ với format sai:
```json
{
  "heroVideoUrl": "/api/assets/uuid.mp4",
  "imageUrl": "/api/assets/uuid.jpg"
}
```

### 🔍 Nguyên Nhân

URLs được lưu trước khi migrate từ `/api/assets/` sang `/dist/attached_assets/`

### ✅ Giải Pháp

**File: `fix-media-urls.ts`**

Script migration tự động update tất cả URLs trong database:

```typescript
// Fix home_content table
UPDATE home_content
SET 
  hero_video_url = REPLACE(hero_video_url, '/api/assets/', '/dist/attached_assets/'),
  reservation_video_url = REPLACE(...),
  pending_hero_video_url = REPLACE(...),
  pending_reservation_video_url = REPLACE(...)

// Fix menu_items table
UPDATE menu_items
SET image_url = REPLACE(image_url, '/api/assets/', '/dist/attached_assets/')

// Fix blog_posts table
UPDATE blog_posts
SET image_url = REPLACE(image_url, '/api/assets/', '/dist/attached_assets/')

// Fix page_seo table
UPDATE page_seo
SET og_image_url = REPLACE(og_image_url, '/api/assets/', '/dist/attached_assets/')
```

### 📊 Migration Results

```
✅ home_content updated
✅ menu_items updated
✅ blog_posts updated
✅ page_seo updated

Remaining old URLs: { 
  home_old: '0', 
  menu_old: '0', 
  blog_old: '0', 
  seo_old: '0' 
}
```

### 📝 Additional Fixes

**File: `client/src/pages/admin/seo-management.tsx`**

Fixed placeholder text:
```typescript
// Before:
placeholder="/api/assets/..."

// After:
placeholder="/dist/attached_assets/..."
```

---

## ✅ Verification Tests

### 1. Development Mode

```bash
# Server logs
✅ Using DATABASE_URL from .env file (not Replit environment)
🔓 SSL disabled for custom database connection
📁 Assets upload path: /home/runner/workspace/attached_assets
📁 Assets serve path: /home/runner/workspace/attached_assets

# API responses
$ curl http://localhost:5000/api/hero-videos/status
{
  "url": "/dist/attached_assets/e708dd50-6089-4e64-9620-8e429bb5cfe4.mp4" ✅
}

$ curl http://localhost:5000/api/menu-items
{
  "imageUrl": "/dist/attached_assets/ed7fec0d-bd2f-49fe-b0a8-698bb1f78ac7.png" ✅
}
```

### 2. Production Build

```bash
$ npm run build
✓ built successfully

$ bash test-production-urls.sh
✅ Build successful
✅ URLs are correct: /dist/attached_assets/...
📁 Assets upload path: /home/runner/workspace/attached_assets
📁 Assets serve path: /home/runner/workspace/attached_assets
```

---

## 📂 Files Modified

1. **`server/db.ts`** - Added force `.env` file reading for DATABASE_URL
2. **`client/src/pages/admin/seo-management.tsx`** - Fixed placeholder text
3. **`fix-media-urls.ts`** - Created migration script (can be deleted after running)

---

## 🚀 Production Deployment

### Pre-deployment Checklist

- [x] Database connection verified (s88d63.cloudnetwork.vn)
- [x] All media URLs migrated to `/dist/attached_assets/`
- [x] Production build tested successfully
- [x] No remaining `/api/assets/` URLs in database

### Deployment Steps

```bash
# 1. Build
npm run build

# 2. Upload to production server
# - Upload: attached_assets/ + dist/ + package.json + .env

# 3. Run on server
cd /var/www/app/dist
NODE_ENV=production node index.js
```

### Expected Server Logs

```
✅ Using DATABASE_URL from .env file (not Replit environment)
🔓 SSL disabled for custom database connection
📁 Assets upload path: /var/www/app/attached_assets
📁 Assets serve path: /var/www/app/attached_assets
✓ User seeding completed
[express] serving on port 5000
```

---

## 📋 Summary

### Database Connection
- ✅ Force reads DATABASE_URL from `.env` file
- ✅ Ignores Replit's environment variable
- ✅ Connects to: `s88d63.cloudnetwork.vn/hum94111_pizza`
- ✅ SSL disabled (prevents certificate mismatch)

### Media URLs
- ✅ All tables migrated: `home_content`, `menu_items`, `blog_posts`, `page_seo`
- ✅ Old format: `/api/assets/...` → New format: `/dist/attached_assets/...`
- ✅ Zero remaining old URLs
- ✅ Placeholder texts updated

### Testing
- ✅ Development mode verified
- ✅ Production build tested
- ✅ API endpoints returning correct URLs
- ✅ Files serving successfully

---

## 🎉 Result

**App hiện đang:**
1. Connect đúng custom PostgreSQL server (s88d63.cloudnetwork.vn)
2. Serve tất cả media files từ đúng path (`/dist/attached_assets/`)
3. Hoạt động ổn định trong cả development và production mode

**Sẵn sàng deploy lên production!** 🚀
