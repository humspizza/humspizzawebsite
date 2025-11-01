# ✅ Assets Path - Simplified Architecture

## 🎯 Summary

Đã thay đổi cách serve uploaded files để **KHÔNG CẦN copy `attached_assets/` vào `dist/`** nữa!

## 📁 Folder Structure

```
project-root/
├── attached_assets/           ← Files upload vào đây
│   ├── uuid1.mp4
│   ├── uuid2.jpg
│   └── ...
└── dist/                      ← Build output
    ├── index.js              ← Server runs here, reads ../attached_assets/
    └── public/
```

## 🔧 How It Works

### Development Mode
```javascript
// Server runs from: project-root/
// Serves files from: ./attached_assets/
const attachedAssetsPath = path.join(process.cwd(), 'attached_assets');
```

### Production Mode
```javascript
// Server runs from: dist/
// Serves files from: ../attached_assets/
const attachedAssetsPath = path.join(__dirname, '..', 'attached_assets');
```

### File URLs in Database
```
/dist/attached_assets/uuid.mp4
```

Đây là **public URL path**, không phải physical path:
- Development: `/dist/attached_assets/` → `./attached_assets/`
- Production: `/dist/attached_assets/` → `../attached_assets/`

## 🚀 Build & Deploy

### Local Build
```bash
npm run build
```

That's it! Không cần copy files.

### Deploy to Production
```bash
# Upload toàn bộ project folder
rsync -avz \
  attached_assets/ \
  dist/ \
  package.json \
  .env \
  user@server:/var/www/app/

# Hoặc zip
zip -r deploy.zip attached_assets/ dist/ package.json .env
```

### Nginx Config
```nginx
# Serve uploaded files directly (faster)
location /dist/attached_assets/ {
    alias /var/www/app/attached_assets/;
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## ✅ Advantages

1. **No copying needed** - Files stay at project root
2. **Faster builds** - No extra copy step
3. **Less disk space** - No duplicate files
4. **Simpler workflow** - Just `npm run build` and deploy
5. **Files persist** - Uploads not affected by rebuild

## 📝 Updated Files

- ✅ `server/index.ts` - Auto-detect production/development paths
- ✅ `BUILD_INSTRUCTIONS.md` - No copy steps needed
- ✅ `DEPLOYMENT_GUIDE.md` - Updated folder structure
- ✅ `scripts/copy-assets-to-dist.js` - Marked as deprecated
- ✅ `ASSETS_PATH_FIX_SUMMARY.md` - Updated architecture

## 🧪 Verification

```bash
# Test current setup
curl -I http://localhost:5000/dist/attached_assets/some-file.mp4
# → HTTP/1.1 200 OK ✓

# Check API response
curl http://localhost:5000/api/hero-videos/status
# → "url": "/dist/attached_assets/..." ✓
```

## 📖 Documentation

- **BUILD_INSTRUCTIONS.md** - Production build guide
- **DEPLOYMENT_GUIDE.md** - Full deployment steps
- **ASSETS_PATH_FIX_SUMMARY.md** - Technical details

---

**Bottom Line**: Just build and deploy the entire project folder. Server automatically reads files from the right place! 🎉
