# 🐛 Debug Production Upload Issue

## ❌ Lỗi Hiện Tại

```
Error: ENOENT: no such file or directory, open 
'/var/www/vhosts/humspizza.com/httpdocs/dist/attached_assets/deaa3d2c-4580-4745-b259-0d596e779b3e.mp4'
```

**Vấn đề:** Upload đang cố lưu vào `/dist/attached_assets/` thay vì `../attached_assets/`

---

## 🔍 Các Bước Debug

### 1️⃣ Kiểm Tra NODE_ENV

Trên production server, chạy:

```bash
cd /var/www/vhosts/humspizza.com/httpdocs/dist
echo $NODE_ENV
# Phải trả về: production
```

Nếu không phải `production`, set lại:

```bash
export NODE_ENV=production
# Hoặc thêm vào file .env
echo "NODE_ENV=production" >> ../.env
```

---

### 2️⃣ Kiểm Tra Thư Mục attached_assets

```bash
cd /var/www/vhosts/humspizza.com/httpdocs
ls -la

# Phải thấy:
# drwxr-xr-x attached_assets/
# drwxr-xr-x dist/
```

**Nếu thư mục `attached_assets` chưa tồn tại:**

```bash
mkdir -p /var/www/vhosts/humspizza.com/httpdocs/attached_assets
chmod 755 /var/www/vhosts/humspizza.com/httpdocs/attached_assets
chown www-data:www-data /var/www/vhosts/humspizza.com/httpdocs/attached_assets
```

**Note:** Thay `www-data` bằng user mà Nginx/Passenger chạy (có thể là `nginx`, `apache`, hoặc user của bạn)

---

### 3️⃣ Kiểm Tra Quyền Ghi

```bash
# Test quyền ghi
touch /var/www/vhosts/humspizza.com/httpdocs/attached_assets/test.txt
# Nếu lỗi "Permission denied" → fix permissions

# Check owner
ls -la /var/www/vhosts/humspizza.com/httpdocs/attached_assets/

# Fix permissions nếu cần
chown -R www-data:www-data /var/www/vhosts/humspizza.com/httpdocs/attached_assets/
chmod -R 755 /var/www/vhosts/humspizza.com/httpdocs/attached_assets/
```

---

### 4️⃣ Xem Server Logs

Sau khi rebuild (với debug logs mới), check logs khi upload:

```bash
# On production server
tail -f /var/log/nginx/error.log
# or
pm2 logs
# or wherever your app logs are
```

Khi upload file, bạn sẽ thấy:

```
🔍 Multer upload destination: /var/www/vhosts/humspizza.com/httpdocs/attached_assets
🔍 __dirname: /var/www/vhosts/humspizza.com/httpdocs/dist
🔍 process.cwd(): /var/www/vhosts/humspizza.com/httpdocs/dist
🔍 NODE_ENV: production
🔍 isProduction: true
📝 Generated filename: uuid.mp4
```

**Nếu thấy path sai**, gửi logs cho tôi để debug tiếp.

---

## 🛠️ Quick Fix Script

Chạy script này trên production server:

```bash
#!/bin/bash

cd /var/www/vhosts/humspizza.com/httpdocs

echo "=== Production Upload Fix ==="
echo ""

# 1. Create attached_assets folder
echo "1. Creating attached_assets folder..."
mkdir -p attached_assets
chmod 755 attached_assets
echo "✅ Folder created"

# 2. Check NODE_ENV
echo ""
echo "2. Checking NODE_ENV..."
if [ "$NODE_ENV" == "production" ]; then
  echo "✅ NODE_ENV=production"
else
  echo "⚠️  NODE_ENV=$NODE_ENV (should be 'production')"
  echo "   Fix: export NODE_ENV=production"
fi

# 3. Check permissions
echo ""
echo "3. Checking folder structure..."
ls -la | grep -E "attached_assets|dist"

# 4. Test write permission
echo ""
echo "4. Testing write permission..."
if touch attached_assets/test.txt 2>/dev/null; then
  echo "✅ Can write to attached_assets/"
  rm attached_assets/test.txt
else
  echo "❌ Cannot write to attached_assets/"
  echo "   Fix: chown -R \$USER:www-data attached_assets/"
fi

echo ""
echo "=== Done ==="
```

Save as `fix-upload.sh`, chạy:

```bash
chmod +x fix-upload.sh
./fix-upload.sh
```

---

## 📋 Deployment Checklist

Khi deploy lại production:

- [ ] Upload cả folder `dist/` VÀ folder `attached_assets/`
- [ ] Đảm bảo cấu trúc:
  ```
  /var/www/vhosts/humspizza.com/httpdocs/
  ├── attached_assets/      ← Upload folder này
  ├── dist/                 ← Upload folder này
  │   └── index.js
  ├── package.json
  └── .env
  ```
- [ ] Set `NODE_ENV=production`
- [ ] Fix permissions: `chmod 755 attached_assets`
- [ ] Restart app

---

## 🔄 Restart App

Sau khi fix:

```bash
# Nếu dùng PM2
pm2 restart humspizza

# Nếu dùng Passenger
touch /var/www/vhosts/humspizza.com/httpdocs/dist/tmp/restart.txt

# Hoặc restart Nginx
sudo systemctl restart nginx
```

---

## ✅ Verify Fix

Test upload lại video. Nếu thành công, sẽ thấy:

1. **File được tạo tại:**
   ```
   /var/www/vhosts/humspizza.com/httpdocs/attached_assets/uuid.mp4
   ```

2. **Database lưu URL:**
   ```json
   { "heroVideoUrl": "/dist/attached_assets/uuid.mp4" }
   ```

3. **Browser có thể truy cập:**
   ```
   https://humspizza.com/dist/attached_assets/uuid.mp4
   ```

---

## 🆘 Nếu Vẫn Lỗi

Gửi cho tôi:

1. **Output của script `fix-upload.sh`**
2. **Server logs khi upload** (phần có debug logs 🔍)
3. **Output của:**
   ```bash
   echo $NODE_ENV
   pwd
   ls -la ../
   whoami
   ```

Tôi sẽ debug tiếp!
