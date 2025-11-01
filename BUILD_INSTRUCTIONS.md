# Production Build Instructions

## Important: Asset Files Setup

Khi build cho production, cần copy thư mục `attached_assets` vào `dist/` để Nginx + Passenger có thể serve files.

### Cách 1: Tự động (Recommended)

Chạy lệnh sau để build và copy assets tự động:

```bash
npm run build && node scripts/copy-assets-to-dist.js
```

### Cách 2: Manual

Sau khi chạy `npm run build`, copy thủ công:

```bash
cp -r attached_assets dist/
```

## Deployment Checklist

1. **Build project:**
   ```bash
   npm run build
   ```

2. **Copy assets:**
   ```bash
   node scripts/copy-assets-to-dist.js
   ```

3. **Verify dist structure:**
   ```
   dist/
   ├── index.js          (backend)
   ├── public/           (frontend)
   └── attached_assets/  (uploaded files) ← MUST EXIST
   ```

4. **Upload to server:**
   - Upload entire `dist/` folder
   - Ensure `attached_assets/` is included

5. **Configure Nginx:**
   ```nginx
   location /dist/attached_assets/ {
     alias /path/to/your/app/dist/attached_assets/;
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
