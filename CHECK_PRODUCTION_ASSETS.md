# Hướng Dẫn Kiểm Tra Assets Trên Production Server

## 🔍 Hiểu Response Codes

**Response code bạn thấy:**
```
GET /api/assets/f2da29c3-aa42-4b50-8ced-df83ca71f507.mp4 206 in 3ms
GET /api/assets/59fa1dc0-4c8d-46b9-ad30-6291060d366b.mp4 206 in 3ms
```

### ✅ 206 = THÀNH CÔNG!

- **HTTP 206 (Partial Content)**: Video đang được serve thành công với range requests
- Đây là **BÌNH THƯỜNG** cho video streaming
- Nếu lỗi sẽ là: **404 Not Found** hoặc **500 Internal Server Error**

---

## 🧪 Kiểm Tra Trên Production Server

### Bước 1: SSH vào Production Server

```bash
ssh user@your-server-ip
cd /var/www/humpizza  # Hoặc đường dẫn app của bạn
```

### Bước 2: Kiểm Tra Assets Directory

```bash
# Kiểm tra attached_assets tồn tại chưa
ls -lh attached_assets/

# Kiểm tra file cụ thể có tồn tại không
ls -lh attached_assets/f2da29c3-aa42-4b50-8ced-df83ca71f507.mp4
ls -lh attached_assets/59fa1dc0-4c8d-46b9-ad30-6291060d366b.mp4

# Đếm số files
find attached_assets -type f | wc -l
```

**Kết quả mong đợi:**
```
✅ File tồn tại → Assets serving thành công!
❌ File không tồn tại → Cần upload lại hoặc check upload path
```

### Bước 3: Kiểm Tra Logs Production Server

```bash
# Xem logs để tìm assets path
pm2 logs humpizza-api | grep "Assets path"

# Hoặc nếu chạy trực tiếp
# (Trong logs khi start server)
```

**Phải thấy:**
```
📁 Assets path: /var/www/humpizza/attached_assets
📁 Current working directory: /var/www/humpizza
```

### Bước 4: Test Assets Serving

```bash
# Test từ server
curl -I http://localhost:5000/api/assets/f2da29c3-aa42-4b50-8ced-df83ca71f507.mp4

# Kết quả mong đợi:
# HTTP/1.1 200 OK (hoặc 206 Partial Content)
# Content-Type: video/mp4
```

---

## 🔧 Các Vấn Đề Thường Gặp

### Vấn đề 1: Files Được Upload Vào Sai Thư Mục

**Triệu chứng:**
- Upload thành công
- Nhưng request trả về 404
- Files không ở trong `attached_assets/`

**Nguyên nhân:**
Server đang chạy từ thư mục sai:

```bash
# ❌ SAI:
cd /var/www/humpizza/dist
node index.js
# → process.cwd() = /var/www/humpizza/dist
# → Upload vào: /var/www/humpizza/dist/attached_assets/ ❌

# ✅ ĐÚNG:
cd /var/www/humpizza
node dist/index.js
# → process.cwd() = /var/www/humpizza
# → Upload vào: /var/www/humpizza/attached_assets/ ✅
```

**Giải pháp:**
```bash
# Stop server
pm2 stop humpizza-api

# Delete PM2 config
pm2 delete humpizza-api

# Chạy lại từ thư mục ROOT
cd /var/www/humpizza
pm2 start dist/index.js --name humpizza-api

# Save config
pm2 save
```

### Vấn đề 2: Files Bị Upload Vào Thư Mục Cũ

**Kiểm tra:**
```bash
# Tìm tất cả attached_assets trong project
find /var/www/humpizza -type d -name "attached_assets"

# Có thể có:
# /var/www/humpizza/attached_assets ← ĐÚNG
# /var/www/humpizza/dist/attached_assets ← SAI, XÓA ĐI!
```

**Giải pháp:**
```bash
# Nếu files ở sai nơi, di chuyển về đúng
mv /var/www/humpizza/dist/attached_assets/* /var/www/humpizza/attached_assets/
rm -rf /var/www/humpizza/dist/attached_assets
```

