# Production Build Instructions

## Important: Asset Files Setup

**KHÔNG CẦN copy `attached_assets` vào `dist/`!** Server tự động đọc từ `../attached_assets/` (relative path).

## Deployment Checklist

1. **Build project:**
   ```bash
   npm run build
   ```

2. **Verify folder structure:**
   ```
   project-root/
   ├── attached_assets/  (uploaded files - keep at root!)
   └── dist/
       ├── index.js      (backend)
       └── public/       (frontend)
   ```

3. **Upload to server:**
   - Upload entire project folder (including both `attached_assets/` and `dist/`)
   - Server will run from `dist/` and read files from `../attached_assets/`

4. **Configure Nginx:**
   ```nginx
   # Option 1: Let Express serve assets (recommended)
   location /dist/attached_assets/ {
     proxy_pass http://localhost:PORT;
   }
   
   # Option 2: Nginx serve directly (faster)
   location /dist/attached_assets/ {
     alias /path/to/your/app/attached_assets/;
     access_log off;
     expires max;
   }
   ```

## Important Notes

- **Assets path:** All database URLs use `/dist/attached_assets/...`
- **Upload location:** Files are uploaded to `attached_assets/` at project root
- **Serve location:** Nginx serves from `dist/attached_assets/`
- **Build process:** Copy `attached_assets/` → `dist/attached_assets/` after each build

## Troubleshooting

### Issue: Files not displaying after deployment

**Solution:**
1. Verify `dist/attached_assets/` exists on server
2. Check file permissions (644 for files, 755 for directories)
3. Clear browser cache completely
4. Check Nginx access logs

### Issue: Browser shows old URLs

**Solution:**
Clear browser cache completely:
- Chrome: DevTools → Right-click Refresh → "Empty Cache and Hard Reload"
- Or: Ctrl+Shift+Delete → Clear "Cached images and files"
