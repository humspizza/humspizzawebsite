# Assets Path Migration Summary

## ✅ Completed Fixes

### 1. **Assets Serving Path Changed**
   - **Old path:** `/api/assets/*`
   - **New path:** `/dist/attached_assets/*`
   - **Reason:** Nginx + Passenger production deployment compatibility

### 2. **Backend Code Updated**
   - ✅ `server/fileUpload.ts`: `getUploadedFileUrl()` returns `/dist/attached_assets/`
   - ✅ `server/routes.ts`: Hero videos API returns new path
   - ✅ `server/index.ts`: Added middleware + static serving for `/dist/attached_assets/`

### 3. **Database URLs Updated**
   - ✅ All URLs in `home_content` table updated
   - ✅ All URLs in `menu_items` table updated
   - ✅ All URLs in `blog_posts` table updated
   - Migration SQL: `migrate-urls-to-dist.sql`

### 4. **Build Process Fixed**
   - ✅ Created script: `scripts/copy-assets-to-dist.js`
   - ✅ Script copies `attached_assets/` → `dist/attached_assets/` after build
   - ✅ Test passed: 55 files copied successfully

### 5. **Cache Headers Optimized**
   - ✅ Development: `no-cache` to force browser refresh
   - ✅ Production: Nginx will handle caching
   - ✅ Fixed cache-control conflicts

## 📝 Documentation Created

1. **BUILD_INSTRUCTIONS.md** - Complete production build guide
2. **CHANGE_ASSETS_PATH_TO_DIST.md** - Migration documentation
3. **migrate-urls-to-dist.sql** - Database migration script

## 🔧 How to Build for Production

```bash
# 1. Build project
npm run build

# 2. Copy assets to dist
node scripts/copy-assets-to-dist.js

# 3. Verify structure
ls -la dist/attached_assets/

# 4. Deploy to server
# Upload entire dist/ folder (including dist/attached_assets/)
```

## ⚠️ Important Notes

### File Upload Flow
```
User uploads file
    ↓
Saved to: attached_assets/{uuid}.{ext}
    ↓
Database stores: /dist/attached_assets/{uuid}.{ext}
    ↓
Development: Express serves from attached_assets/
Production: Nginx serves from dist/attached_assets/
```

### Why `/dist/attached_assets/` in Database?
- Production Nginx serves files from `dist/` directory
- URLs must match production serving path
- Development Express.static maps `/dist/attached_assets/` → `attached_assets/`

## 🐛 Troubleshooting

### Problem: Browser still shows old `/api/assets/` URLs

**Solution:**
1. **Clear browser cache completely:**
   - Chrome: DevTools → Right-click Refresh → "Empty Cache and Hard Reload"
   - Or: Ctrl+Shift+Delete → Clear "Cached images and files" → "All time"

2. **Verify API response:**
   ```bash
   curl http://localhost:5000/api/hero-videos/status
   # Should show: "url": "/dist/attached_assets/..."
   ```

3. **Test file serving:**
   ```bash
   curl -I http://localhost:5000/dist/attached_assets/{filename}
   # Should return: HTTP/1.1 200 OK
   ```

### Problem: Files not found after build

**Solution:**
1. Run copy script: `node scripts/copy-assets-to-dist.js`
2. Verify files exist: `ls dist/attached_assets/`
3. Check file permissions: `chmod 644 dist/attached_assets/*`

### Problem: Videos not playing

**Solution:**
1. Check file exists: `ls attached_assets/{filename}`
2. Check database URL is correct: `/dist/attached_assets/...`
3. Clear browser cache completely
4. Check Nginx logs for 404 errors

## ✅ Verification Checklist

- [x] Backend code returns `/dist/attached_assets/` URLs
- [x] Database URLs updated to new path
- [x] Build script copies files to `dist/attached_assets/`
- [x] Express.static serves files in development
- [x] Cache headers set to no-cache in development
- [x] Documentation complete

## 🚀 Next Steps

1. **Clear your browser cache completely**
2. Refresh the admin page
3. Videos should now display with new URLs
4. Test file uploads work correctly

If you still see old URLs after clearing cache, it's browser cache persistence. Try:
- Open in Incognito/Private window
- Use different browser
- Wait 5 minutes for cache to expire