### Vấn đề 3: Permissions

**Kiểm tra:**
```bash
# Check permissions
ls -ld attached_assets/
ls -lh attached_assets/*.mp4

# Phải có read permission cho user chạy Node.js
```

**Giải pháp:**
```bash
# Fix permissions nếu cần
chmod 755 attached_assets/
chmod 644 attached_assets/*
```

---

## 📋 Checklist Debug

Khi gặp vấn đề assets không hiển thị:

- [ ] 1. Kiểm tra response code (206 hay 404?)
- [ ] 2. Kiểm tra file có tồn tại: `ls attached_assets/filename.mp4`
- [ ] 3. Kiểm tra logs: Assets path đúng chưa?
- [ ] 4. Kiểm tra `process.cwd()`: Có chạy từ root không?
- [ ] 5. Kiểm tra permissions: Files có readable không?
- [ ] 6. Test curl: `curl -I http://localhost:5000/api/assets/file.mp4`

---

## 🎯 Xác Định Vấn Đề Chính Xác

### Case 1: Response 206 + File Hiển Thị

✅ **KHÔNG CÓ VẤN ĐỀ!** 
- 206 = Thành công với range request
- Video đang streaming bình thường
- Nếu bạn thấy video hiển thị → Tất cả OK!

### Case 2: Response 404 + File Không Hiển Thị

❌ **VẤN ĐỀ: File không tồn tại**

Kiểm tra:
1. File có trong `attached_assets/` không?
2. Assets path trong logs đúng không?
3. Server có chạy từ thư mục root không?

### Case 3: Response 200/206 + File KHÔNG Hiển Thị

❌ **VẤN ĐỀ: Frontend Issue**

Có thể:
- Browser cache (hard refresh: Ctrl+Shift+R)
- CORS issue
- Frontend URL sai

Kiểm tra:
```bash
# Test trực tiếp từ browser DevTools Console
fetch('/api/assets/filename.mp4').then(r => console.log(r.status))
```

---

## 🔄 Quy Trình Upload/Serve Đúng

### 1. User Upload File

```
Frontend: POST /api/admin/home-content/hero-video
Body: multipart/form-data với file
```

### 2. Server Nhận và Lưu

```javascript
// fileUpload.ts
const attachedAssetsDir = path.join(process.cwd(), 'attached_assets');
// Save: /var/www/humpizza/attached_assets/abc123.mp4
```

### 3. Database Lưu URL

```javascript
// routes.ts
const url = `/api/assets/abc123.mp4`;
// Save to database: { heroVideoUrl: "/api/assets/abc123.mp4" }
```

### 4. Frontend Request File

```javascript
<video src="/api/assets/abc123.mp4" />
// Browser request: GET /api/assets/abc123.mp4
```

### 5. Server Serve File

```javascript
// routes.ts
app.use('/api/assets', express.static(assetsPath));
// Serve from: /var/www/humpizza/attached_assets/abc123.mp4
```

**✅ Nếu mọi bước đúng → Video hiển thị thành công!**

---

## 📞 Hỗ Trợ Debug

Nếu vẫn gặp vấn đề, gửi cho tôi:

1. **Logs từ production server:**
   ```bash
   pm2 logs humpizza-api --lines 50
   ```

2. **Kết quả kiểm tra files:**
   ```bash
   ls -lh attached_assets/ | head -20
   ```

3. **Process working directory:**
   ```bash
   pm2 describe humpizza-api | grep cwd
   ```

4. **Test curl:**
   ```bash
   curl -I http://localhost:5000/api/assets/abc123.mp4
   ```

Với thông tin này tôi sẽ giúp bạn debug chính xác!

---

## ✅ Tóm Tắt

- **206 Response** = Video streaming thành công ✅
- **404 Response** = File không tồn tại ❌
- **Luôn chạy server từ project root**: `cd /var/www/humpizza && node dist/index.js`
- **Assets path phải là**: `/var/www/humpizza/attached_assets`
- **Không được là**: `/var/www/humpizza/dist/attached_assets`

🎉 Nếu bạn thấy **206** trong logs → Assets đang hoạt động tốt!
