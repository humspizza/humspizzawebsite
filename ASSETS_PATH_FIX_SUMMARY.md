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

### 4. **Build Process Simplified**
   - ✅ **NO NEED to copy files!** Server reads from `../attached_assets/` in production
   - ✅ Files stay at project root: `attached_assets/`
   - ✅ Build only needs: `npm run build` (no extra steps)

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

# 2. Verify folder structure
ls -la attached_assets/  # Files at project root
ls -la dist/             # Build output

# 3. Deploy to server
# Upload ENTIRE project folder (both attached_assets/ and dist/)
# Server runs from dist/ and reads files from ../attached_assets/
```

## ⚠️ Important Notes

### File Upload Flow
```
User uploads file
    ↓
Saved to: attached_assets/{uuid}.{ext} (at project root)
    ↓
Database stores: /dist/attached_assets/{uuid}.{ext}
    ↓
Development: Express serves from ./attached_assets/
Production: Express serves from ../attached_assets/ (relative to dist/)
```

### Why `/dist/attached_assets/` in Database?
- Public URL path for consistency across dev and production
- Development: `/dist/attached_assets/` → `./attached_assets/`
- Production: `/dist/attached_assets/` → `../attached_assets/` (relative to dist/)

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
1. Verify files exist at root: `ls attached_assets/`
2. Check folder structure:
   ```
   project-root/
   ├── attached_assets/  ← Files here!
   └── dist/
       └── index.js      ← Server runs here, reads ../attached_assets/
   ```
3. Ensure entire project folder is deployed (not just dist/)

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
