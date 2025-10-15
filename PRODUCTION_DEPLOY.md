# Production Deployment Guide - Hum's Pizza

## 🚀 Build for Production

### Prerequisites
- Node.js or Bun installed
- PostgreSQL database (Neon recommended)
- All environment variables configured

### Build Steps

#### Option 1: Using Build Script (Recommended)
```bash
# Make script executable
chmod +x build-production.sh

# Run build
./build-production.sh

# Deploy dist/ folder to your server
```

#### Option 2: Manual Build
```bash
# 1. Clean previous builds
rm -rf dist

# 2. Build frontend (outputs to dist/public)
vite build

# 3. Build backend (outputs to dist/index.js)
esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# 4. Copy assets to dist folder
cp -r attached_assets dist/attached_assets

# 5. Copy environment file
cp .env dist/.env
```

### Run Production Server

```bash
# Navigate to dist folder
cd dist

# Set NODE_ENV and start
NODE_ENV=production node index.js
```

**CRITICAL:** Always set `NODE_ENV=production` or the server will try to run Vite dev mode!

## 📦 What Gets Built

```
dist/
├── index.js              # Backend server (bundled)
├── public/               # Frontend static files
│   ├── index.html
│   ├── assets/          # JS, CSS bundles
│   └── ...
└── attached_assets/      # Media files (copied)
    ├── logo.humpizza.png
    ├── hero.landingpage.mp4
    └── ...
```

## ⚙️ Environment Variables

Create `.env` file in `dist/` folder:

```env
DATABASE_URL=postgresql://user:password@host/database
SESSION_SECRET=your-production-secret-here
NODE_ENV=production
PORT=5000
```

## 🔧 Server Configuration (Apache/Nginx)

### Apache Configuration
```apache
<VirtualHost *:80>
    ServerName humspizza.com
    
    ProxyPreserveHost On
    ProxyPass / http://localhost:5000/
    ProxyPassReverse / http://localhost:5000/
    
    ErrorLog ${APACHE_LOG_DIR}/humspizza-error.log
    CustomLog ${APACHE_LOG_DIR}/humspizza-access.log combined
</VirtualHost>
```

### PM2 Process Manager (Recommended)
```bash
# Install PM2
npm install -g pm2

# Start app
cd dist
pm2 start index.js --name humspizza --node-args="--env-file=.env"

# Save PM2 config
pm2 save

# Setup auto-restart on reboot
pm2 startup
```

## 🐛 Common Issues

### Issue: "Failed to load url /src/main.tsx"
**Cause:** Server running in dev mode instead of production
**Fix:** Ensure `NODE_ENV=production` is set before starting

### Issue: 502 Bad Gateway
**Cause:** Server not starting or port conflict
**Fix:** Check logs, ensure port 5000 is free, verify DATABASE_URL

### Issue: Assets not loading (404 on images/videos)
**Cause:** `attached_assets` folder not copied to dist
**Fix:** Re-run build script or manually copy: `cp -r attached_assets dist/`

### Issue: Database connection failed
**Cause:** DATABASE_URL not set or incorrect
**Fix:** Verify .env file in dist/ folder with correct credentials

## 📝 Deployment Checklist

- [ ] Run production build: `./build-production.sh`
- [ ] Verify dist/ folder contains: index.js, public/, attached_assets/
- [ ] Copy dist/ to production server
- [ ] Set up .env with production DATABASE_URL and SESSION_SECRET
- [ ] Install production dependencies: `npm install --production`
- [ ] Set NODE_ENV=production
- [ ] Start server with process manager (PM2)
- [ ] Configure reverse proxy (Apache/Nginx)
- [ ] Test all routes work
- [ ] Verify assets load correctly
- [ ] Check database connection

## 🔒 Security Notes

1. **Never commit .env** to git
2. Use strong SESSION_SECRET in production
3. Enable SSL/HTTPS (use Let's Encrypt)
4. Set `trust proxy` in Express (already configured)
5. Use secure cookies (already configured)
6. Keep dependencies updated

## 📊 Monitoring

```bash
# View PM2 logs
pm2 logs humspizza

# Monitor app
pm2 monit

# Restart app
pm2 restart humspizza
```

## 🔄 Updates/Redeployment

```bash
# 1. Pull latest code
git pull origin main

# 2. Rebuild
./build-production.sh

# 3. Upload new dist/ to server
scp -r dist/* user@server:/path/to/app/

# 4. Restart PM2
pm2 restart humspizza
```
