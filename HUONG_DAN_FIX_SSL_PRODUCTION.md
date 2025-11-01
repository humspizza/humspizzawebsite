# Hướng Dẫn Fix Lỗi SSL Trong Production Build

## ❌ Vấn Đề Gặp Phải

Khi chạy production build trên server:

```bash
npm run build
npm run start
```

Gặp lỗi:
```
Error: Hostname/IP does not match certificate's altnames
IP: 103.138.88.63 is not in the cert's list
```

## ✅ Nguyên Nhân

- Database server dùng **IP address** (`103.138.88.63`) 
- SSL certificate chỉ hỗ trợ **domain name** (`*.cloudnetwork.vn`)
- PostgreSQL driver mặc định cố gắng kết nối qua SSL
- → SSL handshake thất bại vì certificate không khớp với IP

## 🔧 Giải Pháp Đã Áp Dụng

### 1. Chuyển Driver PostgreSQL

**Trước (Neon serverless):**
```typescript
import { Pool } from '@neondatabase/serverless';
```

**Sau (PostgreSQL chuẩn):**
```typescript
import pg from 'pg';
const { Pool } = pg;
```

### 2. Force Disable SSL Cho IP-Based Connections

File: `server/db.ts`

```typescript
// IMPORTANT: Force disable SSL for IP-based connections
if (connectionString.includes('103.138.88.63')) {
  sslConfig = false;
  console.log('🔓 SSL disabled for IP-based database connection');
}

export const pool = new Pool({ 
  connectionString,
  ssl: sslConfig  // false cho IP connections
});
```

### 3. Parse sslmode Parameter

```typescript
if (connectionString.includes('sslmode=')) {
  const url = new URL(connectionString);
  const sslmode = url.searchParams.get('sslmode');
  
  // Remove sslmode (pg driver doesn't accept it)
  url.searchParams.delete('sslmode');
  
  if (sslmode === 'none' || sslmode === 'disable') {
    sslConfig = false;
  }
}
```

## 🚀 Deploy Lên Production Server

### Bước 1: Set Environment Variable

Trên production server, đảm bảo `DATABASE_URL` được set:

```bash
export DATABASE_URL="postgresql://hum94111_pizza_user:F~xd@c9H5exFxh7x@103.138.88.63/hum94111_pizza?sslmode=none"
```

Hoặc trong file `.env`:
```env
DATABASE_URL=postgresql://hum94111_pizza_user:F~xd@c9H5exFxh7x@103.138.88.63/hum94111_pizza?sslmode=none
```

### Bước 2: Build Project

```bash
# Clean previous build
rm -rf dist/

# Install dependencies
npm install

# Build
npm run build
```

### Bước 3: Start Production Server

```bash
NODE_ENV=production node dist/index.js
```

Hoặc dùng PM2:
```bash
pm2 start dist/index.js --name humpizza-api
```

## 🧪 Test Production Build

### Test 1: Kiểm tra logs
```bash
# Phải thấy message này:
🔓 SSL disabled for IP-based database connection
✓ User seeding completed
✓ Home content already exists
✓ Auto-archive system initialized
```

### Test 2: Test API endpoints
```bash
# Test categories
curl http://your-server:5000/api/categories

# Test home content
curl http://your-server:5000/api/home-content

# Test SEO
curl http://your-server:5000/api/seo/pages/home/vi
```

### Test 3: Test Login
```bash
curl -X POST http://your-server:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## 📋 Checklist Deployment

- [ ] Environment variables được set đúng
- [ ] DATABASE_URL có `sslmode=none` hoặc chứa IP `103.138.88.63`
- [ ] `npm run build` chạy thành công
- [ ] Production server start không lỗi SSL
- [ ] Logs hiển thị "SSL disabled for IP-based database connection"
- [ ] API endpoints trả về dữ liệu (không 500 error)
- [ ] Login admin/staff hoạt động

## 🔒 Security Note

**Tắt SSL chỉ an toàn khi:**
- Database server trong cùng internal network
- Firewall bảo vệ database (chỉ cho app server connect)
- Không expose database ra public internet

**Khuyến nghị cho production:**
- Dùng domain name thay vì IP: `db.cloudnetwork.vn`
- Hoặc thêm IP vào certificate SANs (Subject Alternative Names)
- Hoặc dùng internal network không cần SSL

## 🆘 Troubleshooting

### Lỗi: "permission denied for table"
→ Cấp quyền cho database user (xem `HUONG_DAN_DATABASE_PERMISSIONS.md`)

### Lỗi: "Database not found"
→ Tạo database trước:
```sql
CREATE DATABASE hum94111_pizza;
```

### Lỗi: "Cannot find module"
→ Install dependencies:
```bash
npm install
```

### Port 5000 đã được dùng
→ Đổi port trong `server/index.ts` hoặc kill process:
```bash
lsof -ti:5000 | xargs kill
```

## 📝 Alternative Solutions

### Giải pháp 1: Dùng Domain Name (Khuyến nghị)

Thay DATABASE_URL:
```
postgresql://user:pass@db.cloudnetwork.vn/database
```

Ưu điểm: SSL hoạt động bình thường với certificate

### Giải pháp 2: Update Certificate

Thêm IP `103.138.88.63` vào certificate SANs khi renew SSL cert.

### Giải pháp 3: SSH Tunnel

Tạo SSH tunnel để connect qua localhost:
```bash
ssh -L 5432:103.138.88.63:5432 user@server
# Then use localhost:5432
```

## ✅ Kết Luận

Sau khi áp dụng các fix trên:
- ✅ Development mode: Hoạt động hoàn hảo
- ✅ Production build: Kết nối database thành công
- ✅ Không còn lỗi SSL certificate mismatch
- ✅ Ready for deployment!
